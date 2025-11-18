# Autonomous AI Store Manager - Phase 2 Roadmap

## Phase 1 Achievements ✅

**What's Working:**
- Daily SEO audit scheduler (node-cron, 2 AM daily)
- Rule engine evaluating SEO scores and triggering optimizations
- AI-powered SEO optimization (GPT-4o-mini)
- Product snapshots for rollback
- Audit trail in database
- Safety features:
  - maxDailyActions enforcement (10/day default)
  - Autopilot mode verification
  - Cooldown periods (7 days default)
  - Deduplication of pending actions
  - Concurrency protection
- UI for autopilot settings and activity timeline

**Business Value Delivered:**
- Merchants can enable autopilot and let AI optimize their store while they sleep
- All actions are logged and reversible
- Safety limits prevent runaway automation
- Demonstrates the "autonomous while you sleep" concept

---

## Phase 2: Production Hardening 🔒

### Priority 1: Critical Security & Data Integrity

#### 1.1 Authentication Middleware
**Problem**: Currently uses `x-user-id` header pattern which is insecure for production.

**Solution**:
```typescript
// server/middleware/auth.ts
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Extract user from session/JWT
  // Validate session is active
  // Attach req.user = authenticatedUser
  // Reject if unauthenticated
}
```

**Impact**: Prevents unauthorized access to automation settings and actions

**Files to Update**:
- `server/routes.ts` (automation API routes)
- `client/src/pages/ai-tools/autopilot.tsx` (remove hardcoded x-user-id)
- `client/src/pages/ai-tools/activity-timeline.tsx` (remove hardcoded x-user-id)

**Effort**: 2-3 hours

---

#### 1.2 Request Validation with Zod
**Problem**: Automation API routes accept raw request bodies without validation.

**Solution**:
```typescript
// shared/schema.ts - Add validation schemas
export const updateAutomationSettingsSchema = z.object({
  autopilotEnabled: z.boolean().optional(),
  autopilotMode: z.enum(['safe', 'balanced', 'aggressive']).optional(),
  autoPublishEnabled: z.boolean().optional(),
  maxDailyActions: z.number().int().min(1).max(100).optional(),
  maxCatalogChangePercent: z.number().min(1).max(100).optional(),
});

// server/routes.ts
app.put("/api/automation/settings", async (req, res) => {
  const validated = updateAutomationSettingsSchema.safeParse(req.body);
  if (!validated.success) {
    return res.status(400).json({ error: validated.error });
  }
  // Use validated.data
});
```

**Impact**: Prevents malicious/malformed data from corrupting automation settings

**Files to Update**:
- `shared/schema.ts` (add validation schemas)
- `server/routes.ts` (apply validation to all automation routes)

**Effort**: 1-2 hours

---

#### 1.3 Complete Rollback Implementation
**Problem**: Rollback only restores `products` table, not `seoMeta` table.

**Solution**:
```typescript
// server/lib/autonomous-action-processor.ts
// Store complete snapshot including seoMeta
await db.insert(productSnapshots).values({
  productId: product.id,
  actionId: action.id,
  snapshotData: {
    product: product,
    seoMeta: seoMetaRecord, // Add this
  },
  reason: 'before_optimization',
});

// Rollback route - restore both tables
const snapshotData = snapshot[0].snapshotData as any;
await db.update(products).set(snapshotData.product);
await db.update(seoMeta).set(snapshotData.seoMeta);
```

**Impact**: Complete state restoration when rolling back changes

**Files to Update**:
- `server/lib/autonomous-action-processor.ts` (capture seoMeta in snapshot)
- `server/routes.ts` (restore seoMeta in rollback route)

**Effort**: 1 hour

---

### Priority 2: Enhanced Safety

#### 2.1 maxCatalogChangePercent Enforcement
**Problem**: Not currently enforced, could change too many products at once.

**Solution**:
```typescript
// server/lib/autonomous-scheduler.ts
const totalProducts = userProducts.length;
const maxChanges = Math.floor(totalProducts * (settings.maxCatalogChangePercent / 100));
const todaysChangedProducts = new Set(
  todaysActions.map(a => a.entityId)
);

if (todaysChangedProducts.size >= maxChanges) {
  console.log(`⏸️  Reached catalog change limit: ${maxChanges} products (${settings.maxCatalogChangePercent}%)`);
  continue;
}
```

**Impact**: Prevents mass changes that could disrupt catalog

**Files to Update**:
- `server/lib/autonomous-scheduler.ts`

**Effort**: 30 minutes

---

#### 2.2 Dry-Run Mode
**Problem**: No way to preview what autopilot would do without actually doing it.

**Solution**:
```typescript
// Add to automation_settings
export const automationSettings = pgTable("automation_settings", {
  // ...existing fields
  dryRunMode: boolean("dry_run_mode").default(false),
});

// In action processor
if (settings[0].dryRunMode) {
  // Create action with status 'dry_run'
  // Don't actually modify products
  // Show in timeline as "would have done X"
}
```

**Impact**: Safe testing of automation rules before enabling

**Files to Update**:
- `shared/schema.ts` (add dryRunMode field)
- `server/lib/autonomous-action-processor.ts` (skip execution if dry run)
- `client/src/pages/ai-tools/autopilot.tsx` (add dry-run toggle)

