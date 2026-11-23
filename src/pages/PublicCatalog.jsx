import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  ChevronRight,
  Layers3,
  Search,
  X,
  MessageCircle,
  ExternalLink,
  UserRound,
  CircleAlert,
  Info,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/useAuthStore';
import useMediaStore from '../store/useMediaStore';
import useGroupStore from '../store/useGroupStore';
import apiClient from '../services/client';
import ThemeToggle from '../components/ui/ThemeToggle';
import HeaderBrand from '../components/layout/HeaderBrand';
import { usePlatformBrand } from '../context/ThemeContext';
import { resolveImageUrl } from '../utils/imageUrl';
import PublicSidebar from '../components/layout/PublicSidebar';
import SiteCopyrightFooter from '../components/layout/SiteCopyrightFooter';
import HeroSlider from '../components/home/HeroSlider';
import CategoryCard from '../components/home/CategoryCard';
import BestSellingSection from '../components/home/BestSellingSection';
import ProductSearchBar from '../components/products/ProductSearchBar';
import ProductCardSimple from '../components/products/ProductCardSimple';
import ProductPurchaseDialog from '../components/products/ProductPurchaseDialog';
import LoadingSkeleton from '../components/products/LoadingSkeleton';
import EmptyState from '../components/products/EmptyState';
import { getDefaultRouteForRole } from '../utils/authRoles';
import { getSearchSiteName, storefrontDescription } from '../utils/seo';
import { WHATSAPP_CHANNEL_URL } from '../utils/whatsapp';
import {
  createStorefrontCategories,
  createStorefrontProducts,
  getStorefrontLanguage,
} from '../utils/storefront';
import { useBodyScrollLock } from '../utils/bodyScrollLock';
import slideOneImage from '../assets/slide-1.webp';
import slideTwoImage from '../assets/slide-2.webp';
import slideThreeImage from '../assets/slide-3.webp';
import slideFourImage from '../assets/slide-4.webp';
import slideFiveImage from '../assets/slide-5.webp';
import targetSalesImage from '../assets/تارجت.jpg';

const dataProvider = (import.meta.env.VITE_DATA_PROVIDER || 'mock').toLowerCase();
const isRealProvider = dataProvider === 'real';
const PUBLIC_NOTICES_SEEN_KEY = 'ka-card-public-notices-seen-v1';
const normalizeCategoryKey = (value) => String(value || '').trim().toLowerCase();

const addCategoryAlias = (set, value) => {
  const normalized = normalizeCategoryKey(value);
  if (normalized) {
    set.add(normalized);
  }
};

const hasSeenPublicNotices = () => {
  if (typeof window === 'undefined') return true;

  try {
    return window.localStorage.getItem(PUBLIC_NOTICES_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
};

const markPublicNoticesSeen = () => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(PUBLIC_NOTICES_SEEN_KEY, 'true');
  } catch {
    // Ignore storage restrictions; the notice should still work normally.
  }
};

const getGroupPercentage = (group) => {
  const value = Number(group?.percentage ?? group?.discount ?? group?.markup ?? group?.rate ?? 0);
  return Number.isFinite(value) ? value : 0;
};

const getPublicPricingGroup = (groups) => {
  const list = Array.isArray(groups) ? groups : [];
  const highestGroup = list.reduce((best, group) => {
    if (!best) return group;
    return getGroupPercentage(group) > getGroupPercentage(best) ? group : best;
  }, null);

  return {
    group: highestGroup?.name || highestGroup?.nameAr || 'Normal',
    groupId: highestGroup?.id || highestGroup?._id || highestGroup?.name || 'Normal',
    groupPercentage: highestGroup ? getGroupPercentage(highestGroup) : null,
    currency: 'USD',
    coins: 0,
    walletBalance: 0,
    creditLimit: 0,
    creditUsed: 0,
  };
};

