// src/App.jsx
import { useState } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [modelo, setModelo] = useState('');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buscar = async () => {
    if (!modelo.trim()) {
      setError('Por favor, ingresa un modelo para buscar.');
      setResultados([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('equipos')
        .select('id,hoja,codigo_sap,modelo,stock_final,status_equipo')
        .ilike('modelo', `%${modelo}%`)
        .limit(200);

      if (error) throw error;
      setResultados(data || []);
    } catch (err) {
      setError(err.message || String(err));
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  const manejarKeyPress = (e) => {
    if (e.key === 'Enter') {
      buscar();
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Buscador de Equipos</h1>

      <div style={styles.searchContainer}>
        <input
          style={styles.searchInput}
          placeholder="Buscar modelo..."
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          onKeyPress={manejarKeyPress} // Búsqueda con Enter
        />
        <button
          style={styles.searchButton}
          onClick={buscar}
          disabled={loading || !modelo.trim()} // Deshabilitar si está vacío o en blanco
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

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
                <tr key={r.id} style={styles.tr}>
                  <td style={styles.td}>{r.codigo_sap}</td>
                  <td style={styles.td}>{r.modelo}</td>
                  <td style={styles.td}>{r.stock_final}</td>
                  <td style={styles.td}>{r.status_equipo || '-'}</td>
                  <td style={styles.td}>{r.hoja}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={styles.noResults}>
          {modelo ? 'No se encontraron resultados.' : 'Ingresa un modelo y presiona "Buscar".'}
        </p>
      )}

      <p style={styles.note}>
        Nota: la búsqueda es insensible a mayúsculas/minúsculas y busca coincidencias parciales.
      </p>
    </div>
  );
}

// --- Estilos en línea ---
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
  },
  title: {
    textAlign: 'center',
    color: '#1f2937',
    fontSize: '2.2rem',
    marginBottom: '2rem',
    fontWeight: 'bold',
  },
  searchContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  searchInput: {
    padding: '12px 16px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    width: '300px',
    maxWidth: '100%',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  searchButton: {
    padding: '12px 24px',
    fontSize: '1rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  searchButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  searchButtonHover: {
    backgroundColor: '#4338ca',
  },
  error: {
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    padding: '12px',
    borderRadius: '6px',
    textAlign: 'center',
    marginBottom: '1rem',
    border: '1px solid #fecaca',
  },
  tableContainer: {
    overflowX: 'auto',
    marginBottom: '2rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    backgroundColor: '#f3f4f6',
    color: '#111827',
    fontWeight: '600',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '0.95rem',
    color: '#374151',
  },
  tr: {
    transition: 'background-color 0.2s',
  },
  trHover: {
    backgroundColor: '#f9fafb',
  },
  noResults: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    padding: '2rem',
    fontSize: '1.1rem',
  },
  note: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '0.85rem',
    marginTop: '1rem',
  },
};
