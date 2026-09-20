const { EventEmitter } = require('events');
const { createMockFile } = require('./helpers/mockFile');

// ---- Mock @google-cloud/storage ----
const mockGcsWriteStream = new EventEmitter();
mockGcsWriteStream.end = jest.fn();

const mockFile = {
  createWriteStream: jest.fn(() => mockGcsWriteStream),
  delete: jest.fn().mockResolvedValue([]),
};

const mockBucket = {
  name: 'my-gcs-bucket',
  file: jest.fn(() => mockFile),
};

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({
    bucket: jest.fn(() => mockBucket),
  })),
}));

const { Storage } = require('@google-cloud/storage');
const GCSAdapter = require('../src/adapters/GCSAdapter');

describe('GCSAdapter', () => {
  const baseConfig = {
    projectId: 'my-project',
    keyFilename: './fake-key.json',
    bucketName: 'my-gcs-bucket',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFile.createWriteStream.mockImplementation(() => mockGcsWriteStream);
    mockFile.delete.mockResolvedValue([]);
  });

  describe('constructor', () => {
    it('initializes Storage with project + key file', () => {
      new GCSAdapter(baseConfig); // eslint-disable-line no-new

      expect(Storage).toHaveBeenCalledWith({
        projectId: 'my-project',
        keyFilename: './fake-key.json',
      });
    });
  });

  describe('upload()', () => {
    it('pipes the file stream and resolves on finish', async () => {
      const adapter = new GCSAdapter(baseConfig);
      const file = createMockFile({ mimetype: 'image/png' });

      // Emit "finish" on next tick so the stream has time to pipe
      setImmediate(() => mockGcsWriteStream.emit('finish'));

      const result = await adapter.upload(file, { destination: 'avatars/u.png' });

      expect(mockFile.createWriteStream).toHaveBeenCalledTimes(1);
      const writeOpts = mockFile.createWriteStream.mock.calls[0][0];
      expect(writeOpts.metadata.contentType).toBe('image/png');
      expect(writeOpts.resumable).toBe(true);

      expect(result.provider).toBe('gcs');
      expect(result.path).toBe('avatars/u.png');
      expect(result.url).toBe(
        'https://storage.googleapis.com/my-gcs-bucket/avatars/u.png'
      );
    });

    it('generates a destination when none is provided', async () => {
      const adapter = new GCSAdapter(baseConfig);
      const file = createMockFile({ originalname: 'report.pdf' });

      setImmediate(() => mockGcsWriteStream.emit('finish'));

      const result = await adapter.upload(file);

      expect(result.path).toMatch(/^uploads\/\d+-report\.pdf$/);
    });

    it('rejects when the write stream errors', async () => {
      const adapter = new GCSAdapter(baseConfig);
      const file = createMockFile();

      setImmediate(() => mockGcsWriteStream.emit('error', new Error('GCS write failed')));

      await expect(adapter.upload(file)).rejects.toThrow('GCS write failed');
    });
  });

  describe('delete()', () => {
    it('calls file.delete() with the given path', async () => {
      const adapter = new GCSAdapter(baseConfig);

      await adapter.delete('avatars/u.png');

      expect(mockBucket.file).toHaveBeenCalledWith('avatars/u.png');
      expect(mockFile.delete).toHaveBeenCalledTimes(1);
    });

    it('propagates deletion errors', async () => {
      mockFile.delete.mockRejectedValueOnce(new Error('Not found'));
      const adapter = new GCSAdapter(baseConfig);

      await expect(adapter.delete('nope')).rejects.toThrow('Not found');
    });
  });
});