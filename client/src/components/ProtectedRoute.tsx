import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Solo redirigir si ya terminó de cargar Y no hay usuario
    if (!loading) {
      setHasChecked(true);
      if (!user && location !== '/login') {
        setLocation('/login');
      }
    }
  }, [user, loading, location, setLocation]);

  // Mostrar loading mientras carga o mientras no ha verificado
  if (loading || !hasChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-emerald-700">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si ya verificó y no hay usuario, no renderizar nada (ya se redirigió)
  if (!user) {
    return null;
  }

  return <>{children}</>;
};
