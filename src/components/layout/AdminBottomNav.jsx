import React, { useEffect, useMemo } from 'react';
import { Boxes, ClipboardList, Coins, LayoutDashboard, Target } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import useHideOnScroll from '../../hooks/useHideOnScroll';
import useAuthStore from '../../store/useAuthStore';
import { isAdminRole } from '../../utils/authRoles';
import MobileBottomNavItem from './MobileBottomNavItem';


const AdminBottomNav = () => {
  const location = useLocation();
  const { language, dir } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const isArabic = language === 'ar' || dir === 'rtl';
  const shouldShow = isAdminRole(user?.role);
  const { isHidden, isScrolled } = useHideOnScroll({ enabled: shouldShow, hideAfter: 15, minimumDelta: 5 });

  const items = useMemo(() => ([
    { to: '/admin/orders', label: isArabic ? 'إدارة الطلبات' : 'Orders', icon: ClipboardList, matches: ['/admin/orders'] },
    { to: '/admin/target-requests', label: isArabic ? 'طلبات التارجت' : 'Target requests', icon: Target, matches: ['/admin/target-requests'] },
    { to: '/admin/dashboard', label: isArabic ? 'لوحة التحكم' : 'Dashboard', icon: LayoutDashboard, matches: ['/admin/dashboard'] },
    { to: '/admin/products', label: isArabic ? 'إدارة المنتجات' : 'Products', icon: Boxes, matches: ['/admin/products'] },
    { to: '/admin/currencies', label: isArabic ? 'العملات' : 'Currencies', icon: Coins, matches: ['/admin/currencies'] },
  ]), [isArabic]);

  useEffect(() => {
    if (!shouldShow) return undefined;
    document.body.dataset.mobileBottomNav = 'true';
    return () => delete document.body.dataset.mobileBottomNav;
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <nav className={`mobile-bottom-nav mobile-auto-hide-bar fixed inset-x-0 bottom-0 z-[65] md:hidden ${isHidden ? 'is-hidden' : 'is-visible'} ${isScrolled ? 'is-scrolled' : 'is-at-top'}`} aria-label={isArabic ? 'تنقل الإدارة' : 'Admin navigation'} dir={dir}>
      <div className="mobile-bottom-nav__panel">
        {items.map((item) => (
          <MobileBottomNavItem key={item.to} item={item} pathname={location.pathname} />
        ))}
      </div>
    </nav>
  );
};

export default AdminBottomNav;
