// src/App.jsx
import { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { supabase } from './supabase';

export default function App() {
  const [modelo, setModelo] = useState('');
  const [resultados, setResultados] = useState([]);
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]); // Nuevo estado para la búsqueda en vivo
  const [loading, setLoading] = useState(false);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false); // Nuevo estado de carga para la búsqueda en vivo
  const [error, setError] = useState(null);

  // --- Función de búsqueda principal ---
  const buscar = async (modeloABuscar) => {
    if (!modeloABuscar.trim()) {
      setResultados([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('equipos')
        .select('id,hoja,codigo_sap,modelo,stock_final,status_equipo')
        .ilike('modelo', `%${modeloABuscar}%`)
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

  // --- Función de búsqueda en tiempo real (con debounce) ---
  const buscarEnTiempoReal = useCallback(
    debounce(async (modeloABuscar) => {
      if (!modeloABuscar.trim()) {
        setResultadosBusqueda([]);
        return;
      }

      setLoadingBusqueda(true);
      try {
        const { data, error } = await supabase
          .from('equipos')
          .select('id, modelo') // Solo traemos modelo e id para la sugerencia
          .ilike('modelo', `%${modeloABuscar}%`)
          .limit(10); // Limitamos a 10 sugerencias

        if (error) throw error;
        setResultadosBusqueda(data || []);
      } catch (err) {
        console.error('Error en la búsqueda en tiempo real:', err);
        setResultadosBusqueda([]);
      } finally {
        setLoadingBusqueda(false);
      }
    }, 300), // 300ms de retraso
    []
  );

  // --- Efecto para disparar la búsqueda en tiempo real ---
  useEffect(() => {
    buscarEnTiempoReal(modelo);
    // La función `buscarEnTiempoReal.cancel` se puede usar aquí si se deseara cancelar
    // la búsqueda anterior si cambia el modelo, pero `debounce` ya lo maneja internamente.
  }, [modelo, buscarEnTiempoReal]);

  // --- Handler para el botón de búsqueda ---
  const manejarBusquedaClick = () => {
    if (!modelo.trim()) {
      setError('Por favor, ingresa un modelo para buscar.');
      setResultados([]);
      return;
    }
    setError(null); // Limpiar error anterior si se intenta buscar de nuevo
    buscar(modelo);
  };

  // --- Handler para Enter ---
  const manejarKeyPress = (e) => {
    if (e.key === 'Enter') {
      manejarBusquedaClick();
    }
  };

  // --- Handler para seleccionar un modelo de la lista de sugerencias ---
  const seleccionarModelo = (modeloSeleccionado) => {
    setModelo(modeloSeleccionado);
    setResultadosBusqueda([]); // Limpiar sugerencias
    // Opcional: Llamar a la búsqueda principal automáticamente
    // buscar(modeloSeleccionado);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Buscador de Equipos</h1>

      <div style={styles.searchContainer}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <input
            style={styles.searchInput}
            placeholder="Buscar modelo..."
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            onKeyPress={manejarKeyPress}
          />
          {/* Lista de sugerencias */}
          {modelo && resultadosBusqueda.length > 0 && (
            <ul style={styles.suggestionsList}>
              {resultadosBusqueda.map((r) => (
                <li
                  key={r.id}
                  style={styles.suggestionItem}
                  onClick={() => seleccionarModelo(r.modelo)}
                >
                  {r.modelo}
                </li>
              ))}
            </ul>
          )}
          {modelo && loadingBusqueda && (
            <div style={styles.loadingSuggestions}>Buscando...</div>
          )}
        </div>
        <button
          style={styles.searchButton}
          onClick={manejarBusquedaClick}
          disabled={loading || !modelo.trim()}
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
          {modelo ? 'No se encontraron resultados para la búsqueda.' : 'Ingresa un modelo y presiona "Buscar".'}
        </p>
      )}

      <p style={styles.note}>
        Nota: la búsqueda principal es insensible a mayúsculas/minúsculas y busca coincidencias parciales.
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
    alignItems: 'flex-start', // Alinea el input y el botón al inicio
    gap: '10px',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  searchInput: {
    padding: '12px 16px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    boxSizing: 'border-box',
  },
  suggestionsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '0 0 8px 8px',
    maxHeight: '200px',
    overflowY: 'auto',
    listStyle: 'none',
    padding: 0,
    margin: '0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  suggestionItem: {
    padding: '10px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '0.95rem',
    color: '#374151',
  },
  suggestionItemHover: {
    backgroundColor: '#f3f4f6',
  },
  loadingSuggestions: {
    padding: '10px 16px',
    fontSize: '0.9rem',
    color: '#6b7280',
    textAlign: 'center',
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
    alignSelf: 'flex-start', // Alinea el botón al inicio verticalmente
    marginTop: '0px', // Ajuste fino si es necesario
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
