const mongoose = require('mongoose');

const Booking = require('../models/Booking');
const Parking = require('../models/Parking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { getProvider, PaymentError } = require('../payments');
const { ownsBooking } = require('../utils/ownership');
const { serverError } = require('../utils/http');
const { paginate } = require('../utils/paginate');

const round2 = (n) => Math.round(n * 100) / 100;

// PaymentError carries its own 4xx status; serverError honours it.
const fail = (res, error) => serverError(res, error);

/**
 * Adds to a balance and rounds the result, in one atomic write.
 *
 * A plain $inc accumulates binary floating-point dust — after a handful of
 * movements a balance reads 1067.9999999999998 — so the arithmetic runs as an
 * aggregation pipeline, where $round can clean up the sum server-side without
 * a second read-modify-write.
 */
const bumpWallet = (delta) => [
  { $set: { walletBalance: { $round: [{ $add: [{ $ifNull: ['$walletBalance', 0] }, delta] }, 2] } } },
];

/**
 * Moves money out of a wallet only if it actually covers the amount.
 *
 * The balance check lives inside the query, so two concurrent payments can
 * never both pass it — the same trick the spot reservation uses, since
 * standalone MongoDB gives us no transactions.
 */
const debitWallet = async (userId, amount) =>
  User.findOneAndUpdate(
    { _id: userId, walletBalance: { $gte: amount } },
    bumpWallet(-amount),
    { new: true }
  ).select('walletBalance');

const creditWallet = async (userId, amount) =>
  User.findByIdAndUpdate(userId, bumpWallet(amount), { new: true }).select('walletBalance');

// GET /api/payments/wallet — the caller's own balance and recent movements.
exports.getWallet = async (req, res) => {
  try {
    const [user, payments] = await Promise.all([
      User.findById(req.user._id).select('walletBalance').lean(),
      Payment.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('parkingId', 'name')
        .lean(),
    ]);

    res.json({
      // Rounded on the way out too, so a balance written before the rounding
      // fix never reaches a client as 1067.9999999999998.
      balance: round2(user?.walletBalance ?? 0),
      currency: 'MAD',
      payments,
    });
  } catch (error) {
    fail(res, error);
  }
};

// GET /api/payments/my — full payment history for the caller.
exports.listMine = async (req, res) => {
  try {
    const payments = await paginate(req, res, Payment, { userId: req.user._id }, (q) =>
      q.sort({ createdAt: -1 }).populate('parkingId', 'name').lean()
    );
    res.json(payments);
  } catch (error) {
    fail(res, error);
  }
};

// POST /api/payments/topup — add credit to the caller's wallet.
// Always goes through the provider: a top-up is a real card charge.
exports.topUp = async (req, res) => {
  try {
    const amount = round2(Number(req.body.amount));
    if (!(amount > 0)) return res.status(400).json({ message: 'Amount must be greater than zero' });
    if (amount > 5000) return res.status(400).json({ message: 'Maximum top-up is 5000 MAD' });

    const provider = getProvider();
    const charge = await provider.createCharge({
      amount,
      currency: 'MAD',
      description: `Recharge du portefeuille AutoPark`,
      metadata: { userId: String(req.user._id), kind: 'topup', simulate: req.body.simulate },
    });

    const payment = await Payment.create({
      userId: req.user._id,
      kind: 'topup',
      amount,
      method: 'card',
      status: 'pending',
      provider: provider.name,
      providerRef: charge.ref,
    });

    res.status(201).json({ payment, redirectUrl: charge.redirectUrl ?? null });
  } catch (error) {
    fail(res, error);
  }
};

// POST /api/payments/booking/:bookingId — pay for a stay.
//
// `wallet` settles immediately; `card` returns a pending payment the client
// confirms; `cash` records the intent and leaves the booking unpaid until
// staff collect at the barrier.
exports.payBooking = async (req, res) => {
  try {
    const method = req.body.method || 'wallet';
    if (!['wallet', 'card', 'cash'].includes(method)) {
      return res.status(400).json({ message: 'Unsupported payment method' });
    }

    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!ownsBooking(booking, req.user)) {
      return res.status(403).json({ message: 'Not authorized to pay for this booking' });
    }
    if (booking.paymentStatus === 'paid') {
      return res.status(409).json({ message: 'This booking is already paid' });
    }
    if (booking.status === 'cancelled') {
      return res.status(410).json({ message: 'This booking is no longer active' });
    }

    // A pending card charge from an abandoned attempt should not pile up.
    await Payment.updateMany(
      { bookingId: booking._id, status: 'pending' },
      { $set: { status: 'cancelled' } }
    );

    const parking = await Parking.findById(booking.parkingId)
      .select('commissionPercent name')
      .lean();
    const amount = round2(booking.totalPrice);
    // commissionPercent was stored and never used anywhere; this is where it
    // finally earns its keep.
    const commission = round2((amount * (parking?.commissionPercent ?? 0)) / 100);

    const base = {
      userId: req.user._id,
      bookingId: booking._id,
      parkingId: booking.parkingId,
      kind: 'booking',
      amount,
      commission,
      method,
    };

    if (method === 'cash') {
      const payment = await Payment.create({ ...base, status: 'pending', provider: 'cash' });
      booking.paymentStatus = 'pending';
      await booking.save();
      return res.status(201).json({ payment, booking });
    }

    if (method === 'wallet') {
      const debited = await debitWallet(req.user._id, amount);
      if (!debited) {
        return res.status(402).json({ message: 'Insufficient wallet balance' });
      }
      const payment = await Payment.create({
        ...base,
        status: 'paid',
        provider: 'wallet',
        paidAt: new Date(),
      });
      booking.paymentStatus = 'paid';
      booking.paidAt = payment.paidAt;
      await booking.save();
      return res.status(201).json({ payment, booking, walletBalance: debited.walletBalance });
    }

    const provider = getProvider();
    const charge = await provider.createCharge({
      amount,
      currency: 'MAD',
      description: `Stationnement ${parking?.name ?? ''} · place n°${booking.spotNumber}`,
      metadata: {
        bookingId: String(booking._id),
        userId: String(req.user._id),
        simulate: req.body.simulate,
      },
    });

    const payment = await Payment.create({
      ...base,
      status: 'pending',
      provider: provider.name,
      providerRef: charge.ref,
    });
    booking.paymentStatus = 'pending';
    await booking.save();

    res.status(201).json({ payment, booking, redirectUrl: charge.redirectUrl ?? null });
  } catch (error) {
    fail(res, error);
  }
};

