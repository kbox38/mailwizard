import { Header } from '../components/marketing/Header';
import { Hero } from '../components/marketing/Hero';
import { Features } from '../components/marketing/Features';
import { Callout } from '../components/marketing/Callout';
import { Pricing } from '../components/marketing/Pricing';
import { Footer } from '../components/marketing/Footer';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <Callout />
      <Pricing />
      <Footer />
    </div>
  );
};