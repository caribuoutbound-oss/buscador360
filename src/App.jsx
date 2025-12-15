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

// Datos de planes
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
                {plan.nombre.includes("Ilimitado") ? "Internet Ilimitado" : `${plan.precio === "S/20.9" ? "2" : plan.precio === "S/25.9" ? "4" : plan.precio === "S/35.9" ? "20" : plan.precio === "S/45.9" ? "36" : ""} GB de internet`}
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
        const accMap = {};
        accesoriosData.forEach(acc => {
          const c = normalizarCodigo(acc.codigo_sap);
          if (c) accMap[c] = acc;
        });
        const combinados = equiposData.map(eq => {
          let acc = null;
          const c = normalizarCodigo(eq.codigo_sap);
          if (c && accMap[c]) acc = accMap[c];
          if (!acc) {
            const modeloEq = normalizarTexto(eq.modelo);
            for (const a of accesoriosData) {
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <div className="p-6 space-y-6">
              {/* Introducción */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-indigo-900">Inicio de Grabación</h3>
                    <p className="text-slate-700 mt-1">Muy bien Sr/Sra. <span className="font-semibold">XXX</span>, vamos a iniciar con la grabación del contrato.</p>
                    <p className="text-slate-700 mt-1">Siendo hoy <span className="font-semibold">(día, mes, año)</span>, para continuar con la renovación del número <span className="font-semibold">XXX</span>, validaremos los siguientes datos:</p>
                  </div>
                </div>
              </div>

              {/* Carrusel de Planes (PC only) */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-blue-900">Renovación + Cambio de Plan</h3>
                </div>
                <p className="text-slate-700 mb-3">Sr/Sra. <span className="font-semibold">XXX</span> ahora pasará a tener el plan <span className="font-semibold">XXX</span> por <span className="font-bold">S/ XXX</span> mensuales.</p>
                <p className="text-slate-600 text-sm mb-4">Beneficios del plan:</p>

                {/* Carrusel */}
                <div className="relative">
                  <div className="overflow-hidden">
                    <div
                      className="flex transition-transform duration-300 ease-out"
                      style={{
                        transform: `translateX(-${currentIndex * (100 / 3)}%)`,
                        width: '300%'
                      }}
                    >
                      {[...Array(3)].map((_, i) =>
                        Object.entries(planesData).map(([key, plan]) => (
                          <div key={`${i}-${key}`} className="w-1/3 flex-shrink-0 px-1">
                            <button
                              onClick={() => setPlanModalAbierto(key)}
                              className={`group relative overflow-hidden text-white rounded-lg p-3 h-16 w-full shadow transition-all
                                ${plan.gradient.includes('rose') ? 'bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500'
                                : plan.gradient.includes('blue') ? 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500'
                                : plan.gradient.includes('slate') ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-gray-900'
                                : plan.gradient.includes('purple') ? 'bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500'
                                : plan.gradient.includes('green') ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500'
                                : plan.gradient.includes('cyan') ? 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500'
                                : plan.gradient.includes('amber') ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500'
                                : plan.gradient.includes('pink') ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-red-500'
                                : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'}`}
                            >
                              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <div className="relative text-center">
                                <div className="text-sm font-black">{plan.precio}</div>
                                <div className="text-[9px] font-semibold opacity-90">{plan.tipo}</div>
                              </div>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentIndex(prev => (prev === 0 ? 8 : prev - 1))}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentIndex(prev => (prev === 8 ? 0 : prev + 1))}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Resto del contrato (Términos, Equipo, Datos, etc.) aquí */}
              {/* ... (puedes mantener el resto tal como lo tenías) ... */}
            </div>
          </div>
        </div>
      </div>

      <PlanModal
        plan={planesData[planModalAbierto]}
        isOpen={!!planModalAbierto}
        onClose={() => setPlanModalAbierto(null)}
      />
    </div>
  );

  if (mostrarContrato) return renderContrato();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
        <div className="max-w-6xl mx-auto px-6">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow-md hover:from-emerald-600 hover:to-emerald-700"
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
        <div className="max-w-6xl mx-auto py-6">
          {/* Buscador */}
          <div className="bg-white rounded-xl shadow p-4 mb-6 flex gap-4">
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

          {/* Estadísticas */}
          {modelo && resultadosFiltrados.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Resultados", value: resultadosFiltrados.length },
                { label: "Stock Total", value: totalStock.toLocaleString() },
                { label: "Activos", value: itemsActivos },
                { label: "Tasa Activos", value: `${resultadosFiltrados.length > 0 ? Math.round((itemsActivos / resultadosFiltrados.length) * 100) : 0}%` }
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-lg p-4 shadow text-center">
                  <p className="text-xs text-slate-600">{stat.label}</p>
                  <p className="text-lg font-bold text-slate-800">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabla */}
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
                          r.stock_final === 0 ? "text-red-600"
                          : r.stock_final <= 5 ? "text-amber-600"
                          : "text-emerald-600"
                        }`}>
                          {r.stock_final ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          !r.status_equipo ? "bg-slate-100 text-slate-600"
                          : r.status_equipo.toLowerCase().includes("activo") ? "bg-emerald-100 text-emerald-700"
                          : r.status_equipo.toLowerCase().includes("inactivo") ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
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
