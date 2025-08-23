import axios from 'axios';
import API_URL from '../config';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const getUserBookings = async (page = 1, limit = 10, status = null) => {
  try {
    const response = await axios.get(`${API_URL}/bookings?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch bookings';
  }
};

export const createBooking = async (bookingData) => {
  try {
    const response = await axios.post(`${API_URL}/bookings`, bookingData, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to create booking';
  }
};

export const cancelBooking = async (bookingId) => {
  try {
    const response = await axios.put(`${API_URL}/bookings?id=${bookingId}&action=cancel`, {}, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to cancel booking';
  }
};

export const getBookingDetails = async (bookingId) => {
  try {
    const response = await axios.get(`${API_URL}/bookings?id=${bookingId}`, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch booking details';
  }
};