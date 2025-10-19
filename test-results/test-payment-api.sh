#!/bin/bash

echo "╔══════════════════════════════════════════════════╗"
echo "║   ZYRA Payment Gateway Quick API Test            ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:5000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if server is running
echo "📡 Testing server connectivity..."
if curl -s --max-time 5 "${BASE_URL}/api/health" > /dev/null; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not responding${NC}"
    exit 1
fi
echo ""

# Test 2: Check Razorpay configuration (no auth required to check if it's configured)
echo "🇮🇳 Testing Razorpay Configuration..."
RAZORPAY_STATUS=$(curl -s "${BASE_URL}/api/health" | grep -o '"database":"[^"]*"' || echo "configured")
if [ -n "$RAZORPAY_KEY_ID" ]; then
    echo -e "${GREEN}✅ RAZORPAY_KEY_ID is set${NC}"
else
    echo -e "${YELLOW}⚠️  RAZORPAY_KEY_ID environment variable not found${NC}"
fi

if [ -n "$RAZORPAY_KEY_SECRET" ]; then
    echo -e "${GREEN}✅ RAZORPAY_KEY_SECRET is set${NC}"
else
    echo -e "${YELLOW}⚠️  RAZORPAY_KEY_SECRET environment variable not found${NC}"
fi
echo ""

# Test 3: Check PayPal configuration
echo "🌍 Testing PayPal Configuration..."
if [ -n "$PAYPAL_CLIENT_ID" ]; then
    echo -e "${GREEN}✅ PAYPAL_CLIENT_ID is set${NC}"
else
    echo -e "${YELLOW}⚠️  PAYPAL_CLIENT_ID environment variable not found${NC}"
fi

if [ -n "$PAYPAL_CLIENT_SECRET" ]; then
    echo -e "${GREEN}✅ PAYPAL_CLIENT_SECRET is set${NC}"
else
    echo -e "${YELLOW}⚠️  PAYPAL_CLIENT_SECRET environment variable not found${NC}"
fi
echo ""

# Test 4: Check health endpoint
echo "🏥 Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/api/health")
echo "$HEALTH_RESPONSE" | head -20
echo ""

# Summary
echo "╔══════════════════════════════════════════════════╗"
echo "║              Test Summary                        ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Server Status: ✅ Running"
echo "Razorpay: $([ -n "$RAZORPAY_KEY_ID" ] && echo "✅ Configured" || echo "⚠️  Not configured")"
echo "PayPal: $([ -n "$PAYPAL_CLIENT_ID" ] && echo "✅ Configured" || echo "⚠️  Not configured")"
echo ""
echo "📋 Next Steps:"
echo "  1. Visit http://localhost:5000/checkout to test payments"
echo "  2. Login with test@example.com / password123"
echo "  3. Test Razorpay with test amount (INR)"
echo "  4. Test PayPal with test amount (USD)"
echo ""
