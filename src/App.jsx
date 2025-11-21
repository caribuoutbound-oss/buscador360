import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { supabase } from "./supabase";

// ============================================
// 🛠️ UTILIDADES
// ============================================
const normalizarCodigo = (codigo) => {
  if (!codigo) return "";
  return codigo.toString().trim().toUpperCase().replace(/\s+/g, "");
};

const normalizarTexto = (texto) => {
  if (!texto) return "";
  return texto.toString().trim().toUpperCase().replace(/\s+/g, " ");
};

const getStatusColor = (status) => {
  if (!status) return "bg-blue-100 text-blue-700 border-blue-200";
  const statusLower = status.toLowerCase();
  if (statusLower.includes("activo") || statusLower.includes("disponible") || statusLower.includes("life")) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (statusLower.includes("inactivo") || statusLower.includes("baja")) {
    return "bg-red-100 text-red-700 border-red-200";
  }
  if (statusLower.includes("mantenimiento") || statusLower.includes("reposo") || statusLower.includes("phase")) {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  return "bg-blue-100 text-blue-700 border-blue-200";
};

// ============================================
// 🔧 CUSTOM HOOKS
// ============================================
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// ============================================
// 🔍 CUSTOM HOOK PARA BÚSQUEDA
// ============================================
const useInventorySearch = (searchTerm) => {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    const buscar = async () => {
      if (!debouncedSearch.trim()) {
        setResultados([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [equiposResponse, accesoriosResponse] = await Promise.all([
          supabase
            .from("equipos")
            .select("id, hoja, codigo_sap, modelo, stock_final, status_equipo")
            .or(`modelo.ilike.%${debouncedSearch}%,codigo_sap.ilike.%${debouncedSearch}%`)
            .limit(50),
          supabase
            .from("accesorios")
            .select("id, codigo_sap, modelo, accesorio")
            .or(`modelo.ilike.%${debouncedSearch}%,codigo_sap.ilike.%${debouncedSearch}%`)
            .limit(50)
        ]);

        if (equiposResponse.error) throw equiposResponse.error;
        if (accesoriosResponse.error) throw accesoriosResponse.error;

        // Crear índice rápido por código SAP
        const accesoriosPorCodigo = new Map(
          accesoriosResponse.data
            .filter(acc => acc.codigo_sap)
            .map(acc => [normalizarCodigo(acc.codigo_sap), acc])
        );

        // Matching optimizado
        const combinados = equiposResponse.data.map((eq) => {
          const codigoNorm = normalizarCodigo(eq.codigo_sap);
          let accesorio = accesoriosPorCodigo.get(codigoNorm);

          // Matching por modelo si no hay match por código
          if (!accesorio) {
            const modeloEqNorm = normalizarTexto(eq.modelo);
            accesorio = accesoriosResponse.data.find(acc => {
              const modeloAccNorm = normalizarTexto(acc.modelo);
              return modeloAccNorm && modeloEqNorm.includes(modeloAccNorm);
            });
          }

          return { 
            ...eq, 
            accesorio: accesorio?.accesorio ?? "-"
          };
        });

        setResultados(combinados);

      } catch (err) {
        console.error("Error en búsqueda:", err);
        setError(err.message);
        setResultados([]);
      } finally {
        setLoading(false);
      }
    };

    buscar();
  }, [debouncedSearch]);

  return { resultados, loading, error };
};

// ============================================
// 📊 COMPONENTES
// ============================================
const StatsCard = ({ label, value, icon, colorClass }) => (
  <div className={`bg-gradient-to-br ${colorClass} rounded-xl shadow-sm border p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium mb-1 opacity-80">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
      <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center shadow-md">
        {icon}
      </div>
    </div>
  </div>
);

const TableRow = ({ resultado }) => {
  const stockColor = 
    resultado.stock_final === null || resultado.stock_final === undefined
      ? "text-slate-400"
      : resultado.stock_final === 0
      ? "text-red-600"
      : resultado.stock_final <= 5
      ? "text-amber-600"
      : "text-emerald-600";

  return (
    <tr className="hover:bg-slate-50 transition-all duration-200 hover:shadow-sm cursor-pointer">
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded border">
          {resultado.codigo_sap}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-slate-800 font-medium max-w-md truncate" title={resultado.modelo}>
          {resultado.modelo}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-slate-700 max-w-md truncate" title={resultado.accesorio}>
          {resultado.accesorio}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`text-sm font-bold ${stockColor}`}>
          {resultado.stock_final ?? "-"}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(resultado.status_equipo)}`}>
          {resultado.status_equipo || "-"}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-sm text-slate-600 font-medium bg-slate-50 px-2 py-1 rounded border">
          {resultado.hoja}
        </span>
      </td>
    </tr>
  );
};

