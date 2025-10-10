import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testServerEndpoints() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Server AI Endpoints Integration Test           ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  
  const results = {
    tests: [],
    passed: 0,
    failed: 0
  };
  
  // Test 1: Server Health Check
  console.log('Test 1: Server Health Check');
  console.log('────────────────────────────────────────────────────');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      console.log(`✅ Status: PASSED`);
      console.log(`📡 Server: Running on port 5000`);
      results.passed++;
      results.tests.push({ name: 'Server Health', status: 'PASSED' });
    } else {
      throw new Error('Server not responding');
    }
  } catch (error) {
    console.log(`❌ Status: FAILED - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Server Health', status: 'FAILED', error: error.message });
  }
  
  console.log('');
  
  // Test 2: Code Verification - Check Model References
  console.log('Test 2: Code Verification - Model References');
  console.log('────────────────────────────────────────────────────');
  try {
    const fs = await import('fs');
    const routesContent = fs.readFileSync('./server/routes.ts', 'utf8');
    
    const gpt4oMiniCount = (routesContent.match(/gpt-4o-mini/g) || []).length;
    const hasGpt5 = routesContent.includes('gpt-5');
    const hasGpt4 = routesContent.match(/gpt-4[^o]/g);
    
    if (gpt4oMiniCount >= 7 && !hasGpt5 && !hasGpt4) {
      console.log(`✅ Status: PASSED`);
      console.log(`📊 Found ${gpt4oMiniCount} "gpt-4o-mini" references`);
      console.log(`📊 No old model references found`);
      results.passed++;
      results.tests.push({ name: 'Model References', status: 'PASSED', count: gpt4oMiniCount });
    } else {
      throw new Error(`Incorrect model references: ${gpt4oMiniCount} gpt-4o-mini, has gpt-5: ${hasGpt5}`);
    }
  } catch (error) {
    console.log(`❌ Status: FAILED - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Model References', status: 'FAILED', error: error.message });
  }
  
  console.log('');
  
  // Test 3: Database Schema Verification
  console.log('Test 3: Database Schema Default Model');
  console.log('────────────────────────────────────────────────────');
  try {
    const fs = await import('fs');
    const schemaContent = fs.readFileSync('./shared/schema.ts', 'utf8');
    
    if (schemaContent.includes('model: text("model").default("gpt-4o-mini")')) {
      console.log(`✅ Status: PASSED`);
      console.log(`📊 Schema default model: gpt-4o-mini`);
      results.passed++;
      results.tests.push({ name: 'Database Schema', status: 'PASSED' });
    } else {
      throw new Error('Schema does not have gpt-4o-mini as default');
    }
  } catch (error) {
    console.log(`❌ Status: FAILED - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Database Schema', status: 'FAILED', error: error.message });
  }
  
  console.log('');
  
  // Test 4: Documentation Verification
  console.log('Test 4: Documentation Updated');
  console.log('────────────────────────────────────────────────────');
  try {
    const fs = await import('fs');
    const replitContent = fs.readFileSync('./replit.md', 'utf8');
    
    if (replitContent.includes('GPT-4o mini')) {
      console.log(`✅ Status: PASSED`);
      console.log(`📚 Documentation references GPT-4o mini`);
      results.passed++;
      results.tests.push({ name: 'Documentation', status: 'PASSED' });
    } else {
      throw new Error('Documentation not updated');
    }
  } catch (error) {
    console.log(`❌ Status: FAILED - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Documentation', status: 'FAILED', error: error.message });
  }
  
  console.log('');
  
  // Test 5: Environment Configuration
  console.log('Test 5: OpenAI API Key Configuration');
  console.log('────────────────────────────────────────────────────');
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.log(`✅ Status: PASSED`);
    console.log(`🔑 API Key: Configured (${process.env.OPENAI_API_KEY.substring(0, 10)}...)`);
    results.passed++;
    results.tests.push({ name: 'API Key Config', status: 'PASSED' });
  } else {
    console.log(`❌ Status: FAILED - API key not configured`);
    results.failed++;
    results.tests.push({ name: 'API Key Config', status: 'FAILED' });
  }
  
  // Summary
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║              Test Summary                        ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\n✅ Passed: ${results.passed}/${results.tests.length}`);
  console.log(`❌ Failed: ${results.failed}/${results.tests.length}\n`);
  
  results.tests.forEach((test, i) => {
    const icon = test.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} ${i + 1}. ${test.name}`);
  });
  
  console.log('\n' + '═'.repeat(52));
  
  if (results.failed === 0) {
    console.log('\n🎉 All server-side validations passed!');
    console.log('\n✨ Verified Configuration:');
    console.log('   • Server running and healthy ✅');
    console.log('   • All routes use gpt-4o-mini ✅');
    console.log('   • Database schema updated ✅');
    console.log('   • Documentation updated ✅');
    console.log('   • API key configured ✅');
    console.log('\n🚀 GPT-4o mini setup complete and verified!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some validations failed. Review errors above.\n');
    process.exit(1);
  }
}

testServerEndpoints();
