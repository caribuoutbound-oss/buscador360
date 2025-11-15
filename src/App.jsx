import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { supabase } from "./supabase";

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

  // --- Estadísticas ---
  const totalStock = resultados.reduce(
    (sum, r) => sum + (r.stock_final || 0),
    0
  );

  const itemsActivos = resultados.filter((r) =>
    r.status_equipo &&
    (
      r.status_equipo.toLowerCase().includes("activo") ||
      r.status_equipo.toLowerCase().includes("disponible") ||
      r.status_equipo.toLowerCase().includes("life")
    )
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-100 to-blue-100 p-6 backdrop-blur-md">

      {/* Header Glass */}
      <header className="max-w-6xl mx-auto mb-10">
        <div
          className="backdrop-blur-xl bg-white/30 border border-white/40 shadow-xl
          rounded-3xl p-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
              Inventario de Equipos
            </h1>
            <p className="text-slate-600 mt-1 text-sm">
              Consulta rápida en tiempo real
            </p>
          </div>

          <div className="hidden md:flex">
            <div className="w-14 h-14 rounded-2xl bg-white/50 shadow-inner
            backdrop-blur-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-700 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Contenedor principal */}
      <main className="max-w-6xl mx-auto space-y-8">

        {/* Buscador Glass */}
        <div className="backdrop-blur-xl bg-white/40 border border-white/60
        shadow-lg rounded-2xl p-6">

          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            <input
              type="text"
              placeholder="Buscar modelo..."
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/40 
              border border-white/60 backdrop-blur-md shadow-inner text-slate-800
              placeholder-slate-500 focus:ring-2 focus:ring-blue-300
              focus:border-blue-500 outline-none"
            />
          </div>

          {loading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Buscando...</span>
            </div>
          )}
        </div>

        {/* Stats compactas Glass */}
        {modelo && resultados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* card estática glass */}
            <div className="glass-card">
              <p className="text-sm text-slate-600">Resultados</p>
              <p className="text-4xl font-bold text-slate-800 mt-1">{resultados.length}</p>
            </div>

            <div className="glass-card">
              <p className="text-sm text-slate-600">Stock Total</p>
              <p className="text-4xl font-bold text-slate-800 mt-1">{totalStock}</p>
            </div>

            <div className="glass-card">
              <p className="text-sm text-slate-600">Equipos Activos</p>
              <p className="text-4xl font-bold text-slate-800 mt-1">{itemsActivos}</p>
            </div>

          </div>
        )}

        {/* Error */}
        {error && (
          <div className="backdrop-blur-xl bg-red-200/40 border border-red-400
          text-red-800 rounded-xl p-4 shadow-lg">
            Error: {error}
          </div>
        )}

        {/* Tabla Glass */}
        {resultados.length > 0 && (
          <div className="backdrop-blur-xl bg-white/50 border border-white/60 shadow-xl rounded-2xl overflow-hidden">

            <div className="overflow-x-auto">
              <table className="min-w-full text-slate-800">
                <thead className="bg-white/40 backdrop-blur-xl">
                  <tr>
                    {["Código SAP", "Modelo", "Stock", "Estado", "Sede"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="backdrop-blur-xl">
                  {resultados.map((r) => (
                    <tr key={r.id} className="hover:bg-white/40 transition">

                      <td className="px-6 py-4 text-sm font-mono bg-white/20 rounded">
                        {r.codigo_sap}
                      </td>

                      <td className="px-6 py-4 text-sm">{r.modelo}</td>

                      <td className="px-6 py-4">
                        <span className="font-semibold">
                          {r.stock_final ?? "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/40 backdrop-blur-md border border-white/60">
                          {r.status_equipo || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm">{r.hoja}</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mensaje vacío */}
        {!modelo && (
          <div className="backdrop-blur-xl bg-white/40 p-10 rounded-2xl border border-white/60 text-center shadow-xl">
            <p className="text-xl font-semibold text-slate-800">Comienza a escribir para buscar</p>
            <p className="text-slate-600 mt-1">Ingresa el modelo de un equipo</p>
          </div>
        )}

        {/* Sin resultados */}
        {modelo && !loading && resultados.length === 0 && (
          <div className="backdrop-blur-xl bg-white/40 p-10 rounded-2xl border border-white/60 text-center shadow-xl">
            <p className="text-xl font-semibold text-slate-800">Sin resultados</p>
            <p className="text-slate-600 mt-1">No se encontró nada para "{modelo}"</p>
          </div>
        )}

      </main>
    </div>
  );
}
