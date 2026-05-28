/**
 * ============================================================================
 * Logo Component - Mail Wizard (Updated to Single Image)
 * ============================================================================
 * 
 * PURPOSE:
 * Displays Mail Wizard logo as a single combined image
 * 
 * SIZES:
 * - sm: 120px width (compact spaces, mobile)
 * - md: 160px width (standard navigation, sidebar)
 * - lg: 200px width (page headers, login pages)
 * - xl: 240px width (hero sections, landing page)
 * 
 * USAGE EXAMPLES:
 * 
 * // Header navigation
 * <Logo size="md" onClick={() => navigate('/')} />
 * 
 * // Login page header
 * <Logo size="lg" onClick={() => navigate('/')} />
 * 
 * // Footer (with white variant)
 * <Logo size="md" variant="white" />
 * 
 * ============================================================================
 */

import React from 'react';

// Import single combined logo
// Note: This should be the full "Email Wizard" logo as one image
// Path: public/logos/email-wizard-logo.png (or similar)
// For now, using placeholder path - update with actual logo path
const logoPath = '/logos/email-wizard-logo.png';
const logoWhitePath = '/logos/email-wizard-logo-white.png'; // For dark backgrounds

interface LogoProps {
  /** Size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Logo color variant */
  variant?: 'default' | 'white';
  /** Additional CSS classes */
  className?: string;
  /** Click handler (makes logo clickable) */
  onClick?: () => void;
}

/**
 * Size mapping - width in pixels
 * Height will scale automatically to maintain aspect ratio
 */
const sizeMap = {
  sm: 120,  // Compact: mobile, small spaces
  md: 160,  // Standard: navigation, sidebar
  lg: 200,  // Large: page headers, login
  xl: 240   // Extra large: hero sections
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
  onClick
}) => {
  const width = sizeMap[size];
  const isClickable = !!onClick;
  const imageSrc = variant === 'white' ? logoWhitePath : logoPath;

  // Base classes
  const baseClasses = `
    object-contain
    ${isClickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}
    ${className}
  `.trim();

  return (
    <img
      src={imageSrc}
      alt="Email Wizard"
      className={baseClasses}
      style={{ 
        width: `${width}px`, 
        height: 'auto'
      }}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    />
  );
};

/**
 * ============================================================================
 * RESPONSIVE USAGE PATTERNS
 * ============================================================================
 * 
 * Responsive sizing with Tailwind:
 * 
 * <Logo 
 *   size="md"
 *   className="w-32 md:w-40 lg:w-48"
 * />
 * 
 * Dark background usage (Footer):
 * 
 * <Logo 
 *   size="md"
 *   variant="white"
 * />
 * 
 * ============================================================================
 */