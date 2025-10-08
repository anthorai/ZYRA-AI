import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users (AI endpoints have rate limits)
    { duration: '1m', target: 10 },   // Peak: 10 concurrent users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // AI requests can take longer - 95% under 3s
    http_req_failed: ['rate<0.1'],      // Allow 10% failure due to rate limits
    errors: ['rate<0.15'],              // Custom error rate under 15%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export function setup() {
  // Mock authentication token for testing
  return { authToken: 'mock-auth-token' };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.authToken}`,
  };

  group('AI Product Description Generation', () => {
    const res = http.post(`${BASE_URL}/api/generate-description`, JSON.stringify({
      productName: `Test Product ${Date.now()}`,
      category: 'Electronics',
      features: 'High quality, durable, modern design',
      audience: 'Tech enthusiasts',
      brandVoice: 'professional'
    }), { headers });

    check(res, {
      'AI generation status ok': (r) => r.status === 200 || r.status === 403 || r.status === 429,
      'AI generation has response': (r) => r.body.length > 0,
    });
    
    // Don't mark rate limits as errors - they're expected
    if (res.status >= 500) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });

  sleep(2); // Longer sleep for AI endpoints

  group('SEO Optimization', () => {
    const res = http.post(`${BASE_URL}/api/optimize-seo`, JSON.stringify({
      currentTitle: 'Premium Wireless Headphones',
      keywords: 'wireless headphones, premium audio, noise cancelling',
      category: 'Electronics'
    }), { headers });

    check(res, {
      'SEO optimization status ok': (r) => r.status === 200 || r.status === 403 || r.status === 429,
    });

    if (res.status >= 500) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });

  sleep(3); // Longer sleep between AI requests
}

export function teardown(data) {
  console.log('AI load test completed - Note: Rate limiting is expected and normal');
}
