import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, differenceInDays, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import NavigationMenu from '@/components/NavigationMenu';
import { DateRangePicker } from '@/components/DateRangePicker';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { DateRange } from 'react-day-picker';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = {
  'primera calidad': '#10b981',
  'segunda calidad': '#f59e0b',
  'desperdicio': '#ef4444',
};

const Analytics = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  // Fetch harvests
  const { data: harvests, isLoading } = trpc.harvests.list.useQuery({
    startDate: dateRange?.from?.toISOString() || subDays(new Date(), 7).toISOString(),
    endDate: dateRange?.to?.toISOString() || new Date().toISOString(),
  });

  // Calculate if it's a single day view
  const isSingleDay = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return false;
    return differenceInDays(dateRange.to, dateRange.from) === 0;
  }, [dateRange]);

  // Process data for charts
  const chartData = useMemo(() => {
    if (!harvests || !dateRange?.from || !dateRange?.to) return [];

    if (isSingleDay) {
      // Group by hour for single day
      const hourlyData: Record<string, any> = {};
      
      harvests.forEach((h) => {
        if (!h.submissionTime) return;
        const hour = format(new Date(h.submissionTime), 'HH:00');
        if (!hourlyData[hour]) {
          hourlyData[hour] = {
            time: hour,
            'primera calidad': 0,
            'segunda calidad': 0,
            'desperdicio': 0,
          };
        }
        const tipo = h.tipoHigo?.toLowerCase() || 'sin clasificar';
        if (hourlyData[hour][tipo] !== undefined) {
          hourlyData[hour][tipo] += (h.pesoCaja || 0) / 1000;
        }
      });

      return Object.values(hourlyData).sort((a, b) => a.time.localeCompare(b.time));
    } else {
      // Group by day for date ranges
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      const dailyData = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const data: any = {
          date: format(day, 'dd MMM', { locale: es }),
          'primera calidad': 0,
          'segunda calidad': 0,
          'desperdicio': 0,
        };

        harvests.forEach((h) => {
          if (!h.submissionTime) return;
          const harvestDay = format(new Date(h.submissionTime), 'yyyy-MM-dd');
          if (harvestDay === dayStr) {
            const tipo = h.tipoHigo?.toLowerCase() || 'sin clasificar';
            if (data[tipo] !== undefined) {
              data[tipo] += (h.pesoCaja || 0) / 1000;
            }
          }
        });

        return data;
      });

      return dailyData;
    }
  }, [harvests, dateRange, isSingleDay]);

  // Calculate quality distribution
  const qualityDistribution = useMemo(() => {
    if (!harvests) return [];

    const distribution: Record<string, number> = {
      'primera calidad': 0,
      'segunda calidad': 0,
      'desperdicio': 0,
    };

    harvests.forEach((h) => {
      const tipo = h.tipoHigo?.toLowerCase() || 'sin clasificar';
      if (distribution[tipo] !== undefined) {
        distribution[tipo] += (h.pesoCaja || 0) / 1000;
      }
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: parseFloat(value.toFixed(2)),
      percentage: 0,
    })).map(item => {
      const total = Object.values(distribution).reduce((a, b) => a + b, 0);
      return {
        ...item,
        percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0',
      };
    });
  }, [harvests]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!harvests) return null;

    const byQuality: Record<string, { count: number; weight: number }> = {
      'primera calidad': { count: 0, weight: 0 },
      'segunda calidad': { count: 0, weight: 0 },
      'desperdicio': { count: 0, weight: 0 },
    };

    harvests.forEach((h) => {
      const tipo = h.tipoHigo?.toLowerCase() || 'sin clasificar';
      if (byQuality[tipo]) {
        byQuality[tipo].count += 1;
        byQuality[tipo].weight += (h.pesoCaja || 0) / 1000;
      }
    });

    const total = Object.values(byQuality).reduce((acc, val) => acc + val.weight, 0);

    return {
      primeraCalidad: {
        ...byQuality['primera calidad'],
        percentage: total > 0 ? ((byQuality['primera calidad'].weight / total) * 100).toFixed(1) : '0',
      },
      segundaCalidad: {
        ...byQuality['segunda calidad'],
        percentage: total > 0 ? ((byQuality['segunda calidad'].weight / total) * 100).toFixed(1) : '0',
      },
      desperdicio: {
        ...byQuality['desperdicio'],
        percentage: total > 0 ? ((byQuality['desperdicio'].weight / total) * 100).toFixed(1) : '0',
      },
      total,
    };
  }, [harvests]);

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
            <BarChart3 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
              Análisis de Rendimiento
            </h1>
            <p className="text-emerald-700">Visualiza el rendimiento por calidad de higo</p>
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
                <span className="font-medium text-emerald-800">Período de análisis:</span>
              </div>
              <div className="flex-1 max-w-md">
                <DateRangePicker date={dateRange} setDate={setDateRange} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setDateRange({ from: today, to: today });
                  }}
                >
                  Hoy
                </Button>
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
                  7 días
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
                  30 días
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <GlassCard className="p-6" variant="green">
              <h3 className="text-sm text-emerald-700 mb-2">Primera Calidad</h3>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-emerald-900">
                    {performanceMetrics?.primeraCalidad.percentage}%
                  </p>
                  <p className="text-sm text-emerald-600 mt-1">
                    {performanceMetrics?.primeraCalidad.weight.toFixed(2)} kg ({performanceMetrics?.primeraCalidad.count} cajas)
                  </p>
                </>
              )}
            </GlassCard>

            <GlassCard className="p-6" variant="emerald">
              <h3 className="text-sm text-amber-700 mb-2">Segunda Calidad</h3>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-amber-900">
                    {performanceMetrics?.segundaCalidad.percentage}%
                  </p>
                  <p className="text-sm text-amber-600 mt-1">
                    {performanceMetrics?.segundaCalidad.weight.toFixed(2)} kg ({performanceMetrics?.segundaCalidad.count} cajas)
                  </p>
                </>
              )}
            </GlassCard>

            <GlassCard className="p-6" variant="green">
              <h3 className="text-sm text-red-700 mb-2">Desperdicio</h3>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-red-900">
                    {performanceMetrics?.desperdicio.percentage}%
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    {performanceMetrics?.desperdicio.weight.toFixed(2)} kg ({performanceMetrics?.desperdicio.count} cajas)
                  </p>
                </>
              )}
            </GlassCard>
          </div>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <GlassCard className="p-6" hover={false}>
              <h3 className="text-xl font-bold text-emerald-800 mb-4">
                {isSingleDay ? 'Producción por Hora' : 'Producción Diaria'}
              </h3>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  {isSingleDay ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                      <XAxis dataKey="time" stroke="#059669" />
                      <YAxis stroke="#059669" label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #10b981' }}
                      />
                      <Legend />
                      <Bar dataKey="primera calidad" fill={COLORS['primera calidad']} name="Primera Calidad" />
                      <Bar dataKey="segunda calidad" fill={COLORS['segunda calidad']} name="Segunda Calidad" />
                      <Bar dataKey="desperdicio" fill={COLORS['desperdicio']} name="Desperdicio" />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                      <XAxis dataKey="date" stroke="#059669" />
                      <YAxis stroke="#059669" label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #10b981' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="primera calidad" stroke={COLORS['primera calidad']} strokeWidth={2} name="Primera Calidad" />
                      <Line type="monotone" dataKey="segunda calidad" stroke={COLORS['segunda calidad']} strokeWidth={2} name="Segunda Calidad" />
                      <Line type="monotone" dataKey="desperdicio" stroke={COLORS['desperdicio']} strokeWidth={2} name="Desperdicio" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </GlassCard>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <GlassCard className="p-6" hover={false}>
              <h3 className="text-xl font-bold text-emerald-800 mb-4">Distribución</h3>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={qualityDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {qualityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {qualityDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[item.name.toLowerCase() as keyof typeof COLORS] }}
                          />
                          <span className="text-emerald-800">{item.name}</span>
                        </div>
                        <span className="font-semibold text-emerald-900">{item.value} kg</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </GlassCard>
          </motion.div>
        </div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <GlassCard className="p-6" hover={false}>
            <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Insights de Rendimiento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/50 rounded-xl">
                <p className="font-semibold text-emerald-900 mb-2">Eficiencia de Calidad</p>
                <p className="text-sm text-emerald-600">
                  La primera calidad representa el {performanceMetrics?.primeraCalidad.percentage}% del total,
                  lo que indica un {parseFloat(performanceMetrics?.primeraCalidad.percentage || '0') > 50 ? 'excelente' : 'buen'} nivel de selección.
                </p>
              </div>
              <div className="p-4 bg-white/50 rounded-xl">
                <p className="font-semibold text-emerald-900 mb-2">Control de Desperdicio</p>
                <p className="text-sm text-emerald-600">
                  El desperdicio es del {performanceMetrics?.desperdicio.percentage}%.
                  {parseFloat(performanceMetrics?.desperdicio.percentage || '0') < 10 
                    ? ' ¡Excelente control de calidad!' 
                    : ' Hay oportunidad de mejora en la selección.'}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <NavigationMenu />
    </div>
  );
};

export default Analytics;
