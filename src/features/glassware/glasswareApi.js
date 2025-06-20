import axios from 'axios';

const BASE_URL = 'https://backend-pharmacy-5541.onrender.com/api/glassware';

export const addGlasswareToCentral = async (items, usePreviousBatchId = false) => {
  const res = await axios.post(`${BASE_URL}/central/add`, { items, usePreviousBatchId });
  return res.data;
};

export const allocateGlasswareToLab = async ({ productId, toLabId, quantity, variant }) => {
  const res = await axios.post(`${BASE_URL}/allocate`, { productId, toLabId, quantity, variant });
  return res.data;
};

export const transferGlassware = async ({ productId, fromLabId, toLabId, quantity, variant }) => {
  const res = await axios.post(`${BASE_URL}/transfer`, { productId, fromLabId, toLabId, quantity, variant });
  return res.data;
};

export const scanGlasswareQRCode = async (qrCodeData) => {
  const res = await axios.post(`${BASE_URL}/scan`, { qrCodeData });
  return res.data;
};

export const getCentralAvailableGlassware = async () => {
  const res = await axios.get(`${BASE_URL}/central/available`);
  return res.data;
};

export const getGlasswareStock = async (labId) => {
  const url = labId ? `${BASE_URL}/stock?labId=${labId}` : `${BASE_URL}/stock`;
  const res = await axios.get(url);
  return res.data;
};

export const getAllGlasswareStock = async () => {
  // Get stock from all labs by not passing any labId
  const res = await axios.get(`${BASE_URL}/stock`);
  return res.data;
};
