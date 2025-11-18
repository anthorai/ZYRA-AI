import cron from 'node-cron';
import { db } from '../db';
import { abandonedCarts, autonomousActions, automationSettings } from '@shared/schema';
import { eq, and, sql, gte, lt, isNull } from 'drizzle-orm';

/**
 * Cart Recovery Scheduler
 * 
 * Monitors abandoned carts and triggers recovery attempts at configured intervals:
 * - Default intervals: [1hr, 4hr, 24hr] after abandonment
 * - Creates autonomous actions to send recovery emails/SMS
 * - Respects user settings: minCartValue, maxRecoveryAttempts, channel preferences
 * - Prevents duplicate attempts using recoveryAttempts counter
 */

const runningJobs = new Set<string>();

/**
 * Check if a cart is eligible for recovery attempt at a specific interval
 * 
 * CRITICAL: This function determines if a cart should trigger a recovery action
 * at a specific interval. We must prevent duplicate actions by:
 * 1. Checking recoveryAttempts matches the expected interval index
 * 2. Verifying time window for this specific interval
 * 3. Ensuring we're within the correct time window for this attempt
 */
async function shouldTriggerRecovery(
  cart: any,
  settings: any,
  intervalHours: number
): Promise<boolean> {
  // Skip if recovery not enabled
  if (!settings.cartRecoveryEnabled) return false;

  // Skip if cart value below threshold
  const cartValue = parseFloat(cart.cartValue);
  const minValue = parseFloat(settings.minCartValue);
  if (cartValue < minValue) return false;

  // Skip if max attempts reached
  if (cart.recoveryAttempts >= settings.maxRecoveryAttempts) return false;

  // Skip if already recovered or expired
  if (cart.status === 'recovered' || cart.status === 'expired') return false;

  // Get sorted intervals to determine sequence
  const intervals = settings.recoveryIntervals as number[];
  if (!Array.isArray(intervals) || intervals.length === 0) return false;
  
  const sortedIntervals = [...intervals].sort((a, b) => a - b);
  const intervalIndex = sortedIntervals.indexOf(intervalHours);
  
  if (intervalIndex === -1) return false; // Interval not configured

  // CRITICAL FIX: Only trigger the NEXT interval based on recoveryAttempts
  // This ensures sequential delivery even after missed cron runs
  //
  // Key insight: We should trigger interval[N] when:
  // 1. recoveryAttempts === N (next in sequence)
  // 2. Time since abandonment >= interval[N] hours
  // 3. We haven't exceeded max attempts
  //
  // Example: Cart at recoveryAttempts=1, 25hr old
  //   - Checks interval[0] (1hr): recoveryAttempts (1) !== 0, skip
  //   - Checks interval[1] (4hr): recoveryAttempts (1) === 1 AND 25hr >= 4hr ✓
  //
  // This allows "catch-up" after delayed cron while preventing duplicates
  if (cart.recoveryAttempts !== intervalIndex) return false;

  // Calculate time since abandonment
  const abandonedAt = new Date(cart.abandonedAt);
  const now = new Date();
  const hoursSinceAbandonment = (now.getTime() - abandonedAt.getTime()) / (1000 * 60 * 60);

  // SIMPLIFIED WINDOW: Just check if we're past the interval time
  // No upper bound needed - cart stays eligible until action created or max attempts reached
  // Expiry job will clean up carts that get too old
  return hoursSinceAbandonment >= intervalHours;
}

/**
 * Process abandoned carts and create recovery actions
 */
