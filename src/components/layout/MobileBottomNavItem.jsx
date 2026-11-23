import React from 'react';
import { Check, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { preloadRoute } from '../../transitions/routeModules';

const MobileBottomNavItem = ({ item, pathname }) => {
  const { to, state, icon: Icon, label, matches } = item;
  const isActive = matches.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const warmRoute = () => { void preloadRoute(to); };

  return (
    <Link
      to={to}
      state={state}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      onPointerEnter={warmRoute}
      onTouchStart={warmRoute}
      onFocus={warmRoute}
      className="mobile-bottom-nav__item"
    >
      <Crown className="mobile-bottom-nav__crown" aria-hidden="true" />
      <span className="mobile-bottom-nav__item-icon" aria-hidden="true">
        <Icon size={18} />
        <span className="mobile-bottom-nav__check">
          <Check size={9} strokeWidth={3} />
        </span>
      </span>
      <span className="mobile-bottom-nav__item-label">{label}</span>
    </Link>
  );
};

export default MobileBottomNavItem;
