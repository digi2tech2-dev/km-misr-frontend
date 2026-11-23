const defaultSupportContacts = [
  { id: 'customer-support-primary', name: 'خدمة العملاء', role: 'الرقم الأساسي', number: '+201125278141' },
  { id: 'customer-support-backup', name: 'خدمة العملاء', role: 'الرقم الاحتياطي', number: '+201142845003' },
];
const previousDefaultNumber = '201064920750';

export const normalizeWhatsAppNumber = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';

  // Support local numbers like 010xxxxxxxx by defaulting to Egypt country code.
  if (digits.startsWith('0') && digits.length >= 10) {
    return `20${digits.replace(/^0+/, '')}`;
  }

  return digits;
};

export const buildWhatsAppLink = ({ number, message = '' }) => {
  const normalizedNumber = normalizeWhatsAppNumber(number);
  if (!normalizedNumber) return null;
  const text = String(message || '').trim();
  const suffix = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${normalizedNumber}${suffix}`;
};

export const getDefaultWhatsAppNumber = () => normalizeWhatsAppNumber(defaultSupportContacts[0].number);

export const resolveSupportContacts = (value) => {
  if (!value) return [];
  if (Array.isArray(value?.entries)) return value.entries;
  const contacts = [];
  if (value.owner) contacts.push({ id: 'legacy-owner', name: 'إدارة المتجر', role: 'الإدارة', number: value.owner });
  if (value.support) contacts.push({ id: 'legacy-support', name: 'خدمة العملاء', role: 'الدعم', number: value.support });
  return contacts;
};

export const getCustomerSupportContacts = (value) => {
  if (!value) return [];

  const isSavedList = Array.isArray(value.entries) && Number(value.revision) > 0;
  const configured = resolveSupportContacts(value).filter((contact) => {
    const number = normalizeWhatsAppNumber(contact?.number);
    return number && (isSavedList || number !== previousDefaultNumber);
  });
  return isSavedList || configured.length > 0 ? configured : defaultSupportContacts;
};

export const normalizeSupportContactNumber = (value) => {
  const phone = String(value || '')
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\s()-]/g, '');
  if (/^01[0125]\d{8}$/.test(phone)) return `+20${phone.slice(1)}`;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : '';
};

export const getSupportContactLabel = (contact, index, isArabic) => {
  if (index === 0) return isArabic ? 'الرقم الأساسي' : 'Primary number';
  if (index === 1) return isArabic ? 'الرقم الاحتياطي' : 'Backup number';
  return contact.name || (isArabic ? 'خدمة العملاء' : 'Customer support');
};

export const formatSupportNumber = (value) => {
  const number = normalizeWhatsAppNumber(value);
  return /^201[0125]\d{8}$/.test(number) ? `0${number.slice(2)}` : `+${number}`;
};
