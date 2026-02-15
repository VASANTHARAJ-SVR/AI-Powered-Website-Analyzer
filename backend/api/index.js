const app = require('../src/app');
const connectDB = require('../src/db/connection');

module.exports = async (req, res) => {
  // Ensure database connection is established
  await connectDB();
  
  // Forward request to Express app
  return app(req, res);
};
