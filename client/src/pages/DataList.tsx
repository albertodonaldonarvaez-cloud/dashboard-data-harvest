import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Filter, Download, Eye } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import NavigationMenu from '@/components/NavigationMenu';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

const DataList = () => {
  const [startDate, setStartDate] = useState(() => subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(() => new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [selectedHarvest, setSelectedHarvest] = useState<number | null>(null);

  // Fetch harvests
  const { data: harvests, isLoading } = trpc.harvests.list.useQuery({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    tipoHigo: tipoFilter !== 'all' ? tipoFilter : undefined,
  });

  // Fetch selected harvest details
  const { data: harvestDetail } = trpc.harvests.getById.useQuery(
    { id: selectedHarvest! },
    { enabled: selectedHarvest !== null }
  );

  const formatWeight = (grams: number | null | undefined) => {
    if (!grams) return '0 kg';
    return `${(grams / 1000).toFixed(2)} kg`;
  };

  const filteredHarvests = harvests?.filter(h => 
    h.parcela?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.numeroCaja?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.numeroCortadora?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    if (!filteredHarvests) return;

    const headers = ['ID', 'Fecha', 'Parcela', 'Peso (kg)', 'Tipo', 'Caja', 'Cortadora', 'Enviado por'];
    const rows = filteredHarvests.map(h => [
      h.id,
      h.submissionTime ? format(new Date(h.submissionTime), 'dd/MM/yyyy HH:mm') : '',
      h.parcela || '',
      h.pesoCaja ? (h.pesoCaja / 1000).toFixed(2) : '0',
      h.tipoHigo || '',
      h.numeroCaja || '',
      h.numeroCortadora || '',
      h.submittedBy || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cosechas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-green-50 relative overflow-hidden pb-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1)_0%,transparent_50%)]" />
      
      <div className="container mx-auto py-8 max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-6 mb-6 text-center" hover={false}>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
              Lista Completa de Datos
            </h1>
            <p className="text-emerald-700">Visualiza y filtra todos los registros de cosecha</p>
          </GlassCard>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <GlassCard className="p-6 mb-6" hover={false}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <Input
                    placeholder="Buscar por parcela, caja o cortadora..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="primera calidad">Primera Calidad</SelectItem>
                  <SelectItem value="segunda calidad">Segunda Calidad</SelectItem>
                  <SelectItem value="desperdicio">Desperdicio</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GlassCard className="p-6" hover={false}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-emerald-800">
                {filteredHarvests?.length || 0} registros encontrados
              </h3>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Caja</TableHead>
                    <TableHead>Cortadora</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredHarvests && filteredHarvests.length > 0 ? (
                    filteredHarvests.map((harvest) => (
                      <TableRow key={harvest.id} className="hover:bg-white/50">
                        <TableCell>
                          {harvest.submissionTime 
                            ? format(new Date(harvest.submissionTime), 'dd/MM/yyyy HH:mm', { locale: es })
                            : '-'}
                        </TableCell>
                        <TableCell className="font-medium">{harvest.parcela || '-'}</TableCell>
                        <TableCell>{formatWeight(harvest.pesoCaja)}</TableCell>
                        <TableCell className="capitalize">{harvest.tipoHigo || '-'}</TableCell>
                        <TableCell>{harvest.numeroCaja || '-'}</TableCell>
                        <TableCell>{harvest.numeroCortadora || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedHarvest(harvest.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-emerald-600">
                        No se encontraron registros
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Detail Modal */}
      <Dialog open={selectedHarvest !== null} onOpenChange={() => setSelectedHarvest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Cosecha</DialogTitle>
          </DialogHeader>
          {harvestDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Parcela</p>
                  <p className="font-semibold">{harvestDetail.parcela}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Peso</p>
                  <p className="font-semibold">{formatWeight(harvestDetail.pesoCaja)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Higo</p>
                  <p className="font-semibold capitalize">{harvestDetail.tipoHigo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Número de Caja</p>
                  <p className="font-semibold">{harvestDetail.numeroCaja}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Número de Cortadora</p>
                  <p className="font-semibold">{harvestDetail.numeroCortadora}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Envío</p>
                  <p className="font-semibold">
                    {harvestDetail.submissionTime 
                      ? format(new Date(harvestDetail.submissionTime), 'dd/MM/yyyy HH:mm', { locale: es })
                      : '-'}
                  </p>
                </div>
                {harvestDetail.latitud && harvestDetail.longitud && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Latitud</p>
                      <p className="font-semibold">{harvestDetail.latitud}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Longitud</p>
                      <p className="font-semibold">{harvestDetail.longitud}</p>
                    </div>
                  </>
                )}
              </div>

              {harvestDetail.attachments && harvestDetail.attachments.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Imágenes</p>
                  <div className="grid grid-cols-2 gap-4">
                    {harvestDetail.attachments.map((att) => (
                      <div key={att.id} className="relative aspect-square rounded-lg overflow-hidden">
                        <img
                          src={att.smallUrl || att.largeUrl || ''}
                          alt={att.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <NavigationMenu />
    </div>
  );
};

export default DataList;
