// Vercel serverless function that runs our Express app

// Import our built Express app (CommonJS)
const app = require('../dist/index.cjs');

// Export as Vercel serverless function
module.exports = app;