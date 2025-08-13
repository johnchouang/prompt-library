import { createApp } from './app';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

async function startServer(): Promise<void> {
  try {
    const app = await createApp();
    
    app.listen(PORT, () => {
      console.log(`🚀 Prompt Library Service is running on http://${HOST}:${PORT}`);
      console.log(`📚 API Documentation: http://${HOST}:${PORT}/api/v1/docs`);
      console.log(`🏥 Health Check: http://${HOST}:${PORT}/health`);
      console.log(`📊 API Info: http://${HOST}:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();