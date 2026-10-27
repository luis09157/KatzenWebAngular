# Tareas 107

- [x] Fórmula (`domicilio-cotizacion.util` + spec con viajes reales: 3 km X2 → $24.40; 2.5 km X4 → $40.66)
- [x] Configuración: Finanzas → Precios y costos → Domicilios (`TarifasDomicilioService`)
- [x] Cotizador reutilizable (`app-domicilio-cotizador`): km de la ficha, tipo, sugerido, precio editable, guardar km en ficha
- [x] Nuevo baño: «Es a domicilio» → `Banio.domicilio`
- [x] Citas: «Es a domicilio» → `Cita.domicilio` (y en modo ver)
- [x] Cobrar: línea «Domicilio» al pasar baño/cita (dentro del diálogo y desde Peluquería/Citas/Hoy) + tarjeta «Domicilio» en Consulta y Peluquería
- [x] Métricas: Finanzas → Domicilios (por mes, colonias, clientes, para qué, tipo, historial, CSV) incluyendo viajes de la app
- [x] Carga diferida: cotizador y diálogo standalone con `import()` (`domicilio-dialog.launcher.ts`); Baño/Cita muestran resumen + «Cambiar». Build pasaba el presupuesto inicial por 13 kB (anotación nueva en CI muestra el error).
- [x] QA (2026-10-27, datos reales, sin guardar):
  - Finanzas → Domicilios: 2025 = 273 viajes de la app, 947.4 km, gasolina $7,519.99, cobrado $12,482.34, ganancia $4,962.00. Viajes viejos sin dueño ligado → «Dueño no capturado» (la app solo guardaba el nombre de la mascota).
  - Precios y costos → Domicilios: valores de la app (24.50, 10 km/L, tipos y %).
  - Nuevo baño (Viggo, 2.5 km de su ficha): Ida y vuelta → gasolina $12.25, sugerido $21; resumen «Domicilio $21 · Ida y vuelta · 2.5 km»; cancelado sin guardar.
  - Cobrar: tarjeta «Domicilio» → línea «Domicilio · Ida y vuelta · 2.5 km · Viggo $21.00»; quitada y cerrada sin ticket.
  - Citas a 412 px: diálogo 400 px, campos 254 px, sin scroll lateral; Cancelar desmarca la casilla.
- [x] Deploy
