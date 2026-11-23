import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { usePlatformBrand } from '../../context/ThemeContext';
import { getPageSeo, pageMeta, resolveSiteOrigin } from '../../utils/seo';

const origin = resolveSiteOrigin(import.meta.env.VITE_SITE_URL, import.meta.env.VITE_PUBLIC_SITE_URL);

const updateHead = (selector, tagName, attributes) => {
  const existing = document.head.querySelector(selector);
  if (!attributes) {
    existing?.remove();
    return;
  }
  const element = existing || document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  if (!existing) document.head.appendChild(element);
  return element;
};

const Seo = () => {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const { platformName } = usePlatformBrand();

  useEffect(() => {
    const metadata = getPageSeo({ pathname, language, origin, platformName });
    document.title = metadata.title;
    for (const [attribute, name, content] of pageMeta(metadata)) {
      updateHead(`meta[${attribute}="${name}"]`, 'meta', content ? { [attribute]: name, content } : null);
    }
    updateHead(
      'link[rel="canonical"]',
      'link',
      metadata.canonicalUrl ? { rel: 'canonical', href: metadata.canonicalUrl } : null
    );
    const schema = updateHead(
      'script#website-structured-data',
      'script',
      metadata.jsonLd ? { id: 'website-structured-data', type: 'application/ld+json' } : null
    );
    if (schema) schema.textContent = JSON.stringify(metadata.jsonLd);
  }, [pathname, language, platformName]);

  return null;
};

export default Seo;
