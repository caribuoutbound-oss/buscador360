import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { supabase } from "./supabase";

export default function App() {
  const [modelo, setModelo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Función de búsqueda optimizada ---
  const buscarModelo = useCallback(
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
          .limit(100);

        if (error) throw error;
        setResultados(data || []);
      } catch (err) {
        setError(err.message);
        setResultados([]);
      }

      setLoading(false);
    }, 250), // busca cada 250ms
    []
  );

  // --- Buscar automáticamente al escribir ---
  useEffect(() => {
    buscarModelo(modelo);
    return () => buscarModelo.cancel();
  }, [modelo]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Buscador de Equipos</h1>

      {/* INPUT */}
      <div style={styles.searchContainer}>
        <input
          style={styles.searchInput}
          placeholder="Buscar modelo..."
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
        />
        {loading && <span style={styles.loading}>Buscando...</span>}
      </div>

      {/* ERRORES */}
      {error && <p style={styles.error}>{error}</p>}

      {/* RESULTADOS */}
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
        modelo && <p style={styles.noResults}>No se encontraron resultados.</p>
      )}

      {!modelo && (
        <p style={styles.noResults}>Empieza a escribir para buscar.</p>
      )}
    </div>
  );
}

/* --- ESTILOS --- */
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
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  searchInput: {
    padding: "12px",
    width: "360px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "1rem",
  },
  loading: {
    fontSize: "0.9rem",
    color: "#555",
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
    background: "white",
    borderCollapse: "collapse",
  },
  th: {
    padding: "10px",
    background: "#f0f0f0",
    fontWeight: "bold",
    textAlign: "left",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #e5e5e5",
  },
  noResults: {
    textAlign: "center",
    marginTop: "20px",
    color: "#777",
    fontStyle: "italic",
  },
};
