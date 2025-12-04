import { Helmet } from "react-helmet";
import { seoConfig } from "@/content/seo-config";

interface SeoHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogType?: "website" | "article" | "product";
  ogImage?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  structuredData?: object;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
}

export function SeoHead({
  title,
  description,
  keywords = [],
  ogType = "website",
  ogImage,
  canonicalUrl,
  noindex = false,
  structuredData,
  article
}: SeoHeadProps) {
  const fullTitle = title 
    ? `${title} | ${seoConfig.siteName}`
    : seoConfig.defaultTitle;
  
  const metaDescription = description || seoConfig.defaultDescription;
  const allKeywords = [...keywords, ...seoConfig.keywordClusters.shopifySeo.slice(0, 5)];
  
  const defaultOgImage = `${seoConfig.siteUrl}/og-image.png`;
  const ogImageUrl = ogImage || defaultOgImage;
  
  const canonical = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={allKeywords.join(", ")} />
      
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />}
      
      {canonical && <link rel="canonical" href={canonical} />}
      
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:site_name" content={seoConfig.siteName} />
      {canonical && <meta property="og:url" content={canonical} />}
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImageUrl} />
      
      {article && (
        <>
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
          {article.author && (
            <meta property="article:author" content={article.author} />
          )}
          {article.section && (
            <meta property="article:section" content={article.section} />
          )}
          {article.tags?.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

export function generateFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  price: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": product.currency || "USD",
      "availability": "https://schema.org/InStock"
    },
    ...(product.rating && product.reviewCount && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.reviewCount
      }
    })
  };
}

export function generateArticleSchema(article: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "author": {
      "@type": "Person",
      "name": article.author
    },
    "datePublished": article.datePublished,
    "dateModified": article.dateModified || article.datePublished,
    "publisher": {
      "@type": "Organization",
      "name": seoConfig.siteName,
      "logo": {
        "@type": "ImageObject",
        "url": `${seoConfig.siteUrl}/logo.png`
      }
    },
    ...(article.image && {
      "image": article.image
    })
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export function generateComparisonSchema(comparison: {
  headline: string;
  description: string;
  items: { name: string; rating: number; reviewCount: number }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": comparison.headline,
    "description": comparison.description,
    "itemListElement": comparison.items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "SoftwareApplication",
        "name": item.name,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": item.rating,
          "reviewCount": item.reviewCount
        }
      }
    }))
  };
}
