import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { supabase } from "./supabase";

// Función para normalizar los códigos SAP
const normalizarCodigo = (codigo) => {
  if (!codigo) return "";
  return codigo.toString().trim().toUpperCase().replace(/\s+/g, "");
};

// Función para normalizar texto (modelos): quitar espacios extra, convertir a mayúsculas
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
      {/* Header Fijo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Inventario 360
                </h1>
                <p className="text-slate-500 text-xs -mt-0.5 hidden sm:block font-medium">
                  Sistema de gestión inteligente
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm">
              <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 rounded-lg font-medium border border-emerald-200/50">
                En línea
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Buscador Premium */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 mb-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
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
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border-2 border-slate-200/50 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 text-slate-800 placeholder-slate-400 transition-all duration-200 font-medium"
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
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50/50 border-2 border-slate-200/50 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 text-slate-700 font-medium appearance-none cursor-pointer transition-all duration-200"
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

          {/* Estadísticas */}
          {modelo && resultadosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/30 p-6 transform hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide">Resultados</p>
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{resultadosFiltrados.length}</p>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-emerald-500/30 p-6 transform hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wide">Stock Total</p>
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{totalStock.toLocaleString()}</p>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-violet-500/30 p-6 transform hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-violet-100 text-sm font-semibold uppercase tracking-wide">Activos</p>
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">{itemsActivos}</p>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-amber-500/30 p-6 transform hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-amber-100 text-sm font-semibold uppercase tracking-wide">Tasa Activos</p>
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {resultadosFiltrados.length > 0
                      ? Math.round((itemsActivos / resultadosFiltrados.length) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 p-5 mb-8 rounded-xl shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-red-800 text-sm mb-1">Error de conexión</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabla Premium */}
          {resultadosFiltrados.length > 0 ? (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200/50">
                  <thead className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Código SAP
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Modelo
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Accesorio
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors select-none"
                        onClick={() => setSortStockDesc(!sortStockDesc)}
                      >
                        <div className="flex items-center gap-2">
                          Stock
                          <svg className={`w-4 h-4 transition-transform duration-200 ${sortStockDesc ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Sede
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Especificaciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-slate-100/50">
                    {resultadosFiltrados.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-blue-50/50 transition-all duration-200 group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2 text-sm font-mono font-semibold text-slate-700 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/50 group-hover:border-blue-300 group-hover:bg-blue-50 transition-all duration-200">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            {r.codigo_sap}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-800 font-medium max-w-md truncate" title={r.modelo}>
                            {r.modelo}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600 max-w-md truncate" title={r.accesorio}>
                            {r.accesorio}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 text-sm font-bold rounded-lg ${
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border backdrop-blur-sm ${
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 font-medium bg-slate-50/80 px-3 py-1.5 rounded-lg border border-slate-200/50">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {r.hoja}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCodigoSap(r.codigo_sap);
                              cargarEspecificaciones(r.codigo_sap);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 transition-all duration-200 group/btn"
                            title="Ver especificaciones técnicas"
                          >
                            <svg 
                              className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-200" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="hidden sm:inline">Ver detalles</span>
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
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-12 text-center border-2 border-dashed border-slate-200/50">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-slate-700 text-lg font-semibold mb-2">
                  No se encontraron resultados
                </p>
                <p className="text-slate-500 text-base mb-1">
                  para <span className="font-semibold text-slate-700">"{modelo}"</span>
                </p>
                <p className="text-slate-400 text-sm">
                  Intenta con otro término de búsqueda
                </p>
              </div>
            )
          )}

          {/* Pantalla de inicio */}
          {!modelo && !loading && (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-12 text-center border border-white/50">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-slate-800 text-xl font-bold mb-2">
                Comienza tu búsqueda
              </p>
              <p className="text-slate-600 text-base">
                Ingresa el modelo o código SAP para explorar el inventario
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Premium de Especificaciones */}
      {selectedCodigoSap && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn"
          onClick={() => {
            setSelectedCodigoSap(null);
            setEspecificaciones(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden transform animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Especificaciones Técnicas
                    </h2>
                    <p className="text-blue-100 text-sm font-medium">
                      Código SAP: {selectedCodigoSap}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCodigoSap(null);
                    setEspecificaciones(null);
                  }}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:rotate-90 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"></div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)] custom-scrollbar">
              {loadingSpecs ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-slate-600 font-medium">Cargando especificaciones...</p>
                </div>
              ) : especificaciones ? (
                <div className="space-y-3">
                  {Object.entries(especificaciones)
                    .filter(([key]) => !['id', 'created_at'].includes(key))
                    .map(([key, value], index) => (
                      <div 
                        key={key} 
                        className="group flex items-start gap-4 p-4 bg-gradient-to-r from-slate-50/80 to-blue-50/50 rounded-xl border border-slate-200/50 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="font-semibold text-slate-700 capitalize text-sm whitespace-nowrap">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <span className="text-slate-800 text-sm break-words">
                              {value || <span className="text-slate-400 italic">No especificado</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-700 font-semibold text-lg mb-2">No hay especificaciones disponibles</p>
                  <p className="text-slate-500 text-sm">Código SAP: {selectedCodigoSap}</p>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-t border-slate-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Presiona ESC para cerrar</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedCodigoSap(null);
                    setEspecificaciones(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-sm font-semibold rounded-lg hover:from-slate-700 hover:to-slate-800 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
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
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
