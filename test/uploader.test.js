const Uploader = require('../src/Uploader');

// Mock every adapter so we're testing only the dispatch logic
jest.mock('../src/adapters/LocalAdapter');
jest.mock('../src/adapters/S3Adapter');
jest.mock('../src/adapters/GCSAdapter');

const LocalAdapter = require('../src/adapters/LocalAdapter');
const S3Adapter = require('../src/adapters/S3Adapter');
const GCSAdapter = require('../src/adapters/GCSAdapter');

describe('Uploader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Give every adapter a stub upload/delete so delegation can be verified
    [LocalAdapter, S3Adapter, GCSAdapter].forEach((Adapter) => {
      Adapter.mockImplementation(() => ({
        upload: jest.fn().mockResolvedValue({ provider: 'mock' }),
        delete: jest.fn().mockResolvedValue(undefined),
      }));
    });
  });

  describe('constructor', () => {
    it('instantiates LocalAdapter for provider=local', () => {
      new Uploader({ provider: 'local', uploadDir: './tmp' }); // eslint-disable-line no-new
      expect(LocalAdapter).toHaveBeenCalledWith({
        provider: 'local',
        uploadDir: './tmp',
      });
    });

    it('instantiates S3Adapter for provider=s3', () => {
      new Uploader({ provider: 's3', bucketName: 'b' }); // eslint-disable-line no-new
      expect(S3Adapter).toHaveBeenCalled();
    });

    it('instantiates GCSAdapter for provider=gcs', () => {
      new Uploader({ provider: 'gcs', bucketName: 'b' }); // eslint-disable-line no-new
      expect(GCSAdapter).toHaveBeenCalled();
    });

    it('throws for an unsupported provider', () => {
      expect(() => new Uploader({ provider: 'azure' })).toThrow(
        /Unsupported provider: azure/
      );
    });

    it('throws when provider is missing', () => {
      expect(() => new Uploader({})).toThrow(/Unsupported provider/);
    });
  });

  describe('upload()', () => {
    it('delegates to the adapter and returns its result', async () => {
      const uploader = new Uploader({ provider: 'local' });
      const fakeFile = { stream: {}, originalname: 'x.txt' };

      const result = await uploader.upload(fakeFile, { destination: 'a/b' });

      expect(uploader.adapter.upload).toHaveBeenCalledWith(fakeFile, {
        destination: 'a/b',
      });
      expect(result).toEqual({ provider: 'mock' });
    });

    it('propagates adapter errors', async () => {
      const uploader = new Uploader({ provider: 's3' });
      uploader.adapter.upload.mockRejectedValueOnce(new Error('nope'));

      await expect(uploader.upload({})).rejects.toThrow('nope');
    });
  });

  describe('delete()', () => {
    it('delegates to the adapter', async () => {
      const uploader = new Uploader({ provider: 'gcs' });

      await uploader.delete('some/key.txt');

      expect(uploader.adapter.delete).toHaveBeenCalledWith('some/key.txt');
    });
  });
});