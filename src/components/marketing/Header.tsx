/**
 * ============================================================================
 * HEADER COMPONENT - Updated
 * ============================================================================
 * 
 * Marketing site header with navigation and auth buttons.
 * 
 * UPDATES:
 * - Removed "Resources" navigation link
 * - Now uses updated single-image Logo component
 * - Navigation links: Solutions, Features, Pricing
 * 
 * ============================================================================
 */

import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo 
            size="sm"
            onClick={() => navigate('/')}
          />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#solutions" className="text-sm font-medium hover:text-gold transition-colors">
              Solutions
            </a>
            <a href="#features" className="text-sm font-medium hover:text-gold transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-gold transition-colors">
              Pricing
            </a>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="tertiary" size="sm" onClick={() => navigate('/login')}>
              Log In
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-black bg-white animate-slide-down">
          <nav className="flex flex-col p-4 gap-4">
            <a href="#solutions" className="text-sm font-medium py-2 hover:text-gold transition-colors">
              Solutions
            </a>
            <a href="#features" className="text-sm font-medium py-2 hover:text-gold transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium py-2 hover:text-gold transition-colors">
              Pricing
            </a>
            <div className="flex flex-col gap-2 mt-4">
              <Button variant="secondary" size="sm" fullWidth onClick={() => navigate('/login')}>
                Log In
              </Button>
              <Button variant="primary" size="sm" fullWidth onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};