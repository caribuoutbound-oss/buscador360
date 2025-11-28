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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Fijo - Dark Gradient */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border-b border-slate-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform duration-200">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Inventario 360
                </h1>
                <p className="text-slate-300 text-xs -mt-0.5 hidden sm:block font-medium">
                  Sistema de gestión inteligente
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm">
              <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 rounded-lg font-medium border border-emerald-400/30">
                En línea
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenedor principal - OCUPA 90% DE LA ALTURA DE LA PANTALLA */}
      <div className="pt-16 h-[90vh] flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 overflow-y-auto hide-scrollbar">
          {/* Buscador compacto */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 px-6 py-3 mb-5 hover:shadow-2xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex-1 relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar modelo o código SAP..."
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50/50 border-2 border-slate-200/50 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 text-slate-800 placeholder-slate-400 transition-all duration-200 font-medium text-sm"
                />
                {modelo && (
                  <button
                    onClick={() => setModelo("")}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="w-full sm:w-56 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <select
                  value={sedeFiltro}
                  onChange={(e) => setSedeFiltro(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border-2 border-slate-200/50 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 text-slate-700 font-medium text-sm appearance-none cursor-pointer transition-all duration-200"
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
          </div>

          {/* Estadísticas compactas */}
          {modelo && resultadosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Resultados", value: resultadosFiltrados.length, icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", color: "from-blue-500 to-blue-600" },
                { label: "Stock Total", value: totalStock.toLocaleString(), icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "from-emerald-500 to-teal-600" },
                { label: "Activos", value: itemsActivos, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "from-violet-500 to-purple-600" },
                {
                  label: "Tasa Activos",
                  value: `${resultadosFiltrados.length > 0 ? Math.round((itemsActivos / resultadosFiltrados.length) * 100) : 0}%`,
                  icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
                  color: "from-amber-500 to-orange-600"
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`group relative overflow-hidden bg-gradient-to-br ${item.color} rounded-lg shadow-sm hover:shadow-md p-3 transform hover:scale-[1.02] transition-all duration-200`}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white/90 text-[10px] font-semibold">{item.label}</p>
                      <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-md flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-white">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 p-3 mb-5 rounded-xl shadow">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-red-800 text-[12px] mb-0.5">Error de conexión</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabla */}
          {resultadosFiltrados.length > 0 ? (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200/50 text-xs">
                  <thead className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur-sm">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Código SAP</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Modelo</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Accesorio</th>
                      <th
                        className="px-3 py-2 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors select-none"
                        onClick={() => setSortStockDesc(!sortStockDesc)}
                      >
                        <div className="flex items-center gap-1">
                          Stock
                          <svg className={`w-3 h-3 transition-transform duration-200 ${sortStockDesc ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Estado</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-700 uppercase tracking-wider">Sede</th>
                      <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-700 uppercase tracking-wider">Especificaciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-slate-100/50">
                    {resultadosFiltrados.map((r) => (
                      <tr key={r.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/50">
                            <svg className="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            {r.codigo_sap}
                          </span>
                        </td>
                        <td className="px-3 py-2 max-w-[140px]">
                          <div className="text-[11px] text-slate-800 font-medium truncate" title={r.modelo}>
                            {r.modelo}
                          </div>
                        </td>
                        <td className="px-3 py-2 max-w-[140px]">
                          <div className="text-[11px] text-slate-600 truncate" title={r.accesorio}>
                            {r.accesorio}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              r.stock_final === null || r.stock_final === undefined
                                ? "text-slate-400 bg-slate-50"
                                : r.stock_final === 0
                                ? "text-red-700 bg-red-50 border border-red-200"
                                : r.stock_final <= 5
                                ? "text-amber-700 bg-amber-50 border border-amber-200"
                                : "text-emerald-700 bg-emerald-50 border border-emerald-200"
                            }`}
                          >
                            {r.stock_final ?? "-"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border backdrop-blur-sm ${
                              !r.status_equipo
                                ? "bg-slate-50 text-slate-600 border-slate-200"
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
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 font-medium bg-slate-50/80 px-2 py-0.5 rounded border border-slate-200/50">
                            <svg className="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {r.hoja}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCodigoSap(r.codigo_sap);
                              cargarEspecificaciones(r.codigo_sap);
                            }}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[11px] font-semibold rounded hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="hidden sm:inline">Detalles</span>
                            <span className="sm:hidden">Info</span>
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
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow p-6 text-center border-2 border-dashed border-slate-200/50">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-slate-700 text-sm font-semibold mb-1">
                  No se encontraron resultados
                </p>
                <p className="text-slate-500 text-xs mb-1">
                  para <span className="font-semibold text-slate-700">"{modelo}"</span>
                </p>
                <p className="text-slate-400 text-[11px]">
                  Intenta con otro término de búsqueda
                </p>
              </div>
            )
          )}

          {/* Pantalla de inicio */}
          {!modelo && !loading && (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow p-6 text-center border border-white/50">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-slate-800 text-base font-bold mb-1">
                Comienza tu búsqueda
              </p>
              <p className="text-slate-600 text-sm">
                Ingresa el modelo o código SAP para explorar el inventario
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Especificaciones - VISTA COMPACTA */}
      {selectedCodigoSap && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn"
          onClick={() => {
            setSelectedCodigoSap(null);
            setEspecificaciones(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Especificaciones Técnicas
                    </h2>
                    <p className="text-blue-100 text-sm">
                      Código SAP: {selectedCodigoSap}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCodigoSap(null);
                    setEspecificaciones(null);
                  }}
                  className="w-9 h-9 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:rotate-90"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"></div>
            </div>

            {/* Contenido del Modal - TABLA COMPACTA */}
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar text-sm">
              {loadingSpecs ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="relative w-14 h-14 mb-3">
                    <div className="absolute inset-0 border-3 border-blue-200 rounded-full"></div>
                    <div className="absolute inset-0 border-3 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-slate-600 font-medium text-sm">Cargando especificaciones...</p>
                </div>
              ) : especificaciones ? (
                <div className="overflow-hidden">
                  <table className="w-full text-xs leading-tight">
                    <tbody>
                      {Object.entries(especificaciones)
                        .filter(([key]) => !['id', 'created_at', 'codigo_sap'].includes(key))
                        .map(([key, value]) => (
                          <tr key={key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                            <td className="w-2/5 py-2 px-2 font-medium text-slate-600 capitalize whitespace-nowrap">
                              {key.replace(/_/g, " ")}:
                            </td>
                            <td className="w-3/5 py-2 px-2 text-slate-800 break-words">
                              {value || <span className="text-slate-400 italic">—</span>}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-3 shadow">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-700 font-semibold text-base mb-1">No hay especificaciones disponibles</p>
                  <p className="text-slate-500 text-sm">Código SAP: {selectedCodigoSap}</p>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-3 border-t border-slate-200/50">
              <div className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Presiona ESC para cerrar</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedCodigoSap(null);
                    setEspecificaciones(null);
                  }}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-[13px] font-semibold rounded-md hover:from-slate-700 hover:to-slate-800 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos personalizados */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #6366f1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #4f46e5);
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
