import api from './api.js'

export const brandsService = {
  getBrands: () => api.get('/brands'),
  getBrandById: (id) => api.get(`/brands/${id}`),
  createBrand: (data) => api.post('/brands', data),
  updateBrand: (id, data) => api.put(`/brands/${id}`, data),
  deleteBrand: (id) => api.delete(`/brands/${id}`),
  runBrandPipeline: (id) => api.post(`/brands/${id}/run`),
}
