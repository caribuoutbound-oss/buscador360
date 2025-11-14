import { useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [modelo, setModelo] = useState('')
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const buscar = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('equipos')
        .select('id,hoja,codigo_sap,modelo,stock_final,status_equipo')
        .ilike('modelo', `%${modelo}%`)
        .limit(200)

      if (error) throw error
      setResultados(data || [])
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Buscador de Equipos</h1>

      <div style={{ marginTop: 12 }}>
        <input
          placeholder="Buscar modelo..."
          value={modelo}
          onChange={e => setModelo(e.target.value)}
        />
        <button onClick={buscar} disabled={loading || !modelo}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {resultados.map(r => (
          <li key={r.id}>
            <strong>{r.modelo}</strong> — {r.codigo_sap} — Stock: {r.stock_final} — {r.hoja}
            {r.status_equipo ? ` — ${r.status_equipo}` : ''}
          </li>
        ))}
      </ul>

      <p style={{ marginTop: 12, color: '#666' }}>
        Nota: la búsqueda usa `ilike` (case-insensitive). Ajusta la consulta en `src/App.jsx` si necesitas filtros adicionales.
      </p>
    </div>
  )
}
