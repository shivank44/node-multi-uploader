const { Readable } = require('stream');

/**
 * Build a mock multer file object.
 *
 * @param {Object} [overrides]
 * @param {string} [overrides.content]       - Text content the stream will emit
 * @param {string} [overrides.mimetype]      - MIME type
 * @param {string} [overrides.originalname]  - Original filename
 * @returns {Object} A multer-compatible file object
 */
function createMockFile(overrides = {}) {
  const content = overrides.content || 'hello world';
  const buffer = Buffer.from(content);

  const stream = Readable.from(buffer);

  return {
    stream,
    mimetype: overrides.mimetype || 'text/plain',
    originalname: overrides.originalname || 'hello.txt',
    size: buffer.length,
    buffer, // handy for assertions
  };
}

/**
 * Build a mock multer file object whose stream errors mid-flight.
 * Useful for testing error propagation.
 */
function createErroringFile(errorMessage = 'stream failed') {
  const stream = new Readable({
    read() {
      this.destroy(new Error(errorMessage));
    },
  });

  return {
    stream,
    mimetype: 'text/plain',
    originalname: 'broken.txt',
    size: 0,
  };
}

module.exports = { createMockFile, createErroringFile };