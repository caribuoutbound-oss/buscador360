// Dentro de App()
const renderContrato = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-bold">Contrato de Renovación</h1>
          <button
            onClick={() => setMostrarContrato(false)}
            className="text-white/90 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <div className="pt-16 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 prose prose-slate max-w-none">
          <h1 className="text-2xl font-bold text-center mb-6 text-slate-800">CONTRATO RENOVACIÓN DE EQUIPO – CAEQ DIGITAL</h1>

          <p>Muy bien Sr/Sra. XXX, vamos a iniciar con la grabación del contrato.</p>

          <p>Siendo hoy (día, mes, año), para continuar con la renovación del número XXX, por su seguridad validaremos los siguientes datos, me indica:</p>

          <ul>
            <li>Nombres y apellidos</li>
            <li>Número de DNI</li>
            <li>Correo electrónico</li>
            <li>Número adicional de referencia</li>
            <li>Dirección de entrega</li>
          </ul>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
            <p><strong>La dirección debe ser completa:</strong></p>
            <ul>
              <li>Calle, número de puerta, distrito y referencias</li>
              <li>Manzana, lote, urbanización, distrito y referencias</li>
            </ul>
          </div>

          <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-700">Renovación más Cambio de Plan</h2>
          <p>Sr/Sra. XXX ahora pasará a tener el plan XXX con un precio mensual de S/ XXX. Con este plan, obtendrá los siguientes beneficios: <strong>(LEER PARRILLA DE PLANES Y MENCIONAR LOS BENEFICIOS COMPLETOS)</strong></p>

          <p>Así mismo:</p>
          <ul>
            <li>Los beneficios del plan no son acumulables.</li>
            <li>Los mensajes de texto del cargo fijo no incluyen Premium ni internacionales.</li>
            <li>Los minutos todo destino no incluyen rurales.</li>
            <li>Los mensajes de texto incluidos en su plan solo podrán utilizarse para mensajes de uso personal. No podrán ser usados para los fines de los servicios “mensajes de notificaciones” y/o “mensajes de publicidad”.</li>
            <li>Para llamar a USA y Canadá deberá marcar previamente <strong>1911</strong> antes del número internacional.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-700">Equipo Financiado</h2>
          <p>Para finalizar la renovación, le detallo lo siguiente:</p>
          <ul>
            <li>Estamos procediendo a registrar la solicitud del equipo XXX (marca, modelo, capacidad, color).</li>
            <li>Con una cuota inicial de S/ XXX y S/ XXX por 12 meses.</li>
            <li>El equipo adquirido tiene un contrato de permanencia de 12 meses.</li>
          </ul>
          <p>En caso realice la baja del servicio móvil, migra a prepago o realiza un cambio de plan a uno menor, Telefónica podrá resolver el financiamiento y cobrar todas las cuotas. Es obligación del cliente pagar la totalidad de las cuotas. Recuerde que en caso de no pagar una o más cuotas del equipo o de la totalidad del precio del equipo, en caso de resolverse el financiamiento, Movistar podrá optar por bloquear el equipo de manera remota y reportarlo en las centrales de riesgo.</p>

          <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-700">Equipo al Contado</h2>
          <p>Para finalizar la renovación, le detallo lo siguiente:</p>
          <ul>
            <li>Estamos procediendo a registrar la solicitud del equipo XXX (marca, modelo, capacidad, color).</li>
            <li>Con un pago único de S/ XXX.</li>
            <li>El equipo adquirido tiene un contrato de permanencia de 12 meses.</li>
          </ul>
          <p>Nuestro delivery le efectuará el cobro correspondiente del equipo. Cabe recalcar que nuestro delivery no acepta efectivo por lo que el pago deberá efectuarse con tarjeta de débito o crédito Visa, MasterCard y Diners.</p>

          <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-700">Autorización de Tratamiento de Datos Personales</h2>
          <p>A fin de crear ofertas personalizadas y recibir anuncios comerciales, autoriza a Movistar a hacer uso y tratamiento de sus datos personales. Te agradeceré decir <strong>SÍ ACEPTO</strong>.</p>
          <p className="text-s
