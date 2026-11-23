import React from 'react';
import { ArrowUpRight, Headphones, MessageCircle } from 'lucide-react';
import Modal from './Modal';
import { usePlatformBrand } from '../../context/ThemeContext';
import { buildWhatsAppLink, formatSupportNumber, getSupportContactLabel } from '../../utils/whatsapp';
import useCustomerSupportContacts from '../../hooks/useCustomerSupportContacts';
import './WhatsAppContactChooser.css';

const WhatsAppContactChooser = ({ isOpen, onClose, message = '', isArabic = true }) => {
  const brand = usePlatformBrand();
  const contacts = useCustomerSupportContacts(isOpen);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xs" title={isArabic ? 'خدمة العملاء' : 'Customer support'}>
      <div dir={isArabic ? 'rtl' : 'ltr'} className="support-contact">
        <div className="support-contact__hero">
          <div className="support-contact__topline">
            <div className="support-contact__brand" dir="ltr">
              <img src={brand.logoUrl} alt={brand.platformName} className="support-contact__logo" />
              <span><small>CLIENT CARE</small></span>
            </div>
            <span className="support-contact__icon" aria-hidden="true"><Headphones /></span>
          </div>
          <div className="support-contact__welcome">
            <div className="support-contact__intro">
              <span className="support-contact__eyebrow">{isArabic ? 'نحن هنا لمساعدتك' : 'WE ARE HERE TO HELP'}</span>
              <h4>{isArabic ? 'كيف نقدر نساعدك؟' : 'How can we help?'}</h4>
              {contacts.length > 0 && (
                <p>{isArabic ? 'اختر جهة التواصل المناسبة وسنفتح محادثة واتساب.' : 'Choose a contact and we will open WhatsApp.'}</p>
              )}
            </div>
            <img className="support-contact__robot" src={brand.logoUrl} alt="" width="512" height="512" decoding="async" />
          </div>
        </div>
        <div className="support-contact__body">
          {contacts.map((contact, index) => {
            const href = buildWhatsAppLink({ number: contact.number, message });
            return (
              <a key={contact.id} href={href} target="_blank" rel="noopener noreferrer" onClick={onClose} className="support-contact__action">
                <MessageCircle aria-hidden="true" />
                <span className="flex flex-col text-start">
                  <span>{getSupportContactLabel(contact, index, isArabic)}</span>
                  <bdi dir="ltr">{formatSupportNumber(contact.number)}</bdi>
                </span>
                <ArrowUpRight className="support-contact__arrow" aria-hidden="true" />
              </a>
            );
          })}
          {!contacts.length && <p className="support-contact__hint" role="status">
            {isArabic ? 'لا توجد أرقام واتساب متاحة حاليًا.' : 'No WhatsApp numbers are currently available.'}
          </p>}
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppContactChooser;
