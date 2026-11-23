import client from './client';

export const roomTypeApi = {
  getAll: () => client.get('/room-types'),
  getById: (id) => client.get(`/room-types/${id}`),
  create: (data) => client.post('/room-types', data),
  update: (id, data) => client.put(`/room-types/${id}`, data),
};
