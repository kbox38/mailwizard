/**
 * ============================================================================
 * FOOTER COMPONENT - Updated with Single Image Logo
 * ============================================================================
 * 
 * Marketing site footer with simplified navigation and legal links.
 * Now uses the updated Logo component with white variant for dark background.
 * 
 * SECTIONS:
 * - Brand with single image logo and social media
 * - Product links (Features, Pricing)
 * - Legal links (Privacy, Terms, Acceptable Use, GDPR DPA)
 * 
 * ============================================================================
 */

import { Twitter, Linkedin, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
  ],
  legal: [
    { label: 'Privacy Policy', to: '/privacy-policy', isInternal: true },
    { label: 'Terms of Service', to: '/terms-of-service', isInternal: true },
    { label: 'Acceptable Use Policy', to: '/acceptable-use-policy', isInternal: true },
    { label: 'GDPR DPA', to: '/gdpr-dpa', isInternal: true },
  ],
};

export const Footer = () => {
  return (
    <footer className="bg-purple text-white">
      <div className="border-b border-gold/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Brand and Social */}
            <div className="col-span-1">
              {/* Logo - White variant for dark background */}
              <div className="mb-6">
                <Logo size="md" variant="white" />
              </div>
              
              <p className="text-sm opacity-80 mb-6">
                The marketing and automations platform designed to grow your business.
              </p>
              
              <div className="flex gap-4">
                <a
                  href="#twitter"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold hover:text-black transition-all duration-250"
                  aria-label="Twitter"
                >
                  <Twitter size={18} />
                </a>
                <a
                  href="#linkedin"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold hover:text-black transition-all duration-250"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={18} />
                </a>
                <a
                  href="#github"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-gold hover:text-black transition-all duration-250"
                  aria-label="GitHub"
                >
                  <Github size={18} />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm opacity-80 hover:opacity-100 hover:text-gold transition-all duration-250"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    {link.isInternal && link.to ? (
                      <Link
                        to={link.to}
                        className="text-sm opacity-80 hover:opacity-100 hover:text-gold transition-all duration-250"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm opacity-80 hover:opacity-100 hover:text-gold transition-all duration-250"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-80">
          <p>&copy; 2025 Email Wizard. All rights reserved.</p>
          <p>Made with care for email marketers everywhere.</p>
        </div>
      </div>
    </footer>
  );
};