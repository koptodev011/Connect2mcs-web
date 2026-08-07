'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { C, F } from '@/lib/tokens';
import Icon from './Icon';
import { useMobileMenu } from './MobileMenuContext';

export const navGroups = [
  {
    label: 'Explore',
    links: [
      { href: '/mandals',    label: 'Mandals',    icon: 'map'    as const },
      { href: '/community',  label: 'Community',  icon: 'people' as const },
      { href: '/events',     label: 'Events',     icon: 'cal'    as const },
      { href: '/culture',    label: 'Culture',    icon: 'lamp'   as const },
      { href: '/aarti',      label: 'Aarti',      icon: 'lamp'   as const },
    ]
  },
  {
    label: 'Services',
    links: [
      { href: '/embassy',    label: 'Embassy',    icon: 'verify' as const },
      { href: '/housing',    label: 'Housing',    icon: 'home2'  as const },
      { href: '/maids',      label: 'Maid Services', icon: 'people' as const },
      { href: '/tiffin',     label: 'Tiffin',     icon: 'tiffin' as const },
      { href: '/taxi',       label: 'NRI Taxi',   icon: 'car'    as const },
    ]
  },
  {
    label: 'Career & Growth',
    links: [
      { href: '/jobs',       label: 'Jobs',       icon: 'work'   as const },
      { href: '/learn',      label: 'Learn',      icon: 'grad'   as const },
      { href: '/mentorship', label: 'Mentorship', icon: 'spark'  as const },
    ]
  },
  {
    label: 'Business',
    links: [
      { href: '/marketplace',label: 'Buy & Sell', icon: 'cart'   as const },
      { href: '/businesses', label: 'Businesses', icon: 'bag'    as const },
      { href: '/offers',     label: 'MCS Offers', icon: 'fire'   as const },
      { href: '/rates',      label: 'Rates',      icon: 'money'  as const },
    ]
  },
  {
    label: 'News',
    links: [
      { href: '/news',       label: 'News',       icon: 'news'   as const },
      { href: '/newspaper',  label: 'Newspaper',  icon: 'news'   as const },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useMobileMenu();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="desktop-hide" 
          onClick={() => setIsOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 99, backdropFilter: 'blur(2px)' }}
        />
      )}
      
      <aside className={isOpen ? 'mob-sidebar-open' : 'mob-sidebar-closed'} style={{
        width: 260,
        background: '#FFFFFF',
        borderRight: `1px solid ${C.line}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0,
      }}>
      {/* Logo Area */}
      <div style={{
        padding: '17px 24px',
        borderBottom: `1px solid ${C.line}`,
        height: 72,
        flexShrink: 0,
        boxSizing: 'border-box'
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 38, height: 38, background: C.saffron, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 10, fontFamily: F.deva, fontSize: 22, lineHeight: 1, paddingTop: 3,
            boxShadow: '0 2px 6px rgba(226,106,31,0.3)',
            flexShrink: 0
          }}>म</div>
          <div style={{ lineHeight: 1.05 }}>
            <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: C.ink, letterSpacing: '-0.025em' }}>Connect2MCS</div>
            <div style={{ fontSize: 10, color: C.ink3, fontWeight: 600, letterSpacing: '0.04em', marginTop: 1 }}>MARATHI DIASPORA</div>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href="/" onClick={() => setIsOpen(false)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 8, textDecoration: 'none',
            color: pathname === '/' ? C.saffronDk : C.ink2,
            background: pathname === '/' ? C.saffronLt : 'transparent',
            fontSize: 14.5, fontWeight: pathname === '/' ? 700 : 500, fontFamily: F.ui,
            transition: 'all 0.15s ease',
          }}>
            <Icon name="home2" size={18} color={pathname === '/' ? C.saffronDk : C.ink3} />
            Home
          </Link>
        </div>

        {navGroups.map((group, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ 
              fontSize: 11, fontWeight: 700, color: C.ink3, 
              textTransform: 'uppercase', letterSpacing: '0.08em', 
              paddingLeft: 14, marginBottom: 4 
            }}>
              {group.label}
            </div>
            {group.links.map(link => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 14px', borderRadius: 8, textDecoration: 'none',
                  color: isActive ? C.saffronDk : C.ink2,
                  background: isActive ? C.saffronLt : 'transparent',
                  fontSize: 14.5, fontWeight: isActive ? 700 : 500, fontFamily: F.ui,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = C.bgDeep;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
                >
                  <Icon name={link.icon} size={18} color={isActive ? C.saffronDk : C.ink3} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Footer Area in Sidebar */}
      <div style={{
        padding: '16px 24px',
        borderTop: `1px solid ${C.line}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontSize: 12, color: C.ink3, fontWeight: 500
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="globe" size={14} color={C.ink3}/> EN 
          </span>
          <span style={{ color: C.line }}>|</span>
          <span style={{ fontFamily: F.deva }}>मराठी</span>
        </div>
        <Link href="/help" style={{ textDecoration: 'none', color: C.ink3, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="help" size={14} color={C.ink3}/> Help & Support
        </Link>
        </div>
      </aside>
    </>
  );
}
