// Entry point untuk Railway/Production deployment
const app = require('./server.js');

const PORT = process.env.PORT || 5000;

console.log('🚀 Starting Depo Air Minum Backend...');
console.log('📍 Port:', PORT);
console.log('🔗 Database URL:', process.env.DATABASE_URL ? 'Connected' : 'Not configured');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/api/health`);
});
