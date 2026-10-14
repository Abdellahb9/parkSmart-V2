const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

/**
 * Photo evidence attached to a fine.
 *
 * Stored under storage/fines — deliberately NOT under uploads/, which is
 * served publicly: a photo of a plate is personal data and is only ever
 * returned through an authenticated route. Filenames are random; nothing the
 * client sends ends up in a path.
 */
const FINE_PHOTO_DIR = path.join(__dirname, '..', '..', 'storage', 'fines');
fs.mkdirSync(FINE_PHOTO_DIR, { recursive: true });

const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: FINE_PHOTO_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + EXTENSIONS[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (EXTENSIONS[file.mimetype]) return cb(null, true);
    const err = new Error('Photo must be a JPEG, PNG or WebP image');
    err.status = 400;
    return cb(err);
  },
});

/**
 * Accepts an optional `photo` field. A JSON request (every client before this
 * feature) passes through untouched, so the endpoint stays backward compatible.
 */
const finePhoto = (req, res, next) =>
  upload.single('photo')(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Photo must be smaller than 5 MB' : err.message || 'Invalid photo';
    return res.status(400).json({ message });
  });

/** Removes an uploaded file when the request it belonged to failed. */
const discardUpload = (file) => {
  if (file && file.path) fs.unlink(file.path, () => {});
};

module.exports = { finePhoto, discardUpload, FINE_PHOTO_DIR };
