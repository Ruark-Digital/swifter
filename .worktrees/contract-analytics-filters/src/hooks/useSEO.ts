import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOConfig {
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
}

const DEFAULT_SEO: SEOConfig = {
  title: 'SwiftPro - Professional eProcurement Portal',
  description: 'SwiftPro is an eProcurement Portal designed for procurement professionals, internal and external stakeholders to streamline RFx workflows, manage end-to-end RFx process or Solicitations and track progress efficiently.',
  keywords: 'eProcurement, RFx workflows, solicitations, procurement management, vendor management, evaluation management, professional platform',
  author: 'SwiftPro',
  ogTitle: 'SwiftPro | Professional eProcurement Portal',
  ogDescription: 'SwiftPro is an eProcurement Portal designed for procurement professionals, internal and external stakeholders to streamline RFx workflows, manage end-to-end RFx process or Solicitations and track progress efficiently.',
  ogImage: 'https://api.swiftpro.tech/api/v1/dev/upload/file-1752307517298-493582260/image9.png',
  ogUrl: 'https://swiftpro.com',
  twitterCard: 'summary_large_image',
  robots: 'index, follow',
};

// Page-specific SEO configurations
const PAGE_SEO_CONFIG: Record<string, SEOConfig> = {
  '/': {
    title: 'Login - SwiftPro eProcurement Portal',
    description: 'Access your SwiftPro eProcurement Portal account. Streamline your procurement workflows and manage solicitations efficiently.',
    keywords: 'SwiftPro login, eProcurement portal access, procurement management login',
  },
  '/dashboard': {
    title: 'Dashboard - SwiftPro eProcurement Portal',
    description: 'SwiftPro dashboard overview with key metrics, recent activities, and quick access to procurement management features.',
    keywords: 'procurement dashboard, eProcurement metrics, solicitation overview, vendor statistics',
  },
  '/dashboard/solicitation': {
    title: 'Solicitation Management - SwiftPro',
    description: 'Manage and track all your solicitations, RFx processes, and procurement requests in one centralized platform.',
    keywords: 'solicitation management, RFx management, procurement requests, tender management',
  },
  '/dashboard/vendor': {
    title: 'Vendor Management - SwiftPro',
    description: 'Comprehensive vendor management system to onboard, evaluate, and manage your supplier relationships.',
    keywords: 'vendor management, supplier management, vendor onboarding, supplier evaluation',
  },
  '/dashboard/evaluation': {
    title: 'Evaluation Management - SwiftPro',
    description: 'Streamline your evaluation processes with comprehensive tools for proposal assessment and vendor scoring.',
    keywords: 'evaluation management, proposal evaluation, vendor scoring, procurement assessment',
  },
  '/dashboard/companies': {
    title: 'Company Management - SwiftPro',
    description: 'Manage company profiles, organizational settings, and corporate information within the SwiftPro platform.',
    keywords: 'company management, organization settings, corporate profiles, business management',
  },
  '/dashboard/user-management': {
    title: 'User Management - SwiftPro',
    description: 'Administer user accounts, roles, and permissions across your SwiftPro eProcurement platform.',
    keywords: 'user management, user administration, role management, access control',
  },
  '/dashboard/profile': {
    title: 'Profile Settings - SwiftPro',
    description: 'Manage your personal profile, account settings, and preferences in SwiftPro eProcurement Portal.',
    keywords: 'profile settings, account management, user preferences, personal information',
  },
  '/privacy-policy': {
    title: 'Privacy Policy - SwiftPro',
    description: 'Read SwiftPro\'s privacy policy to understand how we collect, use, and protect your personal information.',
    keywords: 'privacy policy, data protection, personal information, GDPR compliance',
  },
  '/terms-conditions': {
    title: 'Terms & Conditions - SwiftPro',
    description: 'Review SwiftPro\'s terms and conditions for using our eProcurement platform and services.',
    keywords: 'terms and conditions, service agreement, platform usage terms, legal terms',
  },
  '/contact-us': {
    title: 'Contact Us - SwiftPro',
    description: 'Get in touch with SwiftPro support team for assistance with your eProcurement needs and platform questions.',
    keywords: 'contact support, customer service, help desk, technical assistance',
  },
};

