import React from 'react';
import { MessageCircle } from 'lucide-react';
import useCustomerSupportContacts from '../../hooks/useCustomerSupportContacts';
import { buildWhatsAppLink, formatSupportNumber, getSupportContactLabel } from '../../utils/whatsapp';

const SupportContactLinks = ({ isArabic, message, className }) => {
  const contacts = useCustomerSupportContacts(true);
  if (!contacts.length) return null;

  return (
    <div className={className}>
      <p className="mb-2 text-sm font-bold text-[var(--color-text)]">
        {isArabic ? 'خدمة العملاء على واتساب' : 'Customer support on WhatsApp'}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {contacts.map((contact, index) => (
          <li key={contact.id}>
            <a
              className="flex h-full items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-start text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]"
              href={buildWhatsAppLink({ number: contact.number, message })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
              <span>
                <span className="block text-xs text-[var(--color-text-secondary)]">
                  {getSupportContactLabel(contact, index, isArabic)}
                </span>
                <bdi className="block text-sm font-bold" dir="ltr">{formatSupportNumber(contact.number)}</bdi>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SupportContactLinks;
