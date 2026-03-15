import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

export const parsePreview = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await API.post('/parse-preview', form);
  return data;
};

export const startGeneration = async (file, siteName, maxPages) => {
  const form = new FormData();
  form.append('file', file);
  form.append('site_name', siteName);
  form.append('max_pages', maxPages);
  const { data } = await API.post('/generate', form);
  return data;
};

export const getStatus = async (jobId) => {
  const { data } = await API.get(`/status/${jobId}`);
  return data;
};

export const getResult = async (jobId) => {
  const { data } = await API.get(`/result/${jobId}`);
  return data;
};
