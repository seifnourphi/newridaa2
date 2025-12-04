// Quick diagnostic script to compare document counts between "test" and "ridaa"
// Usage:
//   node scripts/check-db-counts.js

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is not set in .env');
  process.exit(1);
}

const importantCollections = [
  'admins',
  'users',
  'products',
  'orders',
  'categories',
  'coupons',
  'reviews',
  'advertisements',
  'settings',
];

async function run() {
  console.log('🔗 Connecting to MongoDB with URI from .env ...');
  const client = new MongoClient(uri, {});

  try {
    await client.connect();
    console.log('✅ Connected.\n');

    const dbTest = client.db('test');
    const dbRidaa = client.db('ridaa');

    console.log('📊 Document counts per collection (test vs ridaa):\n');

    for (const collName of importantCollections) {
      const cTest = dbTest.collection(collName);
      const cRidaa = dbRidaa.collection(collName);

      const [countTest, countRidaa] = await Promise.all([
        cTest.countDocuments().catch(() => 0),
        cRidaa.countDocuments().catch(() => 0),
      ]);

      console.log(
        `${collName.padEnd(16)}  test: ${String(countTest).padStart(4)}   ridaa: ${String(
          countRidaa,
        ).padStart(4)}`,
      );
    }
  } catch (err) {
    console.error('❌ Error while checking counts:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => {});
    console.log('\n🔌 Disconnected from MongoDB.');
  }
}

run();


