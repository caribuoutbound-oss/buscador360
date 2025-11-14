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

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Buscador de Equipos
        </h1>

        {/* Input */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar modelo..."
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            className="w-80 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm"
          />
          {loading && <span className="text-gray-500 text-sm">Buscando...</span>}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-2 rounded-md mb-4 text-center text-sm">
            {error}
          </div>
        )}

        {/* Tabla */}
        {resultados.length > 0 ? (
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Código SAP</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Modelo</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Stock</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Sede</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r, index) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-blue-50 transition-colors duration-150 cursor-pointer ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-3 py-2 border-b font-mono text-gray-900">{r.codigo_sap}</td>
                    <td className="px-3 py-2 border-b text-gray-900 max-w-xs truncate" title={r.modelo}>
                      {r.modelo}
                    </td>
                    <td
                      className={`px-3 py-2 border-b text-sm ${
                        r.stock_final === 0
                          ? "text-red-600 font-medium"
                          : r.stock_final <= 5
                          ? "text-yellow-600 font-medium"
                          : "text-green-600 font-medium"
                      }`}
                    >
                      {r.stock_final ?? "-"}
                    </td>
                    <td className="px-3 py-2 border-b">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          !r.status_equipo
                            ? "bg-gray-100 text-gray-800"
                            : r.status_equipo.toLowerCase().includes("activo") ||
                              r.status_equipo.toLowerCase().includes("disponible")
                            ? "bg-green-100 text-green-800"
                            : r.status_equipo.toLowerCase().includes("inactivo") ||
                              r.status_equipo.toLowerCase().includes("baja")
                            ? "bg-red-100 text-red-800"
                            : r.status_equipo.toLowerCase().includes("mantenimiento") ||
                              r.status_equipo.toLowerCase().includes("reposo")
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {r.status_equipo || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2 border-b text-gray-600">{r.hoja}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loading &&
          modelo && (
            <p className="text-center mt-4 text-gray-500 italic text-sm">Sin resultados…</p>
          )
        )}

        {!modelo && (
          <p className="text-center mt-4 text-gray-400 italic text-sm">
            Empieza a escribir…
          </p>
        )}
      </div>
    </div>
  );
}
