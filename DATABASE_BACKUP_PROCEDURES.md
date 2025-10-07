# Database Backup and Restore Procedures

## Overview

Zyra uses PostgreSQL (Neon-backed) hosted on Replit. This document outlines the procedures for backing up and restoring the database to ensure data safety and business continuity.

## Database Configuration

- **Provider**: Replit PostgreSQL (Neon)
- **Access**: `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM
- **Schema Location**: `shared/schema.ts`

## Automated Backups

### Replit-Managed Backups

Replit automatically creates database snapshots for paid plans:
- **Frequency**: Daily backups
- **Retention**: 7-30 days depending on plan
- **Access**: Via Replit Dashboard → Database tab → Backups

### Rollback Feature

Replit provides automatic checkpoints that include:
- Code state
- Database state
- Configuration

**To Use Rollback:**
1. Access via Replit Dashboard → History tab
2. Select a checkpoint from the timeline
3. Review changes before restoring
4. Click "Restore" to revert to that state

## Manual Backup Procedures

### Method 1: GDPR Data Export (Application-Level)

The application provides user-level data export:

```bash
# Via API endpoint
GET /api/gdpr/export-data
Authorization: Bearer <user_token>
```

This exports all user data in JSON format including:
- User profile
- Products
- Campaigns
- Templates
- Abandoned carts
- Analytics
- Notifications
- Usage statistics

**Limitations**: Per-user export, not full database backup

### Method 2: Database Dump (Recommended for Full Backup)

**Prerequisites:**
- `pg_dump` installed locally
- Database connection credentials

**Full Database Backup:**

```bash
# Get database credentials
export DATABASE_URL="postgresql://user:password@host:port/database"

# Create full backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Create compressed backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Table-Specific Backup:**

```bash
# Plain SQL format (restore with psql)
pg_dump $DATABASE_URL -t users -t products > partial_backup.sql

# Custom format (restore with pg_restore, recommended for selective restores)
pg_dump $DATABASE_URL -Fc -t users -t products > partial_backup.custom
```

**Schema-Only Backup:**

```bash
# Backup schema without data
pg_dump $DATABASE_URL --schema-only > schema_backup.sql
```

**Backup Format Comparison:**

| Format | Create With | Restore With | Best For |
|--------|-------------|--------------|----------|
| Plain SQL | `pg_dump > file.sql` | `psql < file.sql` | Full restores, version control |
| Compressed | `pg_dump \| gzip > file.sql.gz` | `gunzip -c \| psql` | Storage efficiency |
| Custom | `pg_dump -Fc > file.custom` | `pg_restore file.custom` | Selective table restore, parallel restore |

### Method 3: CSV Export (Selected Data)

**Via Application Endpoints:**

```bash
# Export campaign analytics
GET /api/analytics/export/csv
Authorization: Bearer <user_token>

# Export products (via CSV export feature)
POST /api/automation/csv-export
```

## Restore Procedures

### Restore from Replit Rollback

1. Navigate to Replit Dashboard → History
2. Find the desired checkpoint
3. Click "Restore Checkpoint"
4. Confirm the restore operation
5. Verify application functionality

### Restore from SQL Dump

**Full Database Restore (Plain SQL Format):**

```bash
# Drop existing database (CAUTION: destroys current data)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore from plain SQL backup
psql $DATABASE_URL < backup.sql

# Or from compressed SQL backup
gunzip -c backup.sql.gz | psql $DATABASE_URL
```

**Selective Table Restore (Custom Format):**

```bash
# Restore specific tables from custom format backup
pg_restore -d $DATABASE_URL -t users -t products partial_backup.custom

# Restore with parallel jobs (faster for large databases)
pg_restore -d $DATABASE_URL -j 4 partial_backup.custom
```

**Important Notes:**
- Plain SQL dumps (`.sql`) must use `psql` for restore
- Custom format dumps (`.custom` or `-Fc`) must use `pg_restore`
- Always test restores in a development environment first!
- Verify data after restore using the verification commands below

**Post-Restore Verification:**

```bash
# Verify table row counts
psql $DATABASE_URL -c "SELECT 
  schemaname,
  tablename,
  n_tup_ins as row_count
FROM pg_stat_user_tables
ORDER BY tablename;"

# Check for constraint violations
psql $DATABASE_URL -c "SELECT * FROM pg_constraint WHERE convalidated = false;"

# Test critical application functionality
curl http://localhost:5000/api/health
```

