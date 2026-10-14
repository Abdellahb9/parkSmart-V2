const crypto = require('crypto');

const { PaymentError } = require('./provider');

/**
 * A gateway stand-in for development and demos.
 *
 * It behaves like a real one in the ways that matter to the rest of the code:
 * a charge starts pending, needs a second call to settle, and can fail. It
 * keeps no state of its own — the Payment document is the record — so a server
 * restart never loses a charge.
 *
 * Failures are reproducible on demand: a charge whose description or metadata
 * carries `simulate: 'failure'` always fails, which is how the failure path
 * gets tested without a real gateway.
 */
const ref = () => `mock_${crypto.randomBytes(9).toString('hex')}`;

const mockProvider = {
  name: 'mock',

  async createCharge({ amount, currency = 'MAD', metadata = {} }) {
    if (!(amount > 0)) throw new PaymentError('Amount must be greater than zero');
    return {
      ref: ref(),
      status: 'pending',
      // A real gateway would hand back a hosted page; the mock is confirmed
      // in-app, so there is nowhere to redirect to.
      redirectUrl: null,
      currency,
      metadata,
    };
  },

  async confirmCharge(chargeRef, { outcome = 'success' } = {}) {
    if (!chargeRef) throw new PaymentError('Missing charge reference');
    if (outcome === 'failure') {
      return { ref: chargeRef, status: 'failed', failureReason: 'Paiement refusé par la banque' };
    }
    return { ref: chargeRef, status: 'paid' };
  },

  async refundCharge(chargeRef, amount) {
    if (!chargeRef) throw new PaymentError('Missing charge reference');
    if (!(amount >= 0)) throw new PaymentError('Refund amount must not be negative');
    return { ref: chargeRef, status: 'refunded' };
  },
};

module.exports = mockProvider;
