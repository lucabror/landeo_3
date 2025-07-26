import { useState, useEffect, useContext, createContext } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  role: 'hotel' | 'admin';
  hotelId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (sessionToken: string, userData: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const isAuthenticated = !!user;

  // Check authentication on mount
  useEffect(() => {
    const sessionToken = localStorage.getItem('sessionToken');
    const userDataStr = localStorage.getItem('user');
    
    if (sessionToken && userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (sessionToken: string, userData: User) => {
    localStorage.setItem('sessionToken', sessionToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      
      if (sessionToken) {
        // Call logout endpoint to invalidate session on server
        await apiRequest('POST', '/api/auth/logout', {});
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with local logout even if server logout fails
    } finally {
      // Clear local storage and state
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
      localStorage.removeItem('hotelId'); // Legacy cleanup
      sessionStorage.removeItem('admin-auth'); // Legacy cleanup
      setUser(null);
      
      // Redirect based on user role
      if (user?.role === 'admin') {
        setLocation('/admin-login');
      } else {
        setLocation('/login');
      }
      
      toast({
        title: "Logout effettuato",
        description: "Sei stato disconnesso con successo.",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route wrapper
export function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode;
  requiredRole?: 'hotel' | 'admin';
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (requiredRole === 'admin') {
        setLocation('/admin-login');
      } else {
        setLocation('/login');
      }
    } else if (isAuthenticated && requiredRole && user?.role !== requiredRole) {
      // Redirect to appropriate login if role doesn't match
      if (requiredRole === 'admin') {
        setLocation('/admin-login');
      } else {
        setLocation('/login');
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Caricamento...</div>
      </div>
    );
  }

  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}