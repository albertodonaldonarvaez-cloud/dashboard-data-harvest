import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Palette, Info } from 'lucide-react';
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

        {/* User Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <GlassCard className="p-6 mb-6" hover={false}>
            <h2 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> Perfil de Usuario
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
            </div>
          </GlassCard>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GlassCard className="p-6 mb-6" hover={false}>
            <h2 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" /> Apariencia
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                <div>
                  <p className="font-semibold text-emerald-900">Tema</p>
                  <p className="text-sm text-emerald-600">Tema claro con acentos verdes</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-500" />
              </div>
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                <div>
                  <p className="font-semibold text-emerald-900">Estilo</p>
                  <p className="text-sm text-emerald-600">Glassmorphism moderno</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <GlassCard className="p-6 mb-6" hover={false}>
            <h2 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" /> Notificaciones
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                <div>
                  <p className="font-semibold text-emerald-900">Alertas de rendimiento</p>
                  <p className="text-sm text-emerald-600">Recibe notificaciones sobre estadísticas</p>
                </div>
                <div className="w-11 h-6 bg-emerald-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <GlassCard className="p-6 mb-6" hover={false}>
            <h2 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" /> Acerca de
            </h2>
            <div className="space-y-2">
              <p className="text-emerald-700">
                <span className="font-semibold">Versión:</span> 1.0.0
              </p>
              <p className="text-emerald-700">
                <span className="font-semibold">Sistema:</span> {APP_TITLE}
              </p>
              <p className="text-emerald-600 text-sm mt-4">
                Sistema de gestión de cosecha con visualización de datos en tiempo real,
                análisis de rendimiento y control de acceso basado en roles.
              </p>
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
