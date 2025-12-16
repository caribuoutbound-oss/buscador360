import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { supabase } from "./supabase";

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
              {plan.precio === "S/20.9" ? "50 MB promocionales (12 meses) para datos internacionales en América y Europa."
              : plan.precio === "S/25.9" ? "50 MB promocionales (12 meses) + WhatsApp de texto ilimitado."
              : plan.precio === "S/35.9" ? "250 MB promocionales (12 meses) + WhatsApp de texto ilimitado."
              : plan.precio === "S/45.9" ? "1.25 GB promocionales (12 meses) + WhatsApp de texto ilimitado."
              : plan.precio === "S/55.9" || plan.precio === "S/65.9" ? "2 GB promocionales (12 meses) + WhatsApp de texto ilimitado."
              : plan.precio === "S/74.9" || plan.precio === "S/85.9" ? "3 GB promocionales (12 meses) + WhatsApp de texto ilimitado."
              : "8 GB promocionales (12 meses) + WhatsApp de texto ilimitado."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [modelo, setModelo] = useState("");
  const [sedeFiltro, setSedeFiltro] = useState("");
  const [sedesDisponibles, setSedesDisponibles] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortStockDesc, setSortStockDesc] = useState(true);
  const [selectedCodigoSap, setSelectedCodigoSap] = useState(null);
  const [especificaciones, setEspecificaciones] = useState(null);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [mostrarContrato, setMostrarContrato] = useState(false);
  const [planModalAbierto, setPlanModalAbierto] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); // Para el carrusel

  const buscarTiempoReal = useCallback(
    debounce(async (texto) => {
      if (!texto.trim()) { setResultados([]); return; }
      setLoading(true); setError(null);
      try {
        const { data: equiposData, error: equiposError } = await supabase
          .from("equipos")
          .select("id, hoja, codigo_sap, modelo, stock_final, status_equipo")
          .or(`modelo.ilike.%${texto}%,codigo_sap.ilike.%${texto}%`)
          .limit(50);
        if (equiposError) throw equiposError;
        const { data: accesoriosData, error: accesoriosError } = await supabase
          .from("accesorios")
          .select("id, codigo_sap, modelo, accesorio")
          .or(`modelo.ilike.%${texto}%,codigo_sap.ilike.%${texto}%`)
          .limit(50);
        if (accesoriosError) throw accesoriosError;

        // ✅ Protección: asegurar que data sea array
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
      }
      setLoading(false);
    }, 300),
    []
  );

  useEffect(() => {
    buscarTiempoReal(modelo);
    return () => buscarTiempoReal.cancel();
  }, [modelo]);

  useEffect(() => {
    const sedes = Array.from(new Set(resultados.map(r => r.hoja).filter(Boolean)));
    setSedesDisponibles(sedes);
    if (sedeFiltro && !sedes.includes(sedeFiltro)) setSedeFiltro("");
  }, [resultados]);

  const resultadosFiltrados = resultados
    .filter(r => (sedeFiltro ? r.hoja === sedeFiltro : true))
    .sort((a, b) => (sortStockDesc ? (b.stock_final || 0) - (a.stock_final || 0) : (a.stock_final || 0) - (b.stock_final || 0)));

  const totalStock = resultadosFiltrados.reduce((sum, r) => sum + (r.stock_final || 0), 0);
  const itemsActivos = resultadosFiltrados.filter(
    r => r.status_equipo && (r.status_equipo.toLowerCase().includes("activo") ||
      r.status_equipo.toLowerCase().includes("disponible") ||
      r.status_equipo.toLowerCase().includes("life"))
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
        .animate-slide-in-right { animation: slideInRight 0.5s ease-out forwards; }
        .shimmer-effect { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
      `}</style>

      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>


              <h1 className="text-xl font-bold">Lectura de Contrato</h1>
            </div>
            <button onClick={() => setMostrarContrato(false)} className="text-white/90 hover:text-white p-2 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 shadow-lg animate-slide-in-right" style={{animationDelay: '0.1s'}}>
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
                      Siendo hoy <span className="font-semibold">(día, mes, año)</span>, para continuar con la renovación del número <span className="font-semibold text-indigo-600">XXX</span>, por su seguridad validaremos los siguientes datos:
                    </p>
                  </div>
                </div>
              </div>

              {/* Datos a validar */}
              <div className="bg-white rounded-2xl p-6 border-2 border-indigo-100 shadow-lg animate-slide-in-right" style={{animationDelay: '0.2s'}}>
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
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-xl p-5 shadow-lg animate-slide-in-right" style={{animationDelay: '0.3s'}}>
                <p className="font-bold text-amber-900 mb-2">⚠️ Dirección Completa Requerida</p>
                <ul className="space-y-1 text-sm text-amber-800">
                  <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span> Calle, número de puerta, distrito y referencias</li>
                  <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span> Manzana, lote, urbanización, distrito y referencias</li>
                </ul>
              </div>

              {/* Renovación + Cambio de Plan (CON CARRUSEL) */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 shadow-lg animate-slide-in-right" style={{animationDelay: '0.4s'}}>
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

                {/* CARRUSEL COMPACTO PARA PC */}
                <div className="relative">
                  <div className="overflow-hidden">
                    <div
                      className="flex transition-transform duration-300 ease-out"
                      style={{
                        transform: `translateX(-${currentIndex * (100 / 3)}%)`,
                        width: '300%',
                        display: 'flex',
                        flexWrap: 'nowrap'
                      }}
                    >
                      {[...Array(3)].map((_, repeatIndex) =>
                        Object.entries(planesData).map(([key, plan]) => (
                          <div key={`${repeatIndex}-${key}`} className="w-1/3 flex-shrink-0 px-1">
                            <button
                              onClick={() => setPlanModalAbierto(key)}
                              className={`group relative overflow-hidden text-white rounded-lg p-3 h-16 w-full shadow transition-all duration-200 ${plan.gradient}`}
                            >
                              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <div className="relative text-center">
                                <div className="text-sm font-black">{plan.precio}</div>
                                <div className="text-[9px] font-semibold opacity-90 mt-0.5">{plan.tipo}</div>
                              </div>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentIndex(prev => (prev === 0 ? 8 : prev - 1))}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
                    aria-label="Plan anterior"
                  >
                    <svg className="w-3 h-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentIndex(prev => (prev === 8 ? 0 : prev + 1))}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
                    aria-label="Siguiente plan"
                  >
                    <svg className="w-3 h-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Términos y condiciones */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg animate-slide-in-right" style={{animationDelay: '0.5s'}}>
                <h3 className="text-lg font-bold text-slate-800 mb-4">📋 Términos del Plan | Así mismo</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {[
                    'Los beneficios del plan no son acumulables.',
                    'Los mensajes de texto del cargo fijo no incluyen Premium ni internacionales.',
                    'Los minutos todo destino no incluyen rurales.',
                    'Los mensajes de texto incluidos en su plan solo podrán utilizarse para mensajes de uso personal. No podrán ser usados para los fines de los servicios “mensajes de notificaciones” y/o “mensajes de publicidad”',
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
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200 shadow-lg animate-slide-in-right" style={{animationDelay: '0.6s'}}>
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
                      Telefónica podrá resolver el financiamiento y cobrar todas las cuotas...
                    </p>
                  </div>
                </div>
              </div>

              {/* Equipo al Contado */}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-200 shadow-lg animate-slide-in-right" style={{animationDelay: '0.7s'}}>
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
                      Nuestro delivery le efectuará el cobro... no acepta efectivo...
                    </p>
                  </div>
                </div>
              </div>

              {/* Autorización de Datos */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-200 shadow-lg animate-slide-in-right" style={{animationDelay: '0.8s'}}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-pink-900">🔒 Tratamiento de Datos Personales</h3>
                </div>
                <p className="text-sm leading-relaxed">
                  A fin de crear ofertas personalizadas... autoriza a Movistar... Te agradeceré decir <span className="font-bold text-pink-700">SÍ ACEPTO</span>.
                </p>
              </div>

              {/* Aceptación Final */}
              <div className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-2xl p-6 border-2 border-indigo-300 shadow-xl animate-slide-in-right" style={{animationDelay: '0.9s'}}>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-lg mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-800 text-lg leading-relaxed font-medium">
                    Habiendo sido informado... le agradeceré decir <span className="font-bold text-indigo-700 text-xl">SÍ ACEPTO</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Plan Reutilizable */}
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h1 className="text-xl font-bold">Inventario 360</h1>
            </div>
            <button
              onClick={() => setMostrarContrato(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow-md hover:from-emerald-600 hover:to-emerald-700 transition-all border border-emerald-400/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Contrato
            </button>
          </div>
        </div>
      </header>
      <div className="pt-16 px-6">
        <div className="max-w-7xl mx-auto py-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 mb-6 flex gap-4">
            <div className="flex-1 relative">
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
            <select
              value={sedeFiltro}
              onChange={e => setSedeFiltro(e.target.value)}
              className="w-48 border rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las sedes</option>
              {sedesDisponibles.map(sede => (
                <option key={sede} value={sede}>{sede}</option>
              ))}
            </select>
          </div>

          {/* ✅ ESTADÍSTICAS CON COLORES RESTAURADOS */}
          {modelo && resultadosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-4">
                <p className="text-xs font-medium text-blue-600 mb-1">Resultados</p>
                <p className="text-lg font-bold text-slate-800">{resultadosFiltrados.length}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm border border-emerald-200 p-4">
                <p className="text-xs font-medium text-emerald-600 mb-1">Stock Total</p>
                <p className="text-lg font-bold text-slate-800">{totalStock.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-4">
                <p className="text-xs font-medium text-green-600 mb-1">Activos</p>
                <p className="text-lg font-bold text-slate-800">{itemsActivos}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-4">
                <p className="text-xs font-medium text-purple-600 mb-1">Tasa Activos</p>
                <p className="text-lg font-bold text-slate-800">
                  {resultadosFiltrados.length > 0 ? Math.round((itemsActivos / resultadosFiltrados.length) * 100) : 0}%
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-xl shadow-sm">
              <p className="font-semibold text-red-800 text-sm">Error de conexión</p>
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          {/* ✅ TABLA CON COLORES RESTAURADOS */}
          {resultadosFiltrados.length > 0 ? (
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="min-w-full divide-y">
                <thead className="bg-slate-50">
                  <tr>
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
                  {resultadosFiltrados.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2"><span className="font-mono text-sm">{r.codigo_sap}</span></td>
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
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !loading && modelo && (
            <div className="bg-white rounded-xl p-8 text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-600">No se encontraron resultados para "<span className="font-semibold">{modelo}</span>"</p>
            </div>
          )}

          {!modelo && !loading && (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <p className="text-slate-800 text-lg font-medium mb-2">Comienza a buscar</p>
              <p className="text-slate-600">Ingresa el modelo o código SAP para comenzar</p>
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
    </div>
  );
}
