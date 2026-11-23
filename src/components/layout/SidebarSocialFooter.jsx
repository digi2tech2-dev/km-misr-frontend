import React from 'react';
import { Facebook, Instagram, MessageCircle, Phone } from 'lucide-react';
import { usePlatformBrand } from '../../context/ThemeContext';
import { WHATSAPP_CHANNEL_URL } from '../../utils/whatsapp';

const safeHttpsUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
};

const getWhatsAppSocialUrl = (value) => {
  const href = safeHttpsUrl(value);
  if (!href) return WHATSAPP_CHANNEL_URL;

  const url = new URL(href);
  const host = url.hostname.replace(/^www\./, '');
  const isGroup = host === 'chat.whatsapp.com';
  const isChannel = host === 'whatsapp.com' && /^\/channel(?:\/|$)/i.test(url.pathname);
  return isGroup || isChannel ? WHATSAPP_CHANNEL_URL : href;
};

const StoreSocialLinks = ({ isArabic = true }) => {
  const { platformName, socialMedia } = usePlatformBrand();
  const phone = socialMedia.phone.trim();
  const phoneHref = phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : '';
  const whatsappHref = getWhatsAppSocialUrl(socialMedia.whatsapp);
  const isChannel = whatsappHref === WHATSAPP_CHANNEL_URL;
  const whatsappLabel = isChannel
    ? (isArabic ? `قناة ${platformName} على واتساب` : `${platformName} WhatsApp channel`)
    : (isArabic ? `واتساب ${platformName}` : `${platformName} on WhatsApp`);
  const links = [
    phoneHref && { key: 'phone', href: phoneHref, title: phone, label: isArabic ? `اتصل بـ ${platformName}` : `Call ${platformName}`, Icon: Phone, displayText: phone },
    { key: 'whatsapp', href: whatsappHref, title: whatsappLabel, label: whatsappLabel, Icon: MessageCircle },
    safeHttpsUrl(socialMedia.instagram) && { key: 'instagram', href: safeHttpsUrl(socialMedia.instagram), title: 'Instagram', label: isArabic ? `إنستجرام ${platformName}` : `${platformName} on Instagram`, Icon: Instagram },
    safeHttpsUrl(socialMedia.facebook) && { key: 'facebook', href: safeHttpsUrl(socialMedia.facebook), title: 'Facebook', label: isArabic ? `فيسبوك ${platformName}` : `${platformName} on Facebook`, Icon: Facebook },
  ].filter(Boolean);

  return (
    <nav aria-label={isArabic ? 'السوشيال ميديا' : 'Social media'} className="flex flex-wrap items-center justify-center gap-2" dir="ltr">
      {links.map(({ key, href, title, label, Icon, displayText }) => (
        <a
          key={key}
          href={href}
          target={key === 'phone' ? undefined : '_blank'}
          rel={key === 'phone' ? undefined : 'noopener noreferrer'}
          aria-label={label}
          title={title}
          className={`inline-flex h-8 ${displayText ? 'max-w-full gap-1.5 rounded-full px-2' : 'w-8 justify-center rounded-full'} items-center border border-[color:rgb(var(--color-primary-rgb)/0.25)] bg-[color:rgb(var(--color-primary-rgb)/0.08)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {displayText && <span className="truncate text-[0.65rem] font-semibold" dir="ltr">{displayText}</span>}
        </a>
      ))}
    </nav>
  );
};

const SidebarSocialFooter = ({ isArabic = true }) => {
  const { platformName } = usePlatformBrand();

  return (
    <div className="relative z-10 shrink-0 border-t border-[color:rgb(var(--color-border-rgb)/0.55)] px-3 pb-3 pt-2.5 text-center" dir="ltr">
      <div className="text-[0.62rem] font-semibold text-[var(--color-text-secondary)]">© 2026 {platformName}</div>
      <div className="mt-2"><StoreSocialLinks isArabic={isArabic} /></div>
    </div>
  );
};

export { StoreSocialLinks };
export default SidebarSocialFooter;
