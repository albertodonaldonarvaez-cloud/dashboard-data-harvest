import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Users, Key, Upload } from 'lucide-react';
import { Link } from 'wouter';
import GlassCard from '@/components/GlassCard';
import NavigationMenu from '@/components/NavigationMenu';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_TITLE } from '@/const';

const Settings = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-green-50 relative overflow-hidden pb-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1)_0%,transparent_50%)]" />
      
      <div className="container mx-auto py-8 max-w-4xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-6 mb-6 text-center" hover={false}>
            <SettingsIcon className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-purple-800 mb-2">Configuración</h1>
            <p className="text-gray-600">Personaliza tu experiencia en {APP_TITLE}</p>
          </GlassCard>
        </motion.div>

        {/* User        {/* Admin Section */}
        {user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <GlassCard className="p-6 mb-6" hover={false}>
              <h2 className="text-xl font-bold text-emerald-800 mb-4">Administración</h2>
              <div className="space-y-3">
                <a href="/cortadoras">
                  <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-emerald-900">Configurar Cortadoras</p>
                        <p className="text-sm text-emerald-600">Asignar nombres personalizados</p>
                      </div>
                    </div>
                    <span className="text-emerald-400">→</span>
                  </div>
                </a>
                <a href="/import">
                  <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Upload className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-emerald-900">Importar Datos JSON</p>
                        <p className="text-sm text-emerald-600">Cargar datos de cosecha desde archivo</p>
                      </div>
                    </div>
                    <span className="text-emerald-400">→</span>
                  </div>
                </a>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: user?.role === 'admin' ? 0.3 : 0.2 }}
        >
          <GlassCard className="p-6 mb-6" hover={false}>
            <h2 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> Perfil
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                <div>
                  <p className="text-sm text-emerald-600">Nombre</p>
                  <p className="font-semibold text-emerald-900">{user?.name || 'Usuario'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                <div>
                  <p className="text-sm text-emerald-600">Email</p>
                  <p className="font-semibold text-emerald-900">{user?.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                <div>
                  <p className="text-sm text-emerald-600">Rol</p>
                  <p className="font-semibold text-emerald-900 capitalize">{user?.role || 'viewer'}</p>
                </div>
              </div>
              
              <Link href="/change-password">
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-900">Cambiar Contraseña</p>
                      <p className="text-sm text-emerald-600">Actualiza tu contraseña de acceso</p>
                    </div>
                  </div>
                  <span className="text-emerald-500">›</span>
                </div>
              </Link>
            </div>
          </GlassCard>
        </motion.div>



        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <Button
            variant="destructive"
            size="lg"
            onClick={() => logout()}
            className="px-8"
          >
            Cerrar Sesión
          </Button>
        </motion.div>
      </div>

      <NavigationMenu />
    </div>
  );
};

export default Settings;
