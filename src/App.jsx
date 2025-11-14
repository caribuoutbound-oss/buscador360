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
    }, 300), // 300 ms = óptimo para Vercel/Supabase
    []
  );

  // Ejecutar búsqueda al escribir
  useEffect(() => {
    buscarTiempoReal(modelo);
    return () => buscarTiempoReal.cancel();
  }, [modelo]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Buscador de Equipos</h1>

      {/* Input */}
      <div style={styles.searchContainer}>
        <input
          style={styles.searchInput}
          placeholder="Buscar modelo..."
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
        />
        {loading && <span style={styles.loading}>Buscando...</span>}
      </div>

      {/* Error */}
      {error && <p style={styles.error}>{error}</p>}

      {/* Tabla */}
      {resultados.length > 0 ? (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Código SAP</th>
                <th style={styles.th}>Modelo</th>
                <th style={styles.th}>Stock Final</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Sede</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => (
                <tr key={r.id}>
                  <td style={styles.td}>{r.codigo_sap}</td>
                  <td style={styles.td}>{r.modelo}</td>
                  <td style={styles.td}>{r.stock_final}</td>
                  <td style={styles.td}>{r.status_equipo || "-"}</td>
                  <td style={styles.td}>{r.hoja}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading &&
        modelo && <p style={styles.noResults}>Sin resultados…</p>
      )}

      {!modelo && <p style={styles.noResults}>Empieza a escribir…</p>}
    </div>
  );
}

/* ESTILOS */
const styles = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Segoe UI, sans-serif",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
  },
  searchContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    alignItems: "center",
    marginBottom: "15px",
  },
  searchInput: {
    padding: "12px",
    width: "360px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "1rem",
  },
  loading: {
    color: "#555",
    fontSize: "0.9rem",
  },
  error: {
    background: "#ffe5e5",
    color: "#d00",
    padding: "10px",
    borderRadius: "6px",
    textAlign: "center",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    background: "#f3f3f3",
    padding: "10px",
    textAlign: "left",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #e5e5e5",
  },
  noResults: {
    marginTop: "20px",
    textAlign: "center",
    opacity: 0.6,
    fontStyle: "italic",
  },
};
