# 104 — Buscar siempre por la mascota (el dueño se llena solo)

**Estado:** done (2026-10-26) · **Nivel:** L2 (componente compartido `app-cliente-paciente-picker`; sin cambios en RTDB) · **Pidió:** Luis («las veterinarias conocen al paciente pero no al dueño»)

## Cambios

- `busquedaDual` ahora es `true` por defecto en todos los formularios que usan el selector dueño/mascota (Cobrar, Citas, Peluquería, Pensión, Historial, Recordatorios).
- La mascota va **primero**; al elegirla se llena el dueño. Se puede buscar por nombre de la mascota, del dueño o su teléfono, especie o raza.
- Cada opción se ve como en el buscador de Pacientes: **nombre** — especie · raza · edad · dueño (en Peluquería sin dueño, como ya estaba). Máximo 50 resultados.
- Textos de Cobrar: «Busca la mascota (el dueño se llena solo)…».

## No cambia

- «Cliente nuevo» y «Agregar mascota» siguen igual (agregar mascota pide dueño primero).
- Mismo guardado: los formularios siguen recibiendo `cliente_id` y `paciente_id`.
