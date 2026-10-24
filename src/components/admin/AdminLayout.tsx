import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, BarChart3, Users, Activity, LogOut } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAdminAuth();

  const navigation = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: BarChart3 },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'System', path: '/admin/system', icon: Activity },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-50">
      <aside className="w-full md:w-64 md:shrink-0 bg-white border-r border-black flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="text-purple" size={24} />
            <span className="text-xl font-serif font-bold">Admin Portal</span>
          </div>
          <p className="text-sm text-gray-600">Mail Wizard</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-gold text-black shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-4 p-3 bg-purple/10 rounded-lg">
            <p className="text-sm font-semibold text-purple mb-1">{admin?.email}</p>
            <p className="text-xs text-gray-600">
              {admin?.adminRole.replace('_', ' ').toUpperCase()}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
};
