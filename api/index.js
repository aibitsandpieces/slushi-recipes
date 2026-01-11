// Vercel serverless function that runs our Express app

module.exports = async (req, res) => {
  // Import and initialize the app on first request
  const appPromise = require('../dist/index.cjs');
  const app = await appPromise;

  // Handle the request with the initialized app
  return app(req, res);
};