import puppeteer, { Browser, Page } from 'puppeteer';
import { requireDb } from '../db';
import { competitorProducts } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface ScrapedProduct {
  price: string | null;
  inStock: boolean;
  title: string | null;
  currency: string;
}

interface ScrapeResult {
  success: boolean;
  data?: ScrapedProduct;
  error?: string;
}

export class CompetitorScraper {
  private browser: Browser | null = null;

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Scrape a single competitor product URL
   */
  async scrapeProduct(url: string): Promise<ScrapeResult> {
    let page: Page | null = null;

    try {
      await this.init();
      
      if (!this.browser) {
        return { success: false, error: 'Browser not initialized' };
      }

      page = await this.browser.newPage();
      
      // Set user agent to avoid bot detection
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      // Navigate to the product page with timeout
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait a bit for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Extract product data using common e-commerce selectors
      const productData = await page.evaluate(() => {
        // Common price selectors
        const priceSelectors = [
          '[itemprop="price"]',
          '.price',
          '.product-price',
          '.current-price',
          '[data-testid="price"]',
          '.price-current',
          'meta[property="og:price:amount"]',
        ];

        // Common title selectors
        const titleSelectors = [
          'h1',
          '[itemprop="name"]',
          '.product-title',
          '.product-name',
          'meta[property="og:title"]',
        ];

        // Common stock selectors
        const stockSelectors = [
          '[itemprop="availability"]',
          '.stock-status',
          '.availability',
          '[data-testid="stock"]',
        ];

        let price: string | null = null;
        let title: string | null = null;
        let inStock = true;

        // Try to find price
        for (const selector of priceSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            if (element.tagName === 'META') {
              price = element.getAttribute('content');
            } else {
              price = element.textContent?.trim() || null;
            }
            if (price) break;
          }
        }

        // Try to find title
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            if (element.tagName === 'META') {
              title = element.getAttribute('content');
            } else {
              title = element.textContent?.trim() || null;
            }
            if (title) break;
          }
        }

        // Try to find stock status
        for (const selector of stockSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const text = (element.textContent || element.getAttribute('content') || '').toLowerCase();
            if (text.includes('out of stock') || text.includes('unavailable') || text.includes('sold out')) {
              inStock = false;
              break;
            }
          }
        }

        return { price, title, inStock };
      });

      // Clean and parse price
      let cleanPrice: string | null = null;
      let currency = 'USD';

      if (productData.price) {
        // Extract numbers and decimal point
        const priceMatch = productData.price.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          cleanPrice = priceMatch[0].replace(/,/g, '');
        }

        // Try to detect currency
        if (productData.price.includes('$')) currency = 'USD';
        else if (productData.price.includes('£')) currency = 'GBP';
        else if (productData.price.includes('€')) currency = 'EUR';
      }

      await page.close();

      return {
        success: true,
        data: {
          price: cleanPrice,
          inStock: productData.inStock,
          title: productData.title,
          currency,
        },
      };
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          console.error('Error closing page:', closeError);
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Scrape all enabled competitor products for a user
   */
  async scrapeAllForUser(userId: string): Promise<{ total: number; success: number; failed: number }> {
    try {
      const db = requireDb();
      
      // Get all enabled competitor products for this user
      const competitors = await db
        .select()
        .from(competitorProducts)
        .where(and(
          eq(competitorProducts.userId, userId),
          eq(competitorProducts.scrapingEnabled, true)
        ));

      let successCount = 0;
      let failedCount = 0;

      console.log(`[Competitor Scraper] Scraping ${competitors.length} competitors for user ${userId}`);

      for (const competitor of competitors) {
        const result = await this.scrapeProduct(competitor.competitorUrl);

        if (result.success && result.data) {
          // Update competitor product with new data
          const previousPrice = competitor.currentPrice;
          
          await db
            .update(competitorProducts)
            .set({
              previousPrice,
              currentPrice: result.data.price,
              productTitle: result.data.title || competitor.productTitle,
              inStock: result.data.inStock,
              currency: result.data.currency,
              lastScrapedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(competitorProducts.id, competitor.id));

          successCount++;
          console.log(`[Competitor Scraper] ✓ ${competitor.competitorName}: ${result.data.price} ${result.data.currency}`);
        } else {
          failedCount++;
          console.error(`[Competitor Scraper] ✗ ${competitor.competitorName}: ${result.error}`);
        }

        // Small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        total: competitors.length,
        success: successCount,
        failed: failedCount,
      };
    } catch (error) {
      console.error('[Competitor Scraper] Error scraping all competitors:', error);
      throw error;
    }
  }

  /**
   * Scrape a single competitor product by ID
   */
  async scrapeCompetitor(competitorId: string): Promise<ScrapeResult> {
    try {
      const db = requireDb();
      
      const [competitor] = await db
        .select()
        .from(competitorProducts)
        .where(eq(competitorProducts.id, competitorId))
        .limit(1);

      if (!competitor) {
        return { success: false, error: 'Competitor not found' };
      }

      const result = await this.scrapeProduct(competitor.competitorUrl);

      if (result.success && result.data) {
        // Update database
        const previousPrice = competitor.currentPrice;
        
        await db
          .update(competitorProducts)
          .set({
            previousPrice,
            currentPrice: result.data.price,
            productTitle: result.data.title || competitor.productTitle,
            inStock: result.data.inStock,
            currency: result.data.currency,
            lastScrapedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(competitorProducts.id, competitorId));
      }

      return result;
    } catch (error) {
      console.error(`[Competitor Scraper] Error scraping competitor ${competitorId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const competitorScraper = new CompetitorScraper();
