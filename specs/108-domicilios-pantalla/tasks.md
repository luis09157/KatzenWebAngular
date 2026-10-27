# Tareas 108

- [x] Ruta, menú y pantalla
- [x] Múltiplo de ganancia (×) en lugar de %
- [x] Quitar duplicados en Finanzas
- [x] QA (2026-10-27, datos reales, sin guardar): abre en octubre 2026 con 1 domicilio real (Oreon, Peluquería, 5 km, $41, gasolina $24.50, ganancia $16.50); configuración muestra 24.50, 10 km/L y múltiplos ×1.66/×1.32; menú marca «Domicilios». 412 px: sin scroll lateral; campos de tipo de viaje a 1 columna (antes 174 px).

## Ajustes (2026-10-27, Luis)

- [x] «Gasolina y ganancia» en ventana (`DomicilioTarifasDialogComponent`; el panel tiene `modo="dialog"` y avisa `guardado`).
- [x] Contenido del panel con el mismo margen que el título (antes pegado al borde: se veía descuadrado); campos de un renglón al mismo ancho.
- [x] Historial: tabla (`mat-table`) con buscador sin acentos y paginador 20/50/100; en celular 2 columnas (cliente con fecha/para qué/km · cobrado con ganancia); Año y Mes a lo ancho (antes 171 px).
- [x] QA (datos reales, sin guardar): 2025 → «1 – 20 of 273»; buscar «santa anita» → 13; ventana de configuración 900 px con 24.5 / 10 / ×1.66, cerrada sin guardar; 412 px sin scroll lateral (tabla 384 px).
