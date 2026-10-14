const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

const Booking = require('../models/Booking');
const Parking = require('../models/Parking');
const Payment = require('../models/Payment');
const { serverError } = require('../utils/http');

const round2 = (n) => Math.round(n * 100) / 100;
const MAD = (n) => `${round2(n).toFixed(2)} MAD`;

/** Day boundaries in the server's timezone, which is the parking's timezone. */
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

// 'YYYY-MM-DD' read as a local calendar date. new Date('2026-10-01')
// would be UTC midnight, which is the previous day west of Greenwich.
const parseDay = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
};

const parseRange = (query) => {
  const now = new Date();
  const to = query.to ? endOfDay(parseDay(query.to)) : endOfDay(now);
  const from = query.from
    ? startOfDay(parseDay(query.from))
    : startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  if (from > to) return null;
  return { from, to };
};

const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const frDate = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

/**
 * Which parkings the caller may see figures for.
 *
 * An owner is scoped to their own lots; an admin may narrow to one with
 * ?parkingId. Anyone else never reaches here — the route is role-guarded.
 */
const scopeParkings = async (user, parkingId) => {
  const filter = user.role === 'parking_owner' ? { ownerId: user._id } : {};
  if (parkingId && mongoose.isValidObjectId(parkingId)) filter._id = parkingId;
  return Parking.find(filter).select('name commissionPercent type').lean();
};

/**
 * Revenue over a period, built from paid payments and, for stays nobody has
 * paid through the app yet, from the bookings themselves.
 *
 * Both numbers are reported: `collected` is money that actually moved,
 * `billed` is what the stays were worth. On a dataset predating payments the
 * two differ, and hiding that would make the report a lie.
 */
