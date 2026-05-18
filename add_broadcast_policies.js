process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

async function runSecurityMigration() {
  const connectionString = 'postgresql://postgres.zmjhirfmrsovytlzghgu:%40levyflow%40db@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  const sql = `
    -- Enable Row Level Security
    ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Allow public read access to active broadcasts" ON broadcast_messages;
    DROP POLICY IF EXISTS "Allow authenticated full access to broadcasts" ON broadcast_messages;

    -- Policy: Students can view active broadcast banners anonymously
    CREATE POLICY "Allow public read access to active broadcasts"
      ON broadcast_messages FOR SELECT
      TO anon, authenticated
      USING (active = true);

    -- Policy: Authenticated hosts can insert and manage broadcasts
    CREATE POLICY "Allow authenticated full access to broadcasts"
      ON broadcast_messages FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  `;

  try {
    await client.connect();
    console.log('Applying Row-Level Security policies to broadcast_messages...');
    await client.query(sql);
    console.log('🎉 RLS policies successfully applied and hardened!');
  } catch (err) {
    console.error('❌ Security migration failed:', err);
  } finally {
    await client.end();
  }
}

runSecurityMigration();
