import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { supabase } from "./supabase";

// Función para normalizar los códigos SAP
const normalizarCodigo = (codigo) => {
  if (!codigo) return "";
  return codigo.toString().trim().toUpperCase().replace(/\s+/g, "");
};

// Función para normalizar texto (modelos)
const normalizarTexto = (texto) => {
  if (!texto) return "";
  return texto.toString().trim().toUpperCase().replace(/\s+/g, " ");
};

// Función para convertir enlace de Drive a preview
const convertirDriveUrl = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "drive.google.com" && urlObj.pathname.startsWith("/file/d/")) {
      const id = urlObj.pathname.split("/")[3];
      if (id) {
        return `https://drive.google.com/file/d/${id}/preview`;
      }
    }
  } catch (e) {
    console.warn("URL inválida:", url);
  }
  return url;
};

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
              if (
                modeloAccesorioNormalizado &&
                modeloEquipoNormalizado.includes(modeloAccesorioNormalizado)
              ) {
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.5s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.4s ease-out forwards;
        }
        .shimmer-effect {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
      {/* Header del contrato */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold">Lectura de Contrato</h1>
            <button
              onClick={() => setMostrarContrato(false)}
              className="text-white/90 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
              title="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Título principal animado */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl mb-4 transform hover:scale-110 transition-transform duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Contrato de Renovación
            </h1>
            <p className="text-slate-600 text-lg">CAEQ Digital - Movistar</p>
          </div>
          {/* Contenedor principal del contrato */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-scale-in">
            {/* Barra decorativa superior */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-amber-900 mb-2">⚠️ Dirección Completa Requerida</p>
                    <ul className="space-y-1 text-sm text-amber-800">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>Calle, número de puerta, distrito y referencias</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>Manzana, lote, urbanización, distrito y referencias</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* Renovación y Cambio de Plan */}
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

{/* Botones de planes con tamaño reducido */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  <button
    onClick={() => setPlanModalAbierto('plan1')}
    className="group relative overflow-hidden bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
  >
    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative">
      <div className="text-2xl font-black mb-1">S/20.9</div>
      <div className="text-xs font-semibold opacity-90">Plan Ahorro</div>
      <div className="mt-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full inline-block">Ver detalles →</div>
    </div>
  </button>
  <button
    onClick={() => setPlanModalAbierto('plan2')}
    className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
  >
    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative">
      <div className="text-2xl font-black mb-1">S/25.9</div>
      <div className="text-xs font-semibold opacity-90">Plan Ahorro</div>
      <div className="mt-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full inline-block">Ver detalles →</div>
    </div>
  </button>
  <button
    onClick={() => setPlanModalAbierto('plan3')}
    className="group relative overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-gray-900 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
  >
    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative">
      <div className="text-2xl font-black mb-1">S/35.9</div>
      <div className="text-xs font-semibold opacity-90">Plan Ahorro</div>
      <div className="mt-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full inline-block">Ver detalles →</div>
    </div>
  </button>
  <button
    onClick={() => setPlanModalAbierto('plan4')}
    className="group relative overflow-hidden bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
  >
    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative">
      <div className="text-2xl font-black mb-1">S/45.9</div>
      <div className="text-xs font-semibold opacity-90">Plan Ahorro</div>
      <div className="mt-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full inline-block">Ver detalles →</div>
    </div>
  </button>
  <button
    onClick={() => setPlanModalAbierto('plan5')}
    className="group relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
  >
    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative">
      <div className="text-2xl font-black mb-1">S/55.9</div>
      <div className="text-xs font-semibold opacity-90">Plan Ilimitado</div>
      <div className="mt-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full inline-block">Ver detalles →</div>
    </div>
  </button>
  <button
    onClick={() => setPlanModalAbierto('plan6')}
    className="group relative overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
  >
    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative">
      <div className="text-2xl font-black mb-1">S/65.9</div>
      <div className="text-xs font-semibold opacity-90">Plan Ilimitado</div>
      <div className="mt-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full inline-block">Ver detalles →</div>
    </div>
  </button>
  <button
    onClick={() => setPlanModalAbierto('plan7')}
    className="group relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
  >
    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative">
      <div className="text-2xl font-black mb-1">S/74.9</div>
      <div className="text-xs font-semibold opacity-90">Plan Ilimitado</div>
      <div className="mt-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full inline-block">Ver detalles →</div>
    </div>
  </button>
  <button
    onClick={() => setPlanModalAbierto('plan8')}
    className="group relative overflow-hidden bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
  >
    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative">
      <div className="text-2xl font-black mb-1">S/85.9</div>
      <div className="text-xs font-semibold opacity-90">Plan Ilimitado</div>
      <div className="mt-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full inline-block">Ver detalles →</div>
    </div>
  </button>
  <button
    onClick={() => setPlanModalAbierto('plan9')}
    className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
  >
    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative">
      <div className="text-2xl font-black mb-1">S/114.9</div>
      <div className="text-xs font-semibold opacity-90">Plan Ilimitado</div>
      <div className="mt-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full inline-block">Ver detalles →</div>
    </div>
  </button>
</div>


              </div>
              {/* Términos y condiciones */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg animate-slide-in-right" style={{animationDelay: '0.5s'}}>
                <h3 className="text-lg font-bold text-slate-800 mb-4">📋 Términos del Plan</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {[
                    'Los beneficios del plan no son acumulables.',
                    'Los mensajes de texto del cargo fijo no incluyen Premium ni internacionales.',
                    'Los minutos todo destino no incluyen rurales.',
                    'Los mensajes incluidos solo podrán utilizarse para mensajes de uso personal.',
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
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Equipo <span className="font-semibold text-emerald-700">XXX</span> (marca, modelo, capacidad, color)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Cuota inicial de <span className="font-bold text-emerald-700">S/ XXX</span> y <span className="font-bold text-emerald-700">S/ XXX</span> por 12 meses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Contrato de permanencia de <span className="font-semibold">12 meses</span></span>
                    </li>
                  </ul>
                  <div className="bg-white/50 rounded-xl p-4 mt-4 border border-emerald-200">
                    <p className="text-xs leading-relaxed">
                      En caso de baja del servicio, migración a prepago o cambio de plan menor, Telefónica podrá resolver el financiamiento y cobrar todas las cuotas. El cliente está obligado a pagar la totalidad. El incumplimiento puede resultar en bloqueo remoto del equipo y reporte en centrales de riesgo.
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
                    <li className="flex items-start gap-2">
                      <span className="text-violet-500 font-bold">•</span>
                      <span>Equipo <span className="font-semibold text-violet-700">XXX</span> (marca, modelo, capacidad, color)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-violet-500 font-bold">•</span>
                      <span>Pago único de <span className="font-bold text-violet-700">S/ XXX</span></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-violet-500 font-bold">•</span>
                      <span>Contrato de permanencia de <span className="font-semibold">12 meses</span></span>
                    </li>
                  </ul>
                  <div className="bg-white/50 rounded-xl p-4 mt-4 border border-violet-200">
                    <p className="text-xs leading-relaxed">
                      Nuestro delivery le efectuará el cobro correspondiente del equipo. El delivery no acepta efectivo, el pago deberá efectuarse con tarjeta de débito o crédito Visa, MasterCard y Diners.
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
                <div className="space-y-3 text-sm text-slate-700">
                  <p className="leading-relaxed">
                    A fin de crear ofertas personalizadas y recibir anuncios comerciales, autoriza a Movistar a hacer uso y tratamiento de sus datos personales. Te agradeceré decir <span className="font-bold text-pink-700">SÍ ACEPTO</span>.
                  </p>
                  <div className="bg-white/50 rounded-xl p-4 border border-pink-200">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Movistar resguardará tus datos personales según la legislación vigente. Para más información, consulta la política de privacidad en{' '}
                      <a
                        href="https://www.movistar.com.pe/privacidad"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-700 font-semibold underline"
                      >
                        www.movistar.com.pe/privacidad
                      </a>
                    </p>
                  </div>
                </div>
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
                    Habiendo sido informado de las características del contrato, le agradeceré decir <span className="font-bold text-indigo-700 text-xl">SÍ ACEPTO</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MODALES DE PLANES SIN ANIMACIÓN (solo bg y estructura) */}
      {planModalAbierto === 'plan1' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 p-6 rounded-t-3xl relative">
              <h3 className="text-2xl font-bold text-white mb-1">Plan Ahorro Mi Movistar</h3>
              <p className="text-white/90 text-lg font-semibold">S/20.9 mensuales</p>
              <button
                onClick={() => setPlanModalAbierto(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
                aria-label="Cerrar modal del plan"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-5 rounded-2xl border border-rose-200 shadow-sm">
                <p className="font-bold text-rose-700 text-lg mb-1">📞 Llamadas Ilimitadas</p>
                <p className="text-slate-700">A nivel Nacional + 500 SMS</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                <p className="font-bold text-blue-700 text-lg">📱 2 GB de internet</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200 shadow-sm">
                <p className="text-slate-700">🌎 + 200 min LDI EE.UU./Canadá</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-bold mb-3 text-slate-800">📲 Apps ilimitadas (12 meses)</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['WhatsApp', 'Facebook Fotos', 'Messenger', 'Instagram', 'Waze'].map((app) => (
                    <span key={app} className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-slate-700 border border-slate-300 shadow-sm">{app}</span>
                  ))}
                </div>
                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                  <p className="text-xs text-red-700 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" /></svg>
                    <span className="font-semibold">No informar a clientes de Loreto</span>
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-200 shadow-sm">
                <p className="text-sm text-slate-700"><span className="font-bold text-green-700">🎁 Beneficios adicionales:</span> 50 MB promocionales (12 meses) para datos internacionales en América y Europa.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {planModalAbierto === 'plan2' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 p-6 rounded-t-3xl relative">
              <h3 className="text-2xl font-bold text-white mb-1">Plan Ahorro Mi Movistar</h3>
              <p className="text-white/90 text-lg font-semibold">S/25.9 mensuales</p>
              <button
                onClick={() => setPlanModalAbierto(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
                aria-label="Cerrar modal del plan"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-5 rounded-2xl border border-rose-200 shadow-sm">
                <p className="font-bold text-rose-700 text-lg mb-1">📞 Llamadas Ilimitadas</p>
                <p className="text-slate-700">A nivel Nacional + 500 SMS</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                <p className="font-bold text-blue-700 text-lg">📱 4 GB de internet</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200 shadow-sm">
                <p className="text-slate-700">🌎 + 250 min LDI EE.UU./Canadá</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-bold mb-3 text-slate-800">📲 Apps ilimitadas (12 meses)</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['WhatsApp', 'Facebook Fotos', 'Messenger', 'Instagram', 'Waze'].map((app) => (
                    <span key={app} className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-slate-700 border border-slate-300 shadow-sm">{app}</span>
                  ))}
                </div>
                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                  <p className="text-xs text-red-700 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" /></svg>
                    <span className="font-semibold">No informar a clientes de Loreto</span>
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-200 shadow-sm">
                <p className="text-sm text-slate-700"><span className="font-bold text-green-700">🎁 Beneficios adicionales:</span> 50 MB promocionales (12 meses) + WhatsApp de texto ilimitado.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {planModalAbierto === 'plan3' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-slate-700 via-slate-800 to-gray-900 p-6 rounded-t-3xl relative">
              <h3 className="text-2xl font-bold text-white mb-1">Plan Ahorro Mi Movistar</h3>
              <p className="text-white/90 text-lg font-semibold">S/35.9 mensuales</p>
              <button
                onClick={() => setPlanModalAbierto(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
                aria-label="Cerrar modal del plan"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-5 rounded-2xl border border-rose-200 shadow-sm">
                <p className="font-bold text-rose-700 text-lg mb-1">📞 Llamadas Ilimitadas</p>
                <p className="text-slate-700">A nivel Nacional + 500 SMS</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                <p className="font-bold text-blue-700 text-lg">📱 20 GB de internet</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200 shadow-sm">
                <p className="text-slate-700">🌎 + 300 min LDI EE.UU./Canadá</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-bold mb-3 text-slate-800">📲 Apps ilimitadas (12 meses)</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['WhatsApp', 'Facebook Fotos', 'Messenger', 'Instagram', 'Waze'].map((app) => (
                    <span key={app} className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-slate-700 border border-slate-300 shadow-sm">{app}</span>
                  ))}
                </div>
                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                  <p className="text-xs text-red-700 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" /></svg>
                    <span className="font-semibold">No informar a clientes de Loreto</span>
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-200 shadow-sm">
                <p className="text-sm text-slate-700"><span className="font-bold text-green-700">🎁 Beneficios adicionales:</span> 250 MB promocionales (12 meses) + WhatsApp de texto ilimitado.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {planModalAbierto === 'plan4' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 p-6 rounded-t-3xl relative">
              <h3 className="text-2xl font-bold text-white mb-1">Plan Ahorro Mi Movistar</h3>
              <p className="text-white/90 text-lg font-semibold">S/45.9 mensuales</p>
              <button
                onClick={() => setPlanModalAbierto(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
                aria-label="Cerrar modal del plan"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-5 rounded-2xl border border-rose-200 shadow-sm">
                <p className="font-bold text-rose-700 text-lg mb-1">📞 Llamadas Ilimitadas</p>
                <p className="text-slate-700">A nivel Nacional + 500 SMS</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                <p className="font-bold text-blue-700 text-lg">📱 36 GB de internet</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200 shadow-sm">
                <p className="text-slate-700">🌎 + 350 min LDI EE.UU./Canadá</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-sm font-bold mb-3 text-slate-800">📲 Apps ilimitadas (12 meses)</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['WhatsApp', 'Facebook Fotos', 'Messenger', 'Instagram', 'Waze'].map((app) => (
                    <span key={app} className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-slate-700 border border-slate-300 shadow-sm">{app}</span>
                  ))}
                </div>
                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                  <p className="text-xs text-red-700 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clipRule="evenodd" /></svg>
                    <span className="font-semibold">No informar a clientes de Loreto</span>
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-200 shadow-sm">
                <p className="text-sm text-slate-700"><span className="font-bold text-green-700">🎁 Beneficios adicionales:</span> 1.25 GB promocionales (12 meses) + WhatsApp de texto ilimitado.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {planModalAbierto === 'plan5' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6 rounded-t-3xl relative">
              <h3 className="text-2xl font-bold text-white mb-1">Plan Ilimitado Mi Movistar</h3>
              <p className="text-white/90 text-lg font-semibold">S/55.9 mensuales</p>
              <button
                onClick={() => setPlanModalAbierto(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
                aria-label="Cerrar modal del plan"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-5 rounded-2xl border border-rose-200 shadow-sm">
                <p className="font-bold text-rose-700 text-lg mb-1">📞 Llamadas Ilimitadas</p>
                <p className="text-slate-700">A nivel Nacional + 500 SMS</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                <p className="font-bold text-blue-700 text-xl mb-1">📱 Internet Ilimitado</p>
                <p className="text-slate-700 font-medium">66 GB en alta velocidad</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200 shadow-sm">
                <p className="text-slate-700 font-semibold">🌎 Llamadas Ilimitadas LDI EE.UU./Canadá</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border-l-4 border-green-500 shadow-sm">
                <p className="text-sm text-slate-700"><span className="font-bold text-green-700">🎁 Beneficios adicionales:</span> 2 GB promocionales (12 meses) + WhatsApp de texto ilimitado.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {planModalAbierto === 'plan6' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 p-6 rounded-t-3xl relative">
              <h3 className="text-2xl font-bold text-white mb-1">Plan Ilimitado Mi Movistar</h3>
              <p className="text-white/90 text-lg font-semibold">S/65.9 mensuales</p>
              <button
                onClick={() => setPlanModalAbierto(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
                aria-label="Cerrar modal del plan"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-5 rounded-2xl border border-rose-200 shadow-sm">
                <p className="font-bold text-rose-700 text-lg mb-1">📞 Llamadas Ilimitadas</p>
                <p className="text-slate-700">A nivel Nacional + 500 SMS</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                <p className="font-bold text-blue-700 text-xl mb-1">📱 Internet Ilimitado</p>
                <p className="text-slate-700 font-medium">80 GB en alta velocidad</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200 shadow-sm">
                <p className="text-slate-700 font-semibold">🌎 Llamadas Ilimitadas LDI EE.UU./Canadá</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border-l-4 border-green-500 shadow-sm">
                <p className="text-sm text-slate-700"><span className="font-bold text-green-700">🎁 Beneficios adicionales:</span> 2 GB promocionales (12 meses) + WhatsApp de texto ilimitado.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {planModalAbierto === 'plan7' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 rounded-t-3xl relative">
              <h3 className="text-2xl font-bold text-white mb-1">Plan Ilimitado Mi Movistar</h3>
              <p className="text-white/90 text-lg font-semibold">S/74.9 mensuales</p>
              <button
                onClick={() => setPlanModalAbierto(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
                aria-label="Cerrar modal del plan"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-5 rounded-2xl border border-rose-200 shadow-sm">
                <p className="font-bold text-rose-700 text-lg mb-1">📞 Llamadas Ilimitadas</p>
                <p className="text-slate-700">A nivel Nacional + 500 SMS</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                <p className="font-bold text-blue-700 text-xl mb-1">📱 Internet Ilimitado</p>
                <p className="text-slate-700 font-medium">110 GB en alta velocidad</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200 shadow-sm">
                <p className="text-slate-700 font-semibold">🌎 Llamadas Ilimitadas LDI EE.UU./Canadá</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border-l-4 border-green-500 shadow-sm">
                <p className="text-sm text-slate-700"><span className="font-bold text-green-700">🎁 Beneficios adicionales:</span> 3 GB promocionales (12 meses) + WhatsApp de texto ilimitado.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {planModalAbierto === 'plan8' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-6 rounded-t-3xl relative">
              <h3 className="text-2xl font-bold text-white mb-1">Plan Ilimitado Mi Movistar</h3>
              <p className="text-white/90 text-lg font-semibold">S/85.9 mensuales</p>
              <button
                onClick={() => setPlanModalAbierto(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
                aria-label="Cerrar modal del plan"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-5 rounded-2xl border border-rose-200 shadow-sm">
                <p className="font-bold text-rose-700 text-lg mb-1">📞 Llamadas Ilimitadas</p>
                <p className="text-slate-700">A nivel Nacional + 500 SMS</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                <p className="font-bold text-blue-700 text-xl mb-1">📱 Internet Ilimitado</p>
                <p className="text-slate-700 font-medium">125 GB en alta velocidad</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200 shadow-sm">
                <p className="text-slate-700 font-semibold">🌎 Llamadas Ilimitadas LDI EE.UU./Canadá</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border-l-4 border-green-500 shadow-sm">
                <p className="text-sm text-slate-700"><span className="font-bold text-green-700">🎁 Beneficios adicionales:</span> 3 GB promocionales (12 meses) + WhatsApp de texto ilimitado.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {planModalAbierto === 'plan9' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 rounded-t-3xl relative">
              <h3 className="text-2xl font-bold text-white mb-1">Plan Ilimitado Mi Movistar</h3>
              <p className="text-white/90 text-lg font-semibold">S/114.9 mensuales</p>
              <button
                onClick={() => setPlanModalAbierto(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
                aria-label="Cerrar modal del plan"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-5 rounded-2xl border border-rose-200 shadow-sm">
                <p className="font-bold text-rose-700 text-lg mb-1">📞 Llamadas Ilimitadas</p>
                <p className="text-slate-700">A nivel Nacional + 500 SMS</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                <p className="font-bold text-blue-700 text-xl mb-1">📱 Internet Ilimitado</p>
                <p className="text-slate-700 font-medium">145 GB en alta velocidad + 500MB tethering</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200 shadow-sm">
                <p className="text-slate-700 font-semibold">🌎 Llamadas Ilimitadas LDI EE.UU./Canadá</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border-l-4 border-green-500 shadow-sm">
                <p className="text-sm text-slate-700"><span className="font-bold text-green-700">🎁 Beneficios adicionales:</span> 8 GB promocionales (12 meses) + WhatsApp de texto ilimitado.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (mostrarContrato) {
    return renderContrato();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Fijo */}
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow-md hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:scale-105 transition-all duration-200 border border-emerald-400/30"
              title="Ver contrato de renovación"
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
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 mb-6 hover:shadow-xl transition-shadow duration-300 flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 relative w-full sm:w-auto">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por modelo o código SAP..."
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={sedeFiltro}
                onChange={(e) => setSedeFiltro(e.target.value)}
                className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las sedes</option>
                {sedesDisponibles.map((sede) => (
                  <option key={sede} value={sede}>
                    {sede}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Estadísticas */}
          {modelo && resultadosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-600 mb-1">Resultados</p>
                    <p className="text-xl font-bold text-slate-800">{resultadosFiltrados.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm border border-emerald-200 p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-600 mb-1">Stock Total</p>
                    <p className="text-xl font-bold text-slate-800">{totalStock.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-1">Activos</p>
                    <p className="text-xl font-bold text-slate-800">{itemsActivos}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-purple-600 mb-1">Tasa Activos</p>
                    <p className="text-xl font-bold text-slate-800">
                      {resultadosFiltrados.length > 0 ? Math.round((itemsActivos / resultadosFiltrados.length) * 100) : 0}%
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-red-800 text-sm">Error de conexión</p>
                  <p className="text-red-700 text-xs">{error}</p>
                </div>
              </div>
            </div>
          )}
          {/* Tabla */}
          {resultadosFiltrados.length > 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Código SAP</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Modelo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Accesorio</th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer"
                        onClick={() => setSortStockDesc(!sortStockDesc)}
                      >
                        Stock {sortStockDesc ? "⬇️" : "⬆️"}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Sede</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Especificaciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {resultadosFiltrados.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-all duration-200 hover:shadow-sm">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded border">{r.codigo_sap}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-800 font-medium max-w-md truncate" title={r.modelo}>
                            {r.modelo}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-700 max-w-md truncate" title={r.accesorio}>
                            {r.accesorio}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`text-sm font-bold ${
                              r.stock_final === null || r.stock_final === undefined
                                ? "text-slate-400"
                                : r.stock_final === 0
                                ? "text-red-600"
                                : r.stock_final <= 5
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {r.stock_final ?? "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                              !r.status_equipo
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : r.status_equipo.toLowerCase().includes("activo") ||
                                  r.status_equipo.toLowerCase().includes("disponible") ||
                                  r.status_equipo.toLowerCase().includes("life")
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : r.status_equipo.toLowerCase().includes("inactivo") ||
                                  r.status_equipo.toLowerCase().includes("baja")
                                ? "bg-red-100 text-red-700 border-red-200"
                                : r.status_equipo.toLowerCase().includes("mantenimiento") ||
                                  r.status_equipo.toLowerCase().includes("reposo") ||
                                  r.status_equipo.toLowerCase().includes("phase")
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-blue-100 text-blue-700 border-blue-200"
                            }`}
                          >
                            {r.status_equipo || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-slate-600 font-medium bg-slate-50 px-2 py-1 rounded border">{r.hoja}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCodigoSap(r.codigo_sap);
                              cargarEspecificaciones(r.codigo_sap);
                            }}
                            className="group relative inline-flex items-center justify-center px-3.5 py-2 overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
                            title="Ver especificaciones técnicas"
                          >
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                            <svg
                              className="relative w-4 h-4 mr-1.5 transition-transform group-hover:rotate-12"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="relative text-xs font-medium">Ver</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            !loading &&
            modelo && (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors duration-200">
                <div className="w-16 h-16 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-slate-600 text-base mb-2">
                  No se encontraron resultados para <span className="font-semibold text-slate-800">"{modelo}"</span>
                </p>
                <p className="text-slate-500 text-sm">Intenta con otro término de búsqueda</p>
              </div>
            )
          )}
          {!modelo && !loading && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-slate-200 hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-slate-800 text-lg font-medium mb-2">Comienza a buscar</p>
              <p className="text-slate-600">Ingresa el modelo o código SAP para comenzar</p>
            </div>
          )}
        </div>
      </div>
      {/* Modal: PDF Viewer */}
      {selectedCodigoSap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md transition-all duration-300"
          onClick={() => {
            setSelectedCodigoSap(null);
            setEspecificaciones(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "modalFadeIn 0.3s ease-out forwards",
              border: "1px solid rgba(148, 163, 184, 0.1)",
            }}
          >
            <style>{`
              @keyframes modalFadeIn {
                from {
                  opacity: 0;
                  transform: scale(0.95) translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: scale(1) translateY(0);
                }
              }
            `}</style>
            <div className="relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold">Ficha Técnica (PDF)</h2>
                  <p className="text-blue-100 text-xs font-medium">Código: {selectedCodigoSap}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCodigoSap(null);
                  setEspecificaciones(null);
                }}
                className="text-white/80 hover:text-white hover:bg-white/20 transition-all rounded-full p-2 hover:rotate-90 duration-300"
                aria-label="Cerrar modal de PDF"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-0 h-[70vh]">
              {loadingSpecs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : especificaciones?.url ? (
                <iframe
                  src={convertirDriveUrl(especificaciones.url)}
                  title="Ficha técnica PDF"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              ) : (
                <div className="flex items-center justify-center h-full p-6 text-center text-slate-500">
                  <div>
                    <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium text-slate-600">No se encontró el PDF técnico</p>
                    <p className="text-xs mt-1 opacity-80">Código SAP: {selectedCodigoSap}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
