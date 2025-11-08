-- Script para normalizar tipos de higo y eliminar datos incorrectos

-- 1. Normalizar tipos de higo a formato consistente (lowercase con underscores)
UPDATE harvests 
SET tipoHigo = 'primera_calidad' 
WHERE LOWER(REPLACE(tipoHigo, ' ', '_')) = 'primera_calidad';

UPDATE harvests 
SET tipoHigo = 'segunda_calidad' 
WHERE LOWER(REPLACE(tipoHigo, ' ', '_')) = 'segunda_calidad';

UPDATE harvests 
SET tipoHigo = 'desperdicio' 
WHERE LOWER(REPLACE(tipoHigo, ' ', '_')) = 'desperdicio';

-- 2. Eliminar registros con pesos absurdos (más de 50 kg por caja)
DELETE FROM harvests 
WHERE CAST(pesoCaja AS DECIMAL(10,2)) > 50;

-- 3. Eliminar registros con pesos negativos o cero
DELETE FROM harvests 
WHERE CAST(pesoCaja AS DECIMAL(10,2)) <= 0;

-- 4. Ver resumen después de la limpieza
SELECT 
  tipoHigo,
  COUNT(*) as total_cajas,
  ROUND(SUM(CAST(pesoCaja AS DECIMAL(10,2))), 2) as peso_total_kg,
  ROUND(AVG(CAST(pesoCaja AS DECIMAL(10,2))), 2) as peso_promedio_kg,
  ROUND(MIN(CAST(pesoCaja AS DECIMAL(10,2))), 2) as peso_minimo_kg,
  ROUND(MAX(CAST(pesoCaja AS DECIMAL(10,2))), 2) as peso_maximo_kg
FROM harvests
GROUP BY tipoHigo
ORDER BY tipoHigo;
