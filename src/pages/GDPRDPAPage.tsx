/**
 * ============================================================================
 * GDPR DATA PROCESSING ADDENDUM PAGE
 * ============================================================================
 * 
 * Publicly accessible page displaying MailWizard's GDPR Data Processing Addendum.
 * Uses structured content from gdprDPAContent.ts for easy updates.
 * 
 * DESIGN:
 * - Matches marketing site design with Header and Footer
 * - DM Serif Display for headings, DM Sans for body text
 * - Gold accents, black text on white background
 * - Responsive layout with proper spacing and readability
 * 
 * ============================================================================
 */

import { Header } from '../components/marketing/Header';
import { Footer } from '../components/marketing/Footer';
import { gdprDPAContent } from '../data/gdprDPAContent';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GDPRDPAPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Main Content */}
      <main className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Navigation */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gold transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          {/* Page Title */}
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-black mb-4">
            GDPR Data Processing Addendum
          </h1>

          {/* Last Updated */}
          <p className="text-sm text-gray-600 italic mb-8">
            Last updated: {gdprDPAContent.lastUpdated}
          </p>

          {/* Content Sections */}
          <div className="space-y-8">
            {gdprDPAContent.sections.map((section, index) => (
              <section key={index} className="prose prose-lg max-w-none">
                <h2 className="text-2xl font-serif font-bold text-black mt-8 mb-4">
                  {section.title}
                </h2>
                
                <div className="space-y-4">
                  {section.content.map((paragraph, pIndex) => {
                    // Handle empty paragraphs for spacing
                    if (paragraph.trim() === '') {
                      return <div key={pIndex} className="h-2" />;
                    }
                    
                    // Render paragraph with proper styling
                    return (
                      <p 
                        key={pIndex} 
                        className="text-base font-sans text-gray-800 leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 pt-8 border-t-2 border-gray-200">
            <p className="text-base font-sans text-gray-800">
              Have questions about data processing?{' '}
              <a 
                href="mailto:info@mailwizard.io" 
                className="text-gold hover:text-yellow-600 font-semibold transition-colors"
              >
                Contact us
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
