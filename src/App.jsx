import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { supabase } from "./supabase";

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

const planesData = {
  plan1: {
    nombre: "Plan Ahorro Mi Movistar",
    precio: "S/20.9",
    gradient: "from-rose-500 via-pink-500 to-orange-500",
    beneficios: [
      { tipo: "llamadas", texto: "Llamadas Ilimitadas", sub: "A nivel Nacional + 500 SMS" },
      { tipo: "internet", texto: "2 GB de internet" },
      { tipo: "ldi", texto: "+ 200 min LDI EE.UU./Canadá" },
      { tipo: "apps", apps: ["WhatsApp", "Facebook Fotos", "Messenger", "Instagram", "Waze"], excludeLoreto: true },
      { tipo: "extra", texto: "50 MB promocionales (12 meses) para datos internacionales en América y Europa." }
    ]
  },
  plan2: {
    nombre: "Plan Ahorro Mi Movistar",
    precio: "S/25.9",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    beneficios: [
      { tipo: "llamadas", texto: "Llamadas Ilimitadas", sub: "A nivel Nacional + 500 SMS" },
      { tipo: "internet", texto: "4 GB de internet" },
      { tipo: "ldi", texto: "+ 250 min LDI EE.UU./Canadá" },
      { tipo: "apps", apps: ["WhatsApp", "Facebook Fotos", "Messenger", "Instagram", "Waze"], excludeLoreto: true },
      { tipo: "extra", texto: "50 MB promocionales (12 meses) + WhatsApp de texto ilimitado." }
    ]
  },
  plan3: {
    nombre: "Plan Ahorro Mi Movistar",
    precio: "S/35.9",
    gradient: "from-slate-700 via-slate-800 to-gray-900",
    beneficios: [
      { tipo: "llamadas", texto: "Llamadas Ilimitadas", sub: "A nivel Nacional + 500 SMS" },
      { tipo: "internet", texto: "20 GB de internet" },
      { tipo: "ldi", texto: "+ 300 min LDI EE.UU./Canadá" },
      { tipo: "apps", apps: ["WhatsApp", "Facebook Fotos", "Messenger", "Instagram", "Waze"], excludeLoreto: true },
      { tipo: "extra", texto: "250 MB promocionales (12 meses) + WhatsApp de texto ilimitado." }
    ]
  },
  plan4: {
    nombre: "Plan Ahorro Mi Movistar",
    precio: "S/45.9",
    gradient: "from-purple-500 via-indigo-500 to-blue-500",
    beneficios: [
      { tipo: "llamadas", texto: "Llamadas Ilimitadas", sub: "A nivel Nacional + 500 SMS" },
      { tipo: "internet", texto: "36 GB de internet" },
      { tipo: "ldi", texto: "+ 350 min LDI EE.UU./Canadá" },
      { tipo: "apps", apps: ["WhatsApp", "Facebook Fotos", "Messenger", "Instagram", "Waze"], excludeLoreto: true },
      { tipo: "extra", texto: "1.25 GB promocionales (12 meses) + WhatsApp de texto ilimitado." }
    ]
  },
  plan5: {
    nombre: "Plan Ilimitado Mi Movistar",
    precio: "S/55.9",
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    beneficios: [
      { tipo: "llamadas", texto: "Llamadas Ilimitadas", sub: "A nivel Nacional + 500 SMS" },
      { tipo: "internet", texto: "Internet Ilimitado", sub: "66 GB en alta velocidad" },
      { tipo: "ldi", texto: "Llamadas Ilimitadas LDI", sub: "EE.UU./Canadá" },
      { tipo: "extra", texto: "2 GB promocionales (12 meses) + WhatsApp de texto ilimitado." }
    ]
  },
  plan6: {
    nombre: "Plan Ilimitado Mi Movistar",
    precio: "S/65.9",
    gradient: "from-cyan-500 via-blue-500 to-indigo-500",
    beneficios: [
      { tipo: "llamadas", texto: "Llamadas Ilimitadas", sub: "A nivel Nacional + 500 SMS" },
      { tipo: "internet", texto: "Internet Ilimitado", sub: "80 GB en alta velocidad" },
      { tipo: "ldi", texto: "Llamadas Ilimitadas LDI", sub: "EE.UU./Canadá" },
      { tipo: "extra", texto: "2 GB promocionales (12 meses) + WhatsApp de texto ilimitado." }
    ]
  },
  plan7: {
    nombre: "Plan Ilimitado Mi Movistar",
    precio: "S/74.9",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    beneficios: [
      { tipo: "llamadas", texto: "Llamadas Ilimitadas", sub: "A nivel Nacional + 500 SMS" },
      { tipo: "internet", texto: "Internet Ilimitado", sub: "110 GB en alta velocidad" },
      { tipo: "ldi", texto: "Llamadas Ilimitadas LDI", sub: "EE.UU./Canadá" },
      { tipo: "extra", texto: "3 GB promocionales (12 meses) + WhatsApp de texto ilimitado." }
    ]
  },
  plan8: {
    nombre: "Plan Ilimitado Mi Movistar",
    precio: "S/85.9",
    gradient: "from-pink-500 via-rose-500 to-red-500",
    beneficios: [
      { tipo: "llamadas", texto: "Llamadas Ilimitadas", sub: "A nivel Nacional + 500 SMS" },
      { tipo: "internet", texto: "Internet Ilimitado", sub: "125 GB en alta velocidad" },
      { tipo: "ldi", texto: "Llamadas Ilimitadas LDI", sub: "EE.UU./Canadá" },
      { tipo: "extra", texto: "3 GB promocionales (12 meses) + WhatsApp de texto ilimitado." }
    ]
  },
  plan9: {
    nombre: "Plan Ilimitado Mi Movistar",
    precio: "S/114.9",
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
    beneficios: [
      { tipo: "llamadas", texto: "Llamadas Ilimitadas", sub: "A nivel Nacional + 500 SMS" },
      { tipo: "internet", texto: "Internet Ilimitado", sub: "145 GB en alta velocidad + 500MB tethering" },
      { tipo: "ldi", texto: "Llamadas Ilimitadas LDI", sub: "EE.UU./Canadá" },
      { tipo: "extra", texto: "8 GB promocionales (12 meses) + WhatsApp de texto ilimitado." }
    ]
  }
};

