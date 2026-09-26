export const ROUTES = {
  home: '/',
  preview: '/preview',
  useCases: '/use-cases',
  capabilities: '/capabilities',
  pricing: '/#pricing',
  dashboard: '/dashboard',
  login: '/login',
  register: '/register',
  checkout: '/checkout',
  onboarding: '/onboarding',
  brands: '/brands',
  posts: '/posts',
  analyses: '/analyses',
  retrieval: '/retrieval',
  insights: '/insights',
  reports: '/reports',
  pipelineHistory: '/pipeline-history',
  alerts: '/alerts',
  subscription: '/subscription',
  connections: '/connections',
  knowledge: '/knowledge',
  agentLogs: '/agent-logs',
  agentWorkflow: '/agent-workflow',
  evaluation: '/evaluation',
  settings: '/settings',
  admin: '/admin',
}

export const getPostDetailPath = (postId) => `/posts/${postId}`
export const getBrandDetailPath = (brandId) => `/brands/${brandId}`
export const getRetrievalDetailPath = (retrievalId) => `/retrieval/${retrievalId}`
export const getInsightDetailPath = (insightId) => `/insights/${insightId}`
export const getRetrievalPath = (query) =>
  query ? `/retrieval?q=${encodeURIComponent(query)}` : '/retrieval'
export const getInsightsPath = (retrievalId) =>
  retrievalId ? `/insights?retrieval=${retrievalId}` : '/insights'