// POST /api/payments/:id/confirm — settle a pending charge.
//
// Stands in for the gateway's return call. `outcome: 'failure'` exercises the
// declined path without a real card.
exports.confirm = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (String(payment.userId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to confirm this payment' });
    }
    if (payment.status !== 'pending') {
      return res.status(409).json({ message: 'This payment is no longer pending' });
    }
    if (payment.method === 'cash') {
      return res.status(400).json({ message: 'A cash payment is collected on site' });
    }

    const provider = getProvider();
    const result = await provider.confirmCharge(payment.providerRef, {
      outcome: req.body.outcome === 'failure' ? 'failure' : 'success',
    });

    payment.status = result.status;
    payment.failureReason = result.failureReason || '';
    if (result.status === 'paid') payment.paidAt = new Date();
    await payment.save();

    let walletBalance;
    if (result.status === 'paid' && payment.kind === 'topup') {
      const user = await creditWallet(payment.userId, payment.amount);
      walletBalance = user?.walletBalance;
    }

    let booking = null;
    if (payment.bookingId) {
      booking = await Booking.findById(payment.bookingId);
      if (booking) {
        booking.paymentStatus = result.status === 'paid' ? 'paid' : 'unpaid';
        booking.paidAt = result.status === 'paid' ? payment.paidAt : null;
        await booking.save();
      }
    }

    res.json({ payment, booking, walletBalance });
  } catch (error) {
    fail(res, error);
  }
};

/**
 * Refunds a paid booking, minus whatever cancellation fee was applied.
 *
 * Credit goes to the wallet rather than back down the card rail: it settles
 * instantly, which is what a driver rebooking the same afternoon wants. Called
 * from the cancel flow, never exposed as a route.
 */
exports.refundForCancellation = async (booking, { fee = 0 } = {}) => {
  const paid = await Payment.findOne({
    bookingId: booking._id,
    kind: 'booking',
    status: 'paid',
  });
  if (!paid) return null;

  const refundable = round2(Math.max(0, paid.amount - fee));
  if (refundable === 0) {
    booking.paymentStatus = 'paid';
    return null;
  }

  if (paid.provider !== 'wallet' && paid.providerRef) {
    const provider = getProvider();
    await provider.refundCharge(paid.providerRef, refundable);
  }

  const [refund] = await Promise.all([
    Payment.create({
      userId: paid.userId,
      bookingId: booking._id,
      parkingId: booking.parkingId,
      kind: 'refund',
      amount: refundable,
      method: 'wallet',
      status: 'paid',
      provider: 'wallet',
      paidAt: new Date(),
    }),
    creditWallet(paid.userId, refundable),
  ]);

  paid.status = 'refunded';
  await paid.save();
  booking.paymentStatus = 'refunded';

  return refund;
};

// GET /api/payments — admin: every payment; owner: those on their parkings.
exports.list = async (req, res) => {
  try {
    const filter = {};
    let ownParkings = null;
    if (req.user.role === 'parking_owner') {
      ownParkings = (await Parking.find({ ownerId: req.user._id }).distinct('_id')).map(String);
      filter.parkingId = { $in: ownParkings };
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (typeof req.query.status === 'string') filter.status = req.query.status;
    if (req.query.parkingId && mongoose.isValidObjectId(req.query.parkingId)) {
      // Narrowing only: an owner asking for someone else's parking gets
      // nothing, instead of the filter replacing their own-parkings scope.
      const wanted = String(req.query.parkingId);
      filter.parkingId = ownParkings && !ownParkings.includes(wanted) ? { $in: [] } : wanted;
    }

    const payments = await paginate(req, res, Payment, filter, (q) =>
      q.sort({ createdAt: -1 }).populate('userId', 'fullName email').populate('parkingId', 'name').lean()
    );

    res.json(payments);
  } catch (error) {
    fail(res, error);
  }
};

// POST /api/payments/:id/collect — staff mark a cash payment as collected.
exports.collectCash = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.method !== 'cash') {
      return res.status(400).json({ message: 'Only a cash payment is collected on site' });
    }

    if (req.user.role === 'parking_owner') {
      const parking = await Parking.findById(payment.parkingId).select('ownerId').lean();
      if (!parking || String(parking.ownerId) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to collect this payment' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (payment.status === 'paid') {
      return res.status(409).json({ message: 'This payment is already collected' });
    }

    payment.status = 'paid';
    payment.paidAt = new Date();
    await payment.save();

    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.paymentStatus = 'paid';
      booking.paidAt = payment.paidAt;
      await booking.save();
    }

    res.json({ payment, booking });
  } catch (error) {
    fail(res, error);
  }
};
