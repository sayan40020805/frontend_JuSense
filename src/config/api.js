// API Configuration
const API_CONFIG = {
  // Backend API base URL - Direct connection to your backend
  BASE_URL: process.env.NODE_ENV === 'production'
    ? 'https://backend-jusense.onrender.com'
    : 'http://localhost:5000', // Local development

  // Frontend URL for sharing polls - change this to your deployed frontend URL
  FRONTEND_URL: window.location.origin,

  // Socket.io connection URL
  SOCKET_URL: process.env.NODE_ENV === 'production'
    ? 'https://backend-jusense.onrender.com'
    : 'http://localhost:5000', // Local development

  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      SIGNUP: '/api/auth/signup'
    },
    POLLS: {
      LIST: '/api/polls',
      CREATE: '/api/polls',
      GET: (id) => `/api/polls/${id}`
    },
    VOTES: {
      VOTE: (id) => `/api/votes/${id}/vote`
    },

  }
};

export default API_CONFIG;
