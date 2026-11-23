import client from './client';

export const bookingApi = {
  getAll: (params) => client.get('/bookings', { params }),
  getById: (id) => client.get(`/bookings/${id}`),
  create: (data) => client.post('/bookings', data),
  getBill: (id) => client.get(`/bookings/${id}/bill`),
  checkIn: (id) => client.patch(`/bookings/${id}/check-in`),
  checkOut: (id) => client.patch(`/bookings/${id}/check-out`),
  cancel: (id) => client.patch(`/bookings/${id}/cancel`),
  updateStatus: (id, status) => client.patch(`/bookings/${id}/status`, { status }),
  checkAvailability: (params) => client.get('/bookings/availability', { params }),
};
