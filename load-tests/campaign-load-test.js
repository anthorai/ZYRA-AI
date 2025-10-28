import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Peak: 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],   // 95% under 800ms
    http_req_failed: ['rate<0.05'],     // Error rate under 5%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export function setup() {
  return { authToken: 'mock-auth-token' };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.authToken}`,
  };

  group('Campaign Operations', () => {
    // List campaigns
    const listRes = http.get(`${BASE_URL}/api/campaigns`, { headers });
    check(listRes, {
      'list campaigns status ok': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(listRes.status >= 500);

    sleep(1);

    // Create campaign
    const createRes = http.post(`${BASE_URL}/api/campaigns`, JSON.stringify({
      type: 'email',
      name: `Load Test Campaign ${Date.now()}`,
      subject: 'Test Email',
      content: 'This is a load test email',
      recipientList: ['test@example.com']
    }), { headers });

    check(createRes, {
      'create campaign status ok': (r) => r.status === 201 || r.status === 400 || r.status === 401,
    });
    errorRate.add(createRes.status >= 500);

    sleep(1);

    // Get campaign metrics
    const metricsRes = http.get(`${BASE_URL}/api/analytics/campaigns`, { headers });
    check(metricsRes, {
      'get metrics status ok': (r) => r.status === 200 || r.status === 401,
    });
    errorRate.add(metricsRes.status >= 500);
  });

  sleep(2);
}
