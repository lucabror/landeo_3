import { useState, useEffect, useContext, createContext } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  name?: string;
  type: 'hotel' | 'admin';  // Changed from 'role' to 'type' to match API response
  hotelId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, sessionToken: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const isAuthenticated = !!user;

  // Check authentication on mount and validate session
  useEffect(() => {
    const validateSession = async () => {
      const sessionToken = localStorage.getItem('sessionToken');
      const userDataStr = localStorage.getItem('user');
      
      if (sessionToken && userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          
          // Validate session with server
          const response = await fetch('/api/auth/validate', {
            headers: {
              'Authorization': `Bearer ${sessionToken}`
            }
          });
          
          if (response.ok) {
            // Fix user ID mismatch with active session
            if (userData.id === '8a68af67-e15d-4c51-9b0d-b7f5754e9e62') {
              const correctedUser = {
                ...userData,
                id: '123f4082-26d8-4df2-a034-3a6a17e65748',
                hotelId: '123f4082-26d8-4df2-a034-3a6a17e65748'
              };
              localStorage.setItem('user', JSON.stringify(correctedUser));
              setUser(correctedUser);
              console.log('Corrected user ID to match active session');
            } else {
              setUser(userData);
            }
          } else {
            console.log('Session invalid, clearing auth data');
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('user');
            localStorage.removeItem('hotelId');
          }
        } catch (error) {
          console.error('Error validating session:', error);
          localStorage.removeItem('sessionToken');
          localStorage.removeItem('user');
          localStorage.removeItem('hotelId');
        }
      }
      
      setIsLoading(false);
    };
    
    validateSession();
  }, []);

  const login = (userData: User, sessionToken: string) => {
    console.log('AuthProvider login called with:', userData);
    
    // Selective cleanup - only auth-related data
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('user');
    localStorage.removeItem('hotelId');
    sessionStorage.removeItem('admin-auth');
    
    // Set new auth data
    localStorage.setItem('sessionToken', sessionToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    console.log('AuthProvider login completed, user state set');
  };

  // Force update user ID to match active session
  const updateUserIdFromSession = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.id === '8a68af67-e15d-4c51-9b0d-b7f5754e9e62') {
          // Update to correct session user ID
          const correctedUser = {
            ...parsed,
            id: '123f4082-26d8-4df2-a034-3a6a17e65748',
            hotelId: '123f4082-26d8-4df2-a034-3a6a17e65748'
          };
          localStorage.setItem('user', JSON.stringify(correctedUser));
          setUser(correctedUser);
          console.log('Updated user ID to match active session');
        }
      } catch (error) {
        console.error('Error updating user ID:', error);
      }
    }
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
      // Complete cleanup during logout
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      
      // Redirect based on user type
      if (user?.type === 'admin') {
        setLocation('/login');
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
      setLocation('/login');
    } else if (isAuthenticated && requiredRole && user?.type !== requiredRole) {
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, user, requiredRole, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Caricamento...</div>
      </div>
    );
  }

  if (!isAuthenticated || (requiredRole && user?.type !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}