// Vercel serverless function that runs our Express app

let appPromise;

module.exports = async (req, res) => {
  try {
    // Initialize app only once
    if (!appPromise) {
      appPromise = require('../dist/index.cjs');
    }

    // Wait for app to be ready
    const app = await appPromise;

    // Handle the request with the initialized app
    return app(req, res);
  } catch (error) {
    console.error('Error in serverless function:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};