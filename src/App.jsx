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

  // Render del contrato (más compacto)
  const renderContrato = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header del contrato */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-bold">Lectura de Contrato</h1>
            <button
              onClick={() => setMostrarContrato(false)}
              className="text-white/90 hover:text-white hover:bg-white/20 p-1.5 rounded-full transition-all"
              title="Cerrar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="pt-16 pb-8 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-center mb-3 text-slate-800">CONTRATO RENOVACIÓN DE EQUIPO – CAEQ DIGITAL</h1>

          <p className="text-sm mb-2">Muy bien Sr/Sra. XXX, vamos a iniciar con la grabación del contrato.</p>

          <p className="text-sm mb-2">
            Siendo hoy (día, mes, año), para continuar con la renovación del número XXX, por su seguridad validaremos los siguientes datos, me indica:
          </p>

          <ul className="text-xs list-disc pl-5 mb-3 space-y-1">
            <li>Nombres y apellidos</li>
            <li>Número de DNI</li>
            <li>Correo electrónico</li>
            <li>Número adicional de referencia</li>
            <li>Dirección de entrega</li>
          </ul>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 my-3 rounded-r text-xs">
            <p><strong>La dirección debe ser completa:</strong></p>
            <ul className="list-disc pl-5 mt-1">
              <li>Calle, número de puerta, distrito y referencias</li>
              <li>Manzana, lote, urbanización, distrito y referencias</li>
            </ul>
          </div>

          <h2 className="text-lg font-semibold mt-4 mb-2 text-slate-700">Renovación más Cambio de Plan</h2>
          <p className="text-sm mb-2">
            Sr/Sra. XXX ahora pasará a tener el plan XXX con un precio mensual de S/ XXX. Con este plan, obtendrá los siguientes beneficios:
          </p>

          {/* Botones de planes compactos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 mb-3">
            {[
              { key: 'plan1', label: 'S/20.9', name: 'Plan Ahorro' },
              { key: 'plan2', label: 'S/25.9', name: 'Plan Ahorro' },
              { key: 'plan3', label: 'S/35.9', name: 'Plan Ahorro' },
              { key: 'plan4', label: 'S/45.9', name: 'Plan Ahorro' },
              { key: 'plan5', label: 'S/55.9', name: 'Plan Ilimitado' },
              { key: 'plan6', label: 'S/65.9', name: 'Plan Ilimitado' },
              { key: 'plan7', label: 'S/74.9', name: 'Plan Ilimitado' },
              { key: 'plan8', label: 'S/85.9', name: 'Plan Ilimitado' },
              { key: 'plan9', label: 'S/114.9', name: 'Plan Ilimitado' },
            ].map((plan) => (
              <button
                key={plan.key}
                onClick={() => setPlanModalAbierto(plan.key)}
                className="px-2.5 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold rounded shadow hover:shadow-md transition-all"
              >
                {plan.label} ({plan.name})
              </button>
            ))}
          </div>

          <p className="text-xs mt-2"><strong>(LEER PARRILLA DE PLANES Y MENCIONAR LOS BENEFICIOS COMPLETOS)</strong></p>

          <p className="text-sm mt-3 mb-2">Así mismo:</p>
          <ul className="text-xs list-disc pl-5 mb-3 space-y-1">
            <li>Los beneficios del plan no son acumulables.</li>
            <li>Los mensajes de texto del cargo fijo no incluyen Premium ni internacionales.</li>
            <li>Los minutos todo destino no incluye rurales</li>
            <li>Los mensajes de texto incluidos en su plan solo podrán utilizarse para mensajes de uso personal. No podrán ser usados para los fines de los servicios “mensajes de notificaciones” y/o “mensajes de publicidad”</li>
            <li>Para llamar a USA y Canadá deberá marcar previamente 1911 antes del número internacional</li>
          </ul>

          <h2 className="text-lg font-semibold mt-4 mb-2 text-slate-700">Equipo Financiado</h2>
          <p className="text-sm mb-2">Para finalizar la renovación, le detallo lo siguiente:</p>
          <ul className="text-xs list-disc pl-5 mb-3 space-y-1">
            <li>Estamos procediendo a registrar la solicitud del equipo XXX (marca, modelo, capacidad, color)</li>
            <li>Con una cuota inicial de S/ XXX y S/ XXX por 12 meses</li>
            <li>El equipo adquirido tiene un contrato de permanencia de 12 meses</li>
          </ul>
          <p className="text-xs mb-3">
            En caso realice la baja del servicio móvil, migra a prepago o realiza un cambio de plan a uno menor, Telefónica podrá resolver el financiamiento y cobrar todas las cuotas. Es obligación del cliente pagar la totalidad de las cuotas. Recuerde que en caso de no pagar una o mas cuotas del equipo o de la totalidad del equipo, en caso de resolverse el financiamiento, Movistar podrá optar por bloquear el equipo de manera remota y reportarlo en las centrales de riesgo.
          </p>

          <h2 className="text-lg font-semibold mt-4 mb-2 text-slate-700">Equipo al Contado</h2>
          <p className="text-sm mb-2">Para finalizar la renovación, le detallo lo siguiente:</p>
          <ul className="text-xs list-disc pl-5 mb-3 space-y-1">
            <li>Estamos procediendo a registrar la solicitud del equipo XXX (marca, modelo, capacidad, color)</li>
            <li>Con un pago único de S/ XXX</li>
            <li>El equipo adquirido tiene un contrato de permanencia de 12 meses</li>
          </ul>
          <p className="text-xs">
            Nuestro delivery le efectuara el cobro correspondiente del equipo. Cabe recalcar que nuestro delivery no acepta efectivo por lo que el pago deberá efectuarse con tarjeta de débito o crédito Visa, MasterCard y Diners
          </p>

          <h2 className="text-lg font-semibold mt-4 mb-2 text-slate-700">Autorización de Tratamiento de Datos Personales</h2>
          <p className="text-sm mb-2">
            A fin de crear ofertas personalizadas y recibir anuncios comerciales, autoriza a Movistar a hacer uso y tratamiento de sus datos personales. Te agradeceré decir <strong>SÍ ACEPTO</strong>
          </p>
          <p className="text-xs text-slate-600 italic mb-2">
            Movistar resguardara tus datos personales según la legislación vigente. Para más información, consulta la política de privacidad en{' '}
            <a
              href="https://www.movistar.com.pe/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              www.movistar.com.pe/privacidad
            </a>
          </p>

          <p className="text-sm mt-3">
            Habiendo sido informado de las características del contrato, le agradeceré decir <strong>SÍ ACEPTO</strong>
          </p>
        </div>
      </div>

      {/* Modales de planes (sin animaciones, compactos) */}
      {planModalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-t-lg relative">
              <h3 className="text-base font-bold text-white">
                {planModalAbierto === 'plan1' && 'Plan Ahorro Mi Movistar S/20.9'}
                {planModalAbierto === 'plan2' && 'Plan Ahorro Mi Movistar S/25.9'}
                {planModalAbierto === 'plan3' && 'Plan Ahorro Mi Movistar S/35.9 VI'}
                {planModalAbierto === 'plan4' && 'Plan Ahorro Mi Movistar S/45.9'}
                {planModalAbierto === 'plan5' && 'Plan Ilimitado Mi Movistar S/55.9'}
                {planModalAbierto === 'plan6' && 'Plan Ilimitado Mi Movistar S/65.9'}
                {planModalAbierto === 'plan7' && 'Plan Ilimitado Mi Movistar S/74.9 VI'}
                {planModalAbierto === 'plan8' && 'Plan Ilimitado Mi Movistar S/85.9'}
                {planModalAbierto === 'plan9' && 'Plan Ilimitado Mi Movistar S/114.9'}
              </h3>
              <button
                onClick={() => setPlanModalAbierto(null)}
                className="absolute top-2 right-2 text-white/80 hover:text-white hover:bg-white/20 p-1 rounded-full transition-all"
                aria-label="Cerrar modal del plan"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-3 text-xs space-y-2">
              {/* Beneficios específicos por plan */}
              {planModalAbierto === 'plan1' && (
                <>
                  <div><span className="font-semibold">Llamadas Ilimitadas</span> a nivel Nacional + 500 SMS</div>
                  <div><span className="font-semibold">2 GB de internet</span></div>
                  <div>+ 200 min LDI EE.UU./Canadá</div>
                  <div className="text-[10px] text-red-700">*No informar a clientes de Loreto</div>
                  <div>Apps ilimitadas (12 meses): WhatsApp, Facebook Fotos, Messenger, Instagram, Waze</div>
                  <div><span className="font-semibold">Beneficios adicionales:</span> 50 MB promocionales (12 meses) para datos internacionales en América y Europa.</div>
                </>
              )}
              {planModalAbierto === 'plan2' && (
                <>
                  <div><span className="font-semibold">Llamadas Ilimitadas</span> a nivel Nacional + 500 SMS</div>
                  <div><span className="font-semibold">4 GB de internet</span></div>
                  <div>+ 250 min LDI EE.UU./Canadá</div>
                  <div className="text-[10px] text-red-700">*No informar a clientes de Loreto</div>
                  <div>Apps ilimitadas (12 meses): WhatsApp, Facebook Fotos, Messenger, Instagram, Waze</div>
                  <div><span className="font-semibold">Beneficios adicionales:</span> 50 MB promocionales (12 meses) + WhatsApp de texto ilimitado.</div>
                </>
              )}
              {planModalAbierto === 'plan3' && (
                <>
                  <div><span className="font-semibold">Llamadas Ilimitadas</span> a nivel Nacional + 500 SMS</div>
                  <div><span className="font-semibold">20 GB de internet</span></div>
                  <div>+ 300 min LDI EE.UU./Canadá</div>
                  <div className="text-[10px] text-red-700">*No informar a clientes de Loreto</div>
                  <div>Apps ilimitadas (12 meses): WhatsApp, Facebook Fotos, Messenger, Instagram, Waze</div>
                  <div><span className="font-semibold">Beneficios adicionales:</span> 250 MB promocionales (12 meses) + WhatsApp de texto ilimitado.</div>
                </>
              )}
              {planModalAbierto === 'plan4' && (
                <>
                  <div><span className="font-semibold">Llamadas Ilimitadas</span> a nivel Nacional + 500 SMS</div>
                  <div><span className="font-semibold">36 GB de internet</span></div>
                  <div>+ 350 min LDI EE.UU./Canadá</div>
                  <div className="text-[10px] text-red-700">*No informar a clientes de Loreto</div>
                  <div>Apps ilimitadas (12 meses): WhatsApp, Facebook Fotos, Messenger, Instagram, Waze</div>
                  <div><span className="font-semibold">Beneficios adicionales:</span> 1.25 GB promocionales (12 meses) + WhatsApp de texto ilimitado.</div>
                </>
              )}
              {planModalAbierto === 'plan5' && (
                <>
                  <div><span className="font-semibold">Llamadas Ilimitadas</span> a nivel Nacional + 500 SMS</div>
                  <div><span className="font-semibold">Internet Ilimitado</span> (66 GB en alta velocidad)</div>
                  <div><span className="font-semibold">Llamadas Ilimitadas LDI</span> EE.UU./Canadá</div>
                  <div><span className="font-semibold">Beneficios adicionales:</span> 2 GB promocionales (12 meses) + WhatsApp de texto ilimitado.</div>
                </>
              )}
              {planModalAbierto === 'plan6' && (
                <>
                  <div><span className="font-semibold">Llamadas Ilimitadas</span> a nivel Nacional + 500 SMS</div>
                  <div><span className="font-semibold">Internet Ilimitado</span> (80 GB en alta velocidad)</div>
                  <div><span className="font-semibold">Llamadas Ilimitadas LDI</span> EE.UU./Canadá</div>
                  <div><span className="font-semibold">Beneficios adicionales:</span> 2 GB promocionales (12 meses) + WhatsApp de texto ilimitado.</div>
                </>
              )}
              {planModalAbierto === 'plan7' && (
                <>
                  <div><span className="font-semibold">Llamadas Ilimitadas</span> a nivel Nacional + 500 SMS</div>
                  <div><span className="font-semibold">Internet Ilimitado</span> (110 GB en alta velocidad)</div>
                  <div><span className="font-semibold">Llamadas Ilimitadas LDI</span> EE.UU./Canadá</div>
                  <div><span className="font-semibold">Beneficios adicionales:</span> 3 GB promocionales (12 meses) + WhatsApp de texto ilimitado.</div>
                </>
              )}
              {planModalAbierto === 'plan8' && (
                <>
                  <div><span className="font-semibold">Llamadas Ilimitadas</span> a nivel Nacional + 500 SMS</div>
                  <div><span className="font-semibold">Internet Ilimitado</span> (125 GB en alta velocidad)</div>
                  <div><span className="font-semibold">Llamadas Ilimitadas LDI</span> EE.UU./Canadá</div>
                  <div><span className="font-semibold">Beneficios adicionales:</span> 3 GB promocionales (12 meses) + WhatsApp de texto ilimitado.</div>
                </>
              )}
              {planModalAbierto === 'plan9' && (
                <>
                  <div><span className="font-semibold">Llamadas Ilimitadas</span> a nivel Nacional + 500 SMS</div>
                  <div><span className="font-semibold">Internet Ilimitado</span> (145 GB en alta velocidad + 500MB tethering)</div>
                  <div><span className="font-semibold">Llamadas Ilimitadas LDI</span> EE.UU./Canadá</div>
                  <div><span className="font-semibold">Beneficios adicionales:</span> 8 GB promocionales (12 meses) + WhatsApp de texto ilimitado.</div>
                </>
              )}
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
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
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

    