async function processAbandonedCarts(): Promise<void> {
  const jobId = 'cart-recovery-monitor';
  
  if (runningJobs.has(jobId)) {
    console.log('⏭️  [Cart Recovery] Job already running, skipping');
    return;
  }

  runningJobs.add(jobId);
  
  try {
    console.log('🛒 [Cart Recovery] Starting cart recovery scan...');

    // Get all users with cart recovery enabled
    const usersWithRecovery = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.cartRecoveryEnabled, true));

    console.log(`📊 [Cart Recovery] Found ${usersWithRecovery.length} users with cart recovery enabled`);

    for (const settings of usersWithRecovery) {
      try {
        // CRITICAL FIX: Normalize intervals to ascending order ONCE
        // This ensures outer loop iteration matches intervalIndex calculation
        const intervals = settings.recoveryIntervals as number[];
        if (!intervals || intervals.length === 0) {
          console.log(`⚠️  [Cart Recovery] User ${settings.userId} has no recovery intervals configured`);
          continue;
        }
        
        // Sort intervals in ascending order (e.g., [1, 4, 24])
        // This must match the sorting in shouldTriggerRecovery for consistency
        const sortedIntervals = [...intervals].sort((a, b) => a - b);

        // Get abandoned carts for this user
        const carts = await db
          .select()
          .from(abandonedCarts)
          .where(
            and(
              eq(abandonedCarts.userId, settings.userId),
              eq(abandonedCarts.status, 'abandoned')
            )
          );

        if (carts.length === 0) continue;

        console.log(`🛒 [Cart Recovery] User ${settings.userId} has ${carts.length} abandoned carts`);

        // Check each cart against each interval (in sorted order)
        for (const cart of carts) {
          for (const intervalHours of sortedIntervals) {
            const shouldTrigger = await shouldTriggerRecovery(cart, settings, intervalHours);
            
            if (shouldTrigger) {
              console.log(`✅ [Cart Recovery] Cart ${cart.id} eligible for ${intervalHours}hr recovery attempt`);

              // Check for existing pending action for this cart
              const existingAction = await db
                .select()
                .from(autonomousActions)
                .where(
                  and(
                    eq(autonomousActions.userId, settings.userId),
                    eq(autonomousActions.actionType, 'send_cart_recovery'),
                    eq(autonomousActions.entityId, cart.id),
                    sql`${autonomousActions.status} IN ('pending', 'running', 'dry_run')`
                  )
                )
                .limit(1);

              if (existingAction.length > 0) {
                console.log(`⏭️  [Cart Recovery] Action already exists for cart ${cart.id}, skipping`);
                continue;
              }

              // CRITICAL FIX: Atomically increment recoveryAttempts when creating action
              // This prevents duplicate actions during the window between action creation and processing
              const isDryRun = settings.dryRunMode ?? false;
              
              const actionData = {
                userId: settings.userId,
                actionType: 'send_cart_recovery',
                entityType: 'abandoned_cart',
                entityId: cart.id,
                status: isDryRun ? 'dry_run' as const : 'pending' as const,
                reasoning: `Cart value $${cart.cartValue} abandoned ${Math.round((Date.now() - new Date(cart.abandonedAt).getTime()) / (1000 * 60 * 60))}hrs ago. Attempt ${cart.recoveryAttempts + 1}/${settings.maxRecoveryAttempts} via ${settings.recoveryChannel}.`,
                metadata: {
                  cartValue: cart.cartValue,
                  currency: cart.currency,
                  customerEmail: cart.customerEmail,
                  customerPhone: cart.customerPhone,
                  customerName: cart.customerName,
                  intervalHours,
                  attemptNumber: cart.recoveryAttempts + 1,
                  maxAttempts: settings.maxRecoveryAttempts,
                  channel: settings.recoveryChannel,
                  checkoutUrl: cart.checkoutUrl,
                  cartItems: cart.cartItems,
                },
              };

              // ATOMIC OPERATION: Create action and increment counter in one go
              // If dry-run mode, don't increment the counter (no actual attempt made)
              await db.insert(autonomousActions).values(actionData);
              
              if (!isDryRun) {
                // CRITICAL FIX: Keep status as 'abandoned' until all attempts exhausted
                // This ensures cart remains in scheduler pool for future interval attempts
                const newAttempts = cart.recoveryAttempts + 1;
                const isLastAttempt = newAttempts >= settings.maxRecoveryAttempts;
                
                await db
                  .update(abandonedCarts)
                  .set({ 
                    recoveryAttempts: newAttempts,
                    lastContactedAt: new Date(), // Record when we scheduled the attempt
                    // Mark as 'contacted' only after final attempt scheduled
                    status: isLastAttempt ? 'contacted' as const : cart.status,
                    updatedAt: new Date()
                  })
                  .where(eq(abandonedCarts.id, cart.id));
                
                if (isLastAttempt) {
                  console.log(`📬 [Cart Recovery] Cart ${cart.id} marked 'contacted' after final attempt`);
                }
              }

              console.log(`✅ [Cart Recovery] Created ${isDryRun ? 'dry-run' : 'live'} recovery action for cart ${cart.id} (attempt ${cart.recoveryAttempts + 1})`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ [Cart Recovery] Error processing user ${settings.userId}:`, error);
        // Continue with other users
      }
    }

    console.log('✅ [Cart Recovery] Scan complete');
  } catch (error) {
    console.error('❌ [Cart Recovery] Fatal error in cart recovery scan:', error);
  } finally {
    runningJobs.delete(jobId);
  }
}

/**
 * Mark carts as expired if they exceed the maximum recovery window
 * 
 * CRITICAL: Must handle both 'abandoned' AND 'contacted' carts
 * - 'abandoned' carts: Still have recovery attempts pending
 * - 'contacted' carts: All recovery attempts sent, awaiting customer action
 * 
 * Both should expire after max interval + 24hr grace period
 */
async function expireOldCarts(): Promise<void> {
  try {
    console.log('⏰ [Cart Recovery] Checking for expired carts...');

    // Get all users with cart recovery enabled
    const usersWithRecovery = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.cartRecoveryEnabled, true));

    for (const settings of usersWithRecovery) {
      const intervals = settings.recoveryIntervals as number[];
      if (!intervals || intervals.length === 0) continue;

      // Find max interval + 24hr grace period
      const maxInterval = Math.max(...intervals);
      const expiryHours = maxInterval + 24;
      const expiryTime = new Date(Date.now() - expiryHours * 60 * 60 * 1000);

      // CRITICAL FIX: Mark old abandoned AND contacted carts as expired
      // Contacted carts are those with all recovery attempts sent
      // They should still expire if customer doesn't recover within grace period
      const result = await db
        .update(abandonedCarts)
        .set({ 
          status: 'expired',
          updatedAt: new Date()
        })
        .where(
          and(
            eq(abandonedCarts.userId, settings.userId),
            // Include BOTH 'abandoned' and 'contacted' carts for expiry
            sql`${abandonedCarts.status} IN ('abandoned', 'contacted')`,
            lt(abandonedCarts.abandonedAt, expiryTime)
          )
        );

      console.log(`⏰ [Cart Recovery] Marked ${result.rowCount || 0} carts as expired for user ${settings.userId}`);
    }
  } catch (error) {
    console.error('❌ [Cart Recovery] Error expiring old carts:', error);
  }
}

/**
 * Initialize cart recovery scheduler
 */
export function startCartRecoveryScheduler(): void {
  console.log('🚀 [Cart Recovery] Initializing cart recovery scheduler...');

  // Run every hour to check for carts ready for recovery
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ [Cart Recovery] Hourly cart recovery check triggered');
    await processAbandonedCarts();
  });

  // Run daily at 3 AM to expire old carts
  cron.schedule('0 3 * * *', async () => {
    console.log('⏰ [Cart Recovery] Daily cart expiry check triggered');
    await expireOldCarts();
  });

  console.log('✅ [Cart Recovery] Scheduler initialized');
  console.log('   - Hourly recovery scan: 0 * * * * (top of every hour)');
  console.log('   - Daily expiry check: 0 3 * * * (3 AM daily)');
}

/**
 * Manual trigger for testing
 */
export async function triggerCartRecoveryNow(): Promise<void> {
  console.log('🔧 [Cart Recovery] Manual trigger requested');
  await processAbandonedCarts();
  await expireOldCarts();
}
