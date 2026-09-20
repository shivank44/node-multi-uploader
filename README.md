# node-multi-uploader

> A unified Node.js file upload library that lets you switch between **local filesystem**, **Google Cloud Storage**, and **AWS S3** with a single, consistent API.

Built with a **stream-first** architecture and the **adapter pattern**, `multi-uploader` handles large files efficiently without loading them into memory. Swap providers by changing one config value — no code changes required.

---

## ✨ Features

- 🔌 **Unified API** — Same `upload()` and `delete()` methods for all providers.
- 🚀 **Stream-first** — Pipes files directly to their destination; memory-safe for large files.
- 🧩 **Adapter pattern** — Clean, extensible architecture. Add your own providers easily.
- ☁️ **Multi-cloud** — Local disk, GCS, and S3 out of the box.
- 📦 **Optional peers** — Only install the SDK for the provider you actually use.
- 🧪 **Well-tested** — Unit and integration tests with LocalStack and GCS emulators.
- 🟦 **TypeScript-friendly** — Ships with type definitions.

---

## 📦 Installation

Install the core package:

```bash
npm install node-multi-uploader
```

Then install **only the SDK** for the provider you need:

```bash
# For AWS S3
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage

# For Google Cloud Storage
npm install @google-cloud/storage

# For local filesystem — no extra dependencies needed
```

---

## 🚀 Quick Start

### 1. Basic Setup

```javascript
const Uploader = require('multi-uploader');

const uploader = new Uploader({
  provider: 's3', // 'local' | 'gcs' | 's3'
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucketName: process.env.AWS_BUCKET,
});
```

### 2. Express + Multer Example

```javascript
const express = require('express');
const multer = require('multer');
const Uploader = require('multi-uploader');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const uploader = new Uploader({
  provider: process.env.STORAGE_PROVIDER,
  // Local config
  uploadDir: './uploads',
  // GCS config
  bucketName: process.env.GCS_BUCKET,
  keyFilename: process.env.GCS_KEY_FILE,
  // S3 config
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const result = await uploader.upload(req.file);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

---

## 📖 API Reference

### `new Uploader(config)`

Creates an uploader instance for a specific provider.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `provider` | `'local' \| 'gcs' \| 's3'` | ✅ | The storage backend to use. |

#### Local provider config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `uploadDir` | `string` | `'./uploads'` | Directory to write uploaded files to. |

#### GCS provider config

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `projectId` | `string` | ✅ | Google Cloud project ID. |
| `keyFilename` | `string` | ✅ | Path to the service account JSON key file. |
| `bucketName` | `string` | ✅ | Target GCS bucket name. |

#### S3 provider config

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `region` | `string` | ✅ | AWS region (e.g., `us-east-1`). |
| `accessKeyId` | `string` | ✅ | AWS access key ID. |
| `secretAccessKey` | `string` | ✅ | AWS secret access key. |
| `bucketName` | `string` | ✅ | Target S3 bucket name. |

---

### `uploader.upload(file, options?)`

Uploads a file using the configured provider.

**Parameters**

- `file` *(Object, required)* — A multer file object with `stream`, `mimetype`, and `originalname`.
- `options` *(Object, optional)*:
  - `destination` *(string)* — Custom path/key for the uploaded file.
  - `filename` *(string)* — Custom filename (local provider only).

**Returns** `Promise<UploadResult>`

```typescript
{
  path: string;      // The stored path or key
  url: string;       // Public URL (if applicable)
  provider: string;  // 'local' | 'gcs' | 's3'
}
```

**Example**

```javascript
const result = await uploader.upload(req.file, {
  destination: 'avatars/user-123.png',
});
```

---

### `uploader.delete(filePath)`

Deletes a file from the configured provider.

```javascript
await uploader.delete('uploads/user-123.png');
```

---

## 🧩 Supported Providers

### 🗂️ Local Filesystem

```javascript
const uploader = new Uploader({
  provider: 'local',
  uploadDir: './uploads',
});
```

- ✅ Zero external dependencies.
- ✅ Files are written to disk via `fs.createWriteStream`.
- ⚠️ Serve files statically (e.g., `express.static('uploads')`) to expose URLs.

---

### ☁️ Google Cloud Storage

```javascript
const uploader = new Uploader({
  provider: 'gcs',
  projectId: 'my-project',
  keyFilename: './gcs-key.json',
  bucketName: 'my-bucket',
});
```

- ✅ Uses resumable uploads for files of any size.
- ✅ Automatically sets `contentType` from the file's mimetype.
- 📚 [GCS Setup Guide](https://cloud.google.com/storage/docs/reference/libraries)

---

### 🪣 AWS S3

```javascript
const uploader = new Uploader({
  provider: 's3',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucketName: 'my-bucket',
});
```

- ✅ Uses `@aws-sdk/lib-storage` for automatic multipart uploads.
- ✅ Handles files > 5 GB out of the box.
- 📚 [S3 SDK Guide](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)

---

## 🔧 Extending: Add Your Own Adapter

Want to support Azure Blob Storage, MinIO, or DigitalOcean Spaces? Just extend `BaseAdapter`:

```javascript
const BaseAdapter = require('multi-uploader/src/adapters/BaseAdapter');

class MyAdapter extends BaseAdapter {
  async upload(file, options) {
    // Your implementation
    return { path, url, provider: 'my-provider' };
  }

  async delete(filePath) {
    // Your implementation
  }
}
```

Then register it in the `Uploader` class or open a PR to add it upstream.

---

## 🧪 Testing

Run the test suite:

```bash
npm test
```

For integration tests, `multi-uploader` uses:

- **[LocalStack](https://localstack.cloud/)** — for S3 emulation.
- **[Fake GCS Server](https://github.com/fsouza/fake-gcs-server)** — for GCS emulation.

This means you can run the full test suite in CI without real cloud credentials or costs.

---

## 🗺️ Roadmap

- [ ] Signed URL generation (S3 & GCS)
- [ ] File validation (size, MIME type allowlist)
- [ ] Azure Blob Storage adapter
- [ ] MinIO adapter
- [ ] CLI tool for migration between providers

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repo.
2. Create a feature branch (`git checkout -b feature/my-feature`).
3. Commit your changes (`git commit -m 'Add my feature'`).
4. Push to the branch (`git push origin feature/my-feature`).
5. Open a Pull Request.

Please make sure `npm test` and `npm run lint` pass before submitting.

---

## 📄 License

[MIT](./LICENSE) © Your Name

---

## 🙏 Acknowledgements

- Inspired by the adapter pattern used across the Node.js ecosystem.
- Built on top of the official [AWS SDK v3](https://github.com/aws/aws-sdk-js-v3) and [Google Cloud Storage SDK](https://github.com/googleapis/nodejs-storage).