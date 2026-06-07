import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { disconnectSocket } from '../services/socket';
import { api } from '../services/api';
import { BookOpen, MessageSquare, User as UserIcon, LogOut, Download, ClipboardList } from 'lucide-react';
import { Button } from './Button';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth, isAuthenticated } = useAuthStore();
  const { addToast } = useUIStore();

  // PWA installation prompt hook
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      addToast('Thank you for installing SchoolSwap!', 'success');
      setDeferredPrompt(null);
    }
  };

  const handleLogout = async () => {
    try {
      if (user?.id) {
        disconnectSocket(user.id);
      }
      await api.post('/auth/logout');
      clearAuth();
      addToast('Logged out successfully', 'success');
      navigate('/');
    } catch (err: any) {
      clearAuth(); // Clear anyways
      navigate('/');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm px-4 md:px-8 py-3.5 flex items-center justify-between">
      <Link to={isAuthenticated ? '/feed' : '/'} className="flex items-center gap-2">
        <div className="bg-primary-600 p-2 rounded-lg text-white shadow-md">
          <BookOpen size={20} className="stroke-[2.5]" />
        </div>
        <span className="font-extrabold text-lg tracking-tight text-slate-800">
          School<span className="text-primary-600 font-black">Swap</span>
        </span>
      </Link>

      <div className="flex items-center gap-1.5 md:gap-4">
        {deferredPrompt && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleInstallClick}
            className="flex items-center gap-1 bg-primary-50 text-primary-600 border-primary-200 hover:bg-primary-100 rounded-full"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Install App</span>
          </Button>
        )}

        {isAuthenticated ? (
          <>
            <Link
              to="/feed"
              className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold
                ${isActive('/feed') 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <BookOpen size={18} />
              <span className="hidden md:inline">Feed</span>
            </Link>

            <Link
              to="/checklist"
              className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold
                ${isActive('/checklist') 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <ClipboardList size={18} />
              <span className="hidden md:inline">Checklist</span>
            </Link>

            <Link
              to="/chats"
              className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold
                ${isActive('/chats') 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <MessageSquare size={18} />
              <span className="hidden md:inline">Chats</span>
            </Link>

            <Link
              to="/profile"
              className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold
                ${isActive('/profile') 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <UserIcon size={18} />
              <span className="hidden md:inline">{user?.displayName || 'Profile'}</span>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg touch-target"
            >
              <LogOut size={18} />
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button size="sm" variant="primary" className="rounded-full px-5">
                Login / Register
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
