import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
  currentPath?: string;
}

export const AppLayout = ({ children, currentPath }: AppLayoutProps) => {
  const location = useLocation();
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPath={currentPath || location.pathname} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};
