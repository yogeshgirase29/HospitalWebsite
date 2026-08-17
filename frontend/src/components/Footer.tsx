import React, { useState } from 'react';
import { Stethoscope, ArrowRight, CheckCircle2 } from 'lucide-react';
import { type Language, translations } from '../utils/translations';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const Facebook = ({ size, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || "1em"} height={size || "1em"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

const Twitter = ({ size, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || "1em"} height={size || "1em"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);

const Linkedin = ({ size, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || "1em"} height={size || "1em"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

const Instagram = ({ size, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || "1em"} height={size || "1em"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const t = translations[language];

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  const handleLinkClick = (href: string) => {
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

  return (
    <footer style={{
      background: 'var(--primary)',
      color: 'rgba(255,255,255,0.7)',
      padding: '80px 0 30px 0',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      fontSize: '0.9rem'
    }}>
      <div className="container">
        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr 0.8fr 1.2fr',
          gap: '40px',
          marginBottom: '50px'
        }} className="footer-grid">
          
          {/* Col 1: Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <a 
              href="#home" 
              onClick={(e) => { e.preventDefault(); handleLinkClick('#home'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--white)', fontWeight: 800, fontSize: '1.25rem' }}
            >
              <div style={{
                background: 'var(--gradient-primary)',
                color: 'white',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex'
              }}>
                <Stethoscope size={20} />
              </div>
              <span style={{ letterSpacing: '-0.5px', display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800 }} className="logo-text-main">
                  {t.hospitalName.split(' | ')[0] || ''}
                </span>
                <span style={{ color: 'var(--cyan)', fontWeight: 600, fontSize: '0.8rem', marginTop: '2px' }} className="logo-text-sub">
                  {t.hospitalName.split(' | ')[1] || ''}
                </span>
              </span>
            </a>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              {t.footerBio}
            </p>
            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="#" style={{ color: 'rgba(255,255,255,0.6)', transition: 'color 0.2s' }} className="footer-social-link"><Facebook size={18} /></a>
              <a href="#" style={{ color: 'rgba(255,255,255,0.6)', transition: 'color 0.2s' }} className="footer-social-link"><Twitter size={18} /></a>
              <a href="#" style={{ color: 'rgba(255,255,255,0.6)', transition: 'color 0.2s' }} className="footer-social-link"><Linkedin size={18} /></a>
              <a href="#" style={{ color: 'rgba(255,255,255,0.6)', transition: 'color 0.2s' }} className="footer-social-link"><Instagram size={18} /></a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ color: 'var(--white)', fontSize: '1.05rem', fontWeight: 700 }}>{t.navWhyUs}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a href="#home" onClick={(e) => { e.preventDefault(); handleLinkClick('#home'); }} className="footer-link">{t.navHome}</a>
              <a href="#services" onClick={(e) => { e.preventDefault(); handleLinkClick('#services'); }} className="footer-link">{t.navServices}</a>
              <a href="#why-us" onClick={(e) => { e.preventDefault(); handleLinkClick('#why-us'); }} className="footer-link">{t.navWhyUs}</a>
              <a href="#workflow" onClick={(e) => { e.preventDefault(); handleLinkClick('#workflow'); }} className="footer-link">{t.navWorkflow}</a>
              <a href="#doctors" onClick={(e) => { e.preventDefault(); handleLinkClick('#doctors'); }} className="footer-link">{t.navDoctors}</a>
              <div style={{ height: '4px' }} />
              <h5 style={{ color: 'var(--white)', fontSize: '0.82rem', fontWeight: 700, margin: '6px 0 0 0' }}>Portals</h5>
              <a href="/employee/login" className="footer-link">{language === 'en' ? 'Employee Login' : 'कर्मचारी लॉगिन'}</a>
              <a href="/compounder/login" className="footer-link">{language === 'en' ? 'Compounder Login' : 'कंपाउंडर लॉगिन'}</a>
              <a href="/admin/login" className="footer-link">{language === 'en' ? 'Admin Portal' : 'प्रशासक लॉगिन'}</a>
            </div>
          </div>

          {/* Col 3: Services */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ color: 'var(--white)', fontSize: '1.05rem', fontWeight: 700 }}>{t.navServices}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a href="#services" onClick={(e) => { e.preventDefault(); handleLinkClick('#services'); }} className="footer-link">{t.servicePathologyTitle}</a>
              <a href="#services" onClick={(e) => { e.preventDefault(); handleLinkClick('#services'); }} className="footer-link">{t.serviceRadiologyTitle}</a>
              <a href="#services" onClick={(e) => { e.preventDefault(); handleLinkClick('#services'); }} className="footer-link">{t.servicePedsTitle}</a>
              <a href="#services" onClick={(e) => { e.preventDefault(); handleLinkClick('#services'); }} className="footer-link">{t.serviceOpdTitle}</a>
              <a href="#services" onClick={(e) => { e.preventDefault(); handleLinkClick('#services'); }} className="footer-link">{t.servicePmjayTitle}</a>
            </div>
          </div>

          {/* Col 4: Newsletter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ color: 'var(--white)', fontSize: '1.05rem', fontWeight: 700 }}>{t.footerNewsletter}</h4>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              {t.footerNewsletterDesc}
            </p>
            {!subscribed ? (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', position: 'relative' }}>
                <input 
                  type="email" 
                  required 
                  placeholder={t.footerNewsletterPlaceholder} 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '0.88rem'
                  }}
                  className="footer-email-input"
                />
                <button 
                  type="submit" 
                  style={{
                    position: 'absolute',
                    right: '4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowRight size={14} />
                </button>
              </form>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--cyan)',
                background: 'rgba(6, 182, 212, 0.08)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                fontSize: '0.85rem'
              }}>
                <CheckCircle2 size={16} />
                <span>{t.footerNewsletterSuccess}</span>
              </div>
            )}
          </div>

        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '30px 0' }} />

        {/* Copyright */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          color: 'rgba(255,255,255,0.45)',
          fontSize: '0.8rem'
        }} className="footer-bottom">
          <div>
            © {new Date().getFullYear()} {t.footerRights}
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#" className="footer-sublink">Privacy Policy</a>
            <a href="#" className="footer-sublink">Terms of Service</a>
            <a href="#" className="footer-sublink">Sitemap</a>
          </div>
        </div>
      </div>

      <style>{`
        .footer-link {
          color: rgba(255, 255, 255, 0.6) !important;
          transition: color 0.2s, transform 0.2s;
        }
        .footer-link:hover {
          color: var(--cyan) !important;
          transform: translateX(4px);
        }
        .footer-social-link:hover {
          color: var(--cyan) !important;
        }
        .footer-sublink {
          color: rgba(255,255,255,0.45) !important;
        }
        .footer-sublink:hover {
          color: var(--white) !important;
        }
        .footer-email-input::placeholder {
          color: rgba(255,255,255,0.4);
        }
        .footer-email-input:focus {
          border-color: var(--cyan) !important;
          outline: none;
        }
        @media (max-width: 991px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 576px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .footer-bottom {
            flex-direction: column;
            text-align: center;
            justify-content: center !important;
          }
        }
      `}</style>
    </footer>
  );
};
