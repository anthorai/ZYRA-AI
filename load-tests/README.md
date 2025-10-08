# Performance Load Testing

This directory contains load testing scripts for the Zyra application using k6.

## Prerequisites

Install k6:
- **macOS**: `brew install k6`
- **Windows**: `choco install k6` or download from https://k6.io/docs/getting-started/installation
- **Linux**: `sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 && echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list && sudo apt-get update && sudo apt-get install k6`

## Test Scripts

### 1. API Load Test (`api-load-test.js`)
Tests general API endpoints including health checks, products, campaigns, and analytics.

**Load Profile:**
- 10 → 50 → 100 → 50 → 0 users over 5 minutes
- Target: 95% of requests < 500ms
- Error rate < 5%

**Run:**
```bash
k6 run api-load-test.js
```

### 2. AI Load Test (`ai-load-test.js`)
Tests AI endpoints (product descriptions, SEO optimization) which have rate limiting.

**Load Profile:**
- 5 → 10 → 0 users over 2 minutes
- Target: 95% of requests < 3s (AI endpoints are slower)
- Error rate < 15% (allows for rate limiting)

**Run:**
```bash
k6 run ai-load-test.js
```

### 3. Campaign Load Test (`campaign-load-test.js`)
Tests campaign creation and management endpoints.

**Load Profile:**
- 20 → 50 → 0 users over 2 minutes
- Target: 95% of requests < 800ms
- Error rate < 5%

**Run:**
```bash
k6 run campaign-load-test.js
```

## Custom Configuration

### Change Base URL
```bash
k6 run -e BASE_URL=https://your-domain.com api-load-test.js
```

### Run All Tests
```bash
k6 run api-load-test.js && k6 run ai-load-test.js && k6 run campaign-load-test.js
```

## Understanding Results

k6 provides detailed metrics:
- **http_req_duration**: Request response time
- **http_req_failed**: Percentage of failed requests
- **vus (Virtual Users)**: Number of concurrent users
- **iterations**: Total number of test iterations completed

### Success Criteria
✅ **Pass**: All thresholds met
- Response times within limits
- Error rates acceptable
- No server crashes

❌ **Fail**: Any threshold exceeded
- Investigate slow endpoints
- Check for memory leaks
- Review rate limiting configuration

## Performance Baselines

Based on the application architecture:

| Endpoint Type | Expected p95 Latency | Max Throughput |
|--------------|---------------------|----------------|
| Health Check | < 100ms | 1000 req/s |
| Product CRUD | < 500ms | 500 req/s |
| AI Generation | < 3000ms | 30 req/s |
| Campaign Send | < 1000ms | 100 req/s |
| Analytics | < 800ms | 200 req/s |

## Monitoring During Tests

1. **Server Resources**: Monitor CPU, memory, and disk I/O
2. **Database**: Watch connection pool usage and query performance
3. **Rate Limits**: Ensure rate limiting works as expected
4. **Error Logs**: Check for any unexpected errors

## Continuous Integration

Add to CI/CD pipeline:
```yaml
# Example GitHub Actions step
- name: Run Load Tests
  run: |
    k6 run --quiet load-tests/api-load-test.js
```

## Troubleshooting

### High Error Rate
- Check authentication tokens
- Verify API endpoints are accessible
- Review rate limiting configuration

### Slow Response Times
- Analyze database query performance
- Check for N+1 queries
- Review caching strategy
- Monitor third-party API latency

### Rate Limiting Issues
- AI endpoints have strict rate limits by plan
- Expected 429 responses are normal
- Adjust test load if hitting limits too often
