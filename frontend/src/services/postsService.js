import apiClient from './api.js'

export const postsService = {
  createPost: (data) => apiClient.post('/posts', data).then((response) => response.data),
  createFromScreenshot: (data) => apiClient.post('/posts/screenshot', data, { timeout: 45000 }).then((response) => response.data),
  createFromFacebookLink: (url) => apiClient.post('/posts/facebook-link', { url }, { timeout: 30000 }).then((response) => response.data),
  getPosts: () => apiClient.get('/posts').then((response) => response.data),
  getPost: (id) => apiClient.get(`/posts/${id}`).then((response) => response.data),
  updatePost: (id, data) => apiClient.patch(`/posts/${id}`, data).then((response) => response.data),
  deletePost: (id) => apiClient.delete(`/posts/${id}`).then((response) => response.data),
}
