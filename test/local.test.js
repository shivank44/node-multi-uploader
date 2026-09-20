const fs = require('fs');
const path = require('path');
const os = require('os');

const LocalAdapter = require('../src/adapters/LocalAdapter');
const { createMockFile, createErroringFile } = require('./helpers/mockFile');

describe('LocalAdapter', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multi-uploader-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('constructor', () => {
    it('uses the configured uploadDir', () => {
      const adapter = new LocalAdapter({ uploadDir: tmpDir });
      expect(adapter.uploadDir).toBe(tmpDir);
    });

    it('defaults uploadDir to ./uploads when not provided', () => {
      const adapter = new LocalAdapter({});
      expect(adapter.uploadDir).toBe('./uploads');
    });
  });

  describe('upload()', () => {
    it('writes the stream to disk and returns path + url', async () => {
      const adapter = new LocalAdapter({ uploadDir: tmpDir });
      const file = createMockFile({ content: 'file content' });

      const result = await adapter.upload(file, { filename: 'test.txt' });

      expect(result.provider).toBe('local');
      expect(result.path).toBe(path.join(tmpDir, 'test.txt'));
      expect(result.url).toBe('/uploads/test.txt');

      // Verify actual file contents
      const written = fs.readFileSync(result.path, 'utf8');
      expect(written).toBe('file content');
    });

    it('generates a unique filename when none is provided', async () => {
      const adapter = new LocalAdapter({ uploadDir: tmpDir });
      const file = createMockFile({ originalname: 'photo.jpg' });

      const result = await adapter.upload(file);

      expect(result.path).toMatch(/photo\.jpg$/);
      expect(fs.existsSync(result.path)).toBe(true);
    });

    it('creates nested destination directories automatically', async () => {
      const adapter = new LocalAdapter({ uploadDir: tmpDir });
      const file = createMockFile();
      const nested = path.join(tmpDir, 'a', 'b', 'c');

      const result = await adapter.upload(file, {
        destination: nested,
        filename: 'deep.txt',
      });

      expect(fs.existsSync(result.path)).toBe(true);
      expect(result.path).toBe(path.join(nested, 'deep.txt'));
    });

    it('rejects when the source stream errors', async () => {
      const adapter = new LocalAdapter({ uploadDir: tmpDir });
      const file = createErroringFile('boom');

      await expect(
        adapter.upload(file, { filename: 'fail.txt' })
      ).rejects.toThrow('boom');
    });
  });

  describe('delete()', () => {
    it('removes an existing file', async () => {
      const adapter = new LocalAdapter({ uploadDir: tmpDir });
      const filePath = path.join(tmpDir, 'delete-me.txt');
      fs.writeFileSync(filePath, 'bye');

      await adapter.delete(filePath);

      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('rejects when the file does not exist', async () => {
      const adapter = new LocalAdapter({ uploadDir: tmpDir });
      const missing = path.join(tmpDir, 'nope.txt');

      await expect(adapter.delete(missing)).rejects.toThrow();
    });
  });
});