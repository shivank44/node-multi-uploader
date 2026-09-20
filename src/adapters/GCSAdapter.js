// src/adapters/GCSAdapter.js
const { Storage } = require('@google-cloud/storage');
const BaseAdapter = require('./BaseAdapter');

class GCSAdapter extends BaseAdapter {
  constructor(config) {
    super();
    this.storage = new Storage({
      projectId: config.projectId,
      keyFilename: config.keyFilename, // Path to service account JSON
    });
    this.bucket = this.storage.bucket(config.bucketName);
  }

  async upload(file, options = {}) {
    const destination = options.destination || `uploads/${Date.now()}-${file.originalname}`;
    const gcsFile = this.bucket.file(destination);

    return new Promise((resolve, reject) => {
      const writeStream = gcsFile.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
          },
        },
        resumable: true, // Use resumable uploads for large files
      });

      file.stream.pipe(writeStream);

      writeStream.on('finish', () => {
        resolve({
          path: destination,
          url: `https://storage.googleapis.com/${this.bucket.name}/${destination}`,
          provider: 'gcs',
        });
      });

      writeStream.on('error', reject);
    });
  }

  async delete(filePath) {
    await this.bucket.file(filePath).delete();
  }
}

module.exports = GCSAdapter;