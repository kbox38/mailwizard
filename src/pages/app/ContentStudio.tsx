import { Image } from 'lucide-react';
import { AppLayout } from '../../components/app/AppLayout';

export const ContentStudio = () => {
  return (
    <AppLayout currentPath="/app/content">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Content Studio</h1>
          <p className="text-gray-600">Manage your media assets and content.</p>
        </div>
        <div className="text-center py-20">
          <Image size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Media library coming soon.</p>
        </div>
      </div>
    </AppLayout>
  );
};
