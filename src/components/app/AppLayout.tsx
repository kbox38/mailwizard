import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
  currentPath: string;
}

export const AppLayout = ({ children, currentPath }: AppLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPath={currentPath} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};