const getProductCategoryKeys = (product) => {
  const keys = new Set();
  const category = product?.category;

  if (category && typeof category === 'object' && !Array.isArray(category)) {
    addCategoryAlias(keys, category._id);
    addCategoryAlias(keys, category.id);
    addCategoryAlias(keys, category.name);
    addCategoryAlias(keys, category.nameAr);
    addCategoryAlias(keys, category.title);
    addCategoryAlias(keys, category.titleAr);
    addCategoryAlias(keys, category.slug);
  } else {
    addCategoryAlias(keys, category);
  }

  addCategoryAlias(keys, product?.categoryId);
  addCategoryAlias(keys, product?.categoryName);
  addCategoryAlias(keys, product?.categoryNameAr);
  addCategoryAlias(keys, product?.categoryTitle);
  addCategoryAlias(keys, product?.categoryTitleAr);
  addCategoryAlias(keys, product?.categoryLabel);
  addCategoryAlias(keys, product?.categoryLabelAr);

  return keys;
};

const PublicCatalog = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.user?.role);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const { categories, products, isLoading, loadProducts } = useMediaStore();
  const groups = useGroupStore((state) => state.groups);
  const loadGroups = useGroupStore((state) => state.loadGroups);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showServiceNotice, setShowServiceNotice] = useState(false);
  const [showWhatsAppNotice, setShowWhatsAppNotice] = useState(false);
  const [currentParentId, setCurrentParentId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [publicCatalog, setPublicCatalog] = useState({ categories: null, products: null });
  const [isPublicCatalogLoading, setIsPublicCatalogLoading] = useState(isRealProvider);
  const hasActiveNotice = showServiceNotice || showWhatsAppNotice || isMenuOpen;

  useBodyScrollLock(hasActiveNotice);

  const language = getStorefrontLanguage(i18n);
  const isArabic = language === 'ar';
  const copy = useMemo(
    () => (
      isArabic
        ? {
            searchPlaceholder: 'ابحث عن منتج...',
            noResults: 'لا يوجد منتج مطابق',
            home: 'الرئيسية',
            emptyCatalogsTitle: 'لا توجد كاتلوجات جاهزة للعرض',
            emptyCatalogsDescription: 'عندما تتوفر أقسام مرتبطة بمنتجات ظاهرة في المتجر ستظهر هنا تلقائيًا.',
            emptyCategoryTitle: 'لا يوجد بها عناصر',
            emptyCategoryDescription: 'هذا القسم فارغ حاليًا، ويمكنك العودة لاختيار قسم آخر.',
            backToCatalogs: 'العودة إلى الأقسام',
            unavailable: 'غير متاح',
            loginToBuy: 'شراء الآن',
            targetTitle: 'بيع التارجت',
            topSellingTitle: 'الأكثر مبيعًا',
            viewAll: 'عرض الكل',
          }
        : {
            searchPlaceholder: 'Search for a product...',
            noResults: 'No matching product found',
            home: 'Home',
            emptyCatalogsTitle: 'No catalogs are ready to display',
            emptyCatalogsDescription: 'Collections linked to visible storefront products will appear here automatically.',
            emptyCategoryTitle: 'There are no items in this category',
            emptyCategoryDescription: 'This category is currently empty, and you can return to choose another one.',
            backToCatalogs: 'Back to categories',
            unavailable: 'Unavailable',
            loginToBuy: 'Buy now',
            targetTitle: 'Target Sales',
            topSellingTitle: 'Top selling',
            viewAll: 'View all',
          }
    ),
    [isArabic]
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDefaultRouteForRole(userRole), { replace: true });
    }
  }, [isAuthenticated, navigate, userRole]);

  useEffect(() => {
    loadGroups({ force: false });
  }, [loadGroups]);

  useEffect(() => {
    if (typeof window === 'undefined' || isAuthenticated) return undefined;
    if (hasSeenPublicNotices()) return undefined;

    let didCancel = false;
    const showNotice = () => {
      if (!didCancel) {
        markPublicNoticesSeen();
        setShowServiceNotice(true);
      }
    };

    const scheduleNotice = () => {
      if ('requestIdleCallback' in window) {
        return window.requestIdleCallback(showNotice, { timeout: 1800 });
      }

      return window.setTimeout(showNotice, 900);
    };

    const handle = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scheduleNotice);
    });

    return () => {
      didCancel = true;
      window.cancelAnimationFrame(handle);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isRealProvider) {
      void loadProducts({ force: true, bypassCache: true });
      setIsPublicCatalogLoading(false);
      return undefined;
    }

    let isMounted = true;
    let refreshRequest = null;

    const refreshCatalog = ({ showLoading = false } = {}) => {
      if (refreshRequest) return refreshRequest;
      if (showLoading) setIsPublicCatalogLoading(true);

      refreshRequest = Promise.resolve(apiClient.publicCatalog.fetch())
        .then((catalog) => {
          if (!isMounted || !catalog) return;

          const nextCategories = Array.isArray(catalog.categories) ? catalog.categories : null;
          const nextProducts = Array.isArray(catalog.products) ? catalog.products : null;

          if (nextCategories || nextProducts) {
            setPublicCatalog({
              categories: nextCategories,
              products: nextProducts,
            });
          }
        })
        .catch(() => {
          if (isMounted) setPublicCatalog({ categories: null, products: null });
          return loadProducts({ force: true, bypassCache: true });
        })
        .finally(() => {
          refreshRequest = null;
          if (isMounted && showLoading) setIsPublicCatalogLoading(false);
        });

      return refreshRequest;
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshCatalog();
    };

    void refreshCatalog({ showLoading: true });
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const refreshInterval = window.setInterval(refreshWhenVisible, 30_000);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.clearInterval(refreshInterval);
    };
  }, [loadProducts]);

  const handleCloseServiceNotice = useCallback(() => {
    setShowServiceNotice(false);
    setShowWhatsAppNotice(true);
  }, []);

  const handleCloseWhatsAppNotice = useCallback(() => {
    markPublicNoticesSeen();
    setShowWhatsAppNotice(false);
  }, []);

  const platformBrand = usePlatformBrand();
  const heroSlides = useMemo(() => {
    const defaults = [
      { id: 'landing-slide-1', image: slideOneImage, title: '' },
      { id: 'landing-slide-2', image: slideTwoImage, alt: 'قناة واتساب الرسمية', href: WHATSAPP_CHANNEL_URL },
      { id: 'landing-slide-3', image: slideThreeImage, title: '', href: '/referral' },
      { id: 'landing-slide-4', image: slideFourImage, title: '' },
      { id: 'landing-slide-5', image: slideFiveImage, title: '' },
    ];
    return defaults.map((slide, index) => platformBrand.slides[index]
      ? { ...slide, fallbackImage: slide.image, image: resolveImageUrl(platformBrand.slides[index]) } : slide);
  }, [platformBrand.slides]);

  const catalogProducts = useMemo(
    // Use one authoritative availability source. Mixing two responses can let a
    // stale `active` snapshot overwrite a freshly stopped product.
    () => (Array.isArray(publicCatalog.products) ? publicCatalog.products : products),
    [products, publicCatalog.products]
  );
  const catalogCategories = useMemo(
    () => (Array.isArray(publicCatalog.categories) ? publicCatalog.categories : categories),
    [categories, publicCatalog.categories]
  );
  const publicPricingUser = useMemo(() => getPublicPricingGroup(groups), [groups]);

  const storefrontProducts = useMemo(
    () => createStorefrontProducts(catalogProducts, {
      language,
      userGroup: publicPricingUser.groupId || publicPricingUser.group,
      userGroupPercentage: publicPricingUser.groupPercentage,
    }),
    [catalogProducts, language, publicPricingUser.group, publicPricingUser.groupId, publicPricingUser.groupPercentage]
  );

  const storefrontCategories = useMemo(
    () => createStorefrontCategories(catalogCategories, storefrontProducts, language)
      .filter((category) => category.id !== 'all'),
    [catalogCategories, storefrontProducts, language]
  );

  const sourceCategoriesById = useMemo(() => {
    const map = new Map();

    (Array.isArray(catalogCategories) ? catalogCategories : []).forEach((category) => {
      const id = String(category?.id || category?._id || '').trim();
      if (id) {
        map.set(id, category);
      }
    });

    return map;
  }, [catalogCategories]);

  const categoryAliasesById = useMemo(() => {
    const map = new Map();

    storefrontCategories.forEach((category) => {
      const aliases = new Set();
      const sourceCategory = sourceCategoriesById.get(category.id) || {};

      addCategoryAlias(aliases, category.id);
      addCategoryAlias(aliases, category.title);
      addCategoryAlias(aliases, sourceCategory.id);
      addCategoryAlias(aliases, sourceCategory._id);
      addCategoryAlias(aliases, sourceCategory.name);
      addCategoryAlias(aliases, sourceCategory.nameAr);
      addCategoryAlias(aliases, sourceCategory.title);
      addCategoryAlias(aliases, sourceCategory.titleAr);
      addCategoryAlias(aliases, sourceCategory.slug);

      map.set(category.id, aliases);
    });

    return map;
  }, [sourceCategoriesById, storefrontCategories]);

  const getParentId = useCallback((category) => {
    if (!category || !category.parentCategory) return null;

    const parent = category.parentCategory;
    if (typeof parent === 'object') return parent._id || parent.id || String(parent) || null;
    if (typeof parent === 'string') {
      const trimmed = parent.trim();
      return trimmed || null;
    }

    return String(parent) || null;
  }, []);

  const childrenMap = useMemo(() => {
    const map = new Map();

    for (const category of storefrontCategories) {
      const parentId = getParentId(category);
      if (!map.has(parentId)) {
        map.set(parentId, []);
      }
      map.get(parentId).push(category);
    }

    return map;
  }, [getParentId, storefrontCategories]);

  const currentCategories = useMemo(
    () => storefrontCategories.filter((category) => {
      const parentId = getParentId(category);
      if (currentParentId === null) return parentId === null;
      return String(parentId || '').trim() === String(currentParentId || '').trim();
    }),
    [currentParentId, getParentId, storefrontCategories]
  );

  const breadcrumbTrail = useMemo(() => {
    if (!currentParentId) return [];

    const categoriesById = new Map(storefrontCategories.map((category) => [category.id, category]));
    const trail = [];
    let categoryId = currentParentId;

    while (categoryId) {
      const category = categoriesById.get(categoryId);
      if (!category) break;
      trail.unshift(category);
      categoryId = getParentId(category);
    }

    return trail;
  }, [currentParentId, getParentId, storefrontCategories]);

  const currentCategoryIds = useMemo(() => {
    if (!currentParentId) return [];

    const ids = [];
    const seen = new Set();
    const queue = [currentParentId];

    while (queue.length > 0) {
      const categoryId = queue.shift();
      if (!categoryId || seen.has(categoryId)) continue;

      seen.add(categoryId);
      ids.push(categoryId);

      (childrenMap.get(categoryId) || []).forEach((child) => {
        if (child?.id && !seen.has(child.id)) {
          queue.push(child.id);
        }
      });
    }

    return ids;
  }, [childrenMap, currentParentId]);

  const currentCategoryProductKeys = useMemo(() => {
    const keys = new Set();

    currentCategoryIds.forEach((categoryId) => {
      const aliases = categoryAliasesById.get(categoryId);
      if (aliases) {
        aliases.forEach((alias) => keys.add(alias));
      } else {
        addCategoryAlias(keys, categoryId);
      }
    });

    return keys;
  }, [categoryAliasesById, currentCategoryIds]);

  const currentProducts = useMemo(
    () => (
      currentParentId
        ? storefrontProducts.filter((product) => {
          const productCategoryKeys = getProductCategoryKeys(product);
          return Array.from(productCategoryKeys).some((key) => currentCategoryProductKeys.has(key));
        })
        : []
    ),
    [currentCategoryProductKeys, currentParentId, storefrontProducts]
  );

  const homepageProducts = useMemo(() => {
    const rootCategories = storefrontCategories.filter((category) => {
      const parentId = getParentId(category);
      return parentId === null;
    });
    const pickedIds = new Set();

    const pickFromCategory = (category, limit) => {
      if (!category) return [];
      const categoryIds = new Set([category.id]);
      const queue = [category.id];
      const selected = [];

      while (queue.length > 0) {
        const categoryId = queue.shift();
        (childrenMap.get(categoryId) || []).forEach((child) => {
          if (child?.id && !categoryIds.has(child.id)) {
            categoryIds.add(child.id);
            queue.push(child.id);
          }
        });
      }

      const categoryKeys = new Set();
      categoryIds.forEach((categoryId) => {
        addCategoryAlias(categoryKeys, categoryId);
        const aliases = categoryAliasesById.get(categoryId);
        if (aliases) {
          aliases.forEach((alias) => categoryKeys.add(alias));
        }
      });

      for (const product of storefrontProducts) {
        if (selected.length >= limit) break;
        const productCategoryKeys = getProductCategoryKeys(product);
        const matchesCategory = Array.from(productCategoryKeys).some((key) => categoryKeys.has(key));
        if (!matchesCategory) continue;
        if (pickedIds.has(product.id)) continue;
        pickedIds.add(product.id);
        selected.push(product);
      }

      return selected;
    };

    return [
      ...pickFromCategory(rootCategories[0], 4),
      ...pickFromCategory(rootCategories[1], 4),
    ];
  }, [categoryAliasesById, childrenMap, getParentId, storefrontCategories, storefrontProducts]);

  const showInitialLoading = (isRealProvider ? isPublicCatalogLoading : isLoading)
    && storefrontProducts.length === 0
    && storefrontCategories.length === 0;
  const isInsideCategory = Boolean(currentParentId);
  const shouldMergeProductsWithSubcategories =
    isInsideCategory && currentCategories.length > 0;

  const selectedCategoryExists = useMemo(
    () => !currentParentId || storefrontCategories.some((category) => category.id === currentParentId),
    [currentParentId, storefrontCategories]
  );

  useEffect(() => {
    if (selectedCategoryExists) return;
    setCurrentParentId(null);
  }, [selectedCategoryExists]);

  const handleCategorySelect = useCallback((categoryId) => {
    setCurrentParentId(categoryId || null);
  }, []);

  const handleProductSelect = useCallback((product) => {
    if (!product) return;
    setSelectedProduct(product);
  }, []);

  const closePurchaseDialog = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const resetToCatalogs = useCallback(() => {
    setCurrentParentId(null);
  }, []);

  const navigateBreadcrumb = useCallback((categoryId) => {
    setCurrentParentId(categoryId || null);
  }, []);

  const handleLogin = useCallback(() => {
    navigate('/auth?mode=login');
  }, [navigate]);

  const handleCreateAccount = useCallback(() => {
    navigate('/auth?mode=signup');
  }, [navigate]);

  const handleGoogleLogin = useCallback(() => {
    Promise.resolve(loginWithGoogle());
  }, [loginWithGoogle]);

  const handleAbout = useCallback(() => {
    navigate('/about-us');
  }, [navigate]);

  const handleContact = useCallback(() => {
    navigate('/public-contact-us');
  }, [navigate]);

  const handleHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen pb-5 pt-[4.75rem]">
      {typeof document !== 'undefined' && createPortal(
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[90]">
        <div className="w-full">
          <div dir="ltr" className="public-full-header ka-card-panel pointer-events-auto grid min-h-[2.95rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-[20px] border px-2.5 py-1 sm:min-h-[3.25rem] sm:gap-5 sm:rounded-[28px] sm:px-5 sm:py-1.5">
            <div className="col-start-1 row-start-1 flex items-center gap-1 justify-self-start sm:gap-2">
              <ThemeToggle variant="glass" compact className="h-9 w-9 sm:h-10 sm:w-10" />
            </div>

            <div className="col-start-2 row-start-1 justify-self-center">
              <HeaderBrand className="justify-center" iconClassName="h-14 w-24 scale-100 sm:h-16 sm:w-28" />
            </div>

            <div className="col-start-3 row-start-1 flex items-center gap-1.5 justify-self-end sm:gap-2">
              <button
                type="button"
                onClick={handleLogin}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-200/20 bg-[linear-gradient(180deg,rgb(124_58_237/0.22),rgb(3_8_22/0.78))] text-cyan-50 shadow-[inset_0_0_18px_rgb(255_255_255/0.035),0_0_26px_-18px_rgb(124_58_237/0.9)] transition-all hover:-translate-y-0.5 hover:border-amber-200/30 hover:text-amber-100 sm:h-10 sm:w-10"
                aria-label={isArabic ? 'تسجيل الدخول' : 'Login'}
              >
                <UserRound className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </button>

              <button
                type="button"
                onClick={() => setIsMenuOpen((previous) => !previous)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:rgb(var(--color-border-rgb)/0.84)] bg-[linear-gradient(180deg,rgb(3_8_22/0.9),rgb(2_6_19/0.78))] text-[var(--color-text)] shadow-[inset_0_0_18px_rgb(255_255_255/0.035),0_0_26px_-18px_rgb(34_211_238/0.9)] transition-all hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.38)] hover:text-[var(--color-primary)] sm:h-10 sm:w-10"
                aria-label={isArabic ? 'القائمة' : 'Menu'}
              >
                <Menu className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>,
      document.body
      )}

      <PublicSidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onHome={handleHome}
        onAbout={handleAbout}
        onContact={handleContact}
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccount}
        onGoogleLogin={handleGoogleLogin}
        isBusy={false}
        isArabic={isArabic}
      />

      {typeof document !== 'undefined' && createPortal(
        <>
      {showServiceNotice && (
        <div className="public-notice-overlay km-notice-overlay">
          <div className="km-notice" dir={isArabic ? 'rtl' : 'ltr'} role="dialog" aria-modal="true" aria-labelledby="service-notice-title">
            <div className="km-notice__flag" aria-hidden="true" />
            <button type="button" onClick={handleCloseServiceNotice} className="km-notice__close" aria-label={isArabic ? 'إغلاق التنويه' : 'Close notice'}>
              <X size={19} />
            </button>
            <div className="km-notice__header">
              <img src={platformBrand.logoUrl} alt={platformBrand.platformName} className="km-notice__logo" />
              <h2 id="service-notice-title">{isArabic ? 'تنبيه قبل الدفع' : 'Before you pay'}</h2>
            </div>
            <div className="km-notice__content">
              <div className="km-notice__row">
                <span className="km-notice__icon"><CircleAlert size={20} /></span>
                <p>{isArabic ? 'المنتجات الرقمية لا تُسترد بعد تأكيد التحويل.' : 'Digital products cannot be refunded after the transfer is confirmed.'}</p>
              </div>
              <div className="km-notice__row">
                <span className="km-notice__icon"><Info size={20} /></span>
                <p>{isArabic ? 'راجع تفاصيل طلبك جيدًا قبل الدفع.' : 'Please check your order details carefully before paying.'}</p>
              </div>
            </div>
            <button type="button" onClick={handleCloseServiceNotice} className="km-notice__primary">
              {isArabic ? 'متابعة' : 'Continue'} <Check size={17} />
            </button>
          </div>
        </div>
      )}

      {showWhatsAppNotice && (
        <div className="public-notice-overlay km-notice-overlay">
          <div className="km-notice" dir={isArabic ? 'rtl' : 'ltr'} role="dialog" aria-modal="true" aria-labelledby="whatsapp-notice-title">
            <div className="km-notice__flag" aria-hidden="true" />
            <button type="button" onClick={handleCloseWhatsAppNotice} className="km-notice__close" aria-label={isArabic ? 'إغلاق التنويه' : 'Close notice'}>
              <X size={19} />
            </button>
            <div className="km-notice__header">
              <img src={platformBrand.logoUrl} alt={platformBrand.platformName} className="km-notice__logo" />
              <h2 id="whatsapp-notice-title">{isArabic ? 'قناة واتساب الرسمية' : 'Official WhatsApp channel'}</h2>
            </div>
            <div className="km-notice__content">
              <div className="km-notice__row">
                <span className="km-notice__icon"><MessageCircle size={20} /></span>
                <p>{isArabic ? 'عدم متابعتك لقناة واتساب مسؤوليتك الشخصية.' : 'Following the WhatsApp channel is your responsibility.'}</p>
              </div>
              <div className="km-notice__row">
                <span className="km-notice__icon"><Info size={20} /></span>
                <p>{isArabic ? 'أي إهمال في المتابعة يعرضك للمخاطر دون أي مسؤولية علينا.' : 'Failure to follow updates may involve risks for which we are not responsible.'}</p>
              </div>
            </div>
            <a href={WHATSAPP_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="km-notice__primary">
              <MessageCircle size={17} /> {isArabic ? 'تابع قناة واتساب' : 'Follow the WhatsApp channel'} <ExternalLink size={15} />
            </a>
            <button type="button" onClick={handleCloseWhatsAppNotice} className="km-notice__secondary">
              {isArabic ? 'متابعة للموقع' : 'Continue to site'}
            </button>
          </div>
        </div>
      )}
        </>,
        document.body
      )}

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-[var(--shell-max-width)] space-y-5 sm:space-y-6">
          <section aria-label={isArabic ? 'العروض الرئيسية' : 'Featured offers'}>
            <HeroSlider slides={heroSlides} />
          </section>

          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-xl font-black text-[var(--color-text)] sm:text-2xl">
              {getSearchSiteName(platformBrand.platformName)}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {storefrontDescription[language]}
            </p>
          </div>

          <section id="categories" className="scroll-mt-28 space-y-3 sm:space-y-3.5">
            <div className="relative z-10 mx-auto flex w-full max-w-5xl justify-center px-0.5 sm:px-2">
              <ProductSearchBar
                products={storefrontProducts}
                language={language}
                onSelectProduct={handleProductSelect}
                forceIconRight
                placeholder={copy.searchPlaceholder}
                noResultsLabel={copy.noResults}
                className="mx-auto w-full"
                inputClassName="h-12 rounded-full"
              />
            </div>

            {showInitialLoading && (
              <LoadingSkeleton variant="catalogs" />
            )}

            {!showInitialLoading && isInsideCategory && (
              <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-1 text-sm">
                <button
                  type="button"
                  onClick={resetToCatalogs}
                  className="font-medium text-[var(--color-primary)] hover:underline"
                >
                  {copy.home}
                </button>
                {breadcrumbTrail.map((category) => (
                  <span key={category.id} className="flex items-center gap-1">
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                    <button
                      type="button"
                      onClick={() => navigateBreadcrumb(category.id)}
                      className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)] hover:underline"
                    >
                      {category.title}
                    </button>
                  </span>
                ))}
              </nav>
            )}

            {!showInitialLoading && (
              <>
                {!isInsideCategory && currentCategories.length > 0 && (
                  <div className="theme-store-categories relative z-0 grid grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-3 xl:grid-cols-4">
                    {currentCategories.map((category, index) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        active={false}
                        index={index}
                        onSelect={handleCategorySelect}
                      />
                    ))}
                  </div>
                )}

                {shouldMergeProductsWithSubcategories && (
                  <div className="theme-store-products grid grid-cols-3 gap-3 p-1 sm:gap-4">
                    {currentCategories.map((category, index) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        active={false}
                        index={index}
                        onSelect={handleCategorySelect}
                        variant="plain"
                      />
                    ))}
                    {currentProducts.map((product) => (
                      <ProductCardSimple
                        key={product.id}
                        product={product}
                        onOpen={handleProductSelect}
                        buyLabel={copy.loginToBuy}
                        unavailableLabel={copy.unavailable}
                      />
                    ))}
                  </div>
                )}

                {isInsideCategory && currentProducts.length > 0 && !shouldMergeProductsWithSubcategories && (
                  <div className="theme-store-products grid grid-cols-3 gap-3 p-1 sm:gap-4">
                    {currentProducts.map((product) => (
                      <ProductCardSimple
                        key={product.id}
                        product={product}
                        onOpen={handleProductSelect}
                        buyLabel={copy.loginToBuy}
                        unavailableLabel={copy.unavailable}
                      />
                    ))}
                  </div>
                )}

                {isInsideCategory && currentCategories.length === 0 && currentProducts.length === 0 && (
                  <EmptyState
                    icon={Layers3}
                    title={copy.emptyCategoryTitle}
                    description={copy.emptyCategoryDescription}
                    actionLabel={copy.backToCatalogs}
                    onAction={resetToCatalogs}
                  />
                )}

                {!isInsideCategory && currentCategories.length === 0 && (
                  <EmptyState
                    icon={Search}
                    title={copy.emptyCatalogsTitle}
                    description={copy.emptyCatalogsDescription}
                  />
                )}
              </>
            )}
          </section>

          {!isInsideCategory && (
            <div className="mx-auto w-full max-w-5xl px-0.5 sm:px-2">
              <button
                type="button"
                onClick={handleLogin}
                className="group mx-auto block w-[21rem] max-w-full overflow-hidden rounded-[1rem] border border-[color:rgb(var(--color-primary-rgb)/0.28)] bg-[color:rgb(var(--color-card-rgb)/0.76)] text-start shadow-[0_18px_42px_-30px_rgb(var(--color-primary-rgb)/0.82),inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:rgb(var(--color-primary-rgb)/0.46)] hover:shadow-[0_22px_48px_-30px_rgb(var(--color-primary-rgb)/0.9)] sm:w-[26rem]"
                aria-label={copy.targetTitle}
              >
                <span className="block overflow-hidden bg-black">
                  <img
                    src={targetSalesImage}
                    alt={copy.targetTitle}
                    className="block aspect-[2048/800] w-full object-cover transition-transform duration-500 group-hover:scale-[1.012]"
                    loading="lazy"
                    decoding="async"
                  />
                </span>
                <span className="block border-t border-[color:rgb(var(--color-primary-rgb)/0.18)] bg-[linear-gradient(180deg,rgb(var(--color-card-rgb)/0.94),rgb(var(--color-primary-rgb)/0.08))] px-3 py-1.5 text-center">
                  <span className="text-xs font-extrabold text-[var(--color-text)] sm:text-sm">
                    {copy.targetTitle}
                  </span>
                </span>
              </button>
            </div>
          )}

          {!isInsideCategory && homepageProducts.length ? (
            <BestSellingSection
              id="public-best-selling-title"
              title={copy.topSellingTitle}
              viewAllLabel={copy.viewAll}
              products={homepageProducts}
              categories={storefrontCategories}
              language={language}
              onViewAll={handleLogin}
              onProductSelect={handleProductSelect}
            />
          ) : null}
        </div>
      </main>

      <ProductPurchaseDialog
        isOpen={Boolean(selectedProduct)}
        productId={selectedProduct?.id}
        initialProduct={selectedProduct}
        onClose={closePurchaseDialog}
        pricingPreviewUser={publicPricingUser}
        requireAuth
        onRequireAuth={handleLogin}
      />

      <div className="mb-3 text-center">
        <Link to="/about-us" className="text-sm text-[var(--color-text-secondary)] underline underline-offset-4">
          {isArabic ? 'من نحن' : 'About us'}
        </Link>
      </div>
      <SiteCopyrightFooter isArabic={isArabic} showSocialLinks />
    </div>
  );
};

export default PublicCatalog;
