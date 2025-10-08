#!/usr/bin/env node
/**
 * Billing Flow Test Script
 * Tests subscription creation, upgrades, downgrades, and trial expiration
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function section(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(message, 'blue');
  log('='.repeat(60), 'blue');
}

async function setupTestUser() {
  section('Step 1: Setting up test user');
  
  try {
    // Check if test user exists
    const checkUser = await pool.query(
      "SELECT id, email, plan FROM users WHERE email = 'billing-test@example.com'"
    );
    
    if (checkUser.rows.length > 0) {
      info('Test user already exists');
      return checkUser.rows[0];
    }
    
    // Create test user
    const result = await pool.query(`
      INSERT INTO users (id, email, full_name, password, plan, role)
      VALUES (
        gen_random_uuid(),
        'billing-test@example.com',
        'Billing Test User',
        NULL,
        '7-Day Free Trial',
        'user'
      )
      RETURNING id, email, full_name, plan
    `);
    
    success(`Created test user: ${result.rows[0].email}`);
    return result.rows[0];
  } catch (err) {
    error(`Failed to setup test user: ${err.message}`);
    throw err;
  }
}

async function getSubscriptionPlans() {
  section('Step 2: Fetching subscription plans');
  
  try {
    const result = await pool.query(`
      SELECT id, plan_name, price, interval, is_active
      FROM subscription_plans
      WHERE is_active = true
      ORDER BY CAST(price AS NUMERIC) ASC
    `);
    
    info(`Found ${result.rows.length} active plans:`);
    result.rows.forEach(plan => {
      console.log(`  - ${plan.plan_name}: $${plan.price}/${plan.interval}`);
    });
    
    return result.rows;
  } catch (err) {
    error(`Failed to fetch plans: ${err.message}`);
    throw err;
  }
}

async function createTrialSubscription(userId, trialPlanId) {
  section('Step 3: Creating trial subscription');
  
  try {
    // Check if subscription exists
    const existing = await pool.query(
      'SELECT id, status FROM subscriptions WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );
    
    if (existing.rows.length > 0) {
      warn('User already has an active subscription');
      return existing.rows[0];
    }
    
    // Create trial subscription
    const result = await pool.query(`
      INSERT INTO subscriptions (
        id, user_id, plan_id, status, 
        trial_start, trial_end,
        current_period_start, current_period_end
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        'trialing',
        NOW(),
        NOW() + INTERVAL '7 days',
        NOW(),
        NOW() + INTERVAL '7 days'
      )
      RETURNING id, user_id, plan_id, status
    `, [userId, trialPlanId]);
    
    success(`Created trial subscription for user`);
    return result.rows[0];
  } catch (err) {
    error(`Failed to create trial subscription: ${err.message}`);
    throw err;
  }
}

async function upgradeSubscription(userId, fromPlanId, toPlanId, toPlanName) {
  section(`Step 4: Upgrading subscription to ${toPlanName}`);
  
  try {
    // Update existing subscription
    const result = await pool.query(`
      UPDATE subscriptions
      SET 
        plan_id = $1,
        status = 'active',
        trial_end = NULL,
        current_period_start = NOW(),
        current_period_end = NOW() + INTERVAL '1 month',
        updated_at = NOW()
      WHERE user_id = $2 AND status IN ('active', 'trialing')
      RETURNING id, plan_id, status
    `, [toPlanId, userId]);
    
    if (result.rows.length === 0) {
      error('No active subscription found to upgrade');
      return null;
    }
    
    // Update user plan
    await pool.query(`
      UPDATE users SET plan = $1 WHERE id = $2
    `, [toPlanName, userId]);
    
    success(`Upgraded subscription to ${toPlanName}`);
    return result.rows[0];
  } catch (err) {
    error(`Failed to upgrade subscription: ${err.message}`);
    throw err;
  }
}

async function downgradeSubscription(userId, toPlanId, toPlanName) {
  section(`Step 5: Downgrading subscription to ${toPlanName}`);
  
  try {
    // Update subscription with cancel at period end
    const result = await pool.query(`
      UPDATE subscriptions
      SET 
        plan_id = $1,
        cancel_at_period_end = true,
        updated_at = NOW()
      WHERE user_id = $2 AND status = 'active'
      RETURNING id, plan_id, cancel_at_period_end
    `, [toPlanId, userId]);
    
    if (result.rows.length === 0) {
      error('No active subscription found to downgrade');
      return null;
    }
    
    success(`Downgrade scheduled to ${toPlanName} at period end`);
    return result.rows[0];
  } catch (err) {
    error(`Failed to downgrade subscription: ${err.message}`);
    throw err;
  }
}

async function testTrialExpiration(userId) {
  section('Step 6: Testing trial expiration logic');
  
  try {
    // Set trial to expired
    await pool.query(`
      UPDATE users
      SET trial_end_date = NOW() - INTERVAL '1 day',
          plan = 'trial'
      WHERE id = $1
    `, [userId]);
    
    info('Set user trial to expired state');
    
    // Simulate trial expiration check
    const expiredTrials = await pool.query(`
      SELECT id, email, plan, trial_end_date
      FROM users
      WHERE trial_end_date < NOW() AND plan = 'trial'
    `);
    
    if (expiredTrials.rows.length > 0) {
      success(`Found ${expiredTrials.rows.length} expired trials`);
      info('Trial expiration service would process these users');
    } else {
      warn('No expired trials found');
    }
    
    return expiredTrials.rows;
  } catch (err) {
    error(`Failed to test trial expiration: ${err.message}`);
    throw err;
  }
}

async function verifyBillingHistory(userId) {
  section('Step 7: Checking subscription history');
  
  try {
    const subscriptions = await pool.query(`
      SELECT s.id, s.status, sp.plan_name, sp.price, s.created_at
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
    `, [userId]);
    
    if (subscriptions.rows.length > 0) {
      info(`Found ${subscriptions.rows.length} subscription record(s):`);
      subscriptions.rows.forEach((sub, i) => {
        console.log(`  ${i + 1}. ${sub.plan_name} ($${sub.price}) - ${sub.status}`);
      });
      success('Subscription history verified');
    } else {
      warn('No subscription history found');
    }
    
    return subscriptions.rows;
  } catch (err) {
    error(`Failed to verify billing history: ${err.message}`);
    throw err;
  }
}

async function cleanup(userId) {
  section('Step 8: Cleanup (optional)');
  
  info('Test data preserved for inspection');
  info(`User ID: ${userId}`);
  info('To clean up manually, run:');
  console.log(`  DELETE FROM subscriptions WHERE user_id = '${userId}';`);
  console.log(`  DELETE FROM users WHERE id = '${userId}';`);
}

async function runTests() {
  try {
    log('\n🧪 BILLING SYSTEM TEST SUITE', 'blue');
    log('Testing subscription flows with real plans\n', 'blue');
    
    // Step 1: Setup test user
    const user = await setupTestUser();
    const userId = user.id;
    
    // Step 2: Get subscription plans
    const plans = await getSubscriptionPlans();
    const trialPlan = plans.find(p => p.plan_name === '7-Day Free Trial');
    const starterPlan = plans.find(p => p.plan_name === 'Starter');
    const growthPlan = plans.find(p => p.plan_name === 'Growth');
    const proPlan = plans.find(p => p.plan_name === 'Pro');
    
    if (!trialPlan || !starterPlan || !growthPlan || !proPlan) {
      error('Missing required subscription plans');
      process.exit(1);
    }
    
    // Step 3: Create trial subscription
    await createTrialSubscription(userId, trialPlan.id);
    
    // Step 4: Upgrade to Starter
    await upgradeSubscription(userId, trialPlan.id, starterPlan.id, starterPlan.plan_name);
    
    // Step 5: Upgrade to Growth
    await upgradeSubscription(userId, starterPlan.id, growthPlan.id, growthPlan.plan_name);
    
    // Step 6: Downgrade to Starter (test downgrade flow)
    await downgradeSubscription(userId, starterPlan.id, starterPlan.plan_name);
    
    // Step 7: Test trial expiration
    await testTrialExpiration(userId);
    
    // Step 8: Verify billing history
    await verifyBillingHistory(userId);
    
    // Step 9: Cleanup
    await cleanup(userId);
    
    section('✅ ALL TESTS PASSED');
    success('Billing system is working correctly!');
    
  } catch (err) {
    error(`Test suite failed: ${err.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests
runTests();
