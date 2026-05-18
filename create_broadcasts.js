process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

async function runMigration() {
  const connectionString = 'postgresql://postgres.zmjhirfmrsovytlzghgu:%40levyflow%40db@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  const sql = `
    CREATE TABLE IF NOT EXISTS broadcast_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      severity VARCHAR(20) DEFAULT 'info',
      active BOOLEAN DEFAULT true,
      starts_at TIMESTAMPTZ DEFAULT NOW(),
      ends_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_broadcast_active ON broadcast_messages(active, campaign_id, ends_at);
  `;

  try {
    await client.connect();
    console.log('Connected to database to run broadcast schema migration...');
    await client.query(sql);
    console.log('🎉 broadcast_messages table and indexes successfully provisioned!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
