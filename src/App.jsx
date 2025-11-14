import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { createClient } from "@supabase/supabase-js";
import { Search, Package, TrendingUp, AlertCircle } from "lucide-react";

// ----------------------
// Configuración Supabase
// ----------------------
const SUPABASE_URL = "https://tu-proyecto.supabase.co"; // Reemplaza con tu URL
const SUPABASE_KEY = "tu-anon-public-key"; // Reemplaza con tu anon key
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [modelo, setModelo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conexionOk, setConexionOk] = useState(true);

  // ----------------------
  // Búsqueda en tiempo real
  // ----------------------
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
        setConexionOk(true); // Si hay datos, la conexión está bien
      } catch (err) {
        console.error("Error Supabase:", err);
        setError("No se pudo conectar con la base de datos");
        setResultados([]);
        setConexionOk(false);
      }

      setLoading(false);
    }, 300),
    []
  );

  useEffect(() => {
    buscarTiempoReal(modelo);
    return () => buscarTiempoReal.cancel();
  }, [modelo]);

  // ----------------------
  // Helpers de colores
  // ----------------------
  const getStatusColor = (status) => {
    if (!status) return "bg-slate-100 text-slate-600 border-slate-200";
    const s = status.toLowerCase();
    if (s.includes("activo") || s.includes("disponible") || s.includes("life")) 
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s.includes("inactivo") || s.includes("baja")) 
      return "bg-red-50 text-red-700 border-red-200";
    if (s.includes("mantenimiento") || s.includes("reposo") || s.includes("phase")) 
      return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  const getStockColor = (stock) => {
    if (stock === null || stock === undefined) return "text-slate-400";
    if (stock <= 0) return "text-red-600 font-semibold";
    if (stock <= 5) return "text-amber-600 font-semibold";
    return "text-emerald-600 font-semibold";
  };

  const totalStock = resultados.reduce((sum, r) => sum + (r.stock_final || 0), 0);
  const itemsActivos = resultados.filter(r => 
    r.status_equipo && r.status_equipo.toLowerCase().includes("life")
  ).length;

  // ----------------------
  // Render
  // ----------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Sistema de Inventario</h1>
          </div>
          <p className="text-blue-100 text-sm">
            Gestión y consulta de equipos en tiempo real
          </p>
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
          
          {loading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Buscando en la base de datos...</span>
            </div>
          )}
        </div>

        {/* Error de conexión */}
        {!conexionOk && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Error de conexión</p>
              <p className="text-red-700 text-sm">No se pudo conectar con Supabase. Revisa tu URL y la API key.</p>
            </div>
          </div>
        )}

        {/* Tarjetas de estadísticas */}
        {modelo && resultados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Resultados</p>
                  <p className="text-3xl font-bold text-slate-800">{resultados.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Stock Total</p>
                  <p className="text-3xl font-bold text-slate-800">{totalStock.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Equipos Activos</p>
                  <p className="text-3xl font-bold text-slate-800">{itemsActivos}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de resultados */}
        {resultados.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Código SAP</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Modelo</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Sede</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {resultados.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">{r.codigo_sap}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 font-medium max-w-md">{r.modelo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${getStockColor(r.stock_final)}`}>
                          {r.stock_final !== null && r.stock_final !== undefined ? r.stock_final.toLocaleString() : "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(r.status_equipo)}`}>
                          {r.status_equipo || "Sin estado"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600 font-medium">{r.hoja}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay resultados */}
        {!loading && modelo && resultados.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 text-lg">
              No se encontraron resultados para <span className="font-semibold text-slate-800">"{modelo}"</span>
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Intenta con otro término de búsqueda
            </p>
          </div>
        )}

        {/* Mensaje cuando no se ha ingresado texto */}
        {!modelo && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-slate-800 text-lg font-medium mb-2">Sistema de Inventario Activo</p>
            <p className="text-slate-600">
              Ingresa el modelo de un equipo en el campo de búsqueda para comenzar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
