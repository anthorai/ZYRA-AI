import { createClient } from '@supabase/supabase-js';

// Development mode allows running without Supabase for UI testing
const isDevelopment = process.env.NODE_ENV === 'development';

// Supabase configuration for server-side operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// In production, require all Supabase credentials
if (!isDevelopment) {
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required for server operations');
  }
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for server operations');
  }
  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY environment variable is required for auth verification');
  }
}

// Development mode: use mock credentials if not provided
const devUrl = supabaseUrl || 'https://mock-supabase-url.supabase.co';
const devServiceKey = supabaseServiceKey || 'mock-service-role-key';
const devAnonKey = supabaseAnonKey || 'mock-anon-key';

if (isDevelopment && (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey)) {
  console.log('⚠️  Development mode: Running without Supabase credentials (auth disabled)');
}

// Create Supabase client for server-side operations (admin tasks)
export const supabase = createClient(devUrl, devServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase client for auth token verification
export const supabaseAuth = createClient(devUrl, devAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

export default supabase;