import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
  robots?: string;
  author?: string;
  structuredData?: object;
  children?: React.ReactNode;
}

const DEFAULT_SEO = {
  title: 'SwiftPro - Professional eProcurement Portal',
  description: 'SwiftPro is an eProcurement Portal designed for procurement professionals, internal and external stakeholders to streamline RFx workflows, manage end-to-end RFx process or Solicitations and track progress efficiently.',
  keywords: 'eProcurement, RFx workflows, solicitations, procurement management, vendor management, evaluation management, professional platform',
  author: 'SwiftPro',
  ogTitle: 'SwiftPro | Professional eProcurement Portal',
  ogDescription: 'SwiftPro is an eProcurement Portal designed for procurement professionals, internal and external stakeholders to streamline RFx workflows, manage end-to-end RFx process or Solicitations and track progress efficiently.',
  ogImage: 'https://api.swiftpro.tech/api/v1/dev/upload/file-1752307517298-493582260/image9.png',
  ogUrl: 'https://swiftpro.com',
  twitterCard: 'summary_large_image' as const,
  robots: 'index, follow',
};

const SEOWrapper: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  twitterCard,
  twitterTitle,
  twitterDescription,
  twitterImage,
  canonical,
  robots,
  author,
  structuredData,
  children
}) => {
  const location = useLocation();
  
  const seoConfig = {
    title: title || DEFAULT_SEO.title,
    description: description || DEFAULT_SEO.description,
    keywords: keywords || DEFAULT_SEO.keywords,
    ogTitle: ogTitle || title || DEFAULT_SEO.ogTitle,
    ogDescription: ogDescription || description || DEFAULT_SEO.ogDescription,
    ogImage: ogImage || DEFAULT_SEO.ogImage,
    ogUrl: ogUrl || `https://swiftpro.com${location.pathname}`,
    twitterCard: twitterCard || DEFAULT_SEO.twitterCard,
    twitterTitle: twitterTitle || title || DEFAULT_SEO.title,
    twitterDescription: twitterDescription || description || DEFAULT_SEO.description,
    twitterImage: twitterImage || ogImage || DEFAULT_SEO.ogImage,
    canonical: canonical || `https://swiftpro.com${location.pathname}`,
    robots: robots || DEFAULT_SEO.robots,
    author: author || DEFAULT_SEO.author,
  };

  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "SwiftPro",
    "description": seoConfig.description,
    "url": "https://swiftpro.com",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "category": "eProcurement Software"
    },
    "provider": {
      "@type": "Organization",
      "name": "SwiftPro",
      "url": "https://swiftpro.com"
    }
  };

  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{seoConfig.title}</title>
        <meta name="description" content={seoConfig.description} />
        <meta name="keywords" content={seoConfig.keywords} />
        <meta name="author" content={seoConfig.author} />
        <meta name="robots" content={seoConfig.robots} />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={seoConfig.ogTitle} />
        <meta property="og:description" content={seoConfig.ogDescription} />
        <meta property="og:image" content={seoConfig.ogImage} />
        <meta property="og:url" content={seoConfig.ogUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SwiftPro" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content={seoConfig.twitterCard} />
        <meta name="twitter:title" content={seoConfig.twitterTitle} />
        <meta name="twitter:description" content={seoConfig.twitterDescription} />
        <meta name="twitter:image" content={seoConfig.twitterImage} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={seoConfig.canonical} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData || defaultStructuredData)}
        </script>
      </Helmet>
      {children}
    </>
  );
};

export default SEOWrapper;