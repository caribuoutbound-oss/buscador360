import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { supabase } from "./supabase";

// ──────────────────────────────────────────────────────────────────────────────
// 📱 DATOS DE EQUIPOS Y PRECIOS DIGITALES
// ──────────────────────────────────────────────────────────────────────────────
const EQUIPOS_DATA = [
  { equipo: 'IPHONE 16 PRO MAX 256GB', precio: 4899, marca: 'IPHONE' },
  { equipo: 'IPHONE 16 PRO 128GB', precio: 4199, marca: 'IPHONE' },
  { equipo: 'IPHONE 17 256GB', precio: 3569, marca: 'IPHONE' },
  { equipo: 'IPHONE 16 128GB', precio: 2939, marca: 'IPHONE' },
  { equipo: 'XIAOMI 15T PRO 512GB 5G', precio: 2659, marca: 'XIAOMI' },
  { equipo: 'SAMSUNG GXY S25 FE SM-S731B 256GB 5G', precio: 2599, marca: 'SAMSUNG' },
  { equipo: 'XIAOMI 15T 512GB 5G', precio: 2039, marca: 'XIAOMI' },
  { equipo: 'IPHONE 13 128GB', precio: 1809, marca: 'IPHONE' },
  { equipo: 'XIAOMI REDMI NOTE 15 PRO+ 512GB 5G', precio: 1729, marca: 'XIAOMI' },
  { equipo: 'OPPO A6 PRO 256GB 5G', precio: 1299, marca: 'OPPO' },
  { equipo: 'XIAOMI REDMI NOTE 15 PRO 512GB 5G', precio: 1259, marca: 'XIAOMI' },
  { equipo: 'HONOR X8C 256GB 5G', precio: 999, marca: 'HONOR' },
  { equipo: 'MOTOROLA EDGE 60 FUSION 256GB 5G', precio: 999, marca: 'MOTOROLA' },
  { equipo: 'ZTE NUBIA AIR 256GB 5G', precio: 899, marca: 'ZTE' },
  { equipo: 'XIAOMI REDMI NOTE 15 256GB LTE', precio: 849, marca: 'XIAOMI' },
  { equipo: 'SAMSUNG GXY A26 SM-A266M 128GB 5G', precio: 819, marca: 'SAMSUNG' },
  { equipo: 'MOTOROLA G56 XT2527 256GB 5G', precio: 739, marca: 'MOTOROLA' },
  { equipo: 'HONOR X6C NIC-LX3 256GB LTE', precio: 549, marca: 'HONOR' },
  { equipo: 'SAMSUNG GXY A16 SM-A165M 128GB LTE', precio: 529, marca: 'SAMSUNG' },
  { equipo: 'SAMSUNG GXY A07 SM-A075M 128GB LTE', precio: 429, marca: 'SAMSUNG' },
  { equipo: 'ZTE BLADE A56 PRO 128GB LTE', precio: 329, marca: 'ZTE' },
];

