const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  CNE: {
    type: String,
    trim: true,
    default: '',
  },
  profilePic: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'parking_owner', 'technicien'],
    default: 'user',
  },
  // Prepaid balance in MAD. Optional and defaulted, so accounts created
  // before payments existed read as zero.
  walletBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Accounts are disabled, never deleted: bookings, payments and fines keep
  // pointing at them. A disabled account can neither sign in nor use a token
  // it already holds.
  isActive: {
    type: Boolean,
    default: true,
  },
  // Bumped to revoke every token issued so far (password change, account
  // disabled, "sign out everywhere"). Access tokens carry it as "tv".
  tokenVersion: {
    type: Number,
    default: 0,
    select: false,
  },
  passwordChangedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT. Without options this is the long-lived token every client
// has always received; src/auth/tokens.js asks for short access tokens.
userSchema.methods.generateToken = function ({ expiresIn } = {}) {
  return jwt.sign(
    { id: this._id, role: this.role, tv: this.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = mongoose.model('User', userSchema);
