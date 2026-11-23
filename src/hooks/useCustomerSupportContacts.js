import { useEffect } from 'react';
import useSystemStore from '../store/useSystemStore';
import { getCustomerSupportContacts } from '../utils/whatsapp';

const useCustomerSupportContacts = (refresh = false) => {
  const savedContacts = useSystemStore((state) => state.paymentSettings.supportContacts);
  const loadPaymentSettings = useSystemStore((state) => state.loadPaymentSettings);

  useEffect(() => {
    if (refresh) void loadPaymentSettings({ force: true });
  }, [refresh, loadPaymentSettings]);

  return getCustomerSupportContacts(savedContacts);
};

export default useCustomerSupportContacts;
