// src/pages/Contrato.js
import React from 'react';
import { Link } from 'react-router-dom';

export default function Contrato() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Lectura de Contrato</h1>
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Link>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border border-slate-200 prose prose-slate max-w-none">
          {/* PEGAR AQUÍ EL HTML DEL CONTRATO QUE TE DI ANTERIORMENTE */}
          <h1>CONTRATO RENOVACIÓN DE EQUIPO – CAEQ DIGITAL</h1>
          <p>Muy bien Sr/Sra. XXX, vamos a iniciar con la grabación del contrato...</p>
          {/* ... resto del contenido ... */}
        </div>
      </div>
    </div>
  );
}
