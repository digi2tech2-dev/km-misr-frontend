export const SITE_NAME = 'KM أولاد مصر';
export const SITE_ORIGIN = 'https://km-wiladmisr.com';
export const SITE_LOGO_PATH = '/km-olad-masr-logo.png';

const alternateNames = ['KM اولاد مصر', 'كي إم أولاد مصر', 'KM Wilad Misr', 'KM Olad Masr', 'KM Awlad Masr'];

export const storefrontDescription = {
  ar: 'شحن الألعاب وتطبيقات الدردشة الصوتية، وشراء البطاقات والاشتراكات الرقمية.',
  en: 'Top up games and voice chat apps, and shop for digital cards and subscriptions.',
};

const publicPages = {
  '/': {
    ar: ['شحن الألعاب والتطبيقات والبطاقات الرقمية', storefrontDescription.ar],
    en: ['Game Top-Ups, Apps and Digital Cards', storefrontDescription.en],
  },
  '/about-us': {
    ar: ['من نحن', 'تعرّف على متجر شحن الألعاب وتطبيقات الدردشة الصوتية والبطاقات الرقمية.'],
    en: ['About us', 'Learn about the store for game top-ups, voice chat apps, and digital cards.'],
  },
  '/api-docs': {
    ar: ['دليل المطورين', 'دليل ربط المتاجر بواجهة API لشحن الألعاب والتطبيقات وإدارة الطلبات.'],
    en: ['API documentation', 'Learn how to integrate with the API for game top-ups, apps, and order management.'],
  },
};

export const sitemapPaths = Object.keys(publicPages);

export const resolveSiteOrigin = (...urls) => {
  for (const value of urls) {
    if (!value?.trim()) continue;
    try {
      const url = new URL(value.trim());
      if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) {
        return url.origin;
      }
    } catch {
      // Try the next configured URL.
    }
  }
  return SITE_ORIGIN;
};

export const getSearchSiteName = (platformName) =>
  !platformName || [SITE_NAME, ...alternateNames].includes(platformName) ? SITE_NAME : platformName;

export const getPageSeo = ({ pathname = '/', language = 'ar', origin = SITE_ORIGIN, platformName } = {}) => {
  const path = pathname.replace(/\/+$/, '') || '/';
  const canonicalPath = path === '/catalog' ? '/' : path;
  const locale = language === 'en' ? 'en' : 'ar';
  const siteName = getSearchSiteName(platformName);
  const page = Object.hasOwn(publicPages, canonicalPath) ? publicPages[canonicalPath][locale] : null;
  const [heading, summary] = page || ['', storefrontDescription[locale]];
  const homeUrl = `${origin}/`;
  const logoUrl = `${origin}${SITE_LOGO_PATH}`;
  const aliases = siteName === SITE_NAME ? alternateNames : undefined;

  return {
    siteName,
    title: heading ? `${siteName} | ${heading}` : siteName,
    description: `${siteName} — ${summary}`,
    canonicalUrl: page ? `${origin}${canonicalPath}` : '',
    robots: page ? 'index, follow, max-image-preview:large' : 'noindex, follow',
    locale: locale === 'ar' ? 'ar_EG' : 'en_US',
    logoUrl,
    jsonLd: path === '/' ? {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${homeUrl}#website`,
          name: siteName,
          alternateName: aliases,
          url: homeUrl,
          inLanguage: ['ar-EG', 'en'],
          publisher: { '@id': `${homeUrl}#organization` },
        },
        {
          '@type': 'Organization',
          '@id': `${homeUrl}#organization`,
          name: siteName,
          alternateName: aliases,
          url: homeUrl,
          logo: logoUrl,
        },
      ],
    } : null,
  };
};

export const pageMeta = ({ siteName, title, description, canonicalUrl, robots, locale, logoUrl }) => [
  ['name', 'application-name', siteName],
  ['name', 'description', description],
  ['name', 'robots', robots],
  ['property', 'og:type', 'website'],
  ['property', 'og:site_name', siteName],
  ['property', 'og:title', title],
  ['property', 'og:description', description],
  ['property', 'og:locale', locale],
  ['property', 'og:url', canonicalUrl],
  ['property', 'og:image', logoUrl],
  ['property', 'og:image:alt', siteName],
  ['name', 'twitter:card', 'summary_large_image'],
  ['name', 'twitter:title', title],
  ['name', 'twitter:description', description],
  ['name', 'twitter:image', logoUrl],
  ['name', 'twitter:image:alt', siteName],
];