function PlanModal({ plan, isOpen, onClose }) {
  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className={`sticky top-0 ${plan.gradient} p-2.5 rounded-t-lg relative`}>
          <h3 className="text-xs font-bold text-white">{plan.nombre}</h3>
          <p className="text-white/90 text-[11px]">{plan.precio} mensuales</p>
          <button
            onClick={onClose}
            className="absolute top-1 right-1 text-white/80 hover:text-white hover:bg-white/20 p-0.5 rounded-full transition-all"
            aria-label="Cerrar modal del plan"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-2.5 text-[11px] space-y-1.5">
          {plan.beneficios.map((beneficio, idx) => {
            if (beneficio.tipo === "llamadas") {
              return (
                <div key={idx} className="bg-rose-50 rounded p-1.5 border border-rose-200">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.848.536l1.42 2.028a1 1 0 01-.024.912l-1.264 6.324a1 1 0 01-1.028.868 1 1 0 01-1.028-.868L3.3 12.028A1 1 0 012 11.118V5a2 2 0 012-2z" />
                    </svg>
                    <span className="font-bold text-rose-700 text-[11px]">{beneficio.texto}</span>
                  </div>
                  <div className="ml-4 mt-0.5 text-slate-700 text-[10px]">{beneficio.sub}</div>
                </div>
              );
            }
            if (beneficio.tipo === "internet") {
              return (
                <div key={idx} className="bg-blue-50 rounded p-1.5 border border-blue-200">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-3M9 7V4M9 4H6M9 4h12M9 4v3M15 7h3" />
                    </svg>
                    <span className="font-bold text-blue-700 text-[11px]">{beneficio.texto}</span>
                  </div>
                  {beneficio.sub && <div className="ml-4 mt-0.5 text-slate-700 text-[10px]">{beneficio.sub}</div>}
                </div>
              );
            }
            if (beneficio.tipo === "ldi") {
              return (
                <div key={idx} className="bg-purple-50 rounded p-1.5 border border-purple-200">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 00-9-9v9h9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10a4 4 0 00-8 0v6a4 4 0 008 0v-6z" />
                    </svg>
                    <span className="text-slate-700 text-[11px]">{beneficio.texto}</span>
                  </div>
                  {beneficio.sub && <div className="ml-4 mt-0.5 text-slate-700 text-[10px]">{beneficio.sub}</div>}
                </div>
              );
            }
            if (beneficio.tipo === "apps") {
              return (
                <div key={idx} className="bg-slate-50 rounded p-1.5 border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="font-bold text-slate-800 text-[11px]">Apps ilimitadas (12 meses)</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {beneficio.apps.map((app) => (
                      <span key={app} className="px-1 py-0.5 bg-white text-[9px] rounded border border-slate-300">{app}</span>
                    ))}
                  </div>
                  {beneficio.excludeLoreto && (
                    <div className="mt-1 bg-red-50 border-l-2 border-red-400 p-0.5 rounded-r">
                      <p className="text-[9px] text-red-700 flex items-center gap-0.5">
                        <svg className="w-2 h-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" /></svg>
                        <span className="font-semibold">No informar a clientes de Loreto</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            }
            if (beneficio.tipo === "extra") {
              return (
                <div key={idx} className="bg-green-50 rounded p-1.5 border border-green-200">
                  <div className="text-slate-700 text-[11px]">
                    <span className="font-bold text-green-700">🎁 Beneficios adicionales:</span> {beneficio.texto}
                  </div>
                </div>
              );
            }
            return null;
          })}
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

  const buscarTiempoReal = useCallback(
    debounce(async (texto) => {
      if (!texto.trim()) {
        setResultados([]);
        return;
      }
      setLoading(true);
      setError(null);
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
        const accesoriosMapByCodigo = {};
        accesoriosData.forEach((acc) => {
          const codigoNormalizado = normalizarCodigo(acc.codigo_sap);
          if (codigoNormalizado) {
            accesoriosMapByCodigo[codigoNormalizado] = acc;
          }
        });
        const combinados = equiposData.map((eq) => {
          let acc = null;
          const codigoNormalizado = normalizarCodigo(eq.codigo_sap);
          if (codigoNormalizado && accesoriosMapByCodigo[codigoNormalizado]) {
            acc = accesoriosMapByCodigo[codigoNormalizado];
          }
          if (!acc) {
            const modeloEquipoNormalizado = normalizarTexto(eq.modelo);
            for (const accesorio of accesoriosData) {
              const modeloAccesorioNormalizado = normalizarTexto(accesorio.modelo);
              if (modeloAccesorioNormalizado && modeloEquipoNormalizado.includes(modeloAccesorioNormalizado)) {
                acc = accesorio;
                break;
              }
            }
          }
          return { ...eq, accesorio: acc?.accesorio ?? "-" };
        });
        setResultados(combinados || []);
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
    const sedes = Array.from(new Set(resultados.map((r) => r.hoja).filter(Boolean)));
    setSedesDisponibles(sedes);
    if (sedeFiltro && !sedes.includes(sedeFiltro)) {
      setSedeFiltro("");
    }
  }, [resultados]);

  const resultadosFiltrados = resultados
    .filter((r) => (sedeFiltro ? r.hoja === sedeFiltro : true))
    .sort((a, b) => {
      if (sortStockDesc) return (b.stock_final || 0) - (a.stock_final || 0);
      return (a.stock_final || 0) - (b.stock_final || 0);
    });

  const totalStock = resultadosFiltrados.reduce((sum, r) => sum + (r.stock_final || 0), 0);
  const itemsActivos = resultadosFiltrados.filter(
    (r) =>
      r.status_equipo &&
      (r.status_equipo.toLowerCase().includes("activo") ||
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
      if (error && error.code !== "PGRST116") {
        throw error;
      }
      setEspecificaciones(data || null);
    } catch (err) {
      console.error("Error al cargar especificaciones:", err);
      setEspecificaciones(null);
    } finally {
      setLoadingSpecs(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (selectedCodigoSap) {
          setSelectedCodigoSap(null);
          setEspecificaciones(null);
        }
        if (planModalAbierto) {
          setPlanModalAbierto(null);
        }
        if (mostrarContrato) {
          setMostrarContrato(false);
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [selectedCodigoSap, planModalAbierto, mostrarContrato]);

  const renderContrato = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-y-auto max-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold">Lectura de Contrato</h1>
            </div>
            <button
              onClick={() => setMostrarContrato(false)}
              className="text-white/90 hover:text-white hover:bg-white/20 p-1.5 rounded-full"
              title="Cerrar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <div className="pt-16 pb-6 px-2 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden max-h-[calc(100vh-80px)] overflow-y-auto">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <div className="p-4 sm:p-5 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
              {/* Introducción */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-indigo-900 mb-1">Inicio de Grabación</h3>
                    <p className="text-slate-700 text-[12px] leading-relaxed">
                      Muy bien Sr/Sra. <span className="font-semibold text-indigo-600">XXX</span>, vamos a iniciar con la grabación del contrato.
                    </p>
                    <p className="text-slate-700 mt-2 text-[12px] leading-relaxed">
                      Siendo hoy <span className="font-semibold">(día, mes, año)</span>, para continuar con la renovación del número <span className="font-semibold text-indigo-600">XXX</span>, por su seguridad validaremos los siguientes datos:
                    </p>
                  </div>
                </div>
              </div>

              {/* Datos a validar */}
              <div className="bg-white rounded-xl p-4 border border-indigo-100">
                <h3 className="text-[13px] font-bold text-slate-800 mb-2">Datos de Validación</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['Nombres y apellidos', 'Número de DNI', 'Correo electrónico', 'Número adicional de referencia', 'Dirección de entrega'].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[9px] font-bold">{idx + 1}</span>
                      </div>
                      <span className="text-[11px] text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advertencia dirección */}
              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4">
                <p className="font-bold text-amber-800 text-[12px] mb-1">⚠️ Dirección Completa Requerida</p>
                <ul className="space-y-0.5 text-[11px] text-amber-800 list-disc pl-4">
                  <li>Calle, número de puerta, distrito y referencias</li>
                  <li>Manzana, lote, urbanización, distrito y referencias</li>
                </ul>
              </div>

              {/* Renovación y Cambio de Plan */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-[14px] font-bold text-blue-900">Renovación + Cambio de Plan</h3>
                </div>
                <p className="text-slate-700 mb-3 text-[12px]">
                  Sr/Sra. <span className="font-semibold text-blue-600">XXX</span> ahora pasará a tener el plan <span className="font-semibold text-blue-600">XXX</span> con un precio mensual de <span className="font-bold text-blue-700">S/ XXX</span>
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(planesData).map(([key, plan]) => (
                    <button
                      key={key}
                      onClick={() => setPlanModalAbierto(key)}
                      className="group relative overflow-hidden bg-gradient-to-br text-white rounded-lg p-2 h-16 shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all"
                      style={{ background: `linear-gradient(to bottom right, ${plan.gradient.split(' ')[0].replace('from-', '')}, ${plan.gradient.split(' ')[2].replace('to-', '')})` }}
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative text-center">
                        <div className="text-[13px] font-black">{plan.precio}</div>
                        <div className="text-[9px] font-semibold opacity-90 mt-0.5">{plan.nombre.replace(" Mi Movistar", "")}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Términos y condiciones */}
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <h3 className="text-[13px] font-bold text-slate-800 mb-2">📋 Términos del Plan | Así mismo</h3>
                <ul className="space-y-1.5 text-[11px] text-slate-700">
                  {[
                    'Los beneficios del plan no son acumulables.',
                    'Los mensajes de texto del cargo fijo no incluyen Premium ni internacionales.',
                    'Los minutos todo destino no incluyen rurales.',
                    'Los mensajes de texto incluidos en su plan solo podrán utilizarse para mensajes de uso personal. No podrán ser usados para los fines de los servicios “mensajes de notificaciones” y/o “mensajes de publicidad”',
                    'Para llamar a USA y Canadá deberá marcar previamente 1911 antes del número internacional.'
                  ].map((term, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 p-1.5 rounded hover:bg-slate-50">
                      <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>{term}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Equipo Financiado */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-[14px] font-bold text-emerald-900">💳 Equipo Financiado</h3>
                </div>
                <div className="text-[11px] text-slate-700 space-y-1.5">
                  <p>Para finalizar la renovación, le detallo lo siguiente:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Estamos procediendo a registrar la solicitud del equipo <span className="font-semibold text-emerald-700">XXX</span> (marca, modelo, capacidad, color)</li>
                    <li>Cuota inicial de <span className="font-bold text-emerald-700">S/ XXX</span> y <span className="font-bold text-emerald-700">S/ XXX</span> por 12 meses</li>
                    <li>El equipo adquirido tiene un contrato de permanencia de <span className="font-semibold">12 meses</span></li>
                  </ul>
                  <div className="bg-white/50 rounded-lg p-3 mt-2 border border-emerald-200">
                    <p className="text-[10px] leading-relaxed">
                      En caso realice la baja del servicio móvil, migra a prepago o realiza un cambio de plan a uno menor,
                      Telefónica podrá resolver el financiamiento y cobrar todas las cuotas...
                    </p>
                  </div>
                </div>
              </div>

              {/* Equipo al Contado */}
              <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-[14px] font-bold text-violet-900">💰 Equipo al Contado</h3>
                </div>
                <div className="text-[11px] text-slate-700 space-y-1.5">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Estamos procediendo a registrar la solicitud del equipo <span className="font-semibold text-violet-700">XXX</span></li>
                    <li>Pago único de <span className="font-bold text-violet-700">S/ XXX</span></li>
                    <li>El equipo adquirido tiene un contrato de permanencia de <span className="font-semibold">12 meses</span></li>
                  </ul>
                  <div className="bg-white/50 rounded-lg p-3 mt-2 border border-violet-200">
                    <p className="text-[10px]">
                      Nuestro delivery le efectuará el cobro... no acepta efectivo...
                    </p>
                  </div>
                </div>
              </div>

              {/* Tratamiento de Datos */}
              <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-[14px] font-bold text-pink-900">🔒 Tratamiento de Datos Personales</h3>
                </div>
                <p className="text-[12px] leading-relaxed">
                  A fin de crear ofertas personalizadas... autoriza a Movistar... Te agradeceré decir <span className="font-bold text-pink-700">SÍ ACEPTO</span>.
                </p>
              </div>

              {/* Aceptación Final */}
              <div className="bg-indigo-100 rounded-xl p-4 border-2 border-indigo-300 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-800 text-[13px] font-medium">
                  Habiendo sido informado... le agradeceré decir <span className="font-bold text-indigo-700">SÍ ACEPTO</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Planes Reutilizable */}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">Inventario 360</h1>
                <p className="text-slate-300 text-xs -mt-0.5 hidden sm:block">Gestión de equipos</p>
              </div>
            </div>
            <button
              onClick={() => setMostrarContrato(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow-md hover:from-emerald-600 hover:to-emerald-700 transition-all border border-emerald-400/30"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden xs:inline">Contrato</span>
            </button>
          </div>
        </div>
      </header>
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Buscador + Filtro */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 relative w-full">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por modelo o código SAP..."
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={sedeFiltro}
                onChange={(e) => setSedeFiltro(e.target.value)}
                className="w-full border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las sedes</option>
                {sedesDisponibles.map((sede) => (
                  <option key={sede} value={sede}>{sede}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Estadísticas */}
          {modelo && resultadosFiltrados.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Resultados", value: resultadosFiltrados.length, color: "blue", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
                { label: "Stock Total", value: totalStock.toLocaleString(), color: "emerald", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
                { label: "Activos", value: itemsActivos, color: "green", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
                { label: "Tasa Activos", value: `${resultadosFiltrados.length > 0 ? Math.round((itemsActivos / resultadosFiltrados.length) * 100) : 0}%`, color: "purple", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }
              ].map((stat, i) => (
                <div key={i} className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 rounded-lg p-3 border border-${stat.color}-200`}>
                  <p className={`text-[10px] font-medium text-${stat.color}-600 mb-1`}>{stat.label}</p>
                  <p className="text-sm font-bold text-slate-800">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-5 rounded-lg">
              <p className="font-semibold text-red-800 text-sm">Error de conexión</p>
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          {/* Tabla */}
          {resultadosFiltrados.length > 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-[13px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-700 uppercase">Código SAP</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-700 uppercase">Modelo</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-700 uppercase">Accesorio</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-700 uppercase">Stock</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-700 uppercase">Estado</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-700 uppercase">Sede</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-700 uppercase">Especificaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultadosFiltrados.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <span className="text-[12px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{r.codigo_sap}</span>
                        </td>
                        <td className="px-3 py-2 max-w-[120px] truncate" title={r.modelo}>{r.modelo}</td>
                        <td className="px-3 py-2 max-w-[120px] truncate" title={r.accesorio}>{r.accesorio}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[12px] font-bold ${
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
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${
                            !r.status_equipo ? "bg-slate-100 text-slate-600"
                            : (r.status_equipo.toLowerCase().includes("activo") || r.status_equipo.toLowerCase().includes("disponible") || r.status_equipo.toLowerCase().includes("life"))
                              ? "bg-emerald-100 text-emerald-700"
                              : (r.status_equipo.toLowerCase().includes("inactivo") || r.status_equipo.toLowerCase().includes("baja"))
                                ? "bg-red-100 text-red-700"
                                : (r.status_equipo.toLowerCase().includes("mantenimiento") || r.status_equipo.toLowerCase().includes("reposo") || r.status_equipo.toLowerCase().includes("phase"))
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-700"
                          }`}>
                            {r.status_equipo || "-"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[12px] text-slate-600 font-medium bg-slate-50 px-2 py-0.5 rounded">{r.hoja}</span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCodigoSap(r.codigo_sap);
                              cargarEspecificaciones(r.codigo_sap);
                            }}
                            className="px-2.5 py-1 bg-blue-500 text-white rounded text-[11px] hover:bg-blue-600 transition-colors"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            !loading && modelo && (
              <div className="bg-white rounded-xl shadow-lg p-6 text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-600">No se encontraron resultados para <span className="font-semibold">"{modelo}"</span></p>
              </div>
            )
          )}

          {!modelo && !loading && (
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-slate-200">
              <p className="text-slate-800 font-medium">Comienza a buscar</p>
              <p className="text-slate-600 text-sm">Ingresa el modelo o código SAP</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal PDF */}
      {selectedCodigoSap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/50 backdrop-blur-md"
          onClick={() => {
            setSelectedCodigoSap(null);
            setEspecificaciones(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
              <h2 className="text-sm font-bold">Ficha Técnica (PDF)</h2>
              <button
                onClick={() => {
                  setSelectedCodigoSap(null);
                  setEspecificaciones(null);
                }}
                className="text-white/80 hover:text-white p-1"
                aria-label="Cerrar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-[70vh]">
              {loadingSpecs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : especificaciones?.url ? (
                <iframe
                  src={convertirDriveUrl(especificaciones.url)}
                  title="Ficha técnica PDF"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              ) : (
                <div className="flex items-center justify-center h-full p-4 text-center text-slate-500">
                  <p className="text-sm">No se encontró el PDF técnico para {selectedCodigoSap}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