// ──────────────────────────────────────────────────────────────────────────────
// 🎨 COMPONENTE BANNER DE PRECIOS
// ──────────────────────────────────────────────────────────────────────────────
function BannerPrecios({ onClose }) {
  const [filtroMarca, setFiltroMarca] = useState('TODAS');
  
  const marcas = ['TODAS', ...new Set(EQUIPOS_DATA.map(e => e.marca))];
  
  const equiposFiltrados = filtroMarca === 'TODAS' 
    ? EQUIPOS_DATA 
    : EQUIPOS_DATA.filter(e => e.marca === filtroMarca);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getMarcaColor = (marca) => {
    const colors = {
      'IPHONE': 'bg-gray-800',
      'SAMSUNG': 'bg-blue-600',
      'XIAOMI': 'bg-orange-500',
      'HONOR': 'bg-cyan-600',
      'MOTOROLA': 'bg-red-600',
      'OPPO': 'bg-green-600',
      'ZTE': 'bg-purple-600',
    };
    return colors[marca] || 'bg-gray-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-3xl font-bold mb-2">📱 Equipos Digitales</h2>
            <p className="text-indigo-100">Precios especiales en equipos tecnológicos</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-4xl font-bold">{EQUIPOS_DATA.length}</div>
              <div className="text-indigo-200 text-sm">Equipos disponibles</div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 transition-all"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-700 mr-2">Filtrar por marca:</span>
            {marcas.map(marca => (
              <button
                key={marca}
                onClick={() => setFiltroMarca(marca)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filtroMarca === marca
                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {marca}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla de Precios */}
        <div className="flex-1 overflow-auto">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-16">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Equipo</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-32">Marca</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider w-40">Precio Digital</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {equiposFiltrados.map((item, index) => (
                  <tr
                    key={index}
                    className={`transition-all hover:scale-[1.01] ${
                      item.marca === 'SAMSUNG'
                        ? 'bg-yellow-100 hover:bg-yellow-200'
                        : 'hover:bg-indigo-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-bold text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">{item.equipo}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white ${getMarcaColor(item.marca)}`}>
                        {item.marca}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-lg font-bold text-indigo-600">{formatPrice(item.precio)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-sm text-gray-600">
              Mostrando <span className="font-bold text-gray-900">{equiposFiltrados.length}</span> de <span className="font-bold text-gray-900">{EQUIPOS_DATA.length}</span> equipos
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span className="text-gray-600">Samsung</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-indigo-100 rounded"></div>
                <span className="text-gray-600">Otros</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componente de Login ───────────────────────────────
function LoginForm({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const { data, error: dbError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("usuario", usuario.trim())
      .eq("contrasena", contrasena)
      .eq("estado", "Activo")
      .single();

    if (dbError || !data) {
      setError("Usuario o contraseña incorrectos");
    } else {
      localStorage.setItem("user", JSON.stringify(data));
      onLogin(data);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl font-bold mb-4 text-center">Iniciar sesión</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

// ─── Tu App Principal ──────────────────────────────────
function MainContent({ user }) {
  // Funciones auxiliares
  const normalizarCodigo = (codigo) => {
    if (!codigo) return "";
    return codigo.toString().trim().toUpperCase().replace(/\s+/g, "");
  };

  const normalizarTexto = (texto) => {
    if (!texto) return "";
    return texto.toString().trim().toUpperCase().replace(/\s+/g, " ");
  };

  const convertirDriveUrl = (url) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === "drive.google.com" && urlObj.pathname.startsWith("/file/d/")) {
        const id = urlObj.pathname.split("/")[3];
        if (id) return `https://drive.google.com/file/d/${id}/preview`;
      }
    } catch (e) {
      console.warn("URL inválida:", url);
    }
    return url;
  };

  // Datos de los planes
  const planesData = {
    plan1: { nombre: "Plan Ahorro Mi Movistar", precio: "S/20.9", gradient: "from-rose-500 via-pink-500 to-orange-500", tipo: "Ahorro" },
    plan2: { nombre: "Plan Ahorro Mi Movistar", precio: "S/25.9", gradient: "from-blue-500 via-cyan-500 to-teal-500", tipo: "Ahorro" },
    plan3: { nombre: "Plan Ahorro Mi Movistar", precio: "S/35.9", gradient: "from-slate-700 via-slate-800 to-gray-900", tipo: "Ahorro" },
    plan4: { nombre: "Plan Ahorro Mi Movistar", precio: "S/45.9", gradient: "from-purple-500 via-indigo-500 to-blue-500", tipo: "Ahorro" },
    plan5: { nombre: "Plan Ilimitado Mi Movistar", precio: "S/55.9", gradient: "from-green-500 via-emerald-500 to-teal-500", tipo: "Ilimitado" },
    plan6: { nombre: "Plan Ilimitado Mi Movistar", precio: "S/65.9", gradient: "from-cyan-500 via-blue-500 to-indigo-500", tipo: "Ilimitado" },
    plan7: { nombre: "Plan Ilimitado Mi Movistar", precio: "S/74.9", gradient: "from-amber-500 via-orange-500 to-red-500", tipo: "Ilimitado" },
    plan8: { nombre: "Plan Ilimitado Mi Movistar", precio: "S/85.9", gradient: "from-pink-500 via-rose-500 to-red-500", tipo: "Ilimitado" },
    plan9: { nombre: "Plan Ilimitado Mi Movistar", precio: "S/114.9", gradient: "from-indigo-500 via-purple-500 to-pink-500", tipo: "Ilimitado" }
  };

  // Modal reutilizable de plan
  function PlanModal({ plan, isOpen, onClose }) {
    if (!isOpen || !plan) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[70vh] overflow-y-auto shadow-2xl">
          <div className={`sticky top-0 bg-gradient-to-r ${plan.gradient} p-3 rounded-t-lg relative`}>
            <h3 className="text-sm font-bold text-white">{plan.nombre}</h3>
            <p className="text-white/90 text-xs">{plan.precio} mensuales</p>
            <button
              onClick={onClose}
              className="absolute top-1 right-1 text-white/80 hover:text-white hover:bg-white/20 p-1 rounded-full transition-all"
              aria-label="Cerrar modal del plan"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-3 text-xs space-y-2">
            <div className="bg-rose-50 rounded-lg p-2 border border-rose-200">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.848.536l1.42 2.028a1 1 0 01-.024.912l-1.264 6.324a1 1 0 01-1.028.868 1 1 0 01-1.028-.868L3.3 12.028A1 1 0 012 11.118V5a2 2 0 012-2z" />
                </svg>
                <span className="font-bold text-rose-700">Llamadas Ilimitadas</span>
              </div>
              <div className="ml-6 mt-1 text-slate-700">A nivel Nacional + 500 SMS</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-3M9 7V4M9 4H6M9 4h12M9 4v3M15 7h3" />
                </svg>
                <span className="font-bold text-blue-700">
                  {plan.nombre.includes("Ilimitado") ? "Internet Ilimitado" : `${plan.precio === "S/20.9" ? "2" : plan.precio === "S/25.9" ? "4" : plan.precio === "S/35.9" ? "20" : "36"} GB de internet`}
                </span>
              </div>
              {plan.nombre.includes("Ilimitado") && (
                <div className="ml-6 mt-1 text-slate-700">
                  {plan.precio === "S/55.9" ? "66 GB en alta velocidad"
                    : plan.precio === "S/65.9" ? "80 GB en alta velocidad"
                      : plan.precio === "S/74.9" ? "110 GB en alta velocidad"
                        : plan.precio === "S/85.9" ? "125 GB en alta velocidad"
                          : "145 GB en alta velocidad + 500MB tethering"}
                </div>
              )}
            </div>
            <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 00-9-9v9h9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10a4 4 0 00-8 0v6a4 4 0 008 0v-6z" />
                </svg>
                <span className="text-slate-700">
                  {plan.precio === "S/20.9" ? "+ 200 min LDI EE.UU./Canadá"
                    : plan.precio === "S/25.9" ? "+ 250 min LDI EE.UU./Canadá"
                      : plan.precio === "S/35.9" ? "+ 300 min LDI EE.UU./Canadá"
                        : plan.precio === "S/45.9" ? "+ 350 min LDI EE.UU./Canadá"
                          : "Llamadas Ilimitadas LDI"}
                </span>
              </div>
              {plan.nombre.includes("Ilimitado") && <div className="ml-6 mt-1 text-slate-700">EE.UU./Canadá</div>}
            </div>
            {!plan.nombre.includes("Ilimitado") && (
              <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="font-bold text-slate-800">Apps ilimitadas (12 meses)</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {['WhatsApp', 'Facebook Fotos', 'Messenger', 'Instagram', 'Waze'].map((app) => (
                    <span key={app} className="px-1.5 py-0.5 bg-white text-[10px] rounded border border-slate-300 shadow-sm">{app}</span>
                  ))}
                </div>
                <div className="mt-1 bg-red-50 border-l-4 border-red-400 p-1 rounded-r">
                  <p className="text-[10px] text-red-700 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" /></svg>
                    <span className="font-semibold">No informar a clientes de Loreto</span>
                  </p>
                </div>
              </div>
            )}
            <div className="bg-green-50 rounded-lg p-2 border border-green-200">
              <div className="text-slate-700">
                <span className="font-bold text-green-700">🎁 Beneficios adicionales:</span>{" "}
                {plan.precio === "S/20.9" ? "50 MB promocionales (12 meses) para usarlos como datos internacionales en determinados países de América y Europa."
                  : plan.precio === "S/25.9" ? "50 MB promocionales (12 meses) para usarlos como datos internacionales en determinados países de América y Europa, así como WhatsApp de texto ilimitado."
                    : plan.precio === "S/35.9" ? "250 MB promocionales (12 meses) para usarlos como datos internacionales en determinados países de América y Europa, así como WhatsApp de texto ilimitado."
                      : plan.precio === "S/45.9" ? "1.25 GB promocionales (12 meses) para usarlos como datos internacionales en determinados países de América y Europa, así como WhatsApp de texto ilimitado."
                        : plan.precio === "S/55.9" || plan.precio === "S/65.9" ? "2 GB promocionales (12 meses) para usarlos como datos internacionales en determinados países de América y Europa, así como WhatsApp de texto ilimitado."
                          : plan.precio === "S/74.9" || plan.precio === "S/85.9" ? "3 GB promocionales (12 meses) para usarlos como datos internacionales en determinados países de América y Europa, así como WhatsApp de texto ilimitado."
                            : "8 GB promocionales (12 meses) para usarlos como datos internacionales en determinados países de América y Europa, así como WhatsApp de texto ilimitado."}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estados principales
  const [modelo, setModelo] = useState("");
  const [sedeFiltro, setSedeFiltro] = useState("");
  const [marcaFiltro, setMarcaFiltro] = useState("");
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortStockDesc, setSortStockDesc] = useState(true);
  const [selectedCodigoSap, setSelectedCodigoSap] = useState(null);
  const [especificaciones, setEspecificaciones] = useState(null);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [mostrarContrato, setMostrarContrato] = useState(false);
  const [planModalAbierto, setPlanModalAbierto] = useState(null);
  const [mostrarBannerPrecios, setMostrarBannerPrecios] = useState(false);

  // Estados para comparación de equipos
  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
  const [modalComparacionAbierto, setModalComparacionAbierto] = useState(false);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [resultadosPorPagina] = useState(50); // ✅ Aumentado para 2k+ registros

  // ✅ NUEVO: Cargar todos los equipos desde la VIEW
  useEffect(() => {
    const cargarTodosLosEquipos = async () => {
      setLoading(true);
      try {
        // ✅ Usar la VIEW en lugar de la tabla directa
        const { data: equiposData, error: equiposError } = await supabase
          .from("v_equipos_marcas")
          .select("id, hoja, codigo_sap, modelo, stock_final, status_equipo, marca")
          .order('modelo', { ascending: true });

        if (equiposError) throw equiposError;

        const { data: accesoriosData, error: accesoriosError } = await supabase
          .from("accesorios")
          .select("id, codigo_sap, modelo, accesorio");

        if (accesoriosError) throw accesoriosError;

        const equiposLista = Array.isArray(equiposData) ? equiposData : [];
        const accesoriosLista = Array.isArray(accesoriosData) ? accesoriosData : [];

        const accMap = {};
        accesoriosLista.forEach(acc => {
          const c = normalizarCodigo(acc.codigo_sap);
          if (c) accMap[c] = acc;
        });

        const combinados = equiposLista.map(eq => {
          let acc = null;
          const c = normalizarCodigo(eq.codigo_sap);
          if (c && accMap[c]) acc = accMap[c];
          if (!acc) {
            const modeloEq = normalizarTexto(eq.modelo);
            for (const a of accesoriosLista) {
              const modeloAcc = normalizarTexto(a.modelo);
              if (modeloAcc && modeloEq.includes(modeloAcc)) { acc = a; break; }
            }
          }
          return { ...eq, accesorio: acc?.accesorio ?? "-" };
        });

        setResultados(combinados);
        console.log(`✅ Cargados ${combinados.length} equipos desde v_equipos_marcas`);
      } catch (err) {
        setError(err.message);
        setResultados([]);
      } finally {
        setLoading(false);
      }
    };
    cargarTodosLosEquipos();
  }, []);

  // Función para toggle de selección de equipo
  const toggleSeleccionEquipo = (equipo) => {
    setEquiposSeleccionados(prev => {
      const yaSeleccionado = prev.find(e => e.codigo_sap === equipo.codigo_sap);
      if (yaSeleccionado) {
        return prev.filter(e => e.codigo_sap !== equipo.codigo_sap);
      } else if (prev.length < 2) {
        return [...prev, equipo];
      } else {
        alert('⚠️ Solo puedes comparar 2 equipos a la vez');
        return prev;
      }
    });
  };

  // Función para cargar especificaciones de comparación
  const cargarEspecificacionesComparacion = async () => {
    if (equiposSeleccionados.length !== 2) return;
    setLoadingSpecs(true);
    const specs = [];
    try {
      for (const equipo of equiposSeleccionados) {
        const { data, error } = await supabase
          .from("especificaciones")
          .select("*")
          .eq("codigo_sap", normalizarCodigo(equipo.codigo_sap))
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
      console.error("Error cargando especificaciones:", err);
      setEspecificaciones(null);
    } finally {
      setLoadingSpecs(false);
    }
  };

  const buscarTiempoReal = useCallback(
    debounce(async (texto) => {
      if (!texto.trim()) {
        // ✅ Si el campo está vacío, recargar desde la VIEW
        const { data: equiposData, error: equiposError } = await supabase
          .from("v_equipos_marcas")
          .select("id, hoja, codigo_sap, modelo, stock_final, status_equipo, marca")
          .order('modelo', { ascending: true });

        if (equiposError) throw equiposError;

        const { data: accesoriosData, error: accesoriosError } = await supabase
          .from("accesorios")
          .select("id, codigo_sap, modelo, accesorio");

        if (accesoriosError) throw accesoriosError;

        const equiposLista = Array.isArray(equiposData) ? equiposData : [];
        const accesoriosLista = Array.isArray(accesoriosData) ? accesoriosData : [];

        const accMap = {};
        accesoriosLista.forEach(acc => {
          const c = normalizarCodigo(acc.codigo_sap);
          if (c) accMap[c] = acc;
        });

        const combinados = equiposLista.map(eq => {
          let acc = null;
          const c = normalizarCodigo(eq.codigo_sap);
          if (c && accMap[c]) acc = accMap[c];
          if (!acc) {
            const modeloEq = normalizarTexto(eq.modelo);
            for (const a of accesoriosLista) {
              const modeloAcc = normalizarTexto(a.modelo);
              if (modeloAcc && modeloEq.includes(modeloAcc)) { acc = a; break; }
            }
          }
          return { ...eq, accesorio: acc?.accesorio ?? "-" };
        });

        setResultados(combinados);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // ✅ Buscar en la VIEW con filtro de marca si está seleccionado
        let query = supabase
          .from("v_equipos_marcas")
          .select("id, hoja, codigo_sap, modelo, stock_final, status_equipo, marca")
          .or(`modelo.ilike.%${texto}%,codigo_sap.ilike.%${texto}%`)
          .limit(100); // ✅ Aumentado límite

        if (marcaFiltro) {
          query = query.eq("marca", marcaFiltro);
        }

        const { data: equiposData, error: equiposError } = await query;

        if (equiposError) throw equiposError;

        const { data: accesoriosData, error: accesoriosError } = await supabase
          .from("accesorios")
          .select("id, codigo_sap, modelo, accesorio")
          .or(`modelo.ilike.%${texto}%,codigo_sap.ilike.%${texto}%`)
          .limit(100);

        if (accesoriosError) throw accesoriosError;

        const equiposLista = Array.isArray(equiposData) ? equiposData : [];
        const accesoriosLista = Array.isArray(accesoriosData) ? accesoriosData : [];

        const accMap = {};
        accesoriosLista.forEach(acc => {
          const c = normalizarCodigo(acc.codigo_sap);
          if (c) accMap[c] = acc;
        });

        const combinados = equiposLista.map(eq => {
          let acc = null;
          const c = normalizarCodigo(eq.codigo_sap);
          if (c && accMap[c]) acc = accMap[c];
          if (!acc) {
            const modeloEq = normalizarTexto(eq.modelo);
            for (const a of accesoriosLista) {
              const modeloAcc = normalizarTexto(a.modelo);
              if (modeloAcc && modeloEq.includes(modeloAcc)) { acc = a; break; }
            }
          }
          return { ...eq, accesorio: acc?.accesorio ?? "-" };
        });

        setResultados(combinados);
      } catch (err) {
        setError(err.message);
        setResultados([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [marcaFiltro]
  );

  useEffect(() => {
    buscarTiempoReal(modelo);
    return () => buscarTiempoReal.cancel();
  }, [modelo, marcaFiltro]);

  useEffect(() => {
    const sedes = Array.from(new Set(resultados.map(r => r.hoja).filter(Boolean)));
    setSedesDisponibles(sedes);
    if (sedeFiltro && !sedes.includes(sedeFiltro)) setSedeFiltro("");

    // Obtener marcas disponibles
    const marcas = Array.from(new Set(
      resultados
        .map(r => {
          const marca = r.modelo?.split(' ')[0];
          return marca;
        })
        .filter(Boolean)
    ));
    setMarcasDisponibles(marcas);
    if (marcaFiltro && !marcas.includes(marcaFiltro)) setMarcaFiltro("");
  }, [resultados]);

  // ✅ Filtrar y ordenar resultados (CON FILTRO DE MARCA)
  const resultadosFiltrados = resultados
    .filter(r => (sedeFiltro ? r.hoja === sedeFiltro : true))
    .filter(r => (marcaFiltro ? r.marca === marcaFiltro : true))
    .sort((a, b) => (sortStockDesc ? (b.stock_final || 0) - (a.stock_final || 0) : (a.stock_final || 0) - (b.stock_final || 0)));

  // Paginación
  const totalResultados = resultadosFiltrados.length;
  const totalPages = Math.ceil(totalResultados / resultadosPorPagina);
  const resultadosPaginados = resultadosFiltrados.slice(
    (paginaActual - 1) * resultadosPorPagina,
    paginaActual * resultadosPorPagina
  );

  const totalStock = resultadosFiltrados.reduce((sum, r) => sum + (parseInt(r.stock_final) || 0), 0);
  const itemsActivos = resultadosFiltrados.filter(
    r => r.status_equipo && (
      r.status_equipo.toLowerCase().includes("activo") ||
      r.status_equipo.toLowerCase().includes("disponible") ||
      r.status_equipo.toLowerCase().includes("life")
    )
  ).length;

  const cargarEspecificaciones = async (codigoSap) => {
    if (!codigoSap) return;
    setLoadingSpecs(true);
    try {
      const { data, error } = await supabase
        .from("especificaciones")
        .select("*")
        .eq("codigo_sap", normalizarCodigo(codigoSap))
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setEspecificaciones(data || null);
    } catch (err) {
      console.error("Error:", err);
      setEspecificaciones(null);
    } finally {
      setLoadingSpecs(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setSelectedCodigoSap(null);
        setEspecificaciones(null);
        setPlanModalAbierto(null);
        setMostrarContrato(false);
        setModalComparacionAbierto(false);
        setMostrarBannerPrecios(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const renderContrato = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        @keyframes pulseAndSpin {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
        .animate-slide-in-right { animation: slideInRight 0.5s ease-out forwards; }
        .shimmer-effect { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
      `}</style>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold">Lectura de Contrato</h1>
            </div>
            <button
              onClick={() => setMostrarContrato(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-md hover:from-red-600 hover:to-red-700 transition-all border border-red-400/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cerrar
            </button>
          </div>
        </div>
      </header>
      <div className="pt-20 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-scaleIn">
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shimmer-effect"></div>
            <div className="p-8 sm:p-10 space-y-8">
              {/* Introducción */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 shadow-lg animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-indigo-900 mb-2">Inicio de Grabación</h3>
                    <p className="text-slate-700 leading-relaxed">
                      Muy bien Sr/Sra. <span className="font-semibold text-indigo-600">XXX</span>, vamos a iniciar con la grabación del contrato.
                    </p>
                    <p className="text-slate-700 mt-3 leading-relaxed">
                      Siendo hoy <span className="font-semibold">(día, mes, año)</span>, para continuar con la renovación del número <span className="font-semibold text-indigo-600">XXX</span>, por su seguridad validaremos los siguientes datos, me indica:
                    </p>
                  </div>
                </div>
              </div>
              {/* Datos a validar */}
              <div className="bg-white rounded-2xl p-6 border-2 border-indigo-100 shadow-lg animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  Datos de Validación
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Nombres y apellidos', 'Número de DNI', 'Correo electrónico', 'Número adicional de referencia', 'Dirección de entrega'].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-indigo-50 p-3 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300 hover:scale-105">
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{idx + 1}</span>
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Advertencia dirección */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-xl p-5 shadow-lg animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
                <p className="font-bold text-amber-900 mb-2">⚠️ Dirección Completa Requerida</p>
                <ul className="space-y-1 text-sm text-amber-800">
                  <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span> Calle, número de puerta, distrito y referencias</li>
                  <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span> Manzana, lote, urbanización, distrito y referencias</li>
                </ul>
              </div>
              {/* ✅ PLANES: FILA COMPACTA DE 9 BOTONES PEQUEÑOS */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 shadow-lg animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-900">Renovación + Cambio de Plan</h3>
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  Sr/Sra. <span className="font-semibold text-blue-600">XXX</span> ahora pasará a tener el plan <span className="font-semibold text-blue-600">XXX</span> con un precio mensual de <span className="font-bold text-xl text-blue-700">S/ XXX</span>
                </p>
                <p className="text-slate-600 text-sm mb-5">Con este plan, obtendrá los siguientes beneficios:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.entries(planesData).map(([key, plan]) => (
                    <button
                      key={key}
                      onClick={() => setPlanModalAbierto(key)}
                      className={`px-2 py-1 text-[10px] font-bold text-white rounded shadow ${plan.gradient} hover:opacity-90 transition-opacity`}
                      title={`${plan.nombre} - ${plan.precio}`}
                    >
                      {plan.precio} ({plan.tipo})
                    </button>
                  ))}
                </div>
              </div>
              {/* Términos y condiciones */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg animate-slide-in-right" style={{ animationDelay: '0.5s' }}>
                <h3 className="text-lg font-bold text-slate-800 mb-4">📋 Términos del Plan | Así mismo</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {[
                    'Los beneficios del plan no son acumulables.',
                    'Los mensajes de texto del cargo fijo no incluyen Premium ni internacionales.',
                    'Los minutos todo destino no incluyen rurales.',
                    'Los mensajes de texto incluidos en su plan solo podrán utilizarse para mensajes de uso personal. No podrán ser usados para los fines de los servicios "mensajes de notificaciones" y/o "mensajes de publicidad"',
                    'Para llamar a USA y Canadá deberá marcar previamente 1911 antes del número internacional.'
                  ].map((term, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>{term}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Equipo Financiado */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200 shadow-lg animate-slide-in-right" style={{ animationDelay: '0.6s' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-emerald-900">💳 Equipo Financiado</h3>
                </div>
                <div className="space-y-3 text-sm text-slate-700">
                  <p>Para finalizar la renovación, le detallo lo siguiente:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">•</span> Estamos procediendo a registrar la solicitud del equipo <span className="font-semibold text-emerald-700">XXX</span> (marca, modelo, capacidad, color)</li>
                    <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">•</span> Cuota inicial de <span className="font-bold text-emerald-700">S/ XXX</span> y <span className="font-bold text-emerald-700">S/ XXX</span> por 12 meses</li>
                    <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">•</span> El equipo adquirido tiene un contrato de permanencia de <span className="font-semibold">12 meses</span></li>
                  </ul>
                  <div className="bg-white/50 rounded-xl p-4 mt-4 border border-emerald-200">
                    <p className="text-xs leading-relaxed">
                      En caso realice la baja del servicio móvil, migra a prepago o realiza un cambio de plan a uno menor,
                      Telefónica podrá resolver el financiamiento y cobrar todas las cuotas. Es obligación del cliente pagar la
                      totalidad de las cuotas. Recuerde que en caso de no pagar una o mas cuotas del equipo o de la totalidad del
                      precio del equipo, en caso de resolverse el financiamiento, Movistar podrá optar por bloquear el equipo de
                      manera remota y reportarlo en las centrales de riesgo.
                    </p>
                  </div>
                </div>
              </div>
              {/* Equipo al Contado */}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-200 shadow-lg animate-slide-in-right" style={{ animationDelay: '0.7s' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-violet-900">💰 Equipo al Contado</h3>
                </div>
                <div className="space-y-3 text-sm text-slate-700">
                  <p>Para finalizar la renovación, le detallo lo siguiente:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2"><span className="text-violet-500 font-bold">•</span> Estamos procediendo a registrar la solicitud del equipo <span className="font-semibold text-violet-700">XXX</span></li>
                    <li className="flex items-start gap-2"><span className="text-violet-500 font-bold">•</span> Pago único de <span className="font-bold text-violet-700">S/ XXX</span></li>
                    <li className="flex items-start gap-2"><span className="text-violet-500 font-bold">•</span> El equipo adquirido tiene un contrato de permanencia de <span className="font-semibold">12 meses</span></li>
                  </ul>
                  <div className="bg-white/50 rounded-xl p-4 mt-4 border border-violet-200">
                    <p className="text-xs leading-relaxed">
                      Nuestro delivery le efectuara el cobro correspondiente del equipo. Cabe recalcar que nuestro delivery no
                      acepta efectivo por lo que el pago deberá efectuarse con tarjeta de débito o crédito Visa, MasterCard y
                      Diners.
                    </p>
                  </div>
                </div>
              </div>
              {/* Autorización de Datos */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-200 shadow-lg animate-slide-in-right" style={{ animationDelay: '0.8s' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-pink-900">🔒 Tratamiento de Datos Personales</h3>
                </div>
                <p className="text-sm leading-relaxed">
                  A fin de crear ofertas personalizadas y recibir anuncios comerciales, autoriza a Movistar a hacer uso y
                  tratamiento de sus datos personales. Te agradeceré decir
                  <span className="font-bold text-pink-700"> SÍ ACEPTO</span>.
                </p>
                <div className="bg-white/50 rounded-xl p-4 mt-4 border border-red-200">
                  <p className="text-sm leading-relaxed">
                    Movistar resguardara tus datos personales según la legislación vigente. Para más información, consulta la
                    política de privacidad en www.movistar.com.pe/privacidad
                  </p>
                </div>
              </div>
              {/* Aceptación Final */}
              <div className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-2xl p-6 border-2 border-indigo-300 shadow-xl animate-slide-in-right" style={{ animationDelay: '0.9s' }}>
                <div className="text-center">
                  <button
                    onClick={() => {
                      const icon = document.getElementById('accept-icon');
                      if (icon) {
                        icon.classList.remove('animate-pulseAndSpin');
                        void icon.offsetWidth;
                        icon.classList.add('animate-pulseAndSpin');
                      }
                    }}
                    className="group relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full mb-4 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <div
                      id="accept-icon"
                      className="w-8 h-8 flex items-center justify-center text-white"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </button>
                  <p className="text-slate-800 text-lg leading-relaxed font-medium">
                    Habiendo sido informado de las características del contrato, le agradeceré decir <span className="font-bold text-indigo-700 text-xl">SÍ ACEPTO</span>.
                  </p>
                </div>
              </div>
              {/* Validaciones antes de terminar la llamada */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-lg animate-slide-in-right" style={{ animationDelay: '0.85s' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-amber-900">✅ Validaciones antes de finalizar la llamada</h3>
                </div>
                <div className="mb-4">
                  <p className="font-bold text-amber-800 mb-2">Huella Biométrica</p>
                  <ul className="space-y-1 text-sm text-amber-700 ml-4">
                    <li className="flex items-start gap-2"><span className="text-amber-500">•</span> La entrega se realiza al titular de la línea, ¿Ha tenido algún percance con su huella biométrica?</li>
                    <li className="flex items-start gap-2"><span className="text-amber-500">•</span> Cuando ha realizado alguna gestión en el banco o en una notaría, ¿su huella pasó sin problemas o demoró?</li>
                    <li className="flex items-start gap-2"><span className="text-amber-500">•</span> Cuando ha solicitado algún chip o equipo, ¿tuvo percances con su huella?</li>
                  </ul>
                </div>
                <div className="mb-4">
                  <p className="font-bold text-amber-800 mb-2">Rango de Entrega</p>
                  <ul className="space-y-1 text-sm text-amber-700 ml-4">
                    <li className="flex items-start gap-2"><span className="text-amber-500">•</span> Recuerde que debe mantenerse en el lugar de la entrega durante todo el rango horario, ¿no tiene ningún pendiente por realizar en este tramo, verdad?</li>
                    <li className="flex items-start gap-2"><span className="text-amber-500">•</span> El delivery lo va a llamar cuando ya esté en la puerta y lo esperará durante 5 minutos, ¿tiene facilidad de salir rápidamente, verdad?</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-amber-800 mb-2">Método de Pago</p>
                  <ul className="space-y-1 text-sm text-amber-700 ml-4">
                    <li className="flex items-start gap-2"><span className="text-amber-500">•</span> Recuerde que debe contar con el monto acordado en el momento de la entrega para que se pueda realizar el pago rápidamente.</li>
                    <li className="flex items-start gap-2"><span className="text-amber-500">•</span> Recuerde que el delivery no acepta efectivo.</li>
                  </ul>
                </div>
                <div className="mb-4">
                  <p className="font-bold text-amber-800 mb-2">Fidelización </p>
                  <ul className="space-y-1 text-sm text-amber-700 ml-4">
                    <li className="flex items-start gap-2"><span className="text-amber-500">•</span>
                      Dentro de 5 a 10 minutos, mi área de validación,
                      se estará comunicando nuevamente con usted para confirmar el precio del equipo que le estamos dando y así,
                      vea que todo esta conforme a lo que hemos conversado. Por favor, super atento a las llamadas, ya que, es de suma importancia que conteste.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal de Plan */}
      <PlanModal
        plan={planesData[planModalAbierto]}
        isOpen={!!planModalAbierto}
        onClose={() => setPlanModalAbierto(null)}
      />
    </div>
  );

  if (mostrarContrato) {
    return renderContrato();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Banner de Precios Modal */}
      {mostrarBannerPrecios && (
        <BannerPrecios onClose={() => setMostrarBannerPrecios(false)} />
      )}

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
              {/* ✅ NUEVO: Botón Banner de Precios */}
              <button
                onClick={() => setMostrarBannerPrecios(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg shadow-md hover:from-purple-600 hover:to-pink-700 transition-all border border-purple-400/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Precios
              </button>
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

  {/* ═══════════════════════════════════════════════════════════════ */}
  {/* 🎉 BANNER CYBER DAYS - AGREGAR AQUÍ */}
  {/* ═══════════════════════════════════════════════════════════════ */}
  <div className="pt-16">
    <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white py-4 px-6 shadow-2xl overflow-hidden relative">
      {/* Animación de fondo */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] animate-pulse" />
      </div>
      
      {/* Contenido del banner */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="text-3xl animate-bounce">🔥</span>
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider drop-shadow-lg">
              🎊 CYBER DAYS MOVISTAR 🎊
            </h2>
            <p className="text-sm md:text-base font-bold text-white/95 mt-1">
              ⚡ Equipos con descuentos increíbles • Stock limitado • ¡Aprovecha ahora!
            </p>
          </div>
          <span className="text-3xl animate-bounce">🎁</span>
        </div>
      </div>

      {/* Efecto de brillo */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" 
           style={{
             animation: 'shimmer 2s infinite',
             background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
           }} 
      />
    </div>
  </div>


      
      <div className="pt-16 px-6">
        <div className="max-w-7xl mx-auto py-6">
          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Buscador */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por modelo o código SAP..."
                  value={modelo}
                  onChange={e => setModelo(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Filtro Sede */}
              <select
                value={sedeFiltro}
                onChange={e => { setSedeFiltro(e.target.value); setPaginaActual(1); }}
                className="border rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las sedes</option>
                {sedesDisponibles.map(sede => (
                  <option key={sede} value={sede}>{sede}</option>
                ))}
              </select>
              {/* Filtro Marca */}
              <select
                value={marcaFiltro}
                onChange={e => { setMarcaFiltro(e.target.value); setPaginaActual(1); }}
                className="border rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las marcas</option>
                {marcasDisponibles.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>
              {/* Limpiar filtros */}
              <button
                onClick={() => { setSedeFiltro(""); setMarcaFiltro(""); setPaginaActual(1); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Limpiar filtros
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-xl shadow-sm">
              <p className="font-semibold text-red-800 text-sm">Error de conexión</p>
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          {resultadosPaginados.length > 0 ? (
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="min-w-full divide-y">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-center text-xs font-medium text-slate-700 uppercase w-12">
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 uppercase">Marca</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 uppercase">Modelo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 uppercase">Accesorio</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 uppercase">Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 uppercase">Estado</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 uppercase">Sede</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 uppercase">Especificaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {resultadosPaginados.map(r => {
                    const estaSeleccionado = equiposSeleccionados.some(e => e.codigo_sap === r.codigo_sap);
                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          estaSeleccionado ? 'bg-blue-50/50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <td className="px-4 py-2 text-center">
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
                            {r.codigo_sap?.toString() || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 inline-flex text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {r.marca || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-2">{r.modelo}</td>
                        <td className="px-4 py-2">{r.accesorio}</td>
                        <td className="px-4 py-2">
                          <span className={`font-bold ${
                            r.stock_final === null || r.stock_final === undefined
                              ? "text-slate-400"
                              : parseInt(r.stock_final) === 0
                                ? "text-red-600"
                                : parseInt(r.stock_final) <= 5
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
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : !loading && modelo && (
            <div className="bg-white rounded-xl p-8 text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-600">No se encontraron resultados para "<span className="font-semibold">{modelo}</span>"</p>
            </div>
          )}

          {/* Mostrar mensaje cuando no hay búsqueda ni filtros */}
          {!modelo && !sedeFiltro && !marcaFiltro && !loading && resultados.length > 0 && (
            <div className="bg-white rounded-xl p-6 text-center border border-slate-200 mb-6">
              <p className="text-slate-800 text-lg font-medium mb-2">📋 Lista completa de equipos</p>
              <p className="text-slate-600">Total: <span className="font-bold text-slate-800">{resultados.length}</span> equipos disponibles</p>
            </div>
          )}

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              {/* Información */}
              <div className="text-sm text-slate-600">
                Mostrando {((paginaActual - 1) * resultadosPorPagina) + 1} - {Math.min(paginaActual * resultadosPorPagina, totalResultados)} de {totalResultados} resultados
              </div>
              {/* Botones de navegación */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    paginaActual === 1
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-300'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>
                {/* Números de página (máximo 5 visibles) */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (paginaActual <= 3) {
                      pageNum = i + 1;
                    } else if (paginaActual >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = paginaActual - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPaginaActual(pageNum)}
                        className={`w-9 h-9 rounded-lg font-medium transition-colors ${
                          paginaActual === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {/* Puntos suspensivos si hay más páginas */}
                  {totalPages > 5 && paginaActual > 3 && paginaActual < totalPages - 2 && (
                    <span className="w-9 h-9 flex items-center justify-center text-slate-400">...</span>
                  )}
                </div>
                <button
                  onClick={() => setPaginaActual(p => Math.min(totalPages, p + 1))}
                  disabled={paginaActual === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    paginaActual === totalPages
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-300'
                  }`}
                >
                  Siguiente
                  <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {/* Ir a página específica */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Ir a página:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={paginaActual}
                  onChange={e => {
                    const num = parseInt(e.target.value);
                    if (num >= 1 && num <= totalPages) setPaginaActual(num);
                  }}
                  className="w-16 px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal PDF */}
      {selectedCodigoSap && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setSelectedCodigoSap(null); setEspecificaciones(null); }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-2 bg-blue-600 text-white">
              <h2>Ficha Técnica</h2>
              <button onClick={() => { setSelectedCodigoSap(null); setEspecificaciones(null); }} className="text-white">✕</button>
            </div>
            <div className="h-[60vh]">
              {loadingSpecs ? (
                <div className="flex items-center justify-center h-full">Cargando...</div>
              ) : especificaciones?.url ? (
                <iframe src={convertirDriveUrl(especificaciones.url)} title="PDF" className="w-full h-full border-0" />
              ) : (
                <div className="flex items-center justify-center h-full">No disponible</div>
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
    </div>
  );
}

// ─── Componente Raíz ───────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  if (!user) {
    return <LoginForm onLogin={setUser} />;
  }

  return <MainContent user={user} />;
}