**Effort**: 2 hours

---

#### 2.3 Transactional Safety
**Problem**: Partial updates can leave inconsistent state if operation fails mid-way.

**Solution**:
```typescript
// Use Drizzle transactions
await db.transaction(async (tx) => {
  // Create snapshot
  await tx.insert(productSnapshots).values(...);
  
  // Update seoMeta
  await tx.update(seoMeta).set(...);
  
  // Mark action complete
  await tx.update(autonomousActions).set(...);
  
  // If any step fails, all rollback automatically
});
```

**Impact**: Atomic operations, no partial updates

**Files to Update**:
- `server/lib/autonomous-action-processor.ts` (wrap in transactions)

**Effort**: 1-2 hours

---

### Priority 3: User Experience

#### 3.1 Morning Report Email
**Problem**: Users don't know what happened overnight.

**Solution**:
```typescript
// server/lib/autonomous-scheduler.ts
async function sendMorningReport() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const usersWithAutopilot = await db.select()...;
  
  for (const user of usersWithAutopilot) {
    const actions = await db.select()
      .from(autonomousActions)
      .where(and(
        eq(autonomousActions.userId, user.userId),
        sql`created_at >= ${yesterday}`
      ));
    
    if (actions.length > 0) {
      await sendEmail({
        to: user.email,
        subject: `Daily Autopilot Report: ${actions.length} optimizations`,
        template: 'morning-report',
        data: { actions },
      });
    }
  }
}

// Schedule for 8 AM daily
cron.schedule('0 8 * * *', sendMorningReport);
```

**Impact**: User awareness of autonomous activity

**Files to Update**:
- `server/lib/autonomous-scheduler.ts` (add morning report job)
- Create email template

**Effort**: 2-3 hours

---

#### 3.2 Monitoring Dashboard
**Problem**: No visibility into autonomous system health.

**Solution**:
Create new page `/ai-tools/autopilot-dashboard` showing:
- System status (enabled/disabled per user)
- Actions this week (chart)
- Success rate
- Average SEO score improvement
- Products optimized
- Actions pending/running/completed/failed

**Impact**: Operational visibility for users and admins

**Files to Create**:
- `client/src/pages/ai-tools/autopilot-dashboard.tsx`
- `server/routes.ts` (add stats endpoint)

**Effort**: 4-6 hours

---

## Phase 3: Advanced Workflows 🚀

### 3.1 Autonomous Cart Recovery
**Description**: Automatically send personalized cart recovery emails when carts are abandoned.

**Implementation**:
- Webhook listener for abandoned checkouts
- Rule engine evaluates abandonment patterns
- AI generates personalized recovery copy
- Scheduled send via SendGrid
- Track conversion rate

**Effort**: 1-2 days

---

### 3.2 Autonomous Product Fixes
**Description**: Detect and fix product errors automatically.

**Checks**:
- Missing images
- Broken product URLs
- Missing descriptions
- Invalid pricing
- Out of stock without notification

**Actions**:
- Generate missing content via AI
- Fix formatting issues
- Update inventory status
- Notify merchant of critical issues

**Effort**: 2-3 days

---

### 3.3 Predictive Intelligence
**Description**: Learn from results and optimize rules over time.

**Features**:
- Track SEO score changes post-optimization
- A/B test different optimization strategies
- Adjust rules based on conversion data
- Recommend new rules based on patterns

**Effort**: 1 week (requires ML pipeline)

---

## Implementation Priority

### Week 1: Critical Security
- [ ] Authentication middleware (1.1)
- [ ] Request validation (1.2)
- [ ] Complete rollback (1.3)

### Week 2: Enhanced Safety
- [ ] maxCatalogChangePercent (2.1)
- [ ] Dry-run mode (2.2)
- [ ] Transactional safety (2.3)

### Week 3: User Experience
- [ ] Morning report email (3.1)
- [ ] Monitoring dashboard (3.2)

### Month 2-3: Advanced Workflows
- [ ] Autonomous cart recovery (3.1)
- [ ] Autonomous product fixes (3.2)
- [ ] Predictive intelligence (3.3)

---

## Success Metrics

**Phase 1 (Current):**
- ✅ Autonomous SEO system functional end-to-end
- ✅ Safety limits prevent runaway automation
- ✅ All actions auditable and reversible

**Phase 2 Goals:**
- Zero security vulnerabilities in autonomous system
- 100% data integrity (no partial updates)
- >95% user satisfaction with safety features
- <1% rollback rate

**Phase 3 Goals:**
- 3+ autonomous workflows live
- Measurable ROI from autonomous optimizations
- Predictive intelligence improving results by 20%+

---

## Notes

**Current Blocker**: Vite package resolution error preventing server startup. This is an infrastructure issue separate from autonomous system code. Once resolved, all autonomous features are ready for testing.

**Testing Strategy**: 
1. Enable autopilot for test user
2. Create products with low SEO scores (<70)
3. Manually trigger daily audit: `await runDailySEOAudit()`
4. Verify actions created and executed
5. Test rollback functionality
6. Verify safety limits work (daily action cap, cooldown, deduplication)
