import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { supabase } from "./supabase";

// Función para normalizar los códigos SAP
const normalizarCodigo = (codigo) => {
  if (!codigo) return "";
  return codigo.toString().trim().toUpperCase().replace(/\s+/g, "");
};

// Función para normalizar texto (modelos)
const normalizarTexto = (texto) => {
  if (!texto) return "";
  return texto.toString().trim().toUpperCase().replace(/\s+/g, " ");
};

export default function App() {
  const [modelo, setModelo] = useState("");
  const [sedeFiltro, setSedeFiltro] = useState("");
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortStockDesc, setSortStockDesc] = useState(true);

  // Estado para el modal de especificaciones
  const [selectedCodigoSap, setSelectedCodigoSap] = useState(null);
  const [especificaciones, setEspecificaciones] = useState(null);
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  const buscarTiempoReal = useCallback(
    debounce(async (texto) => {
      if (!texto.trim()) {
        setResultados([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data: equiposData, error: equiposError } = await supabase
          .from("equipos")
          .select("id, hoja, codigo_sap, modelo, stock_final, status_equipo")
          .or(`modelo.ilike.%${texto}%,codigo_sap.ilike.%${texto}%`)
          .limit(50);
        if (equiposError) throw equiposError;

        const { data: accesoriosData, error: accesoriosError } = await supabase
          .from("accesorios")
          .select("id, codigo_sap, modelo, accesorio")
          .or(`modelo.ilike.%${texto}%,codigo_sap.ilike.%${texto}%`)
          .limit(50);
        if (accesoriosError) throw accesoriosError;

        const accesoriosMapByCodigo = {};
        accesoriosData.forEach(acc => {
          const codigoNormalizado = normalizarCodigo(acc.codigo_sap);
          if (codigoNormalizado) {
            accesoriosMapByCodigo[codigoNormalizado] = acc;
          }
        });

        const combinados = equiposData.map((eq) => {
          let acc = null;
          const codigoNormalizado = normalizarCodigo(eq.codigo_sap);
          if (codigoNormalizado && accesoriosMapByCodigo[codigoNormalizado]) {
            acc = accesoriosMapByCodigo[codigoNormalizado];
          }

          if (!acc) {
            const modeloEquipoNormalizado = normalizarTexto(eq.modelo);
            for (const accesorio of accesoriosData) {
              const modeloAccesorioNormalizado = normalizarTexto(accesorio.modelo);
              if (
                modeloAccesorioNormalizado &&
                modeloEquipoNormalizado.includes(modeloAccesorioNormalizado)
              ) {
                acc = accesorio;
                break;
              }
            }
          }

          return { ...eq, accesorio: acc?.accesorio ?? "-" };
        });

        setResultados(combinados || []);
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

  useEffect(() => {
    const sedes = Array.from(new Set(resultados.map(r => r.hoja).filter(Boolean)));
    setSedesDisponibles(sedes);

    if (sedeFiltro && !sedes.includes(sedeFiltro)) {
      setSedeFiltro("");
    }
  }, [resultados]);

  const resultadosFiltrados = resultados
    .filter(r => (sedeFiltro ? r.hoja === sedeFiltro : true))
    .sort((a, b) => {
      if (sortStockDesc) return (b.stock_final || 0) - (a.stock_final || 0);
      return (a.stock_final || 0) - (b.stock_final || 0);
    });

  const totalStock = resultadosFiltrados.reduce(
    (sum, r) => sum + (r.stock_final || 0),
    0
  );

  const itemsActivos = resultadosFiltrados.filter((r) =>
    r.status_equipo &&
    (r.status_equipo.toLowerCase().includes("activo") ||
      r.status_equipo.toLowerCase().includes("disponible") ||
      r.status_equipo.toLowerCase().includes("life"))
  ).length;

  const cargarEspecificaciones = async (codigoSap) => {
    if (!codigoSap) return;

    setLoadingSpecs(true);
    try {
      const { data, error } = await supabase
        .from("especificaciones")
        .select("*")
        .eq("codigo_sap", normalizarCodigo(codigoSap))
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setEspecificaciones(data || null);
    } catch (err) {
      console.error("Error al cargar especificaciones:", err);
      setEspecificaciones(null);
    } finally {
      setLoadingSpecs(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && selectedCodigoSap) {
        setSelectedCodigoSap(null);
        setEspecificaciones(null);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [selectedCodigoSap]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Fijo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">Inventario 360</h1>
                <p className="text-slate-300 text-xs -mt-0.5 hidden sm:block">
                  Gestión de equipos
                </p>
              </div>
            </div>
            <p className="text-slate-300 text-sm hidden sm:block">
              Sistema de inventario - métricas 😺
            </p>
          </div>
        </div>
      </header>

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Buscador + Filtro */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 mb-6 hover:shadow-xl transition-shadow duration-300 flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 relative w-full sm:w-auto">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por modelo o código SAP..."
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
              />
            </div>

            <div className="w-full sm:w-48">
              <select
                value={sedeFiltro}
                onChange={(e) => setSedeFiltro(e.target.value)}
                className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las sedes</option>
                {sedesDisponibles.map((sede) => (
                  <option key={sede} value={sede}>
                    {sede}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estadísticas */}
          {modelo && resultadosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-600 mb-1">Resultados</p>
                    <p className="text-xl font-bold text-slate-800">{resultadosFiltrados.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm border border-emerald-200 p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-600 mb-1">Stock Total</p>
                    <p className="text-xl font-bold text-slate-800">{totalStock.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-1">Activos</p>
                    <p className="text-xl font-bold text-slate-800">{itemsActivos}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-purple-600 mb-1">Tasa Activos</p>
                    <p className="text-xl font-bold text-slate-800">
                      {resultadosFiltrados.length > 0
                        ? Math.round((itemsActivos / resultadosFiltrados.length) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-red-800 text-sm">Error de conexión</p>
                  <p className="text-red-700 text-xs">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabla */}
          {resultadosFiltrados.length > 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Código SAP</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Modelo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Accesorio</th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSortStockDesc(!sortStockDesc)}
                      >
                        Stock {sortStockDesc ? "⬇️" : "⬆️"}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Sede</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Especificaciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {resultadosFiltrados.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50 transition-all duration-200 hover:shadow-sm"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded border">
                            {r.codigo_sap}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-800 font-medium max-w-md truncate" title={r.modelo}>
                            {r.modelo}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-700 max-w-md truncate" title={r.accesorio}>
                            {r.accesorio}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
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
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                              !r.status_equipo
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : r.status_equipo.toLowerCase().includes("activo") ||
                                  r.status_equipo.toLowerCase().includes("disponible") ||
                                  r.status_equipo.toLowerCase().includes("life")
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : r.status_equipo.toLowerCase().includes("inactivo") ||
                                  r.status_equipo.toLowerCase().includes("baja")
                                ? "bg-red-100 text-red-700 border-red-200"
                                : r.status_equipo.toLowerCase().includes("mantenimiento") ||
                                  r.status_equipo.toLowerCase().includes("reposo") ||
                                  r.status_equipo.toLowerCase().includes("phase")
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-blue-100 text-blue-700 border-blue-200"
                            }`}
                          >
                            {r.status_equipo || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-slate-600 font-medium bg-slate-50 px-2 py-1 rounded border">
                            {r.hoja}
                          </span>
                        </td>
                        {/* ✨ Botón moderno con micro-interacción */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCodigoSap(r.codigo_sap);
                              cargarEspecificaciones(r.codigo_sap);
                            }}
                            className="relative flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-500 hover:text-white transition-all duration-200 shadow-sm hover:shadow-md group"
                            title="Ver especificaciones técnicas"
                          >
                            <svg
                              className="w-4 h-4 transition-transform group-hover:scale-110"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </button>
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
              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors duration-200">
                <div className="w-16 h-16 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-slate-600 text-base mb-2">
                  No se encontraron resultados para{" "}
                  <span className="font-semibold text-slate-800">"{modelo}"</span>
                </p>
                <p className="text-slate-500 text-sm">
                  Intenta con otro término de búsqueda
                </p>
              </div>
            )
          )}

          {!modelo && !loading && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-slate-200 hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-slate-800 text-lg font-medium mb-2">Comienza a buscar</p>
              <p className="text-slate-600">Ingresa el modelo o código SAP para comenzar</p>
            </div>
          )}
        </div>
      </div>

      {/* ✨ Modal moderno con animación */}
      {selectedCodigoSap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => {
            setSelectedCodigoSap(null);
            setEspecificaciones(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeInScale 0.25s ease-out forwards" }}
          >
            <style jsx>{`
              @keyframes fadeInScale {
                from {
                  opacity: 0;
                  transform: scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}</style>

            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-xl">
              <h2 className="text-base font-semibold text-slate-800">Especificaciones Técnicas</h2>
              <button
                onClick={() => {
                  setSelectedCodigoSap(null);
                  setEspecificaciones(null);
                }}
                className="text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1 hover:bg-slate-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 text-sm">
              {loadingSpecs ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : especificaciones ? (
                <div className="space-y-2.5">
                  {Object.entries(especificaciones)
                    .filter(([key]) => !['id', 'created_at'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="font-medium text-slate-600 min-w-[120px] capitalize text-xs">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="text-slate-800 ml-2 text-sm">
                          {value || "-"}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm">
                  <p>No se encontraron especificaciones para este equipo.</p>
                  <p className="mt-1 opacity-80">Código SAP: {selectedCodigoSap}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