### Restore from Application Data Export

1. Create a new user account
2. Use the JSON data export to manually reconstruct records via API
3. This is suitable for individual user data recovery only

## Schema Migrations

**Current Migration Strategy:**
- Schema defined in `shared/schema.ts` using Drizzle ORM
- Migrations executed via `npm run db:push`

**To Apply Schema Changes:**

```bash
# Preview migration changes
npm run db:push

# Force apply changes (if warnings about data loss)
npm run db:push --force
```

**Important**: Always backup before running migrations with `--force`

## Production Backup Best Practices

### Recommended Backup Schedule

1. **Automated Daily Backups** (via Replit): Already configured
2. **Weekly Manual Backups**: Create full dumps every Sunday
3. **Pre-Deployment Backups**: Before major releases
4. **Critical Data Snapshots**: Before bulk operations or migrations

### Backup Storage

**Recommended Storage Locations:**
- **Primary**: Replit-managed backups (automatic)
- **Secondary**: External cloud storage (S3, Google Cloud Storage)
- **Tertiary**: Local encrypted backups

**Example Backup to S3:**

```bash
# Create backup and upload to S3
pg_dump $DATABASE_URL | gzip | aws s3 cp - s3://your-bucket/backups/backup_$(date +%Y%m%d).sql.gz
```

### Backup Verification

Regularly verify backup integrity:

```bash
# Test restore to temporary database
createdb test_restore
psql test_restore < backup.sql
# Verify data
psql test_restore -c "SELECT COUNT(*) FROM users;"
dropdb test_restore
```

## Disaster Recovery Plan

### Recovery Time Objectives (RTO)

- **Critical Data Loss**: < 1 hour
- **Full System Restore**: < 4 hours
- **Data Recovery Point**: < 24 hours (daily backups)

### Recovery Procedures

1. **Identify Issue**: Determine scope of data loss
2. **Select Backup**: Choose most recent valid backup
3. **Create Checkpoint**: Snapshot current state (even if corrupted)
4. **Restore Database**: Follow restore procedures above
5. **Verify Data Integrity**: Run application tests
6. **Monitor**: Check logs and error tracking
7. **Document Incident**: Record timeline and root cause

### Emergency Contacts

- **Database Issues**: Replit Support (support@replit.com)
- **Data Recovery**: Database admin or DevOps team
- **Application Errors**: Development team

## Database Monitoring

### Key Metrics to Monitor

- **Database Size**: Track growth trends
- **Connection Count**: Monitor active connections
- **Query Performance**: Identify slow queries
- **Backup Status**: Verify successful backups

**Check Database Size:**

```sql
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as size;
```

**Monitor Active Connections:**

```sql
SELECT count(*) FROM pg_stat_activity;
```

### Health Check Endpoint

The application provides a health check endpoint:

```bash
GET /api/health
```

Returns database status and connection health.

## Compliance Considerations

### GDPR Requirements

- **User Data Export**: Available via `/api/gdpr/export-data`
- **Right to Erasure**: Implemented via `/api/gdpr/delete-account`
- **Backup Retention**: User data in backups deleted within 30 days post-deletion

### Data Retention Policy

- **Active Data**: Retained indefinitely while user is active
- **Backup Data**: 30-day retention for compliance
- **Deleted User Data**: Purged from live database immediately, from backups within 30 days

## Troubleshooting

### Common Issues

**Backup Fails:**
- Check disk space
- Verify database credentials
- Ensure `pg_dump` version compatibility

**Restore Fails:**
- Verify backup file integrity
- Check PostgreSQL version compatibility
- Ensure database permissions

**Slow Backups:**
- Use compressed backups (`gzip`)
- Consider incremental backups
- Schedule during low-traffic periods

### Getting Help

- **Replit Database Issues**: Check Replit status page
- **Application Errors**: Review error logs via `/api/admin/error-logs`
- **Community Support**: Replit community forums

## Testing Backup & Restore

### Quarterly Backup Drill

1. Create fresh database dump
2. Provision test environment
3. Restore backup to test environment
4. Run full application test suite
5. Verify data integrity
6. Document any issues
7. Update procedures as needed

**Next Backup Drill**: Schedule every 3 months

---

**Document Version**: 1.0
**Last Updated**: October 2025
**Maintained By**: Development Team
**Review Frequency**: Quarterly
