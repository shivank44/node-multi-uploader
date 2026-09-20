class BaseAdapter {
  /**
   * @param {Object} file - File object from Multer (contains stream, mimetype, originalname)
   * @param {Object} options - Additional options (e.g., destination path, metadata)
   * @returns {Promise<Object>} - Upload result (URL, path, etc.)
   */
  async upload(file, options) {
    throw new Error('upload() must be implemented by subclass');
  }

  async delete(filePath) {
    throw new Error('delete() must be implemented by subclass');
  }

  async getUrl(filePath) {
    throw new Error('getUrl() must be implemented by subclass');
  }
}

module.exports = BaseAdapter;