const buildReport = async ({ user, query }) => {
  const range = parseRange(query);
  if (!range) return { error: 'Invalid date range' };
  const { from, to } = range;

  const parkings = await scopeParkings(user, query.parkingId);
  const parkingIds = parkings.map((p) => p._id);
  const byId = new Map(parkings.map((p) => [String(p._id), p]));

  const [payments, bookings] = await Promise.all([
    Payment.find({
      parkingId: { $in: parkingIds },
      status: 'paid',
      kind: { $in: ['booking', 'refund'] },
      paidAt: { $gte: from, $lte: to },
    })
      .select('parkingId kind amount commission paidAt method')
      .lean(),
    Booking.find({
      parkingId: { $in: parkingIds },
      status: { $in: ['active', 'done'] },
      startTime: { $gte: from, $lte: to },
    })
      .select('parkingId totalPrice totalHours startTime status paymentStatus')
      .lean(),
  ]);

  const blank = () => ({
    collected: 0,
    refunded: 0,
    commission: 0,
    billed: 0,
    bookings: 0,
    hours: 0,
  });

  const perParking = new Map(parkingIds.map((id) => [String(id), blank()]));
  const perDay = new Map();

  const bucket = (map, key) => {
    if (!map.has(key)) map.set(key, blank());
    return map.get(key);
  };

  for (const p of payments) {
    const pid = String(p.parkingId);
    const day = dayKey(new Date(p.paidAt));
    for (const target of [perParking.get(pid), bucket(perDay, day)]) {
      if (!target) continue;
      if (p.kind === 'refund') target.refunded += p.amount;
      else {
        target.collected += p.amount;
        target.commission += p.commission ?? 0;
      }
    }
  }

  for (const b of bookings) {
    const pid = String(b.parkingId);
    const day = dayKey(new Date(b.startTime));
    for (const target of [perParking.get(pid), bucket(perDay, day)]) {
      if (!target) continue;
      target.billed += b.totalPrice;
      target.bookings += 1;
      target.hours += b.totalHours;
    }
  }

  const finish = (v) => ({
    ...v,
    collected: round2(v.collected),
    refunded: round2(v.refunded),
    commission: round2(v.commission),
    billed: round2(v.billed),
    net: round2(v.collected - v.refunded - v.commission),
  });

  const parkingRows = [...perParking.entries()]
    .map(([id, v]) => ({
      parkingId: id,
      name: byId.get(id)?.name ?? '—',
      commissionPercent: byId.get(id)?.commissionPercent ?? 0,
      ...finish(v),
    }))
    .sort((a, b) => b.billed - a.billed);

  const dailyRows = [...perDay.entries()]
    .map(([date, v]) => ({ date, ...finish(v) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totals = finish(
    parkingRows.reduce((acc, r) => {
      acc.collected += r.collected;
      acc.refunded += r.refunded;
      acc.commission += r.commission;
      acc.billed += r.billed;
      acc.bookings += r.bookings;
      acc.hours += r.hours;
      return acc;
    }, blank())
  );

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    generatedAt: new Date().toISOString(),
    scope: user.role === 'parking_owner' ? 'owner' : 'network',
    totals,
    parkings: parkingRows,
    daily: dailyRows,
  };
};

const COLUMNS = [
  ['Date', (r) => frDate(r.date)],
  ['Réservations', (r) => r.bookings],
  ['Heures', (r) => r.hours],
  ['Facturé', (r) => round2(r.billed).toFixed(2)],
  ['Encaissé', (r) => round2(r.collected).toFixed(2)],
  ['Remboursé', (r) => round2(r.refunded).toFixed(2)],
  ['Commission', (r) => round2(r.commission).toFixed(2)],
  ['Net', (r) => round2(r.net).toFixed(2)],
];

const toCsv = (report) => {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [];
  lines.push(`Période;${frDate(report.period.from.slice(0, 10))};${frDate(report.period.to.slice(0, 10))}`);
  lines.push('');
  lines.push('Par parking');
  lines.push(
    ['Parking', 'Réservations', 'Heures', 'Facturé', 'Encaissé', 'Remboursé', 'Commission', 'Net']
      .map(esc)
      .join(';')
  );
  for (const r of report.parkings) {
    lines.push(
      [
        r.name,
        r.bookings,
        r.hours,
        round2(r.billed).toFixed(2),
        round2(r.collected).toFixed(2),
        round2(r.refunded).toFixed(2),
        round2(r.commission).toFixed(2),
        round2(r.net).toFixed(2),
      ]
        .map(esc)
        .join(';')
    );
  }
  lines.push('');
  lines.push('Par jour');
  lines.push(COLUMNS.map(([h]) => esc(h)).join(';'));
  for (const r of report.daily) {
    lines.push(COLUMNS.map(([, get]) => esc(get(r))).join(';'));
  }
  lines.push('');
  lines.push(
    [
      'TOTAL',
      report.totals.bookings,
      report.totals.hours,
      round2(report.totals.billed).toFixed(2),
      round2(report.totals.collected).toFixed(2),
      round2(report.totals.refunded).toFixed(2),
      round2(report.totals.commission).toFixed(2),
      round2(report.totals.net).toFixed(2),
    ].join(';')
  );

  // BOM + semicolons so French Excel opens it with columns and accents intact.
  return '﻿' + lines.join('\r\n');
};

const NAVY = '#0F2A4A';
const GOLD = '#C8961E';
const MUTED = '#5B6B7F';

/** Streams the same figures as a one- or two-page PDF. */
const writePdf = (report, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(res);

  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;

  doc.rect(0, 0, doc.page.width, 90).fill(NAVY);
  doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('AutoPark', left, 28);
  doc.fontSize(10).font('Helvetica').text('Rapport de revenus · Laâyoune', left, 54);
  // Plain words rather than an arrow: Helvetica's WinAnsi encoding has no
  // U+2192, and pdfkit silently substitutes a wrong glyph for it.
  doc
    .fontSize(10)
    .text(
      `Du ${frDate(report.period.from.slice(0, 10))} au ${frDate(report.period.to.slice(0, 10))}`,
      left,
      54,
      { width, align: 'right' }
    );

  doc.fillColor('#111827');
  let y = 115;

  // KPI strip.
  const kpis = [
    ['Facturé', MAD(report.totals.billed)],
    ['Encaissé', MAD(report.totals.collected)],
    ['Commission', MAD(report.totals.commission)],
    ['Net', MAD(report.totals.net)],
  ];
  const cardW = (width - 3 * 10) / 4;
  kpis.forEach(([label, value], i) => {
    const x = left + i * (cardW + 10);
    doc.roundedRect(x, y, cardW, 54, 6).fillAndStroke('#F5F7FA', '#E2E8F0');
    doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(label.toUpperCase(), x + 10, y + 11, {
      width: cardW - 20,
    });
    doc.fillColor(NAVY).fontSize(13).font('Helvetica-Bold').text(value, x + 10, y + 26, {
      width: cardW - 20,
    });
  });
  y += 76;

  doc.fillColor(MUTED).fontSize(9).font('Helvetica');
  doc.text(
    `${report.totals.bookings} réservation(s) · ${report.totals.hours} h vendues · ` +
      `remboursements ${MAD(report.totals.refunded)}`,
    left,
    y
  );
  y += 24;

  const table = (title, headers, rows, widths) => {
    if (y > doc.page.height - 120) {
      doc.addPage();
      y = 50;
    }
    doc.fillColor(NAVY).fontSize(12).font('Helvetica-Bold').text(title, left, y);
    y += 18;

    doc.rect(left, y, width, 20).fill('#EEF2F7');
    doc.fillColor(NAVY).fontSize(8).font('Helvetica-Bold');
    let x = left + 6;
    headers.forEach((h, i) => {
      doc.text(h, x, y + 6, { width: widths[i] - 8, align: i === 0 ? 'left' : 'right' });
      x += widths[i];
    });
    y += 20;

    doc.font('Helvetica').fontSize(8).fillColor('#111827');
    rows.forEach((cells, index) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 50;
      }
      if (index % 2 === 1) doc.rect(left, y, width, 16).fill('#FAFBFC').fillColor('#111827');
      let cx = left + 6;
      cells.forEach((cell, i) => {
        doc.fillColor('#111827').text(String(cell), cx, y + 4, {
          width: widths[i] - 8,
          align: i === 0 ? 'left' : 'right',
        });
        cx += widths[i];
      });
      y += 16;
    });
    y += 16;
  };

  const money = (n) => round2(n).toFixed(2);
  const w1 = [width - 5 * 62, 62, 62, 62, 62, 62];
  table(
    'Par parking',
    ['Parking', 'Résa.', 'Facturé', 'Encaissé', 'Commission', 'Net'],
    report.parkings.map((r) => [
      r.name,
      r.bookings,
      money(r.billed),
      money(r.collected),
      money(r.commission),
      money(r.net),
    ]),
    w1
  );

  const w2 = [width - 4 * 72, 72, 72, 72, 72];
  table(
    'Par jour',
    ['Date', 'Résa.', 'Facturé', 'Encaissé', 'Net'],
    report.daily.map((r) => [
      frDate(r.date),
      r.bookings,
      money(r.billed),
      money(r.collected),
      money(r.net),
    ]),
    w2
  );

  doc
    .fillColor(GOLD)
    .fontSize(8)
    .text(
      `Généré le ${new Date(report.generatedAt).toLocaleString('fr-FR')} · AutoPark`,
      left,
      doc.page.height - 50,
      { width, align: 'center' }
    );

  doc.end();
};

const fileStamp = (report) =>
  `${report.period.from.slice(0, 10)}_${report.period.to.slice(0, 10)}`;

// GET /api/reports/revenue?from=&to=&parkingId=&format=json|csv|pdf
exports.revenue = async (req, res) => {
  try {
    const report = await buildReport({ user: req.user, query: req.query });
    if (report.error) return res.status(400).json({ message: report.error });

    const format = (req.query.format || 'json').toLowerCase();

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="autopark-revenus-${fileStamp(report)}.csv"`
      );
      return res.send(toCsv(report));
    }

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="autopark-revenus-${fileStamp(report)}.pdf"`
      );
      return writePdf(report, res);
    }

    return res.json(report);
  } catch (error) {
    serverError(res, error);
  }
};

exports.buildReport = buildReport;
