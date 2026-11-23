import React, { useEffect, useMemo } from 'react';
import { CirclePlus, House, Search, ShoppingCart, WalletCards } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import useHideOnScroll from '../../hooks/useHideOnScroll';
import useAuthStore from '../../store/useAuthStore';
import { isAdminRole, isSupervisorRole } from '../../utils/authRoles';
import MobileBottomNavItem from './MobileBottomNavItem';

const HIDDEN_PATHS = ['/auth', '/login', '/email-verified', '/verify-account', '/account-pending', '/account-rejected'];

const CustomerBottomNav = () => {
  const location = useLocation();
  const { language, dir } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const isArabic = language === 'ar' || dir === 'rtl';
  const isStaff = isAdminRole(user?.role) || isSupervisorRole(user?.role);
  const shouldShow = Boolean(user) && !isStaff && !location.pathname.startsWith('/admin')
    && !HIDDEN_PATHS.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const { isHidden, isScrolled } = useHideOnScroll({ enabled: shouldShow, hideAfter: 15, minimumDelta: 5 });

  const items = useMemo(() => ([
    { to: '/wallet/topup-history', label: isArabic ? 'سجل الرصيد' : 'Balance history', icon: WalletCards, matches: ['/wallet/topup-history', '/wallet/topups'] },
    { to: '/wallet/add-balance', label: isArabic ? 'إضافة رصيد' : 'Add balance', icon: CirclePlus, matches: ['/wallet/add-balance', '/wallet/payment-details'] },
    { to: '/dashboard', label: isArabic ? 'الرئيسية' : 'Home', icon: House, matches: ['/dashboard'] },
    { to: '/orders', label: isArabic ? 'طلباتي' : 'Orders', icon: ShoppingCart, matches: ['/orders', '/target-orders'] },
    { to: '/products', label: isArabic ? 'البحث' : 'Search', icon: Search, matches: ['/products', '/purchase'], state: { openProductSearch: true } },
  ]), [isArabic]);

  useEffect(() => {
    if (!shouldShow) return undefined;
    document.body.dataset.mobileBottomNav = 'true';
    return () => delete document.body.dataset.mobileBottomNav;
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <nav className={`mobile-bottom-nav mobile-auto-hide-bar fixed inset-x-0 bottom-0 z-[65] md:hidden ${isHidden ? 'is-hidden' : 'is-visible'} ${isScrolled ? 'is-scrolled' : 'is-at-top'}`} aria-label={isArabic ? 'التنقل الرئيسي' : 'Main navigation'} dir={dir}>
      <div className="mobile-bottom-nav__panel">
        {items.map((item) => (
          <MobileBottomNavItem key={item.to} item={item} pathname={location.pathname} />
        ))}
      </div>
    </nav>
  );
};

export default CustomerBottomNav;
