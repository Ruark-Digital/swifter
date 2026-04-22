// Sitemap generator utility for SwiftPro eProcurement Portal

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

const BASE_URL = 'https://swiftpro.com';

// Static pages configuration
const STATIC_PAGES: SitemapUrl[] = [
  {
    loc: '/',
    changefreq: 'daily',
    priority: 1.0,
  },
  {
    loc: '/privacy-policy',
    changefreq: 'monthly',
    priority: 0.3,
  },
  {
    loc: '/terms-conditions',
    changefreq: 'monthly',
    priority: 0.3,
  },
  {
    loc: '/disclaimer',
    changefreq: 'monthly',
    priority: 0.3,
  },
  {
    loc: '/contact-us',
    changefreq: 'monthly',
    priority: 0.5,
  },
];

// Dashboard pages (these would be behind authentication)
const DASHBOARD_PAGES: SitemapUrl[] = [
  {
    loc: '/dashboard',
    changefreq: 'daily',
    priority: 0.9,
  },
  {
    loc: '/dashboard/solicitation',
    changefreq: 'daily',
    priority: 0.8,
  },
  {
    loc: '/dashboard/vendor',
    changefreq: 'daily',
    priority: 0.8,
  },
  {
    loc: '/dashboard/evaluation',
    changefreq: 'daily',
    priority: 0.8,
  },
  {
    loc: '/dashboard/companies',
    changefreq: 'weekly',
    priority: 0.7,
  },
  {
    loc: '/dashboard/user-management',
    changefreq: 'weekly',
    priority: 0.6,
  },
  {
    loc: '/dashboard/profile',
    changefreq: 'weekly',
    priority: 0.5,
  },
];

export const generateSitemap = (includePrivatePages: boolean = false): string => {
  const pages = includePrivatePages ? [...STATIC_PAGES, ...DASHBOARD_PAGES] : STATIC_PAGES;
  const currentDate = new Date().toISOString().split('T')[0];
  
  const urlElements = pages.map(page => {
    const lastmod = page.lastmod || currentDate;
    return `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq || 'weekly'}</changefreq>
    <priority>${page.priority || 0.5}</priority>
  </url>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
};

export const generateRobotsTxt = (): string => {
  return `User-agent: *
Allow: /
Allow: /privacy-policy
Allow: /terms-conditions
Allow: /disclaimer
Allow: /contact-us

# Disallow private dashboard pages for non-authenticated users
Disallow: /dashboard/

# Sitemap location
Sitemap: ${BASE_URL}/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1`;
};

// Function to add dynamic URLs (like specific solicitation, vendor, evaluation pages)
export const addDynamicUrls = (urls: SitemapUrl[]): SitemapUrl[] => {
  return [...STATIC_PAGES, ...urls];
};

// Function to generate breadcrumb structured data
export const generateBreadcrumbStructuredData = (breadcrumbs: { name: string; url: string }[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `${BASE_URL}${crumb.url}`
    }))
  };
};

// Function to generate FAQ structured data
export const generateFAQStructuredData = (faqs: { question: string; answer: string }[]) => {
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
};

// Function to generate organization structured data
export const generateOrganizationStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SwiftPro",
    "url": BASE_URL,
    "logo": "https://api.swiftpro.tech/api/v1/dev/upload/file-1752307517298-493582260/image9.png",
    "description": "SwiftPro is an eProcurement Portal designed for procurement professionals, internal and external stakeholders to streamline RFx workflows, manage end-to-end RFx process or Solicitations and track progress efficiently.",
    "foundingDate": "2024",
    "industry": "Software",
    "serviceArea": "Global",
    "sameAs": [
      "https://twitter.com/SwiftPro",
      "https://linkedin.com/company/swiftpro"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": `${BASE_URL}/contact-us`
    }
  };
};