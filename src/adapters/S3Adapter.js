// src/adapters/S3Adapter.js
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const BaseAdapter = require('./BaseAdapter');

class S3Adapter extends BaseAdapter {
  constructor(config) {
    super();
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucket = config.bucketName;
  }

  async upload(file, options = {}) {
    const key = options.destination || `uploads/${Date.now()}-${file.originalname}`;

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: file.stream,
        ContentType: file.mimetype,
      },
    });

    await upload.done();

    return {
      path: key,
      url: `https://${this.bucket}.s3.${this.client.config.region}.amazonaws.com/${key}`,
      provider: 's3',
    };
  }

  async delete(filePath) {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    }));
  }
}

module.exports = S3Adapter;