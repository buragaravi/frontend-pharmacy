import axios from 'axios';

const BASE_URL = 'https://backend-pharmacy-5541.onrender.com/api/glassware';

export const addGlasswareToCentral = async (items, usePreviousBatchId = false) => {
  const token = localStorage.getItem('token');
  const res = await axios.post(`${BASE_URL}/central/add`, { items, usePreviousBatchId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const allocateGlasswareToLab = async ({ productId, toLabId, quantity, variant }) => {
  const token = localStorage.getItem('token');
  const res = await axios.post(`${BASE_URL}/allocate`, { productId, toLabId, quantity, variant }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const transferGlassware = async ({ productId, fromLabId, toLabId, quantity, variant }) => {
  const token = localStorage.getItem('token');
  const res = await axios.post(`${BASE_URL}/transfer`, { productId, fromLabId, toLabId, quantity, variant }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const scanGlasswareQRCode = async (qrCodeData) => {
  const token = localStorage.getItem('token');
  const res = await axios.post(`${BASE_URL}/scan`, { qrCodeData }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getCentralAvailableGlassware = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${BASE_URL}/central/available`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getGlasswareStock = async (labId) => {
  const token = localStorage.getItem('token');
  const url = labId ? `${BASE_URL}/stock?labId=${labId}` : `${BASE_URL}/stock`;
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getAllGlasswareStock = async () => {
  const token = localStorage.getItem('token');
  // Get stock from all labs by not passing any labId
  const res = await axios.get(`${BASE_URL}/stock`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
