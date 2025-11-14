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
    <div className="max-w-4xl mx-auto p-6 font-sans">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Buscador de Equipos
      </h1>

      {/* Input */}
      <div className="flex justify-center items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar modelo..."
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          className="w-80 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm transition"
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
        <div className="overflow-x-auto rounded-md shadow-md">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Código SAP</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Modelo</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Stock</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Status</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Sede</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-blue-50 transition cursor-pointer"
                >
                  <td className="px-3 py-2 border-b">{r.codigo_sap}</td>
                  <td className="px-3 py-2 border-b">{r.modelo}</td>
                  <td className="px-3 py-2 border-b">{r.stock_final}</td>
                  <td className="px-3 py-2 border-b">{r.status_equipo || "-"}</td>
                  <td className="px-3 py-2 border-b">{r.hoja}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading &&
        modelo && (
          <p className="text-center mt-4 text-gray-500 italic text-sm">
            Sin resultados…
          </p>
        )
      )}

      {!modelo && (
        <p className="text-center mt-4 text-gray-400 italic text-sm">
          Empieza a escribir…
        </p>
      )}
    </div>
  );
}
