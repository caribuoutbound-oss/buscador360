import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";

// ⚠️ IMPORTANTE: Asegúrate de tener este archivo y que exporte una instancia válida de Supabase
// Si no lo tienes, reemplaza esto con un mock para pruebas
import { supabase } from "./supabase"; // ← Verifica que este archivo exista y funcione

// Iconos SVG inline
const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const LoadingSpinner = () => (
  <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const ClearIcon = ({ onClick }) => (
  <svg 
    className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    onClick={onClick}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function App() {
  const [modelo, setModelo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);

  // ✅ Validación inicial de Supabase
  useEffect(() => {
    if (!supabase) {
      setError("Supabase no está configurado correctamente.");
      return;
    }
    setIsSupabaseReady(true);
  }, []);

  const buscarTiempoReal = useCallback(
    debounce(async (texto) => {
      if (!texto.trim()) {
        setResultados([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("equipos")
          .select("id, hoja, codigo_sap, modelo, stock_final, status_equipo")
          .ilike("modelo", `%${texto}%`)
          .limit(50);

        if (error) throw error;
        setResultados(data || []);
      } catch (err) {
        console.error("Error en búsqueda:", err);
        setError(err.message || "Error al buscar equipos");
        setResultados([]);
      }

      setLoading(false);
    }, 300),
    []
  );

  useEffect(() => {
    if (!isSupabaseReady) return;
    buscarTiempoReal(modelo);
    return () => buscarTiempoReal.cancel();
  }, [modelo, isSupabaseReady]);

  const limpiarBusqueda = () => {
    setModelo("");
    setResultados([]);
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('activo') || statusLower.includes('disponible')) return 'bg-green-100 text-green-800';
    if (statusLower.includes('inactivo') || statusLower.includes('baja')) return 'bg-red-100 text-red-800';
    if (statusLower.includes('mantenimiento') || statusLower.includes('reposo')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getStockColor = (stock) => {
    if (stock === null || stock === undefined) return 'text-gray-500';
    if (stock <= 0) return 'text-red-600 font-medium';
    if (stock <= 5) return 'text-yellow-600 font-medium';
    return 'text-green-600 font-medium';
  };

  // 💡 Renderizado condicional si hay error crítico
  if (error && !modelo && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 17h.01M12 12h.01M12 12v.01M12 12H9M12 12h3" />
              </svg>
              <h1 className="text-xl font-semibold text-red-800">Error de Configuración</h1>
            </div>
            <p className="text-gray-700 mb-4">{error}</p>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-700">
                Por favor verifica que el archivo <code>./supabase.js</code> exista y exporte una instancia válida de Supabase.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">Inventario de Equipos</h1>
              <p className="text-sm text-gray-600">Búsqueda dinámica en tiempo real</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>En línea</span>
            </div>
          </div>
        </div>

        {/* Search Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Buscar por modelo..."
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50 focus:bg-white"
              />
              {modelo && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button 
                    onClick={limpiarBusqueda}
                    className="hover:bg-gray-200 rounded-full p-1 transition-colors"
                  >
                    <ClearIcon onClick={limpiarBusqueda} />
                  </button>
                </div>
              )}
              {loading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <LoadingSpinner />
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          {modelo && (
            <div className="mt-4 flex justify-center">
              <div className="bg-gray-50 rounded-lg px-4 py-2">
                <span className="text-sm text-gray-600">
                  {loading ? 'Buscando...' : `Mostrando ${resultados.length} resultado${resultados.length !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error general */}
        {error && modelo && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        {resultados.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código SAP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sede</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resultados.map((r, index) => (
                    <tr 
                      key={r.id}
                      className={`hover:bg-blue-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900 bg-gray-50 rounded-lg mx-2">
                        {r.codigo_sap}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium max-w-xs truncate" title={r.modelo}>
                        {r.modelo}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm ${getStockColor(r.stock_final)}`}>
                        {r.stock_final ?? '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(r.status_equipo)}`}>
                          {r.status_equipo || 'Sin status'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {r.hoja}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && modelo && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin resultados</h3>
              <p className="mt-1 text-sm text-gray-500">No se encontraron equipos que coincidan con "{modelo}"</p>
            </div>
          )
        )}

        {!modelo && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Buscar equipos</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza a escribir en el campo de búsqueda para encontrar equipos</p>
          </div>
        )}
      </div>
    </div>
  );
}
