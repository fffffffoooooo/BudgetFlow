import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/services/api";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string; // Ajout du rôle (admin, user, etc.)
  alertEmail?: string;
  netIncomeCeiling?: number | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; email?: string; password?: string; alertEmail?: string; netIncomeCeiling?: number | null }) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        // Récupérer le profil utilisateur
        const { user } = await api.auth.getProfile();
        setUser(user);
      } catch (error) {
        // En cas d'erreur, nettoyer le localStorage
        localStorage.removeItem("auth_token");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  // Connexion
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user } = await api.auth.login({ email, password });
      setUser(user);
      toast.success("Connexion réussie!");
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  // Inscription
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user } = await api.auth.register({ name, email, password });
      setUser(user);
      toast.success("Inscription réussie!");
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  // Déconnexion
  const logout = () => {
    api.auth.logout();
    setUser(null);
    navigate("/login");
    toast.success("Vous avez été déconnecté");
  };

  // Mettre à jour le profil
  const updateProfile = async (data: { name?: string; email?: string; password?: string; alertEmail?: string; netIncomeCeiling?: number | null }) => {
    setIsLoading(true);
    try {
      const { user } = await api.auth.updateProfile(data);
      setUser(user);
      toast.success("Profil mis à jour avec succès");
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer le compte
  const deleteAccount = async () => {
    setIsLoading(true);
    try {
      await api.auth.deleteAccount();
      setUser(null);
      toast.success("Compte supprimé avec succès");
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated: !!user, 
        login, 
        register, 
        logout, 
        updateProfile, 
        deleteAccount 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
