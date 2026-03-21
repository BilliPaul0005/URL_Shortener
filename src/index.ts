import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initDB } from './services/db';

const PORT = process.env.PORT || 3000;

async function main(): Promise<void> {
  try {
    // Run database migrations
    await initDB();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 URL Shortener running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

main();
