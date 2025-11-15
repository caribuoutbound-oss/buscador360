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

  const totalStock = resultados.reduce((sum, r) => sum + (r.stock_final || 0), 0);
  const itemsActivos = resultados.filter(r => 
    r.status_equipo && (
      r.status_equipo.toLowerCase().includes("activo") ||
      r.status_equipo.toLowerCase().includes("disponible") ||
      r.status_equipo.toLowerCase().includes("life")
    )
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      
      {/* Header Moderno */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            <div className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-md transform transition-all duration-300 group-hover:scale-110">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Inventario Pro
              </h1>
            </div>

            <p className="text-slate-500 text-sm hidden sm:block">
              Gestión de equipos en tiempo real
            </p>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Search UX Mejorado */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-lg p-4 mb-6 transition-all hover:shadow-xl">
            <div className="relative group">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-all duration-200 group-focus-within:text-blue-500"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>

              <input
                type="text"
                placeholder="Buscar por modelo…"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full bg-white/60 backdrop-blur-xl pl-11 pr-4 py-2 border border-slate-200 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-sm"
              />
            </div>

            {loading && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 animate-pulse">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Buscando...</span>
              </div>
            )}
          </div>

          {/* Estadísticas Modernizadas */}
          {modelo && resultados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              
              {/* CARD */}
              <StatCard
                title="Resultados"
                value={resultados.length}
                color="from-blue-500 to-blue-600"
                icon="search"
              />

              <StatCard
                title="Stock Total"
                value={totalStock.toLocaleString()}
                color="from-emerald-500 to-emerald-600"
                icon="stack"
              />

              <StatCard
                title="Activos"
                value={itemsActivos}
                color="from-green-500 to-green-600"
                icon="check"
              />

              <StatCard
                title="Tasa Activos"
                value={`${Math.round((itemsActivos / resultados.length) * 100)}%`}
                color="from-purple-500 to-purple-600"
                icon="chart"
              />
            </div>
          )}

          {/* Error Moderno */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm mb-6 flex gap-3">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-red-700">Error</p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Tabla Modernizada */}
          {resultados.length > 0 ? (
            <TableResultados resultados={resultados} />
          ) : (
            !loading &&
            modelo && (
              <EmptyState title={`No se encontraron resultados para "${modelo}"`} />
            )
          )}

          {/* Estado inicial */}
          {!modelo && !loading && <EmptyState title="Comienza a buscar un modelo" />}
        </div>
      </div>
    </div>
  );
}

/* ================================
    COMPONENTES UI MODERNIZADOS
================================ */

function StatCard({ title, value, color, icon }) {
  return (
    <div className="bg-white/80 border border-white/60 backdrop-blur-xl rounded-2xl p-4 shadow-md hover:shadow-xl transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">{title}</p>
          <p className="text-lg font-bold text-slate-800">{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow text-white`}>
          {icon === "search" && <IconSearch />}
          {icon === "stack" && <IconStack />}
          {icon === "check" && <IconCheck />}
          {icon === "chart" && <IconChart />}
        </div>
      </div>
    </div>
  );
}

function TableResultados({ resultados }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-slate-800">
          <thead className="bg-slate-50/70 backdrop-blur-xl">
            <tr>
              {["SAP", "Modelo", "Stock", "Estado", "Sede"].map((col) => (
                <th key={col}
                  className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {resultados.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-all">
                <td className="px-3 py-2">
                  <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {r.codigo_sap}
                  </span>
                </td>

                <td className="px-3 py-2">
                  <div className="text-xs font-medium text-slate-700 truncate max-w-xs">{r.modelo}</div>
                </td>

                <td className="px-3 py-2">
                  <span className="text-xs font-semibold">
                    {r.stock_final ?? "-"}
                  </span>
                </td>

                <td className="px-3 py-2">
                  <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-md border bg-slate-50 text-slate-700">
                    {r.status_equipo || "-"}
                  </span>
                </td>

                <td className="px-3 py-2">
                  <span className="text-xs text-slate-600">{r.hoja}</span>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}

function EmptyState({ title }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-md rounded-2xl p-10 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
        <IconSearch className="w-7 h-7 text-slate-500" />
      </div>
      <p className="text-slate-700 text-sm font-medium">{title}</p>
    </div>
  );
}

/* Icons */
function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
  );
}

function IconStack() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 7l9-4 9 4-9 4-9-4zm0 4l9 4 9-4m-9 4v6"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M5 13l4 4L19 7"/>
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 3v18h18M9 17V9m4 8V5m4 12v-6"/>
    </svg>
  );
}
