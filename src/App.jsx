<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inventario 360</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/@supabase/supabase-js"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#2563eb',
            secondary: '#7c3aed',
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { font-family: 'Inter', sans-serif; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  </style>
</head>
<body class="bg-slate-50 min-h-screen">
  <div id="root"></div>

  <script type="module">
    const { createClient } = Supabase;
    const supabaseUrl = 'https://htjhrhjsgtdizpxwgtue.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0amhyaGpzZ3RkaXpweHdndHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTI5ODUsImV4cCI6MjA3ODcyODk4NX0.K6cgov_VXVYf00qX8R1YWWuh1woNUcvwQYwB1LVp6Es';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { useState, useEffect } = React;

    // ================================
    // COMPONENTE PRINCIPAL
    // ================================
    function App() {
      const [user, setUser] = useState(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        setLoading(false);
      }, []);

      if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-white text-lg font-medium">Cargando...</p>
            </div>
          </div>
        );
      }

      return user ? <MainContent user={user} /> : <Login setUser={setUser} />;
    }

    // ================================
    // LOGIN
    // ================================
    function Login({ setUser }) {
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const [error, setError] = useState('');
      const [loading, setLoading] = useState(false);

      const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
          const { data, error: authError } = await supabase
            .from('usuarios')
            .select('id, usuario, nombre_completo, rol')
            .eq('usuario', username)
            .eq('password', password)
            .single();

          if (authError || !data) {
            setError('Usuario o contraseña incorrectos');
            setLoading(false);
            return;
          }

          const userData = {
            id: data.id,
            usuario: data.usuario,
            nombre_completo: data.nombre_completo,
            rol: data.rol
          };

          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        } catch (err) {
          setError('Error en el servidor. Intente nuevamente.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Inventario 360</h1>
              <p className="text-slate-600 mt-1">Gestión de equipos y accesorios</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Ingrese su usuario"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Ingrese su contraseña"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-2.5 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : 'Ingresar'}
              </button>
            </form>
          </div>
        </div>
      );
    }

    // ================================
    // CONTENIDO PRINCIPAL
    // ================================
    function MainContent({ user }) {
      const [equipos, setEquipos] = useState([]);
      const [accesorios, setAccesorios] = useState([]);
      const [loading, setLoading] = useState(true);
      const [searchTerm, setSearchTerm] = useState('');
      const [selectedCodigoSap, setSelectedCodigoSap] = useState(null);
      const [especificaciones, setEspecificaciones] = useState(null);
      const [loadingSpecs, setLoadingSpecs] = useState(false);
      const [modalAbierto, setModalAbierto] = useState(false);
      const [mostrarContrato, setMostrarContrato] = useState(false);
      const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
      const [modalComparacionAbierto, setModalComparacionAbierto] = useState(false);

      // Cargar datos al montar
      useEffect(() => {
        loadData();
      }, []);

      const loadData = async () => {
        setLoading(true);
        try {
          const [equiposRes, accesoriosRes] = await Promise.all([
            supabase.from('equipos').select('*'),
            supabase.from('accesorios').select('*')
          ]);

          if (equiposRes.error) throw equiposRes.error;
          if (accesoriosRes.error) throw accesoriosRes.error;

          setEquipos(equiposRes.data);
          setAccesorios(accesoriosRes.data);
        } catch (error) {
          console.error('Error cargando datos:', error);
          alert('Error al cargar los datos. Por favor, intente nuevamente.');
        } finally {
          setLoading(false);
        }
      };

      // Normalizar código SAP para búsqueda
      const normalizarCodigo = (codigo) => {
        if (!codigo) return '';
        return codigo.toString().trim().toLowerCase();
      };

      // Convertir URL de Drive a formato embebido
      const convertirDriveUrl = (url) => {
        if (!url) return null;
        const match = url.match(/\/d\/([^\/]+)/);
        if (match) {
          return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
        return url;
      };

      // Cargar especificaciones
      const cargarEspecificaciones = async (codigoSap) => {
        setLoadingSpecs(true);
        setEspecificaciones(null);
        setModalAbierto(true);

        try {
          const { data, error } = await supabase
            .from('especificaciones')
            .select('*')
            .eq('codigo_sap', normalizarCodigo(codigoSap))
            .single();

          if (error) throw error;
          setEspecificaciones({
            ...data,
            url: data?.url ? convertirDriveUrl(data.url) : null
          });
        } catch (err) {
          console.error('Error:', err);
          setEspecificaciones(null);
        } finally {
          setLoadingSpecs(false);
        }
      };

      // Toggle selección de equipo para comparación
      const toggleSeleccionEquipo = (equipo) => {
        setEquiposSeleccionados(prev => {
          const yaSeleccionado = prev.find(e => e.codigo_sap === equipo.codigo_sap);
          
          if (yaSeleccionado) {
            // Deseleccionar
            return prev.filter(e => e.codigo_sap !== equipo.codigo_sap);
          } else if (prev.length < 2) {
            // Seleccionar (si hay espacio)
            return [...prev, equipo];
          } else {
            // Mostrar alerta si ya hay 2 seleccionados
            alert('⚠️ Solo puedes comparar 2 equipos a la vez');
            return prev;
          }
        });
      };

      // Cargar especificaciones para comparación
      const cargarEspecificacionesComparacion = async () => {
        if (equiposSeleccionados.length !== 2) return;
        
        setLoadingSpecs(true);
        const specs = [];
        
        try {
          for (const equipo of equiposSeleccionados) {
            const { data, error } = await supabase
              .from('especificaciones')
              .select('*')
              .eq('codigo_sap', normalizarCodigo(equipo.codigo_sap))
              .single();
            
            specs.push({
              equipo: equipo,
              specs: data || null,
              url: data?.url ? convertirDriveUrl(data.url) : null
            });
          }
          
          setEspecificaciones(specs);
          setModalComparacionAbierto(true);
        } catch (err) {
          console.error('Error cargando especificaciones:', err);
          setEspecificaciones(null);
        } finally {
          setLoadingSpecs(false);
        }
      };

      // Filtrar resultados
      const resultadosFiltrados = equipos.filter(e => {
        const busqueda = searchTerm.toLowerCase();
        return (
          normalizarCodigo(e.codigo_sap).includes(busqueda) ||
          e.modelo?.toLowerCase().includes(busqueda) ||
          e.accesorio?.toLowerCase().includes(busqueda) ||
          e.hoja?.toLowerCase().includes(busqueda)
        );
      });

      return (
        <div className="min-h-screen bg-slate-50">
          {/* HEADER */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Inventario 360</h1>
                    <p className="text-xs text-slate-300 truncate max-w-[180px]">
                      {user.nombre_completo || user.usuario}
                    </p>
                  </div>
                </div>
                
                {/* Botón de Comparación */}
                {equiposSeleccionados.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-md">
                      {equiposSeleccionados.length}/2 seleccionados
                    </div>
                    <button
                      onClick={cargarEspecificacionesComparacion}
                      disabled={equiposSeleccionados.length !== 2}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-md transition-all ${
                        equiposSeleccionados.length === 2
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700"
                          : "bg-slate-400 text-slate-200 cursor-not-allowed"
                      }`}
                      title={equiposSeleccionados.length !== 2 ? "Selecciona exactamente 2 equipos" : "Comparar equipos"}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Comparar ({equiposSeleccionados.length}/2)
                    </button>
                    <button
                      onClick={() => {
                        setEquiposSeleccionados([]);
                        setEspecificaciones(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-md hover:from-red-600 hover:to-red-700 transition-all border border-red-400/30"
                      title="Limpiar selección"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMostrarContrato(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow-md hover:from-emerald-600 hover:to-emerald-700 transition-all border border-emerald-400/30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Contrato
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem("user");
                      window.location.reload();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-md hover:from-red-600 hover:to-red-700 transition-all border border-red-400/30"
                    title="Cerrar sesión"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Salir
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className="pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por código SAP, modelo, accesorio o sede..."
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm"
                  />
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Total Equipos</p>
                      <p className="text-3xl font-bold text-slate-800 mt-1">{equipos.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Total Accesorios</p>
                      <p className="text-3xl font-bold text-slate-800 mt-1">{accesorios.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Equipos Seleccionados</p>
                      <p className="text-3xl font-bold text-slate-800 mt-1">{equiposSeleccionados.length}/2</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-center text-xs font-medium text-slate-700 uppercase w-12">
                          <input
                            type="checkbox"
                            checked={equiposSeleccionados.length === 2}
                            onChange={(e) => {
                              if (e.target.checked) {
                                alert("⚠️ Solo puedes seleccionar 2 equipos para comparar");
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            disabled
                          />
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 uppercase">Código SAP</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 uppercase">Modelo</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 uppercase">Accesorio</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 uppercase">Stock</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 uppercase">Estado</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 uppercase">Sede</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 uppercase">Especificaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="px-4 py-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </td>
                        </tr>
                      ) : resultadosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-4 py-8 text-center">
                            <p className="text-slate-500">No se encontraron resultados</p>
                          </td>
                        </tr>
                      ) : (
                        resultadosFiltrados.map(r => {
                          const estaSeleccionado = equiposSeleccionados.some(e => e.codigo_sap === r.codigo_sap);
                          
                          return (
                            <tr 
                              key={r.id} 
                              className={`hover:bg-slate-50 transition-colors ${
                                estaSeleccionado ? 'bg-blue-50/50 border-l-4 border-blue-500' : ''
                              }`}
                            >
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={estaSeleccionado}
                                  onChange={() => toggleSeleccionEquipo(r)}
                                  disabled={!estaSeleccionado && equiposSeleccionados.length >= 2}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                  title={estaSeleccionado ? "Deseleccionar" : equiposSeleccionados.length >= 2 ? "Máximo 2 equipos" : "Seleccionar para comparar"}
                                />
                              </td>
                              <td className="px-4 py-2">
                                <span className="font-mono text-sm">
                                  {(() => {
                                    const codigo = r.codigo_sap?.toString() || "";
                                    if (codigo.length <= 4) return "•".repeat(codigo.length) || "-";
                                    return "•".repeat(codigo.length - 4) + codigo.slice(-4);
                                  })()}
                                </span>
                              </td>
                              <td className="px-4 py-2">{r.modelo}</td>
                              <td className="px-4 py-2">{r.accesorio}</td>
                              <td className="px-4 py-2">
                                <span className={`font-bold ${
                                  r.stock_final === null || r.stock_final === undefined
                                    ? "text-slate-400"
                                    : r.stock_final === 0
                                    ? "text-red-600"
                                    : r.stock_final <= 5
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                                }`}>
                                  {r.stock_final ?? "-"}
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${
                                  !r.status_equipo
                                    ? "bg-slate-100 text-slate-600"
                                    : r.status_equipo.toLowerCase().includes("activo") ||
                                      r.status_equipo.toLowerCase().includes("disponible") ||
                                      r.status_equipo.toLowerCase().includes("life")
                                    ? "bg-emerald-100 text-emerald-700"
                                    : r.status_equipo.toLowerCase().includes("inactivo") ||
                                      r.status_equipo.toLowerCase().includes("baja")
                                    ? "bg-red-100 text-red-700"
                                    : r.status_equipo.toLowerCase().includes("mantenimiento") ||
                                      r.status_equipo.toLowerCase().includes("reposo") ||
                                      r.status_equipo.toLowerCase().includes("phase")
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}>
                                  {r.status_equipo || "-"}
                                </span>
                              </td>
                              <td className="px-4 py-2">{r.hoja}</td>
                              <td className="px-4 py-2">
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedCodigoSap(r.codigo_sap);
                                    cargarEspecificaciones(r.codigo_sap);
                                  }}
                                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                                >
                                  Ver
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>

          {/* Modal Especificaciones */}
          {modalAbierto && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalAbierto(false)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
                  <h2 className="text-xl font-bold">Especificaciones Técnicas</h2>
                  <button
                    onClick={() => setModalAbierto(false)}
                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="h-[70vh] overflow-y-auto p-6">
                  {loadingSpecs ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-slate-600">Cargando...</p>
                      </div>
                    </div>
                  ) : especificaciones?.url ? (
                    <iframe 
                      src={especificaciones.url} 
                      title="PDF Especificaciones" 
                      className="w-full h-full border-0" 
                    />
                  ) : (
                    <div className="text-center text-slate-500 py-12">
                      No hay especificaciones disponibles para este equipo
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal Comparación */}
          {modalComparacionAbierto && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setModalComparacionAbierto(false); setEspecificaciones(null); }}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Comparación de Equipos
                    </h2>
                    <p className="text-sm text-blue-100 mt-1">Vista lado a lado de especificaciones</p>
                  </div>
                  <button
                    onClick={() => { setModalComparacionAbierto(false); setEspecificaciones(null); }}
                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                    title="Cerrar"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="h-[70vh] overflow-y-auto">
                  {loadingSpecs ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-slate-600">Cargando especificaciones...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                      {/* Equipo 1 */}
                      {especificaciones && especificaciones[0] && (
                        <div className="p-6">
                          <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">{especificaciones[0].equipo.modelo}</h3>
                            <p className="text-sm text-slate-600 mt-1">Código: {especificaciones[0].equipo.codigo_sap}</p>
                            <div className="mt-3 flex justify-center gap-3">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                Stock: {especificaciones[0].equipo.stock_final ?? 0}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                especificaciones[0].equipo.status_equipo?.toLowerCase().includes('activo') ||
                                especificaciones[0].equipo.status_equipo?.toLowerCase().includes('disponible')
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {especificaciones[0].equipo.status_equipo || 'N/A'}
                              </span>
                            </div>
                          </div>

                          {especificaciones[0].url ? (
                            <div className="border rounded-lg overflow-hidden shadow-sm">
                              <div className="bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 border-b">
                                Ficha Técnica
                              </div>
                              <iframe 
                                src={especificaciones[0].url} 
                                title="PDF Equipo 1" 
                                className="w-full h-64 border-0" 
                              />
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                              <p className="text-slate-500">No hay ficha técnica disponible</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Equipo 2 */}
                      {especificaciones && especificaciones[1] && (
                        <div className="p-6">
                          <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">{especificaciones[1].equipo.modelo}</h3>
                            <p className="text-sm text-slate-600 mt-1">Código: {especificaciones[1].equipo.codigo_sap}</p>
                            <div className="mt-3 flex justify-center gap-3">
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                Stock: {especificaciones[1].equipo.stock_final ?? 0}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                especificaciones[1].equipo.status_equipo?.toLowerCase().includes('activo') ||
                                especificaciones[1].equipo.status_equipo?.toLowerCase().includes('disponible')
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {especificaciones[1].equipo.status_equipo || 'N/A'}
                              </span>
                            </div>
                          </div>

                          {especificaciones[1].url ? (
                            <div className="border rounded-lg overflow-hidden shadow-sm">
                              <div className="bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 border-b">
                                Ficha Técnica
                              </div>
                              <iframe 
                                src={especificaciones[1].url} 
                                title="PDF Equipo 2" 
                                className="w-full h-64 border-0" 
                              />
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                              <p className="text-slate-500">No hay ficha técnica disponible</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t">
                  <button
                    onClick={() => { setModalComparacionAbierto(false); setEspecificaciones(null); }}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Contrato */}
          {mostrarContrato && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setMostrarContrato(false)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4 flex justify-between items-center">
                  <h2 className="text-xl font-bold">Contrato de Servicios</h2>
                  <button
                    onClick={() => setMostrarContrato(false)}
                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="h-[70vh] overflow-y-auto p-6">
                  <div className="prose max-w-none">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Términos y Condiciones</h3>
                    <p className="text-slate-600 mb-4">
                      Este sistema de inventario es propiedad exclusiva de la empresa y está destinado únicamente para uso interno autorizado.
                    </p>
                    <ul className="list-disc list-inside text-slate-600 space-y-2">
                      <li>El acceso no autorizado está estrictamente prohibido</li>
                      <li>La información contenida es confidencial</li>
                      <li>Se prohíbe la distribución de datos sin autorización</li>
                      <li>El uso indebido será sancionado conforme a ley</li>
                    </ul>
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm text-slate-500">
                        Última actualización: {new Date().toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Renderizar app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>
