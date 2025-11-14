# Equipos - Buscador (React + Vite)

Proyecto mínimo para buscar equipos por **modelo** desde una tabla en Supabase.

## Setup local

1. Instala dependencias:
   ```
   npm install
   ```

2. Crea archivo `.env` en la raíz con:
   ```
   VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
   VITE_SUPABASE_KEY=your-supabase-key
   ```

3. Ejecuta en desarrollo:
   ```
   npm run dev
   ```

## Deploy en Vercel

- Conecta este repositorio en Vercel.
- Agrega variables en Vercel (Project Settings → Environment Variables):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_KEY`
- Build command: `npm run build`
- Output directory: `dist`

## Estructura principal
- `src/main.jsx` – entrada
- `src/App.jsx` – buscador simple
- `src/supabase.js` – cliente supabase
