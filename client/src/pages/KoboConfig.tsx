import { motion } from 'framer-motion';
import { Save, TestTube, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';
import { useState } from 'react';
import GlassCard from '@/components/GlassCard';
import NavigationMenu from '@/components/NavigationMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function KoboConfig() {
  const { data: config, isLoading, refetch } = trpc.kobo.getConfig.useQuery();
  const saveConfig = trpc.kobo.saveConfig.useMutation();
  const testConnection = trpc.kobo.testConnection.useQuery(undefined, {
    enabled: false, // Don't run automatically
  });

  const [apiUrl, setApiUrl] = useState('');
  const [assetId, setAssetId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Load config when available
  useState(() => {
    if (config) {
      setApiUrl(config.apiUrl);
      setAssetId(config.assetId);
      // Don't set API token as it's not sent from backend for security
    }
  });

  const handleSave = async () => {
    if (!apiUrl || !assetId || !apiToken) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    try {
      await saveConfig.mutateAsync({
        apiUrl,
        assetId,
        apiToken,
      });
      
      toast.success('Configuración guardada exitosamente');
      setHasChanges(false);
      refetch();
    } catch (error) {
      toast.error('Error al guardar configuración');
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await testConnection.refetch();
      
      if (result.data?.success) {
        toast.success(result.data.message);
      } else {
        toast.error(result.data?.message || 'Error de conexión');
      }
    } catch (error) {
      toast.error('Error al probar conexión');
    }
  };

  const handleFieldChange = (field: 'apiUrl' | 'assetId' | 'apiToken', value: string) => {
    setHasChanges(true);
    
    switch (field) {
      case 'apiUrl':
        setApiUrl(value);
        break;
      case 'assetId':
        setAssetId(value);
        break;
      case 'apiToken':
        setApiToken(value);
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pb-24">
        <NavigationMenu />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pb-24">
      <NavigationMenu />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/settings">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Configuración
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-emerald-900 mb-2">
            Configuración de KoboToolbox
          </h1>
          <p className="text-emerald-600">
            Configura las credenciales de API para sincronización automática
          </p>
        </div>

        {/* Config Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-6">
            <div className="space-y-6">
              {/* API URL */}
              <div>
                <Label htmlFor="apiUrl" className="text-emerald-900 font-semibold">
                  URL de la API
                </Label>
                <Input
                  id="apiUrl"
                  type="url"
                  placeholder="https://kf.smart-harvest.tecti-cloud.com"
                  value={apiUrl}
                  onChange={(e) => handleFieldChange('apiUrl', e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-emerald-600 mt-1">
                  URL base de tu servidor KoboToolbox
                </p>
              </div>

              {/* Asset ID */}
              <div>
                <Label htmlFor="assetId" className="text-emerald-900 font-semibold">
                  Asset ID
                </Label>
                <Input
                  id="assetId"
                  type="text"
                  placeholder="aDePEqzfzdqSRjPvn5gqNY"
                  value={assetId}
                  onChange={(e) => handleFieldChange('assetId', e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-emerald-600 mt-1">
                  ID del formulario de KoboToolbox
                </p>
              </div>

              {/* API Token */}
              <div>
                <Label htmlFor="apiToken" className="text-emerald-900 font-semibold">
                  API Token
                </Label>
                <Input
                  id="apiToken"
                  type="password"
                  placeholder={config?.hasApiToken ? '••••••••••••••••' : 'Token de autenticación'}
                  value={apiToken}
                  onChange={(e) => handleFieldChange('apiToken', e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-emerald-600 mt-1">
                  Token de autenticación de la API de KoboToolbox
                </p>
                {config?.hasApiToken && !apiToken && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    Token configurado (deja en blanco para mantener el actual)
                  </div>
                )}
              </div>

              {/* Last Sync Time */}
              {config?.lastSyncTime && (
                <div className="p-4 bg-emerald-100/50 rounded-lg">
                  <p className="text-sm text-emerald-700">
                    <strong>Última sincronización:</strong>{' '}
                    {new Date(config.lastSyncTime).toLocaleString('es-MX')}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || saveConfig.isPending}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveConfig.isPending ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
                
                <Button
                  onClick={handleTestConnection}
                  variant="outline"
                  disabled={testConnection.isFetching}
                  className="flex-1"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testConnection.isFetching ? 'Probando...' : 'Probar Conexión'}
                </Button>
              </div>

              {/* Info */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Información importante:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>El API Token se almacena de forma segura en la base de datos</li>
                    <li>Asegúrate de que el token tenga permisos de lectura en el formulario</li>
                    <li>La sincronización descargará automáticamente las imágenes a S3</li>
                  </ul>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
