import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { DateProvider } from './contexts/DateContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CustomToaster } from './components/ui/CustomToaster';
import { CustomConfirm } from './components/ui/CustomConfirm';
import { PrivateRoute } from './components/router/PrivateRoute';
import { PublicRoute } from './components/router/PublicRoute';
import ScrollToTop from './components/router/ScrollToTop';

// Carregamento sob demanda (Code Splitting) com React.lazy
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const Bills = lazy(() => import('./pages/Bills'));
const AddTransaction = lazy(() => import('./pages/AddTransaction'));
const Extract = lazy(() => import('./pages/Extract'));
const Settings = lazy(() => import('./pages/Settings'));
const Analysis = lazy(() => import('./pages/Analysis'));
const CategoryDetails = lazy(() => import('./pages/CategoryDetails'));
const Dossier = lazy(() => import('./pages/Dossier'));

function PageLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Carregando...</span>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DateProvider>
        <TransactionProvider>
          <NotificationProvider>
            <BrowserRouter>
              <ScrollToTop />
              <CustomToaster />
              <CustomConfirm />
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  {/* Rota Pública (Login) */}
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    }
                  />

                  {/* Rotas Privadas (App) */}
                  <Route
                    element={
                      <PrivateRoute>
                        <AppLayout />
                      </PrivateRoute>
                    }
                  >
                    <Route path="/" element={<Home />} />
                    <Route path="/bills" element={<Bills />} />
                    <Route path="/dossier" element={<Dossier />} />
                    <Route path="/add" element={<AddTransaction />} />
                    <Route path="/extract" element={<Extract />} />
                    <Route path="/analysis" element={<Analysis />} />
                    <Route path="/category-details" element={<CategoryDetails />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </NotificationProvider>
        </TransactionProvider>
      </DateProvider>
    </AuthProvider>
  );
}