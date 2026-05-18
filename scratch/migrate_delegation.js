const { Client } = require('pg');

async function migrate() {
  const connectionString = 'postgresql://postgres.zmjhirfmrsovytlzghgu:%40levyflow%40db@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to PostgreSQL successfully.');

  try {
    // 1. Add 'course_rep' value to user_role enum
    try {
      await client.query("ALTER TYPE user_role ADD VALUE 'course_rep'");
      console.log("Added 'course_rep' to user_role enum.");
    } catch (e) {
      if (e.code === '42710') {
        console.log("'course_rep' role already exists in enum.");
      } else {
        throw e;
      }
    }

    // 2. Add columns to user_profiles
    await client.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS course_code VARCHAR(50)
    `);
    console.log('Updated user_profiles table with delegation columns.');

    // 3. Add columns to campaigns
    await client.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS manager_permissions TEXT[] DEFAULT '{"view","register_students","export"}'
    `);
    console.log('Updated campaigns table with delegation columns.');

    console.log('Database migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
