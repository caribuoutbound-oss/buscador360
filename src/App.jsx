import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { supabase } from "./supabase";

// Componente principal
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

  // --- Helpers ---
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

  const limpiarBusqueda = () => {
    setModelo("");
    setResultados([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-1">
            Inventario de Equipos
          </h1>
          <p className="text-center text-gray-600">
            Búsqueda dinámica en tiempo real
          </p>
        </header>

        {/* Tarjetas resumen */}
        {modelo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white shadow-md rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Resultados encontrados</p>
              <p className="text-xl font-semibold text-gray-800">{resultados.length}</p>
            </div>
            <div className="bg-white shadow-md rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Búsqueda</p>
              <p className="text-xl font-semibold text-gray-800 truncate">{modelo}</p>
            </div>
            {loading && (
              <div className="bg-white shadow-md rounded-lg p-4 text-center flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 text-sm">Buscando...</span>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="flex justify-center mb-6">
          <input
            type="text"
            placeholder="Buscar por modelo..."
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Tabla */}
        {resultados.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow-md bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 uppercase">Código SAP</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 uppercase">Modelo</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 uppercase">Stock</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 uppercase">Sede</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resultados.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-blue-50 transition-colors duration-150 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-3 py-2 font-mono text-gray-900">{r.codigo_sap}</td>
                    <td className="px-3 py-2 text-gray-900 max-w-xs truncate" title={r.modelo}>
                      {r.modelo}
                    </td>
                    <td className={`px-3 py-2 ${getStockColor(r.stock_final)}`}>{r.stock_final ?? "-"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          r.status_equipo
                        )}`}
                      >
                        {r.status_equipo || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{r.hoja}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loading &&
          modelo && (
            <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
              Sin resultados para <span className="font-medium">{modelo}</span>
            </div>
          )
        )}

        {!modelo && !loading && (
          <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-400">
            Comienza a escribir en el campo de búsqueda para encontrar equipos
          </div>
        )}
      </div>
    </div>
  );
}
