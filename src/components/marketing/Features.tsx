/**
 * ============================================================================
 * FEATURES COMPONENT
 * ============================================================================
 * 
 * Landing page features grid showcasing platform capabilities.
 * Reduced top padding to sit closer to the Hero section logo box.
 * 
 * ============================================================================
 */

import { Bot, BarChart3, Users, Zap, Palette, Globe } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'Marketing Automation',
    description: 'Create powerful automated journeys that send the right message at the right time.',
  },
  {
    icon: Palette,
    title: 'AI-Assisted Creation',
    description: 'Design beautiful emails with our drag-and-drop builder powered by intelligent suggestions.',
  },
  {
    icon: Users,
    title: 'Audience Segmentation',
    description: 'Target the right people with advanced segmentation based on behavior and engagement.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Track opens, clicks, and revenue with detailed reports and real-time insights.',
  },
  {
    icon: Zap,
    title: 'Easy Integration',
    description: 'Connect with your favorite tools and platforms through our powerful API.',
  },
  {
    icon: Globe,
    title: 'Custom Landing Pages',
    description: 'Build high-converting landing pages that match your brand perfectly.',
  },
];

export const Features = () => {
  return (
    <section id="features" className="pt-12 pb-20 sm:pt-16 sm:pb-32 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-serif font-bold mb-6">
            Everything you need to succeed
          </h2>
          <p className="text-xl text-gray-700">
            Powerful features that help you create, send, and optimize email campaigns that drive results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="card group hover:-translate-y-1 transition-all duration-250"
              >
                <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-250">
                  <Icon size={24} className="text-black" />
                </div>
                <h3 className="text-xl font-serif font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};