import axios from 'axios';

const BASE_URL = 'https://backend-pharmacy-5541.onrender.com/api/equipment';

export const addEquipmentToCentral = async (items, usePreviousBatchId = false) => {
  const res = await axios.post(`${BASE_URL}/central/add`, { items, usePreviousBatchId });
  return res.data;
};

export const allocateEquipmentToLabByScan = async ({ itemId, toLabId }) => {
  const res = await axios.post(`${BASE_URL}/allocate/scan`, { itemId, toLabId });
  return res.data;
};

export const returnEquipmentToCentral = async (itemId) => {
  const res = await axios.post(`${BASE_URL}/return/central`, { itemId });
  return res.data;
};

export const scanEquipmentQRCode = async (qrCodeData) => {
  const res = await axios.post(`${BASE_URL}/scan`, { qrCodeData });
  return res.data;
};

export const getCentralAvailableEquipment = async () => {
  const res = await axios.get(`${BASE_URL}/central/available`);
  return res.data;
};

export const getEquipmentStock = async (labId) => {
  const res = await axios.get(`${BASE_URL}/stock?labId=${labId}`);
  return res.data;
};
