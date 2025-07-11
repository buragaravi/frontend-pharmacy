import axios from 'axios';

const BASE_URL = 'https://backend-pharmacy-5541.onrender.com/api/equipment';

export const addEquipmentToCentral = async (items, usePreviousBatchId = false) => {
  const token = localStorage.getItem('token');
  const res = await axios.post(`${BASE_URL}/central/add`, { items, usePreviousBatchId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const allocateEquipmentToLabByScan = async ({ itemId, toLabId }) => {
  const token = localStorage.getItem('token');
  const res = await axios.post(`${BASE_URL}/allocate/scan`, { itemId, toLabId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const returnEquipmentToCentral = async (itemId) => {
  const token = localStorage.getItem('token');
  const res = await axios.post(`${BASE_URL}/return/central`, { itemId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const scanEquipmentQRCode = async (qrCodeData) => {
  const token = localStorage.getItem('token');
  const res = await axios.post(`${BASE_URL}/scan`, { qrCodeData }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getCentralAvailableEquipment = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${BASE_URL}/central/available`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getEquipmentStock = async (labId) => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${BASE_URL}/stock?labId=${labId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
