/**
 * ============================================================================
 * ACCEPTABLE USE POLICY PAGE
 * ============================================================================
 * 
 * Publicly accessible page displaying MailWizard's acceptable use policy.
 * Uses structured content from acceptableUsePolicyContent.ts for easy updates.
 * Includes main policy sections and Appendix A (High-Risk Content).
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
import { acceptableUsePolicyContent } from '../data/acceptableUsePolicyContent';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AcceptableUsePolicyPage = () => {
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
            Acceptable Use Policy
          </h1>

          {/* Last Updated */}
          <p className="text-sm text-gray-600 italic mb-8">
            Last updated: {acceptableUsePolicyContent.lastUpdated}
          </p>

          {/* Main Policy Sections */}
          <div className="space-y-8">
            {acceptableUsePolicyContent.sections.map((section, index) => (
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

          {/* Appendix Section */}
          <div className="mt-12 pt-8 border-t-2 border-gray-200">
            <h2 className="text-3xl font-serif font-bold text-black mb-8">
              {acceptableUsePolicyContent.appendixTitle}
            </h2>

            <div className="space-y-8">
              {acceptableUsePolicyContent.appendixSections.map((section, index) => (
                <section key={index} className="prose prose-lg max-w-none">
                  <h3 className="text-xl font-sans font-semibold text-black mt-6 mb-3">
                    {section.title}
                  </h3>
                  
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
          </div>

          {/* Contact CTA */}
          <div className="mt-12 pt-8 border-t-2 border-gray-200">
            <p className="text-base font-sans text-gray-800">
              Have questions about this policy?{' '}
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
