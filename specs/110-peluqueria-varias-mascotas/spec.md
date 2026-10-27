# Spec 110 — Peluquería: varias mascotas, hora, precio al final y cepillado

**Estado:** implementado · **Nivel:** L2 (UI/lógica, sin cambios de reglas ni nodos nuevos)

## Pedido de Luis (2026-10-27)
1. Agregar los servicios «Cepillado» y «Baño con cepillado».
2. Una dueña trae 4 perros: poder elegir varias mascotas en el mismo «Nuevo baño».
3. Desapareció la hora de la agenda en el diálogo de baño.
4. No dejaba «Iniciar» un baño sin precio; el precio se pone al final.

## Solución
- `banio-tipos-servicio.util.ts`: `cepillado` (suelto) y `baño_con_cepillado` (paquete). Valores nuevos de `tipo_servicio`, aditivos.
- Diálogo: sección «¿Trae más mascotas?» con chips de las otras mascotas del dueño (solo al crear). Se crea un baño por mascota con el mismo servicio, fecha y hora; sin precio ni domicilio (`banio-varias-mascotas.util.ts`).
- Diálogo: regresa el campo «Hora» (timepicker) junto a la fecha; se precarga con la hora actual.
- Lista: «Iniciar» ya no exige precio. Al «Terminar y cobrar», «Terminar (lo cobra mostrador)» o «Agregar al ticket» sin precio, se pregunta el precio y se guarda.

## Contrato de datos
Sin nodos ni reglas nuevas. Cada mascota extra es un `Katzen/Banios/{id}` normal.
