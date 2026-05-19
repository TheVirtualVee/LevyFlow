const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const prefixes = ['aws-0', 'aws-1'];
const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ca-central-1', 'eu-central-1', 'eu-west-1', 'eu-west-2',
  'eu-west-3', 'eu-north-1', 'sa-east-1', 'ap-southeast-1',
  'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-south-1'
];

async function tryMigration() {
  const projectRef = 'zmjhirfmrsovytlzghgu';
  const user = `postgres.${projectRef}`;
  const password = '@levyflow@db';
  
  const migrationPath = path.resolve(__dirname, 'supabase/migrations/002_readiness_fixes.sql');
  console.log('Reading readiness fixes migration file...');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  for (const prefix of prefixes) {
    for (const region of regions) {
      const host = `${prefix}-${region}.pooler.supabase.com`;
      console.log(`Trying ${host}...`);
      
      const client = new Client({
        user: user,
        host: host,
        database: 'postgres',
        password: password,
        port: 6543,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000
      });

      try {
        await client.connect();
        console.log(`\n🎉 CONNECTED TO ${host} USING PASSWORD: ${password}`);
        await client.query(sql);
        console.log('✅ READINESS DATABASE MIGRATION COMPLETED SUCCESSFULLY!');
        await client.end();
        return;
      } catch (e) {
        if (e.message.includes('password authentication failed') || e.message.includes('password')) {
          console.log(`\n🎯 CORRECT POOLER FOUND: ${host}! (But password failed: ${e.message})`);
          
          // Try bracket password
          const altPassword = '[@levyflow@db]';
          console.log(`Trying alternative bracket password: ${altPassword}...`);
          const altClient = new Client({
            user: user,
            host: host,
            database: 'postgres',
            password: altPassword,
            port: 6543,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
          });
          
          try {
            await altClient.connect();
            console.log(`\n🎉 CONNECTED TO ${host} USING BRACKET PASSWORD!`);
            await altClient.query(sql);
            console.log('✅ READINESS DATABASE MIGRATION COMPLETED SUCCESSFULLY!');
            await altClient.end();
            return;
          } catch (altErr) {
            console.log(`❌ Bracket password failed:`, altErr.message);
          }
          await client.end();
          return;
        } else {
          console.log(`  - ${host}: ${e.message.split('\n')[0]}`);
        }
        try {
          await client.end();
        } catch (endErr) {}
      }
    }
  }
  
  console.error('\n❌ All pooler connection attempts failed.');
}

tryMigration();