const updateMetaTag = (name: string, content: string, property?: boolean) => {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.querySelector(selector) as HTMLMetaElement;
  
  if (!element) {
    element = document.createElement('meta');
    if (property) {
      element.setAttribute('property', name);
    } else {
      element.setAttribute('name', name);
    }
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
};

const updateLinkTag = (rel: string, href: string) => {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  
  element.setAttribute('href', href);
};

const addStructuredData = (data: object) => {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }
  
  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

export const useSEO = (customConfig?: SEOConfig) => {
  const location = useLocation();
  
  useEffect(() => {
    // Get page-specific config or use custom config
    const pageConfig = PAGE_SEO_CONFIG[location.pathname] || {};
    const config = { ...DEFAULT_SEO, ...pageConfig, ...customConfig };
    
    // Update document title
    if (config.title) {
      document.title = config.title;
    }
    
    // Update meta tags
    if (config.description) {
      updateMetaTag('description', config.description);
    }
    
    if (config.keywords) {
      updateMetaTag('keywords', config.keywords);
    }
    
    if (config.author) {
      updateMetaTag('author', config.author);
    }
    
    if (config.robots) {
      updateMetaTag('robots', config.robots);
    }
    
    // Update Open Graph tags
    if (config.ogTitle) {
      updateMetaTag('og:title', config.ogTitle, true);
    }
    
    if (config.ogDescription) {
      updateMetaTag('og:description', config.ogDescription, true);
    }
    
    if (config.ogImage) {
      updateMetaTag('og:image', config.ogImage, true);
    }
    
    if (config.ogUrl) {
      updateMetaTag('og:url', config.ogUrl, true);
    }
    
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:site_name', 'SwiftPro', true);
    updateMetaTag('og:locale', 'en_US', true);
    
    // Update Twitter Card tags
    if (config.twitterCard) {
      updateMetaTag('twitter:card', config.twitterCard);
    }
    
    if (config.twitterTitle) {
      updateMetaTag('twitter:title', config.twitterTitle);
    }
    
    if (config.twitterDescription) {
      updateMetaTag('twitter:description', config.twitterDescription);
    }
    
    if (config.twitterImage) {
      updateMetaTag('twitter:image', config.twitterImage);
    }
    
    // Update canonical URL
    if (config.canonical) {
      updateLinkTag('canonical', config.canonical);
    } else {
      updateLinkTag('canonical', `https://swiftpro.com${location.pathname}`);
    }
    
    // Add structured data
    if (config.structuredData) {
      addStructuredData(config.structuredData);
    } else {
      // Default structured data for the organization
      const defaultStructuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "SwiftPro",
        "description": config.description,
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
      addStructuredData(defaultStructuredData);
    }
  }, [location.pathname, customConfig]);
  
  return {
    updateSEO: (newConfig: SEOConfig) => {
      // This function can be used to dynamically update SEO
      const config = { ...DEFAULT_SEO, ...newConfig };
      
      if (config.title) document.title = config.title;
      if (config.description) updateMetaTag('description', config.description);
      if (config.keywords) updateMetaTag('keywords', config.keywords);
    }
  };
};

// Utility function to generate dynamic SEO for detail pages
export const generateDetailPageSEO = (type: string, name: string, description?: string): SEOConfig => {
  const baseTitle = `${name} - ${type} | SwiftPro`;
  const baseDescription = description || `View and manage ${name} in SwiftPro eProcurement Portal. Access detailed information and perform actions related to this ${type.toLowerCase()}.`;
  
  return {
    title: baseTitle,
    description: baseDescription,
    keywords: `${name}, ${type.toLowerCase()}, SwiftPro, eProcurement, management`,
    ogTitle: baseTitle,
    ogDescription: baseDescription,
  };
};