import { TrendingUp } from 'lucide-react';
import { Button } from '../ui/Button';

export const Callout = () => {
  return (
    <section className="py-20 bg-purple text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block p-3 bg-gold rounded-full mb-6">
            <TrendingUp size={32} className="text-black" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-serif font-bold mb-6">
            Grow faster with Email Wizard
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses using Email Wizard to build better relationships with their customers and grow their revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg">
              Get Started Free
            </Button>
            <Button variant="secondary" size="lg">
              Talk to Sales
            </Button>
          </div>
          <div className="mt-12 pt-8 border-t border-gold/20">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-serif font-bold text-gold mb-2">12B+</div>
                <div className="text-sm opacity-90">Emails sent monthly</div>
              </div>
              <div>
                <div className="text-4xl font-serif font-bold text-gold mb-2">98%</div>
                <div className="text-sm opacity-90">Delivery rate</div>
              </div>
              <div>
                <div className="text-4xl font-serif font-bold text-gold mb-2">24/7</div>
                <div className="text-sm opacity-90">Support available</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
