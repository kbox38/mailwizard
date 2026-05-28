import { Globe } from 'lucide-react';
import { AppLayout } from '../../components/app/AppLayout';

export const LandingPages = () => {
  return (
    <AppLayout currentPath="/app/landing-pages">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Landing Pages</h1>
          <p className="text-gray-600">Create high-converting landing pages.</p>
        </div>
        <div className="text-center py-20">
          <Globe size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Landing page builder coming soon.</p>
        </div>
      </div>
    </AppLayout>
  );
};
