const mongoose = require('mongoose');

/**
 * One refresh token, stored only as a SHA-256 hash.
 *
 * Tokens rotate: every use revokes the presented token and issues its
 * successor in the same `family` (one family = one signed-in device). If a
 * token that was already rotated is presented again, someone else holds a
 * copy, so the whole family is revoked and that device must sign in again.
 *
 * Revoked tokens are kept until they expire — that history is what makes
 * replay detectable — and MongoDB's TTL monitor deletes them afterwards.
 */
const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  family: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  revokedReason: {
    type: String,
    enum: ['rotated', 'logout', 'reuse', 'revoked', null],
    default: null,
  },
  replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'RefreshToken', default: null },
  // Shown nowhere yet; recorded so a future "your devices" screen has data.
  userAgent: { type: String, default: '' },
  ip: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