// ============================================
// 🎨 COMPONENTE PRINCIPAL
// ============================================
export default function App() {
  const [modelo, setModelo] = useState("");
  const [sedeFiltro, setSedeFiltro] = useState("");
  const [sortStockDesc, setSortStockDesc] = useState(true);
  
  const { resultados, loading, error } = useInventorySearch(modelo);

  // Sedes disponibles (memoizado)
  const sedesDisponibles = Array.from(new Set(resultados.map(r => r.hoja).filter(Boolean))).sort();

  // Resultados filtrados y ordenados
  const resultadosFiltrados = resultados
    .filter(r => !sedeFiltro || r.hoja === sedeFiltro)
    .sort((a, b) => {
      const diff = (b.stock_final || 0) - (a.stock_final || 0);
      return sortStockDesc ? diff : -diff;
    });

  // Estadísticas
  const stats = {
    total: resultadosFiltrados.length,
    totalStock: resultadosFiltrados.reduce((sum, r) => sum + (r.stock_final || 0), 0),
    itemsActivos: resultadosFiltrados.filter(r => {
      const status = r.status_equipo?.toLowerCase() || "";
      return status.includes("activo") || status.includes("disponible") || status.includes("life");
    }).length,
    tasaActivos: resultadosFiltrados.length > 0 
      ? Math.round((stats.itemsActivos / resultadosFiltrados.length) * 100)
      : 0
  };

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = ["Código SAP", "Modelo", "Accesorio", "Stock", "Estado", "Sede"];
    const rows = resultadosFiltrados.map(r => [
      r.codigo_sap,
      r.modelo,
      r.accesorio,
      r.stock_final ?? "",
      r.status_equipo || "",
      r.hoja
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventario_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
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
                <p className="text-slate-300 text-xs -mt-0.5 hidden sm:block">Gestión optimizada</p>
              </div>
            </div>
            {resultadosFiltrados.length > 0 && (
              <button
                onClick={exportarCSV}
                className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Barra de búsqueda y filtros */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 relative w-full">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por modelo o código SAP..."
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="w-full sm:w-48">
              <select
                value={sedeFiltro}
                onChange={(e) => setSedeFiltro(e.target.value)}
                className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las sedes</option>
                {sedesDisponibles.map((sede) => (
                  <option key={sede} value={sede}>{sede}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Estadísticas */}
          {modelo && resultadosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard
                label="Resultados"
                value={stats.total}
                colorClass="from-blue-50 to-blue-100 border-blue-200"
                icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
              />
              <StatsCard
                label="Stock Total"
                value={stats.totalStock.toLocaleString()}
                colorClass="from-emerald-50 to-emerald-100 border-emerald-200"
                icon={<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
              />
              <StatsCard
                label="Activos"
                value={stats.itemsActivos}
                colorClass="from-green-50 to-green-100 border-green-200"
                icon={<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
              />
              <StatsCard
                label="Tasa Activos"
                value={`${stats.tasaActivos}%`}
                colorClass="from-purple-50 to-purple-100 border-purple-200"
                icon={<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-xl shadow-sm">
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
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Código SAP</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Modelo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Accesorio</th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors"
                        onClick={() => setSortStockDesc(!sortStockDesc)}
                      >
                        Stock {sortStockDesc ? "⬇️" : "⬆️"}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Sede</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {resultadosFiltrados.map((r) => (
                      <TableRow key={r.id} resultado={r} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : !loading && modelo ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-slate-600 text-base mb-2">
                No se encontraron resultados para <span className="font-semibold">"{modelo}"</span>
              </p>
              <p className="text-slate-500 text-sm">Intenta con otro término</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-slate-200">
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
    </div>
  );
}
