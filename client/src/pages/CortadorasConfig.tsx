import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Edit, Save, X, AlertCircle } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import NavigationMenu from '@/components/NavigationMenu';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CortadorasConfig = () => {
  const { user: currentUser } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const utils = trpc.useUtils();

  // Fetch all cortadoras config
  const { data: cortadorasConfig, isLoading: configLoading } = trpc.cortadoras.list.useQuery();

  // Fetch top cortadoras to get all unique numbers
  const { data: topCortadoras, isLoading: topLoading } = trpc.cortadoras.topCortadoras.useQuery({
    limit: 100, // Get all cortadoras
  });

  // Upsert mutation
  const upsertMutation = trpc.cortadoras.upsert.useMutation({
    onSuccess: () => {
      toast.success('Nombre de cortadora actualizado');
      utils.cortadoras.list.invalidate();
      utils.cortadoras.topCortadoras.invalidate();
      setEditingId(null);
      setEditValue('');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar cortadora');
    },
  });

  // Merge config with actual cortadoras
  const cortadorasList = useMemo(() => {
    if (!topCortadoras) return [];

    const configMap = new Map(
      cortadorasConfig?.map(c => [c.numeroCortadora, c.customName]) || []
    );

    return topCortadoras.map(c => ({
      numeroCortadora: c.numeroCortadora,
      customName: configMap.get(c.numeroCortadora) || null,
      count: c.count,
      pesoTotal: c.pesoTotal,
    })).sort((a, b) => a.numeroCortadora.localeCompare(b.numeroCortadora));
  }, [topCortadoras, cortadorasConfig]);

  const handleEdit = (numero: string, currentName: string | null) => {
    setEditingId(numero);
    setEditValue(currentName || '');
  };

  const handleSave = (numero: string) => {
    upsertMutation.mutate({
      numeroCortadora: numero,
      customName: editValue.trim() || undefined,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const formatWeight = (grams: number) => {
    return `${(grams / 1000).toFixed(2)} kg`;
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-green-50 relative overflow-hidden pb-24 flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-emerald-800 mb-2">Acceso Restringido</h2>
          <p className="text-emerald-600">Solo los administradores pueden configurar cortadoras.</p>
        </GlassCard>
        <NavigationMenu />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-green-50 relative overflow-hidden pb-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1)_0%,transparent_50%)]" />
      
      <div className="container mx-auto py-8 max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-6 mb-6 text-center" hover={false}>
            <Users className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
              Configuración de Cortadoras
            </h1>
            <p className="text-emerald-700">Asigna nombres personalizados a cada cortadora</p>
          </GlassCard>
        </motion.div>

        {/* Info Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Los números 97, 98 y 99 no son cortadoras. Representan tipos de higo:
              <strong> 97 = Recolección incompleta</strong>, 
              <strong> 98 = Segunda calidad</strong>, 
              <strong> 99 = Desperdicio</strong>
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Cortadoras Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GlassCard className="p-6" hover={false}>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-emerald-800">
                {cortadorasList.length} cortadoras registradas
              </h3>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Nombre Personalizado</TableHead>
                    <TableHead>Cajas</TableHead>
                    <TableHead>Peso Total</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configLoading || topLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : cortadorasList.length > 0 ? (
                    cortadorasList.map((cortadora) => (
                      <TableRow key={cortadora.numeroCortadora} className="hover:bg-white/50">
                        <TableCell className="font-bold text-emerald-900">
                          #{cortadora.numeroCortadora}
                        </TableCell>
                        <TableCell>
                          {editingId === cortadora.numeroCortadora ? (
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder="Nombre personalizado"
                              className="max-w-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSave(cortadora.numeroCortadora);
                                } else if (e.key === 'Escape') {
                                  handleCancel();
                                }
                              }}
                            />
                          ) : (
                            <span className="text-emerald-700">
                              {cortadora.customName || <em className="text-emerald-400">Sin nombre</em>}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-emerald-600">
                          {cortadora.count}
                        </TableCell>
                        <TableCell className="text-emerald-600">
                          {formatWeight(cortadora.pesoTotal)}
                        </TableCell>
                        <TableCell>
                          {editingId === cortadora.numeroCortadora ? (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSave(cortadora.numeroCortadora)}
                                disabled={upsertMutation.isPending}
                              >
                                <Save className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancel}
                                disabled={upsertMutation.isPending}
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(cortadora.numeroCortadora, cortadora.customName)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-emerald-600">
                        No hay cortadoras registradas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </GlassCard>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <GlassCard className="p-6 mt-6" hover={false}>
            <h3 className="text-lg font-bold text-emerald-800 mb-3">💡 Consejos</h3>
            <ul className="space-y-2 text-sm text-emerald-600">
              <li>• Haz clic en el ícono de editar para asignar un nombre personalizado</li>
              <li>• Presiona Enter para guardar o Escape para cancelar</li>
              <li>• Los nombres personalizados aparecerán en el dashboard y reportes</li>
              <li>• Puedes dejar el campo vacío para usar solo el número</li>
            </ul>
          </GlassCard>
        </motion.div>
      </div>

      <NavigationMenu />
    </div>
  );
};

export default CortadorasConfig;
