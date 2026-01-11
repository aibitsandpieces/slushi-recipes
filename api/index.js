// Vercel serverless function that runs our Express app
const path = require('path');

// Import our built Express app
const app = require('../dist/index.cjs');

// Export as Vercel serverless function
module.exports = app;