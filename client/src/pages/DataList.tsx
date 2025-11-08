import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Filter, Eye, Grid3x3, List, Calendar as CalendarIcon, Package } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import NavigationMenu from '@/components/NavigationMenu';
import { DateRangePicker } from '@/components/DateRangePicker';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DateRange } from 'react-day-picker';

const DataList = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedHarvest, setSelectedHarvest] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Fetch harvests
  const { data: harvests, isLoading } = trpc.harvests.list.useQuery({
    startDate: dateRange?.from?.toISOString() || subDays(new Date(), 30).toISOString(),
    endDate: dateRange?.to?.toISOString() || new Date().toISOString(),
    tipoHigo: tipoFilter !== 'all' ? tipoFilter : undefined,
  });

  // Fetch selected harvest details
  const { data: harvestDetail } = trpc.harvests.getById.useQuery(
    { id: selectedHarvest! },
    { enabled: selectedHarvest !== null }
  );

  const formatWeight = (weight: string | number | null | undefined) => {
    if (!weight) return '0 kg';
    const kg = typeof weight === 'string' ? parseFloat(weight) : weight;
    return `${kg.toFixed(2)} kg`;
  };

  const filteredHarvests = harvests?.filter(h => 
    h.parcela?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.numeroCaja?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.numeroCortadora?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="space-y-4">
              {/* Date Range */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-800">Rango de fechas:</span>
                </div>
                <div className="flex-1 max-w-md">
                  <DateRangePicker date={dateRange} setDate={setDateRange} />
                </div>
              </div>

              {/* Search and Filters */}
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
                <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-full md:w-auto">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="list" className="gap-2">
                      <List className="w-4 h-4" />
                      Lista
                    </TabsTrigger>
                    <TabsTrigger value="grid" className="gap-2">
                      <Grid3x3 className="w-4 h-4" />
                      Mosaico
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Data Display */}
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

            {viewMode === 'list' ? (
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {isLoading ? (
                  Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-square">
                      <Skeleton className="h-full w-full rounded-xl" />
                    </div>
                  ))
                ) : filteredHarvests && filteredHarvests.length > 0 ? (
                  filteredHarvests.map((harvest) => (
                    <motion.div
                      key={harvest.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="group cursor-pointer"
                      onClick={() => setSelectedHarvest(harvest.id)}
                    >
                      <div className="relative aspect-square bg-white/50 rounded-xl overflow-hidden hover:bg-white/70 transition-all">
                        {harvest.thumbnailUrl ? (
                          <img
                            src={harvest.thumbnailUrl}
                            alt={`Cosecha ${harvest.numeroCaja}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-green-100">
                            <Package className="w-16 h-16 text-emerald-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                          <p className="font-bold text-sm">{harvest.parcela}</p>
                          <p className="text-xs">{formatWeight(harvest.pesoCaja)}</p>
                          <p className="text-xs capitalize">{harvest.tipoHigo}</p>
                        </div>
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                          {harvest.numeroCaja}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center text-emerald-600 py-12">
                    No se encontraron registros
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* Detail Modal */}
      <Dialog open={selectedHarvest !== null} onOpenChange={() => setSelectedHarvest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      <div key={att.id} className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer">
                        <img
                          src={att.smallUrl || att.largeUrl || ''}
                          alt={att.filename}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          onClick={() => setLightboxImage(att.largeUrl || att.originalUrl || '')}
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

      {/* Lightbox for full-size images */}
      <Dialog open={lightboxImage !== null} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {lightboxImage && (
              <img
                src={lightboxImage}
                alt="Vista ampliada"
                className="max-w-full max-h-[90vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <NavigationMenu />
    </div>
  );
};

export default DataList;
