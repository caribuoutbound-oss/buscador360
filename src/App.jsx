import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { supabase } from "./supabase";

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
    onClick={onClick}
    className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function App() {
  const [modelo, setModelo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Búsqueda en tiempo real ---
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
        setError(err.message);
        setResultados([]);
      }
      setLoading(false);
    }, 300),
    []
  );

  useEffect(() => {
    buscarTiempoReal(modelo);
    return () => buscarTiempoReal.cancel();
  }, [modelo]);

  const limpiarBusqueda = () => {
    setModelo("");
    setResultados([]);
  };

  // --- Helpers de estilo ---
  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";
    const s = status.toLowerCase();
    if (s.includes("activo") || s.includes("disponible")) return "bg-green-100 text-green-800";
    if (s.includes("inactivo") || s.includes("baja")) return "bg-red-100 text-red-800";
    if (s.includes("mantenimiento") || s.includes("reposo")) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  const getStockColor = (stock) => {
    if (stock === null || stock === undefined) return "text-gray-500";
    if (stock <= 0) return "text-red-600 font-medium";
    if (stock <= 5) return "text-yellow-600 font-medium";
    return "text-green-600 font-medium";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
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

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
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
                className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50 focus:bg-white"
              />
              {modelo && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <ClearIcon onClick={limpiarBusqueda} />
                </div>
              )}
              {loading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <LoadingSpinner />
                </div>
              )}
            </div>
          </div>
          {modelo && (
            <div className="mt-2 flex justify-center">
              <div className="bg-gray-50 rounded-lg px-4 py-1 text-sm text-gray-600">
                {loading ? "Buscando..." : `Mostrando ${resultados.length} resultado${resultados.length !== 1 ? "s" : ""}`}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Tabla */}
        {resultados.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Código SAP</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Sede</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resultados.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-gray-900">{r.codigo_sap}</td>
                      <td className="px-3 py-2 text-gray-900 max-w-xs truncate" title={r.modelo}>{r.modelo}</td>
                      <td className={`px-3 py-2 whitespace-nowrap ${getStockColor(r.stock_final)}`}>{r.stock_final ?? "-"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(r.status_equipo)}`}>
                          {r.status_equipo || "Sin status"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{r.hoja}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && modelo && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-sm text-gray-500">No se encontraron equipos que coincidan con "{modelo}"</p>
            </div>
          )
        )}

        {!modelo && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-500">Comienza a escribir en el campo de búsqueda para encontrar equipos</p>
          </div>
        )}
      </div>
    </div>
  );
}
