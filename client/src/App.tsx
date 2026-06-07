import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { api } from './services/api';
import { connectSocket } from './services/socket';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Onboarding } from './pages/Onboarding';
import { Feed } from './pages/Feed';
import { CreateListing } from './pages/CreateListing';
import { ListingDetail } from './pages/ListingDetail';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { Checklist } from './pages/Checklist';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const queryClient = new QueryClient();

// Route Guard for authenticated users
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If user hasn't set up school community, redirect to onboarding page
  if (user && !user.schoolId && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

// Route Guard for guests/unauthenticated users
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { setAuth, clearAuth, isAuthenticated } = useAuthStore();
  const { toasts, removeToast } = useUIStore();
  const [initLoading, setInitLoading] = React.useState(true);

  // Auto-login session restore on mount
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.user) {
          // Retrieve current token (if rotated/active)
          const currentToken = useAuthStore.getState().accessToken;
          setAuth(currentToken || '', res.data.user);
          connectSocket(res.data.user.id);
        } else {
          clearAuth();
        }
      } catch (err) {
        // Clear auth state quietly (fails on no refresh cookie)
        clearAuth();
      } finally {
        setInitLoading(false);
      }
    };
    checkSession();
  }, [setAuth, clearAuth]);

  if (initLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        <span className="text-sm text-slate-400 font-medium tracking-wider">Restoring SchoolSwap Session...</span>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              {/* Guest only routes */}
              <Route 
                path="/" 
                element={
                  <GuestRoute>
                    <Landing />
                  </GuestRoute>
                } 
              />
              <Route 
                path="/auth" 
                element={
                  <GuestRoute>
                    <Auth />
                  </GuestRoute>
                } 
              />

              {/* Private routes */}
              <Route 
                path="/onboarding" 
                element={
                  <PrivateRoute>
                    <Onboarding />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/feed" 
                element={
                  <PrivateRoute>
                    <Feed />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/listings/new" 
                element={
                  <PrivateRoute>
                    <CreateListing />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/listings/:id" 
                element={
                  <PrivateRoute>
                    <ListingDetail />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/chats" 
                element={
                  <PrivateRoute>
                    <Chat />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/checklist" 
                element={
                  <PrivateRoute>
                    <Checklist />
                  </PrivateRoute>
                } 
              />

              {/* Catch all */}
              <Route path="*" element={<Navigate to={isAuthenticated ? "/feed" : "/"} replace />} />
            </Routes>
          </main>

          {/* Premium Toast Overlays */}
          <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform translate-y-0 pointer-events-auto
                  ${toast.type === 'success' 
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' 
                    : toast.type === 'error'
                    ? 'bg-red-50/90 border-red-200 text-red-800'
                    : 'bg-primary-50/90 border-primary-200 text-primary-800'}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-600" />}
                  {toast.type === 'error' && <AlertCircle size={18} className="text-red-600" />}
                  {toast.type === 'info' && <Info size={18} className="text-primary-600" />}
                </div>
                <div className="flex-grow text-xs font-semibold leading-relaxed">
                  {toast.message}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 text-slate-400 hover:text-slate-600 touch-target"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
