export const env = {
  supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  databaseString: required('DATABASE_STRING'),
  appUrl: required('NEXT_PUBLIC_APP_URL'),
  storageBucket: required('STORAGE_BUCKET')
}

function required(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required configuration environment variable: ${key}`)
  }
  return value
}
