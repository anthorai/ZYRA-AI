import { createClient } from '@supabase/supabase-js';

async function reloadSupabaseSchema() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  console.log('🔄 Reloading Supabase PostgREST schema cache...');

  try {
    // PostgREST provides an admin endpoint to reload the schema cache
    // This is done by sending a POST request to /rest/v1/rpc/pgrst_reload_schema
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/pgrst_reload_schema`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) {
      // Try alternative method - NOTIFY command
      console.log('⚠️  Standard reload failed, trying alternative method...');
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test if sync_history is accessible
      const { data, error } = await supabase
        .from('sync_history')
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ Schema cache not refreshed:', error.message);
        console.log('\n📋 Manual fix required:');
        console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run this command: NOTIFY pgrst, \'reload schema\';');
        console.log('4. Or simply restart your Supabase project\n');
        process.exit(1);
      } else {
        console.log('✅ Schema cache is up to date!');
        console.log('✅ sync_history table is accessible');
      }
    } else {
      console.log('✅ Schema cache reloaded successfully');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n📋 Manual fix: Run this in Supabase SQL Editor:');
    console.log('   NOTIFY pgrst, \'reload schema\';');
    console.log('   Or restart your Supabase project\n');
    process.exit(1);
  }
}

reloadSupabaseSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
