import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';
import { DateProvider } from './contexts/DateContext.jsx';
import { TransactionProvider } from './contexts/TransactionContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { CustomToaster } from './components/ui/CustomToaster.jsx';
import { CustomConfirm } from './components/ui/CustomConfirm.jsx';
import { PrivateRoute } from './components/router/PrivateRoute.jsx';
import { PublicRoute } from './components/router/PublicRoute.jsx';

// Páginas
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import AddTransaction from './pages/AddTransaction.jsx';
import Extract from './pages/Extract.jsx';
import Settings from './pages/Settings.jsx';
import Analysis from './pages/Analysis.jsx';
import CategoryDetails from './pages/CategoryDetails.jsx';


export default function App() {
  return (
    <AuthProvider>
      <DateProvider>
        <TransactionProvider>
          <NotificationProvider>
            <BrowserRouter>
            <CustomToaster />
            <CustomConfirm />
            <Routes>
              {/* Rota Pública (Login) */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            {/* Rotas Privadas (App) */}
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="/" element={<Home />} />
              <Route path="/add" element={<AddTransaction />} />
              <Route path="/extract" element={<Extract />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/category-details" element={<CategoryDetails />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
        </TransactionProvider>
      </DateProvider>
    </AuthProvider>
  );
}