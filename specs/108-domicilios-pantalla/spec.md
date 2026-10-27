# 108 — Pantalla propia de Domicilios

**Estado:** done (2026-10-27) · **Nivel:** L2 (UI; mismos datos de la spec 107) · **Pidió:** Luis («algo así como lo de peluquería… rápido y pronto, y ahí mismo poner el costo de la gasolina»)

## Cambios

- Menú → Administración → **Domicilios** (`/admin/finanzas/domicilios`, mismo permiso que Finanzas).
- Arriba: números del **mes actual** (domicilios, km, se cobró, gasolina invertida, ganancia), gráfica por mes, colonias, clientes, para qué, historial y CSV.
- Abajo, en la misma pantalla: **Gasolina y ganancia** (precio del litro, km/L, redondeo y por tipo de viaje el **múltiplo**: «cobrar la gasolina ×1.66» = ganar 66 %). Se guarda igual que antes (`margenPct`).
- Finanzas: se quita la pestaña Domicilios y el panel de tarifas de «Precios y costos» (queda un acceso «Abrir Domicilios»), para que no haya dos lugares.
