import * as fs from 'fs/promises';
import * as path from 'path';

// Clean up test data directory before each test suite
beforeEach(async () => {
  const testDataDir = path.join(process.cwd(), 'test-data');
  try {
    await fs.rm(testDataDir, { recursive: true, force: true });
  } catch {
    // Directory might not exist, which is fine
  }
});

// Global test configuration
process.env.NODE_ENV = 'test';