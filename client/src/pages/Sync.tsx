import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, ArrowLeft, Cloud, Database } from 'lucide-react';
import { Link } from 'wouter';
import GlassCard from '@/components/GlassCard';
import NavigationMenu from '@/components/NavigationMenu';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

const Sync = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [limit, setLimit] = useState<number>(100);

  const testConnectionQuery = trpc.kobo.testConnection.useQuery();
  const syncMutation = trpc.kobo.sync.useMutation({
    onSuccess: (result) => {
      toast.success(`Sincronización completada: ${result.success} registros importados`);
      setSyncResult(result);
      setSyncing(false);
    },
    onError: (error) => {
      toast.error(`Error al sincronizar: ${error.message}`);
      setSyncing(false);
    },
  });

  const handleSync = () => {
    if (!testConnectionQuery.data?.success) {
      toast.error('No se puede sincronizar: verifica la configuración de la API');
      return;
    }

    setSyncing(true);
    setSyncResult(null);
    syncMutation.mutate({ limit });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 pb-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link href="/settings">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Configuración
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">Sincronización con KoboToolbox</h1>
          <p className="text-emerald-600">Importa datos de cosecha directamente desde la API de KoboToolbox</p>
        </motion.div>

        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Cloud className="w-12 h-12 text-emerald-500" />
                <div>
                  <h2 className="text-xl font-bold text-emerald-900">Estado de Conexión</h2>
                  {testConnectionQuery.isLoading ? (
                    <p className="text-emerald-600">Verificando conexión...</p>
                  ) : testConnectionQuery.data?.success ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <p className="text-green-600 font-semibold">{testConnectionQuery.data.message}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <p className="text-red-600 font-semibold">
                        {testConnectionQuery.data?.message || 'Error de conexión'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => testConnectionQuery.refetch()}
                disabled={testConnectionQuery.isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${testConnectionQuery.isLoading ? 'animate-spin' : ''}`} />
                Verificar
              </Button>
            </div>

            {!testConnectionQuery.data?.success && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">Configuración Requerida</h4>
                    <p className="text-sm text-yellow-700">
                      Para habilitar la sincronización automática, necesitas configurar las siguientes variables de entorno:
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                      <li><code className="bg-yellow-100 px-2 py-0.5 rounded">KOBO_API_TOKEN</code>: Token de autenticación de KoboToolbox</li>
                      <li><code className="bg-yellow-100 px-2 py-0.5 rounded">KOBO_API_URL</code>: URL base de la API (opcional)</li>
                      <li><code className="bg-yellow-100 px-2 py-0.5 rounded">KOBO_ASSET_ID</code>: ID del formulario (opcional)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Sync Controls */}
        {testConnectionQuery.data?.success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <GlassCard className="p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <Database className="w-12 h-12 text-emerald-500" />
                <div>
                  <h2 className="text-xl font-bold text-emerald-900">Sincronizar Datos</h2>
                  <p className="text-emerald-600">Importa los últimos registros de KoboToolbox</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-emerald-900 mb-2">
                  Número de registros a sincronizar
                </label>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                  min={1}
                  max={1000}
                  className="w-full px-4 py-2 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-sm text-emerald-600 mt-1">
                  Se importarán hasta {limit} registros más recientes
                </p>
              </div>

              <Button
                variant="default"
                size="lg"
                onClick={handleSync}
                disabled={syncing}
                className="w-full"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Iniciar Sincronización
                  </>
                )}
              </Button>
            </GlassCard>
          </motion.div>
        )}

        {/* Sync Results */}
        {syncResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <GlassCard className="p-6 mb-6">
              <h3 className="text-xl font-bold text-emerald-900 mb-4">Resultados de Sincronización</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-emerald-900">{syncResult.success}</p>
                    <p className="text-sm text-emerald-600">Exitosos</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-emerald-900">{syncResult.failed}</p>
                    <p className="text-sm text-emerald-600">Fallidos</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold text-emerald-900">{syncResult.skipped}</p>
                    <p className="text-sm text-emerald-600">Omitidos</p>
                  </div>
                </div>
              </div>

              {syncResult.errors && syncResult.errors.length > 0 && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <h4 className="font-semibold text-red-900">Errores Encontrados</h4>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {syncResult.errors.slice(0, 20).map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                      {syncResult.errors.length > 20 && (
                        <li className="font-semibold">... y {syncResult.errors.length - 20} errores más</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-emerald-900 mb-3">Cómo Funciona</h3>
            <div className="space-y-3 text-emerald-700">
              <p>
                <strong>1. Conexión Automática:</strong> El sistema se conecta a la API de KoboToolbox usando las credenciales configuradas.
              </p>
              <p>
                <strong>2. Procesamiento de Datos:</strong> Los datos crudos se procesan automáticamente:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Se extrae el número de cortadora y caja del código escaneado</li>
                <li>Se determina el tipo de higo (97=primera, 98=segunda, 99=desperdicio)</li>
                <li>Se separan las coordenadas GPS en latitud y longitud</li>
                <li>Se reformatean las fechas al formato del sistema</li>
              </ul>
              <p>
                <strong>3. Importación:</strong> Los registros procesados se guardan automáticamente en la base de datos.
              </p>
              <p className="text-sm bg-emerald-100 p-3 rounded-xl mt-4">
                <strong>Nota:</strong> La sincronización solo importa datos nuevos. Los registros duplicados se omiten automáticamente.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <NavigationMenu />
    </div>
  );
};

export default Sync;
