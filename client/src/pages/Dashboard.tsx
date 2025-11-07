import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, TrendingUp, Package, Scale, MapPin } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import NavigationMenu from '@/components/NavigationMenu';
import { DateRangePicker } from '@/components/DateRangePicker';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DateRange } from 'react-day-picker';

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = trpc.harvests.stats.useQuery({
    startDate: dateRange?.from?.toISOString() || subDays(new Date(), 7).toISOString(),
    endDate: dateRange?.to?.toISOString() || new Date().toISOString(),
  });

  // Fetch harvests list
  const { data: harvests, isLoading: harvestsLoading } = trpc.harvests.list.useQuery({
    startDate: dateRange?.from?.toISOString() || subDays(new Date(), 7).toISOString(),
    endDate: dateRange?.to?.toISOString() || new Date().toISOString(),
  });

  const formatWeight = (grams: number | null | undefined) => {
    if (!grams) return '0 kg';
    return `${(grams / 1000).toFixed(2)} kg`;
  };

  const topParcelas = useMemo(() => {
    if (!stats?.byParcela) return [];
    return stats.byParcela.slice(0, 5);
  }, [stats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-green-50 relative overflow-hidden pb-24">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1)_0%,transparent_50%)]" />
      
      <div className="container mx-auto py-8 max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <GlassCard className="p-6 mb-8 text-center" hover={false}>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
              HarvestDash
            </h1>
            <p className="text-emerald-700">Sistema de Gestión de Cosecha Inteligente</p>
            {dateRange?.from && dateRange?.to && (
              <p className="text-sm text-emerald-600 mt-2">
                Rango: {format(dateRange.from, 'dd MMM', { locale: es })} - {format(dateRange.to, 'dd MMM yyyy', { locale: es })}
              </p>
            )}
          </GlassCard>
        </motion.div>

        {/* Date Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <GlassCard className="p-4 mb-6" hover={false}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-800">Filtrar por fecha:</span>
              </div>
              <div className="flex flex-col md:flex-row gap-2 flex-1">
                <div className="flex-1 max-w-md">
                  <DateRangePicker date={dateRange} setDate={setDateRange} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({
                        from: subDays(new Date(), 7),
                        to: new Date(),
                      });
                    }}
                  >
                    Última semana
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({
                        from: subDays(new Date(), 30),
                        to: new Date(),
                      });
                    }}
                  >
                    Último mes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      setDateRange({
                        from: new Date(now.getFullYear(), now.getMonth(), 1),
                        to: now,
                      });
                    }}
                  >
                    Este mes
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard className="p-6" variant="green">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 mb-1">Total Cajas</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-3xl font-bold text-emerald-900">
                      {stats?.general?.totalCajas || 0}
                    </p>
                  )}
                </div>
                <Package className="w-12 h-12 text-emerald-500 opacity-50" />
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GlassCard className="p-6" variant="emerald">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1">Peso Total</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-3xl font-bold text-green-900">
                      {formatWeight(stats?.general?.pesoTotal)}
                    </p>
                  )}
                </div>
                <Scale className="w-12 h-12 text-green-500 opacity-50" />
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <GlassCard className="p-6" variant="green">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 mb-1">Peso Promedio</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-3xl font-bold text-emerald-900">
                      {formatWeight(stats?.general?.promedioPeso)}
                    </p>
                  )}
                </div>
                <TrendingUp className="w-12 h-12 text-emerald-500 opacity-50" />
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <GlassCard className="p-6" variant="emerald">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1">Parcelas Activas</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-bold text-green-900">
                      {stats?.byParcela?.length || 0}
                    </p>
                  )}
                </div>
                <MapPin className="w-12 h-12 text-green-500 opacity-50" />
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* By Tipo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <GlassCard className="p-6" hover={false}>
              <h3 className="text-xl font-bold text-emerald-800 mb-4">Por Tipo de Higo</h3>
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.byTipo?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                      <div>
                        <p className="font-semibold text-emerald-900 capitalize">{item.tipoHigo}</p>
                        <p className="text-sm text-emerald-600">{item.count} cajas</p>
                      </div>
                      <p className="text-lg font-bold text-emerald-700">
                        {formatWeight(item.pesoTotal)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Top Parcelas */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <GlassCard className="p-6" hover={false}>
              <h3 className="text-xl font-bold text-emerald-800 mb-4">Top 5 Parcelas</h3>
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {topParcelas.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                      <div>
                        <p className="font-semibold text-green-900">{item.parcela}</p>
                        <p className="text-sm text-green-600">{item.count} cajas</p>
                      </div>
                      <p className="text-lg font-bold text-green-700">
                        {formatWeight(item.pesoTotal)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>

        {/* Recent Harvests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <GlassCard className="p-6" hover={false}>
            <h3 className="text-xl font-bold text-emerald-800 mb-4">Cosechas Recientes</h3>
            {harvestsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {harvests?.slice(0, 10).map((harvest) => (
                  <div
                    key={harvest.id}
                    className="flex items-center justify-between p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-emerald-900">{harvest.parcela}</p>
                      <p className="text-sm text-emerald-600">
                        Caja: {harvest.numeroCaja} | Cortadora: {harvest.numeroCortadora}
                      </p>
                      <p className="text-xs text-emerald-500 capitalize">{harvest.tipoHigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-700">
                        {formatWeight(harvest.pesoCaja)}
                      </p>
                      {harvest.submissionTime && (
                        <p className="text-xs text-emerald-500">
                          {format(new Date(harvest.submissionTime), 'dd/MM HH:mm', { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      <NavigationMenu />
    </div>
  );
};

export default Dashboard;
