import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { supabase } from "./supabase";

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

  // 🔹 Helpers para STOCK (NUEVOS)
  const normalizarStockTexto = (v) => {
    if (v === null || v === undefined) return null;
    const t = v.toString().trim().toUpperCase();
    return t === "" ? null : t;
  };

  const getStockColorClass = (stock) => {
    const t = normalizarStockTexto(stock);
    if (t === "DISPONIBLE") return "text-emerald-600 font-bold";       // Verde
    if (t === "ULTIMAS UNIDADES") return "text-amber-600 font-bold";   // Amarillo/Naranja
    return "text-slate-400 font-bold";                                 // Gris (nulo/desconocido)
  };

  // Ordenamiento por prioridad de stock (texto)
  const prioridadStock = (estado) => {
    const t = normalizarStockTexto(estado);
    if (t === "DISPONIBLE") return 1;
    if (t === "ULTIMAS UNIDADES") return 2;
    return 3; // sin dato u otros
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

  // Estados para comparación de equipos
  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
  const [modalComparacionAbierto, setModalComparacionAbierto] = useState(false);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [resultadosPorPagina] = useState(20);

  // Cargar todos los equipos al inicio
  useEffect(() => {
    const cargarTodosLosEquipos = async () => {
      setLoading(true);
      try {
        const { data: equiposData, error: equiposError } = await supabase
          .from("equipos")
          .select("id, hoja, codigo_sap, modelo, stock_final, status_equipo")
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
        // Si el campo está vacío, recargar todos los equipos
        const { data: equiposData, error: equiposError } = await supabase
          .from("equipos")
          .select("id, hoja, codigo_sap, modelo, stock_final, status_equipo")
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

    // Obtener marcas disponibles
    const marcas = Array.from(new Set(
      resultados
        .map(r => {
          // Extraer marca del modelo (primera palabra)
          const marca = r.modelo?.split(' ')[0];
          return marca;
        })
        .filter(Boolean)
    ));
    setMarcasDisponibles(marcas);
    if (marcaFiltro && !marcas.includes(marcaFiltro)) setMarcaFiltro("");
  }, [resultados]);

  // Filtrar y ordenar resultados
  const resultadosFiltrados = resultados
    .filter(r => (sedeFiltro ? r.hoja === sedeFiltro : true))
    .filter(r => {
      if (!marcaFiltro) return true;
      const marcaDelModelo = r.modelo?.split(' ')[0];
      return marcaDelModelo === marcaFiltro;
    })
    // 🔹 Ordenamiento corregido para STOCK de texto
    .sort((a, b) =>
      sortStockDesc
        ? prioridadStock(a.stock_final) - prioridadStock(b.stock_final)
        : prioridadStock(b.stock_final) - prioridadStock(a.stock_final)
    );

  // Paginación
  const totalResultados = resultadosFiltrados.length;
  const totalPages = Math.ceil(totalResultados / resultadosPorPagina);
  const resultadosPaginados = resultadosFiltrados.slice(
    (paginaActual - 1) * resultadosPorPagina,
    paginaActual * resultadosPorPagina
  );

  // (Seguimos mostrando "Stock Total" como antes, aunque ya no suma números)
  // Si luego quieres, lo cambiamos por conteo por estado.

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
              {/* … (deja intacta toda la sección del contrato, tal como la tenías) … */}
              {/* Para ahorrar espacio en este mensaje, no repito cada bloque del contrato que ya pegaste.
                  Puedes conservarlo sin cambios. */}
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

          {/* KPIs superiores (dejamos como estaban) */}
          {modelo && resultadosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-4">
                <p className="text-xs font-medium text-blue-600 mb-1">Resultados</p>
                <p className="text-lg font-bold text-slate-800">{resultadosFiltrados.length}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm border border-emerald-200 p-4">
                <p className="text-xs font-medium text-emerald-600 mb-1">Stock Total</p>
                <p className="text-lg font-bold text-slate-800">
                  {/* Si luego quieres, convierto esto en conteo por estado */}
                  {resultadosFiltrados.length.toLocaleString()}
                </p>
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
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-sm border border-amber-200 p-4">
                <p className="text-xs font-medium text-amber-600 mb-1">Página</p>
                <p className="text-lg font-bold text-slate-800">{paginaActual} de {totalPages}</p>
              </div>
            </div>
          )}

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
                            {(() => {
                              const codigo = r.codigo_sap?.toString() || "";
                              if (codigo.length <= 4) return "•".repeat(codigo.length) || "-";
                              return "•".repeat(codigo.length - 4) + codigo.slice(-4);
                            })()}
                          </span>
                        </td>
                        <td className="px-4 py-2">{r.modelo}</td>
                        <td className="px-4 py-2">{r.accesorio}</td>
                        {/* 🔹 Celda STOCK corregida con color según texto */}
                        <td className="px-4 py-2">
                          <span className={getStockColorClass(r.stock_final)}>
                            {normalizarStockTexto(r.stock_final) ?? "-"}
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
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            normalizarStockTexto(especificaciones[0].equipo.stock_final) === "DISPONIBLE"
                              ? "bg-emerald-100 text-emerald-700"
                              : normalizarStockTexto(especificaciones[0].equipo.stock_final) === "ULTIMAS UNIDADES"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                            {normalizarStockTexto(especificaciones[0].equipo.stock_final) ?? "SIN DATO"}
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
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            normalizarStockTexto(especificaciones[1].equipo.stock_final) === "DISPONIBLE"
                              ? "bg-emerald-100 text-emerald-700"
                              : normalizarStockTexto(especificaciones[1].equipo.stock_final) === "ULTIMAS UNIDADES"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                            {normalizarStockTexto(especificaciones[1].equipo.stock_final) ?? "SIN DATO"}
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
