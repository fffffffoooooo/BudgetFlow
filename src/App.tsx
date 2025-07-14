
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import MainLayout from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import NewCategory from "./pages/Categories/New";
import Statistics from "./pages/Statistics";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import AddTransaction from "./pages/AddTransaction";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Profile from "./pages/Profile";
import RecurringPayments from "./pages/RecurringPayments";
import SmartFinance from "./pages/SmartFinance";
import NotFound from "./pages/NotFound";
import Landing from "./components/visitors/landing";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import "./App.css";
import "./styles/theme.css"; // Fichier de styles des thèmes

// Route protégée qui redirige vers la connexion si non authentifié
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Chargement...</div>;
  if (!isAuthenticated) return <Navigate to="/welcome" />;
  
  return <>{children}</>;
}

// Route publique qui redirige vers l'accueil si déjà authentifié
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Chargement...</div>;
  if (isAuthenticated) return <Navigate to="/" />;
  
  return <>{children}</>;
}

// Application principale
function AppWithAuth() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <CurrencyProvider>
            <Toaster position="top-right" />
            <Routes>
              {/* Page d'accueil pour les visiteurs */}
              <Route
                path="/welcome"
                element={
                  <PublicRoute>
                    <Landing />
                  </PublicRoute>
                }
              />

              {/* Routes publiques (connexion, inscription) */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />

              {/* Routes protégées (application principale) */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <MainLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Index />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="add-transaction" element={<AddTransaction />} />
                <Route path="categories" element={<Categories />} />
                <Route path="categories/new" element={<NewCategory />} />
                <Route path="statistics" element={<Statistics />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="recurring-payments" element={<RecurringPayments />} />
                <Route path="smart-finance" element={<SmartFinance />} />
              </Route>

              {/* Route par défaut (404) */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CurrencyProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default function App() {
  return <AppWithAuth />;
}
