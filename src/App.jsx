import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { supabase } from "./supabase";

export default function App() {
  const [modelo, setModelo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Estadísticas
  const totalStock = resultados.reduce(
    (sum, r) => sum + (r.stock_final || 0),
    0
  );

  const itemsActivos = resultados.filter(
    (r) =>
      r.status_equipo &&
      (r.status_equipo.toLowerCase().includes("activo") ||
        r.status_equipo.toLowerCase().includes("disponible") ||
        r.status_equipo.toLowerCase().includes("life"))
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h1 className="text-3xl font-bold">Sistema de Inventario</h1>
          </div>
          <p className="text-blue-100 text-sm">Gestión y consulta de equipos en tiempo real</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Buscador */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-slate-200">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            <input
              type="text"
              placeholder="Buscar por modelo del equipo..."
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg 
              focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
              transition-all text-base"
            />
          </div>

          {loading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Buscando en la base de datos...</span>
            </div>
          )}
        </div>

        {/* Tarjetas */}
        {modelo && resultados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

            {/* Total resultados */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Resultados</p>
                  <p className="text-3xl font-bold text-slate-800">{resultados.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Stock total */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Stock Total</p>
                  <p className="text-3xl font-bold text-slate-800">{totalStock.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Equipos activos */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Equipos Activos</p>
                  <p className="text-3xl font-bold text-slate-800">{itemsActivos}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Errores */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>

            <div>
              <p className="font-semibold text-red-800">Error de conexión</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* TABLA */}
        {resultados.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Código SAP</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Modelo</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Sede</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-slate-100">
                  {resultados.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50 transition-colors duration-150">
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">
                          {r.codigo_sap}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 font-medium max-w-md" title={r.modelo}>
                          {r.modelo}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-bold ${
                            r.stock_final === null || r.stock_final === undefined
                              ? "text-slate-400"
                              : r.stock_final === 0
                              ? "text-red-600"
                              : r.stock_final <= 5
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {r.stock_final ?? "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${
                            !r.status_equipo
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : r.status_equipo.toLowerCase().includes("activo") ||
                                r.status_equipo.toLowerCase().includes("disponible") ||
                                r.status_equipo.toLowerCase().includes("life")
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : r.status_equipo.toLowerCase().includes("inactivo") ||
                                r.status_equipo.toLowerCase().includes("baja")
                              ? "bg-red-50 text-red-700 border-red-200"
                              : r.status_equipo.toLowerCase().includes("mantenimiento") ||
                                r.status_equipo.toLowerCase().includes("reposo") ||
                                r.status_equipo.toLowerCase().includes("phase")
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {r.status_equipo || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600 font-medium">
                          {r.hoja}
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>
        ) : (
          !loading &&
          modelo && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-slate-600 text-lg">
                Sin resultados para <span className="font-semibold text-slate-800">"{modelo}"</span>
              </p>
              <p className="text-slate-500 text-sm mt-2">Intenta con otro término de búsqueda</p>
            </div>
          )
        )}

        {!modelo && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>

            <p className="text-slate-800 text-lg font-medium mb-2">Comienza a escribir para buscar</p>
            <p className="text-slate-600">Ingresa el modelo de un equipo en el campo de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
}
