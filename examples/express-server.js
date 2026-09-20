/**
 * multi-uploader — Express example
 * ------------------------------------------------------------
 * A runnable demo server showing how to use multi-uploader with
 * any of the three supported providers (local, GCS, S3).
 *
 * Usage:
 *   1. Copy .env.example to .env and fill in your provider config
 *   2. npm install express multer dotenv
 *   3. node examples/express-server.js
 *   4. curl -F "file=@./somefile.jpg" http://localhost:3000/upload
 */

require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Uploader = require('../src');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Multer — keep files in memory so we can stream them to any provider
// ---------------------------------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB — adjust to taste
  },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|txt|csv|zip/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);

    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error(`File type not allowed: ${file.mimetype}`));
  },
});

// ---------------------------------------------------------------------------
// Build the uploader config from env vars based on the active provider
// ---------------------------------------------------------------------------
function buildUploaderConfig() {
  const provider = process.env.STORAGE_PROVIDER || 'local';

  const base = { provider };

  switch (provider) {
    case 'local':
      return {
        ...base,
        uploadDir: process.env.UPLOAD_DIR || './uploads',
      };

    case 'gcs':
      return {
        ...base,
        projectId: process.env.GCS_PROJECT_ID,
        keyFilename: process.env.GCS_KEY_FILE,
        bucketName: process.env.GCS_BUCKET,
      };

    case 's3':
      return {
        ...base,
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        bucketName: process.env.AWS_BUCKET,
      };

    default:
      throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
  }
}

// ---------------------------------------------------------------------------
// Initialize the uploader (once, at startup)
// ---------------------------------------------------------------------------
let uploader;
try {
  uploader = new Uploader(buildUploaderConfig());
  console.log(`✅ multi-uploader ready — provider: ${process.env.STORAGE_PROVIDER || 'local'}`);
} catch (err) {
  console.error('❌ Failed to initialize uploader:', err.message);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Serve local uploads statically (only meaningful for the local provider)
// ---------------------------------------------------------------------------
if ((process.env.STORAGE_PROVIDER || 'local') === 'local') {
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  app.use('/uploads', express.static(uploadDir));
  console.log(`📁 Serving local uploads from ${uploadDir}`);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'multi-uploader-example',
    provider: process.env.STORAGE_PROVIDER || 'local',
    status: 'ok',
    endpoints: {
      upload: 'POST /upload',
      delete: 'DELETE /files/:path',
    },
  });
});

// Upload a single file
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file provided' });
  }

  try {
    const result = await uploader.upload(req.file, {
      destination: req.body.destination, // optional
      filename: req.body.filename,       // optional (local only)
    });

    return res.status(201).json({
      success: true,
      file: {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      ...result,
    });
  } catch (err) {
    console.error('Upload failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a file by its stored path/key
app.delete('/files/*', async (req, res) => {
  const filePath = req.params[0];

  if (!filePath) {
    return res.status(400).json({ success: false, error: 'Missing file path' });
  }

  try {
    await uploader.delete(filePath);
    return res.json({ success: true, deleted: filePath });
  } catch (err) {
    console.error('Delete failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Error handler (multer + everything else)
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, error: err.message });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ success: false, error: err.message });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`   Try:  curl -F "file=@./README.md" http://localhost:${PORT}/upload`);
});

module.exports = app; // exported for tests