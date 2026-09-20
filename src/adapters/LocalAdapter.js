const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const BaseAdapter = require('./BaseAdapter');

const mkdir = promisify(fs.mkdir);

class LocalAdapter extends BaseAdapter {
  constructor(config) {
    super();
    this.uploadDir = config.uploadDir || './uploads';
  }

  async upload(file, options = {}) {
    const destDir = options.destination || this.uploadDir;
    await mkdir(destDir, { recursive: true });

    const filename = options.filename || `${Date.now()}-${file.originalname}`;
    const filePath = path.join(destDir, filename);

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      file.stream.pipe(writeStream);

      writeStream.on('finish', () => {
        resolve({
          path: filePath,
          url: `/uploads/${filename}`, // Assuming static serving
          provider: 'local',
        });
      });

      writeStream.on('error', reject);
      file.stream.on('error', reject);
    });
  }

  async delete(filePath) {
    return promisify(fs.unlink)(filePath);
  }
}

module.exports = LocalAdapter;