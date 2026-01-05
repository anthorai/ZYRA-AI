import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let shopDomain = searchParams.get('shop');

  // We'll try to extract store handle from shopDomain if provided
  let storeHandle = 'default-store';
  if (shopDomain) {
    storeHandle = shopDomain.replace('.myshopify.com', '').replace(/^https?:\/\//, '');
  }

  const pricingUrl = `https://admin.shopify.com/store/${storeHandle}/charges/zyra-ai-1/pricing_plans`;

  console.log(`[BILLING] Route Handler Redirecting to: ${pricingUrl}`);

  return NextResponse.redirect(pricingUrl, 302);
}
