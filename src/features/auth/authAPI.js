import axios from 'axios';

const BASE_URL = 'https://backend-pharmacy-5541.onrender.com/api';

export const register = async (userData) => {
  const response = await axios.post(`${BASE_URL}/auth/register`, userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axios.get(`${BASE_URL}/auth/me`);
  return response.data;
};
