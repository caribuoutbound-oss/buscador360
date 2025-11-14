<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

  {/* Header */}
  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Package className="w-8 h-8"/>
        <h1 className="text-3xl font-bold">Buscador de Equipos</h1>
      </div>
      <p className="text-blue-100 text-sm">Sistema de consulta en tiempo real</p>
    </div>
  </div>

  <div className="max-w-7xl mx-auto px-6 py-8">

    {/* Barra de búsqueda */}
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-slate-200">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por modelo del equipo..."
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base"
        />
      </div>
      {loading && <p className="mt-3 text-sm text-slate-600">Buscando en la base de datos...</p>}
    </div>

    {/* Tarjetas de estadísticas */}
    {modelo && resultados.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
          <p className="text-sm font-medium text-slate-600 mb-1">Resultados</p>
          <p className="text-3xl font-bold text-slate-800">{resultados.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
          <p className="text-sm font-medium text-slate-600 mb-1">Stock Total</p>
          <p className="text-3xl font-bold text-slate-800">{resultados.reduce((sum,r)=>sum+(r.stock_final||0),0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
          <p className="text-sm font-medium text-slate-600 mb-1">Equipos Activos</p>
          <p className="text-3xl font-bold text-slate-800">{resultados.filter(r=>r.status_equipo?.toLowerCase().includes("activo")||r.status_equipo?.toLowerCase().includes("disponible")).length}</p>
        </div>
      </div>
    )}

    {/* Tabla profesional */}
    {resultados.length > 0 && (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Código SAP</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Modelo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Sede</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {resultados.map((r) => (
                <tr key={r.id} className="hover:bg-blue-50 transition-colors duration-150">
                  <td className="px-6 py-4 font-mono text-slate-900">{r.codigo_sap}</td>
                  <td className="px-6 py-4 truncate max-w-md" title={r.modelo}>{r.modelo}</td>
                  <td className={`px-6 py-4 font-bold ${
                    r.stock_final === 0 ? "text-red-600" : r.stock_final <= 5 ? "text-amber-600" : "text-emerald-600"
                  }`}>{r.stock_final ?? "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      !r.status_equipo ? "bg-slate-100 text-slate-600" :
                      r.status_equipo.toLowerCase().includes("activo") ? "bg-emerald-50 text-emerald-700" :
                      r.status_equipo.toLowerCase().includes("inactivo") ? "bg-red-50 text-red-700" :
                      "bg-blue-50 text-blue-700"
                    }`}>
                      {r.status_equipo || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{r.hoja}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Mensajes cuando no hay resultados */}
    {!modelo && !loading && (
      <p className="text-center mt-4 text-gray-400 italic text-sm">Empieza a escribir…</p>
    )}
    {modelo && !loading && resultados.length === 0 && (
      <p className="text-center mt-4 text-gray-500 italic text-sm">Sin resultados…</p>
    )}

  </div>
</div>
