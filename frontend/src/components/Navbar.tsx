import React, { useState, useEffect } from 'react';
import { Stethoscope, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Language, translations } from '../utils/translations';


interface NavbarProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onOpenAppointment: () => void;
  onOpenStatus: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ language, setLanguage, onOpenAppointment, onOpenStatus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showPortals, setShowPortals] = useState(false);

  const t = translations[language];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t.navHome, href: '#home' },
    { name: t.navServices, href: '#services' },
    { name: t.navWhyUs, href: '#why-us' },
    { name: t.navWorkflow, href: '#departments' },
    { name: t.navDoctors, href: '#doctors' },
    { name: t.navGallery, href: '#gallery' },
    { name: t.navNews, href: '#news' },
    { name: t.navReviews, href: '#testimonials' },
    { name: t.navContact, href: '#contact' },
  ];

  const handleLinkClick = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const LanguageSelector = () => (
    <div style={{ 
      display: 'inline-flex', 
      border: '1px solid rgba(2, 132, 199, 0.18)', 
      borderRadius: '8px', 
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.5)',
      boxShadow: 'var(--shadow-sm)',
      padding: '2px',
      flexShrink: 0
    }}>
      <button 
        onClick={() => setLanguage('en')} 
        style={{ 
          padding: '4px 10px', 
          fontSize: '0.78rem', 
          border: 'none', 
          cursor: 'pointer', 
          borderRadius: '6px',
          background: language === 'en' ? 'var(--gradient-primary)' : 'transparent',
          color: language === 'en' ? 'white' : 'var(--text-secondary)',
          fontWeight: 700,
          transition: 'all var(--transition-fast)',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}
      >
        EN
      </button>
      <button 
        onClick={() => setLanguage('mr')} 
        style={{ 
          padding: '4px 10px', 
          fontSize: '0.78rem', 
          border: 'none', 
          cursor: 'pointer', 
          borderRadius: '6px',
          background: language === 'mr' ? 'var(--gradient-primary)' : 'transparent',
          color: language === 'mr' ? 'white' : 'var(--text-secondary)',
          fontWeight: 700,
          transition: 'all var(--transition-fast)',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}
      >
        मराठी
      </button>
    </div>
  );

  return (
    <>
      <nav 
        className={`glass-navbar`} 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 900,
          transition: 'all var(--transition-normal)',
          padding: scrolled ? '12px 0' : '20px 0',
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.88)' : 'rgba(255, 255, 255, 0.45)',
          borderBottom: scrolled ? '1px solid rgba(2, 132, 199, 0.08)' : '1px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo */}
          <a 
            href="#home" 
            onClick={(e) => { e.preventDefault(); handleLinkClick('#home'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.25rem' }}
          >
            <div style={{
              background: 'var(--gradient-primary)',
              color: 'white',
              padding: '6px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Stethoscope size={22} />
            </div>
            <span style={{ letterSpacing: '-0.5px', display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800 }} className="logo-text-main">
                {t.hospitalName.split(' | ')[0] || ''}
              </span>
              <span style={{ color: 'var(--med-blue)', fontWeight: 600, fontSize: '0.8rem', marginTop: '2px' }} className="logo-text-sub">
                {t.hospitalName.split(' | ')[1] || ''}
              </span>
            </span>
          </a>

          {/* Desktop Actions Wrapper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }} className="nav-actions-desktop">
            <div className="nav-links-container" style={{ display: 'flex', gap: '22px' }}>
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); handleLinkClick(link.href); }}
                  style={{
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    transition: 'var(--transition-fast)',
                    cursor: 'pointer'
                  }}
                  className="nav-link-item"
                >
                  {link.name}
                </a>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Language toggle */}
              <LanguageSelector />
              
              <button 
                onClick={onOpenStatus}
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                {language === 'en' ? 'Check Status' : 'अपॉइंटमेंट तपासा'}
              </button>
              
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setShowPortals(true)}
                onMouseLeave={() => setShowPortals(false)}
              >
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {language === 'en' ? 'Staff Portals' : 'स्टाफ लॉगिन'}
                </button>
                {showPortals && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '180px',
                    background: 'white',
                    border: '1px solid rgba(2, 132, 199, 0.15)',
                    borderRadius: '10px',
                    padding: '8px',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 1000
                  }}>
                    <a href="/employee/login" style={{ padding: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, borderRadius: '6px', transition: 'all 0.2s' }} className="portal-dropdown-item">
                      {language === 'en' ? 'Employee Portal' : 'कर्मचारी लॉगिन'}
                    </a>
                    <a href="/compounder/login" style={{ padding: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, borderRadius: '6px', transition: 'all 0.2s' }} className="portal-dropdown-item">
                      {language === 'en' ? 'Compounder Portal' : 'कंपाउंडर लॉगिन'}
                    </a>
                    <a href="/admin/login" style={{ padding: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, borderRadius: '6px', transition: 'all 0.2s' }} className="portal-dropdown-item">
                      {language === 'en' ? 'Admin Dashboard' : 'प्रशासक लॉगिन'}
                    </a>
                  </div>
                )}
              </div>

              <button 
                onClick={onOpenAppointment}
                className="btn btn-primary" 
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                {t.bookAppointment}
              </button>
            </div>
          </div>

          {/* Mobile actions & hamburger */}
          <div style={{ display: 'none', alignItems: 'center', gap: '10px' }} className="mobile-toggle-wrapper">
            <LanguageSelector />
            <button
              onClick={() => setIsOpen(!isOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                padding: '6px'
              }}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Global style injection for responsiveness of navbar */}
        <style>{`
          @media (max-width: 991px) {
            .nav-actions-desktop {
              display: none !important;
            }
            .mobile-toggle-wrapper {
              display: flex !important;
            }
          }
          @media (max-width: 480px) {
            .logo-text-main {
              font-size: 0.95rem !important;
            }
            .logo-text-sub {
              font-size: 0.72rem !important;
            }
          }
          .nav-link-item:hover {
            color: var(--med-blue) !important;
          }
          .portal-dropdown-item {
            display: block;
          }
          .portal-dropdown-item:hover {
            background: #f0f9ff;
            color: var(--med-blue) !important;
          }
        `}</style>
      </nav>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '72px',
              left: 0,
              width: '100%',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(16px)',
              zIndex: 899,
              boxShadow: 'var(--shadow-lg)',
              borderBottom: '1px solid var(--border-muted)',
              padding: '24px',
              maxHeight: 'calc(100vh - 80px)',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); handleLinkClick(link.href); }}
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    padding: '6px 0',
                    borderBottom: '1px solid #f1f5f9'
                  }}
                >
                  {link.name}
                </a>
              ))}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <button 
                  onClick={() => { setIsOpen(false); onOpenStatus(); }}
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '10px' }}
                >
                  {language === 'en' ? 'Check Status' : 'अपॉइंटमेंट तपासा'}
                </button>
                <button 
                  onClick={() => { setIsOpen(false); onOpenAppointment(); }}
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '10px' }}
                >
                  {t.bookAppointment}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', paddingLeft: '4px' }}>
                  {language === 'en' ? 'STAFF AREA' : 'स्टाफ लॉगिन'}
                </span>
                <a href="/employee/login" onClick={() => setIsOpen(false)} style={{ padding: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>
                  {language === 'en' ? 'Employee Portal' : 'कर्मचारी लॉगिन'}
                </a>
                <a href="/compounder/login" onClick={() => setIsOpen(false)} style={{ padding: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>
                  {language === 'en' ? 'Compounder Portal' : 'कंपाउंडर लॉगिन'}
                </a>
                <a href="/admin/login" onClick={() => setIsOpen(false)} style={{ padding: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>
                  {language === 'en' ? 'Admin Dashboard' : 'प्रशासक लॉगिन'}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
