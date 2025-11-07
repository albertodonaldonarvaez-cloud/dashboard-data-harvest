import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'green' | 'emerald';
  hover?: boolean;
}

const GlassCard = ({ 
  children, 
  className = "", 
  variant = 'default',
  hover = true,
  ...props 
}: GlassCardProps) => {
  const variantClasses = {
    default: 'glass',
    green: 'glass-green',
    emerald: 'glass-emerald',
  };

  return (
    <motion.div
      className={cn(
        variantClasses[variant],
        'rounded-3xl shadow-2xl',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={hover ? { scale: 1.02, y: -5 } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
