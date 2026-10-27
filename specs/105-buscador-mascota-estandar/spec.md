# 105 — Buscador de mascota igual en todos los módulos

**Estado:** done (2026-10-26) · **Nivel:** L1/L2 (solo cómo se muestra; sin cambios en RTDB) · **Pidió:** Luis («que todo esté estandarizado»)

## Cambios

- Opción del selector: **nombre** — especie · raza · edad · dueño en Cobrar, Citas, **Peluquería**, Pensión, Historial y Recordatorios (antes Peluquería no mostraba dueño). Si el dueño ya está elegido no se repite.
- Texto de la mascota ya elegida: «Jack — Canino · Criollo · 3 años» en todos.
- Alta rápida (paso 2): botones de mascota con el mismo formato.
- Especie con mayúscula inicial al mostrar («CANINO» → «Canino»); también en el buscador de Pacientes.
- `etiquetaMascota` queda sin efecto (deprecated).
