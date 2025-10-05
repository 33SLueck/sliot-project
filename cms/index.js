const express = require('express');
const cors = require('cors');
const { initializeSecrets } = require('./secrets');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize with secrets (Parameter Store in production, env vars locally)
initializeSecrets().then(config => {
  const PORT = process.env.PORT || 4000;
  
  console.log(`🚀 CMS starting in ${config.app.nodeEnv} mode`);
  console.log(`📊 Database: ${config.database.url ? 'Connected' : 'Not configured'}`);
  
  app.get('/products', (req, res) => {
    res.json([
      { id: 1, name: "Product A", price: 10 },
      { id: 2, name: "Product B", price: 20 }
    ]);
  });

  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      environment: config.app.nodeEnv,
      timestamp: new Date().toISOString()
    });
  });

  app.listen(PORT, () => {
    console.log(`🎯 CMS API running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}).catch(error => {
  console.error('❌ Failed to initialize secrets:', error);
  process.exit(1);
});
