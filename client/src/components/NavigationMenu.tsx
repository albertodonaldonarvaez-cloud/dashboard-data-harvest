import { motion } from 'framer-motion';
import { Home, BarChart3, Settings, Users, Database } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface NavigationMenuProps {
  className?: string;
}

const NavigationMenu = ({ className }: NavigationMenuProps) => {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: 'Inicio', path: '/' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Database, label: 'Datos', path: '/data' },
    { icon: Users, label: 'Usuarios', path: '/users' },
    { icon: Settings, label: 'Config', path: '/settings' },
  ];

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'glass rounded-full shadow-2xl px-6 py-3',
        'flex items-center gap-2',
        'mx-4 max-w-[calc(100vw-2rem)]', // Add margin on mobile
        className
      )}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.path;

        return (
          <Link key={item.path} href={item.path}>
            <motion.button
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all',
                isActive 
                  ? 'bg-emerald-500 text-white shadow-lg' 
                  : 'text-emerald-700 hover:bg-emerald-50'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </motion.button>
          </Link>
        );
      })}
    </motion.nav>
  );
};

export default NavigationMenu;
