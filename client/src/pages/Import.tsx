import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileJson, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import GlassCard from '@/components/GlassCard';
import NavigationMenu from '@/components/NavigationMenu';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

const Import = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState<any[] | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const importMutation = trpc.import.importJSON.useMutation({
    onSuccess: (result) => {
      toast.success(`Importación completada: ${result.success} registros exitosos, ${result.failed} fallidos`);
      if (result.errors.length > 0) {
        console.error('Errores de importación:', result.errors);
      }
      setImporting(false);
      // Reset form
      setFile(null);
      setJsonData(null);
      setValidationResult(null);
    },
    onError: (error) => {
      toast.error(`Error al importar: ${error.message}`);
      setImporting(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/json') {
        toast.error('Por favor selecciona un archivo JSON válido');
        return;
      }

      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (!Array.isArray(json)) {
            toast.error('El archivo JSON debe contener un array de registros');
            return;
          }
          setJsonData(json);
          
          // Validate structure
          const validation = validateJSONStructure(json);
          setValidationResult(validation);
        } catch (error) {
          toast.error('Error al parsear el archivo JSON');
          console.error(error);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const validateJSONStructure = (data: any[]) => {
    const validation = {
      valid: 0,
      invalid: 0,
      errors: [] as string[],
      preview: [] as any[],
    };

    data.slice(0, 10).forEach((item, index) => {
      try {
        // Check required fields
        if (!item.escanea_la_parcela || !item.peso_de_la_caja || !item.numero_de_cortadora || !item.numero_de_caja) {
          throw new Error('Faltan campos requeridos');
        }

        // Parse parcela
        const parcela = item.escanea_la_parcela.split('-')[0].trim();
        
        validation.valid++;
        validation.preview.push({
          parcela,
          peso: item.peso_de_la_caja,
          cortadora: item.numero_de_cortadora,
          caja: item.numero_de_caja,
          tipo: item.tipo_de_higo,
        });
      } catch (error) {
        validation.invalid++;
        validation.errors.push(`Registro ${index + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    });

    return validation;
  };

  const handleImport = () => {
    if (!jsonData) {
      toast.error('No hay datos para importar');
      return;
    }

    setImporting(true);
    importMutation.mutate({ data: jsonData });
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
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">Importar Datos JSON</h1>
          <p className="text-emerald-600">Carga archivos JSON para alimentar la base de datos de manera manual</p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-8 mb-6">
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-16 h-16 text-emerald-500 mb-4" />
              <h2 className="text-2xl font-bold text-emerald-900 mb-2">Selecciona un archivo JSON</h2>
              <p className="text-emerald-600 mb-6 text-center">
                El archivo debe contener un array de registros con los campos requeridos
              </p>
              
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild variant="default" size="lg">
                  <span className="cursor-pointer">
                    <FileJson className="w-5 h-5 mr-2" />
                    Seleccionar Archivo
                  </span>
                </Button>
              </label>

              {file && (
                <div className="mt-4 text-center">
                  <p className="text-emerald-700 font-semibold">{file.name}</p>
                  <p className="text-emerald-600 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Validation Results */}
        {validationResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <GlassCard className="p-6 mb-6">
              <h3 className="text-xl font-bold text-emerald-900 mb-4">Validación del Archivo</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-emerald-900">{jsonData?.length || 0}</p>
                    <p className="text-sm text-emerald-600">Total Registros</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold text-emerald-900">{validationResult.valid}</p>
                    <p className="text-sm text-emerald-600">Válidos (preview)</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-emerald-900">{validationResult.invalid}</p>
                    <p className="text-sm text-emerald-600">Inválidos (preview)</p>
                  </div>
                </div>
              </div>

              {validationResult.errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <h4 className="font-semibold text-red-900">Errores Encontrados</h4>
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {validationResult.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview */}
              {validationResult.preview.length > 0 && (
                <div>
                  <h4 className="font-semibold text-emerald-900 mb-3">Vista Previa (primeros 10 registros)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-emerald-200">
                          <th className="text-left p-2 text-emerald-900">Parcela</th>
                          <th className="text-left p-2 text-emerald-900">Peso</th>
                          <th className="text-left p-2 text-emerald-900">Cortadora</th>
                          <th className="text-left p-2 text-emerald-900">Caja</th>
                          <th className="text-left p-2 text-emerald-900">Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationResult.preview.map((item: any, index: number) => (
                          <tr key={index} className="border-b border-emerald-100">
                            <td className="p-2 text-emerald-700">{item.parcela}</td>
                            <td className="p-2 text-emerald-700">{item.peso} kg</td>
                            <td className="p-2 text-emerald-700">{item.cortadora}</td>
                            <td className="p-2 text-emerald-700">{item.caja}</td>
                            <td className="p-2 text-emerald-700">{item.tipo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Button */}
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setJsonData(null);
                    setValidationResult(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleImport}
                  disabled={importing || validationResult.invalid > 0}
                >
                  {importing ? 'Importando...' : `Importar ${jsonData?.length || 0} Registros`}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-emerald-900 mb-3">Formato del Archivo JSON</h3>
            <p className="text-emerald-700 mb-4">
              El archivo debe ser un array JSON con objetos que contengan los siguientes campos:
            </p>
            <ul className="list-disc list-inside text-emerald-700 space-y-2 mb-4">
              <li><code className="bg-emerald-100 px-2 py-1 rounded">escanea_la_parcela</code>: Código de parcela (ej: "367 -EL CHATO")</li>
              <li><code className="bg-emerald-100 px-2 py-1 rounded">peso_de_la_caja</code>: Peso en kilogramos (número)</li>
              <li><code className="bg-emerald-100 px-2 py-1 rounded">numero_de_cortadora</code>: Número de cortadora (string)</li>
              <li><code className="bg-emerald-100 px-2 py-1 rounded">numero_de_caja</code>: Número de caja (string)</li>
              <li><code className="bg-emerald-100 px-2 py-1 rounded">tipo_de_higo</code>: Tipo de higo (primera_calidad, segunda_calidad, desperdicio)</li>
              <li><code className="bg-emerald-100 px-2 py-1 rounded">start</code>: Fecha y hora (opcional, formato ISO)</li>
            </ul>
            <div className="bg-emerald-100 p-4 rounded-xl">
              <p className="text-sm font-semibold text-emerald-900 mb-2">Ejemplo:</p>
              <pre className="text-xs text-emerald-800 overflow-x-auto">
{`[
  {
    "escanea_la_parcela": "367 -EL CHATO",
    "peso_de_la_caja": 2.065,
    "numero_de_cortadora": "04",
    "numero_de_caja": "001359",
    "tipo_de_higo": "primera_calidad",
    "start": "2025-11-03 13:55:46"
  }
]`}
              </pre>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <NavigationMenu />
    </div>
  );
};

export default Import;
