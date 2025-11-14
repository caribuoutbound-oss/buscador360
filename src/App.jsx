import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { supabase } from "./supabase";

export default function App() {
  const [modelo, setModelo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Buscador principal EN TIEMPO REAL ---
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
    <div className="max-w-6xl mx-auto p-6 font-sans">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Buscador de Equipos
      </h1>

      {/* Input */}
      <div className="flex justify-center items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar modelo..."
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          className="w-96 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
        {loading && <span className="text-gray-500">Buscando...</span>}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg mb-4 text-center">
          {error}
        </div>
      )}

      {/* Tabla */}
      {resultados.length > 0 ? (
        <div className="overflow-x-auto rounded-lg shadow-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Código SAP</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Modelo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Stock Final</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Sede</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="px-4 py-3 border-b">{r.codigo_sap}</td>
                  <td className="px-4 py-3 border-b">{r.modelo}</td>
                  <td className="px-4 py-3 border-b">{r.stock_final}</td>
                  <td className="px-4 py-3 border-b">{r.status_equipo || "-"}</td>
                  <td className="px-4 py-3 border-b">{r.hoja}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading &&
        modelo && (
          <p className="text-center mt-6 text-gray-500 italic">
            Sin resultados…
          </p>
        )
      )}

      {!modelo && (
        <p className="text-center mt-6 text-gray-400 italic">
          Empieza a escribir…
        </p>
      )}
    </div>
  );
}
