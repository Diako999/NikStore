import http from './http.service'

export const searchService = {
  search: (params) => http.get('/search', { params }),
  suggest: (q) => http.get('/search/suggest', { params: { q } }),
  getHistory: () => http.get('/search/history'),
  clearHistory: () => http.delete('/search/history'),
  removeHistoryTerm: (term) => http.delete(`/search/history/${term}`),
}
