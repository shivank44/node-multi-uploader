const { createMockFile } = require('./helpers/mockFile');

// ---- Mock @aws-sdk/client-s3 ----
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
    config: { region: 'us-east-1' },
  })),
  DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

// ---- Mock @aws-sdk/lib-storage ----
const mockUploadDone = jest.fn();
jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation((opts) => ({
    done: mockUploadDone,
    _opts: opts, // expose for assertions
  })),
}));

const { Upload } = require('@aws-sdk/lib-storage');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const S3Adapter = require('../src/adapters/S3Adapter');

describe('S3Adapter', () => {
  const baseConfig = {
    region: 'us-east-1',
    accessKeyId: 'AKIA_TEST',
    secretAccessKey: 'secret',
    bucketName: 'my-bucket',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUploadDone.mockResolvedValue({});
    mockSend.mockResolvedValue({});
  });

  describe('constructor', () => {
    it('stores the bucket name', () => {
      const adapter = new S3Adapter(baseConfig);
      expect(adapter.bucket).toBe('my-bucket');
    });
  });

  describe('upload()', () => {
    it('uses the Upload helper with correct params', async () => {
      const adapter = new S3Adapter(baseConfig);
      const file = createMockFile({ mimetype: 'image/png' });

      await adapter.upload(file, { destination: 'avatars/user.png' });

      expect(Upload).toHaveBeenCalledTimes(1);
      const params = Upload.mock.calls[0][0].params;
      expect(params.Bucket).toBe('my-bucket');
      expect(params.Key).toBe('avatars/user.png');
      expect(params.ContentType).toBe('image/png');
      expect(params.Body).toBe(file.stream);
      expect(mockUploadDone).toHaveBeenCalled();
    });

    it('generates a key when no destination is provided', async () => {
      const adapter = new S3Adapter(baseConfig);
      const file = createMockFile({ originalname: 'doc.pdf' });

      const result = await adapter.upload(file);

      expect(result.path).toMatch(/^uploads\/\d+-doc\.pdf$/);
    });

    it('returns a provider-tagged result with URL', async () => {
      const adapter = new S3Adapter(baseConfig);
      const file = createMockFile();

      const result = await adapter.upload(file, { destination: 'test.txt' });

      expect(result.provider).toBe('s3');
      expect(result.path).toBe('test.txt');
      expect(result.url).toBe(
        'https://my-bucket.s3.us-east-1.amazonaws.com/test.txt'
      );
    });

    it('propagates upload failures', async () => {
      mockUploadDone.mockRejectedValueOnce(new Error('S3 down'));
      const adapter = new S3Adapter(baseConfig);

      await expect(adapter.upload(createMockFile())).rejects.toThrow('S3 down');
    });
  });

  describe('delete()', () => {
    it('sends a DeleteObjectCommand with the right bucket + key', async () => {
      const adapter = new S3Adapter(baseConfig);

      await adapter.delete('avatars/user.png');

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'my-bucket',
        Key: 'avatars/user.png',
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('propagates deletion errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('Access denied'));
      const adapter = new S3Adapter(baseConfig);

      await expect(adapter.delete('some-key')).rejects.toThrow('Access denied');
    });
  });
});