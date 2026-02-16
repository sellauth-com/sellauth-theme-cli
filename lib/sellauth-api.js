import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

export default class SellAuthAPI {
  constructor({ apiKey }) {
    if (!apiKey) {
      throw new Error('API key is required.');
    }

    this.client = axios.create({
      baseURL: process.env.SELLAUTH_API_URL || 'https://api-internal.sellauth.com/v1',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  // =========================
  // SHOP ENDPOINTS
  // =========================

  async getShops() {
    const { data } = await this.client.get('/shops');
    return data;
  }

  // =========================
  // THEME ENDPOINTS
  // =========================

  async getThemes(shopId) {
    const { data } = await this.client.get(`/shops/${shopId}/themes`);
    return data;
  }

  async getTheme(shopId, themeId) {
    const { data } = await this.client.get(`/shops/${shopId}/themes/${themeId}`);
    return data;
  }

  async createTheme(shopId, name, template = null) {
    const payload = { name };
    if (template) payload.template = template;

    const { data } = await this.client.post(`/shops/${shopId}/themes`, payload);

    return data;
  }

  async deleteTheme(shopId, themeId) {
    const { data } = await this.client.delete(`/shops/${shopId}/themes/${themeId}`);
    return data;
  }

  async exportTheme(shopId, themeId) {
    const response = await this.client.get(`/shops/${shopId}/themes/${themeId}/export`, {
      responseType: 'arraybuffer',
    });

    return response.data; // Buffer
  }

  async applyTheme(shopId, themeId) {
    const res = await this.client.put(`/shops/${shopId}/themes/${themeId}/apply`);
    return res.data;
  }

  // =========================
  // BUILDER FILE ENDPOINTS
  // =========================

  async getFiles(themeId) {
    const { data } = await this.client.get(`/builder/${themeId}?mode=sync`);
    return data;
  }

  async getFile(themeId, folderName, fileName) {
    const { data } = await this.client.get(`/builder/${themeId}/${folderName}/${fileName}`);

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch file.');
    }

    // Decode base64 content
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  async updateFile(themeId, folderName, fileName, content) {
    const { data } = await this.client.put(`/builder/${themeId}/${folderName}/${fileName}`, {
      content,
    });

    return data;
  }

  async createFile(themeId, folderName, fileName) {
    const { data } = await this.client.post(`/builder/${themeId}/${folderName}/${fileName}`);

    return data;
  }

  async deleteFile(themeId, folderName, fileName) {
    const { data } = await this.client.delete(`/builder/${themeId}/${folderName}/${fileName}`);

    return data;
  }

  async uploadFile(themeId, folderName, filePath) {
    const form = new FormData();

    form.append('file', fs.createReadStream(filePath));

    const response = await axios.post(
      `${this.client.defaults.baseURL}/builder/${themeId}/${folderName}/upload`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.client.defaults.headers.Authorization}`,
          Accept: 'application/json',
        },
      }
    );

    return response.data;
  }

  async generateBuilderToken(shopId, themeId) {
    const response = await this.client.post(`/shops/${shopId}/builder/${themeId}/generate-token`);
    return response.data;
  }

  getBuilderPreviewUrl(shopId, themeId, token, template = 'shop', second = '') {
    const baseUrl = process.env.SELLAUTH_URL || 'https://sellauth.com';
    return `${baseUrl}/builder/render/${shopId}/${themeId}/${token}/${template}${second ? '/' + second : ''}`;
  }
}
