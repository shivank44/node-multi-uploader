// src/Uploader.js
const LocalAdapter = require('./adapters/LocalAdapter');
const GCSAdapter = require('./adapters/GCSAdapter');
const S3Adapter = require('./adapters/S3Adapter');

class Uploader {
  constructor(config) {
    switch (config.provider) {
      case 'local':
        this.adapter = new LocalAdapter(config);
        break;
      case 'gcs':
        this.adapter = new GCSAdapter(config);
        break;
      case 's3':
        this.adapter = new S3Adapter(config);
        break;
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  async upload(file, options) {
    return this.adapter.upload(file, options);
  }

  async delete(filePath) {
    return this.adapter.delete(filePath);
  }
}

module.exports = Uploader;