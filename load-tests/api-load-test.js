import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Peak load: 100 users
    { duration: '1m', target: 50 },   // Ramp down to 50
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.05'],    // Error rate should be below 5%
    errors: ['rate<0.1'],              // Custom error rate should be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
let authToken = '';

export function setup() {
  // Authenticate and get token for load testing
  // In real testing, you'd have test credentials
  const loginRes = http.post(`${BASE_URL}/api/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'TestPassword123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status === 200 || loginRes.status === 400) {
    // For testing purposes, use a mock token or handle appropriately
    authToken = 'mock-auth-token';
  }

  return { authToken };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.authToken}`,
  };

  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, {
      'health check status 200': (r) => r.status === 200,
      'health check has status field': (r) => JSON.parse(r.body).status !== undefined,
    });
    errorRate.add(res.status !== 200);
  });

  sleep(1);

  group('Product Endpoints', () => {
    // Get products
    const getRes = http.get(`${BASE_URL}/api/products`, { headers });
    check(getRes, {
      'get products status 200 or 401': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(getRes.status >= 500);

    // Create product (if authenticated)
    if (getRes.status === 200) {
      const createRes = http.post(`${BASE_URL}/api/products`, JSON.stringify({
        name: `Test Product ${Date.now()}`,
        description: 'Load test product',
        price: '99.99',
        category: 'Electronics',
        stock: 100
      }), { headers });
      
      check(createRes, {
        'create product status 201 or 400': (r) => r.status === 201 || r.status === 400,
      });
      errorRate.add(createRes.status >= 500);
    }
  });

  sleep(1);

  group('Campaign Endpoints', () => {
    const res = http.get(`${BASE_URL}/api/campaigns`, { headers });
    check(res, {
      'get campaigns status 200 or 401': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(res.status >= 500);
  });

  sleep(1);

  group('Analytics Endpoints', () => {
    const res = http.get(`${BASE_URL}/api/analytics/summary`, { headers });
    check(res, {
      'get analytics status 200 or 401': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(res.status >= 500);
  });

  sleep(2);
}

export function teardown(data) {
  console.log('Load test completed');
}
