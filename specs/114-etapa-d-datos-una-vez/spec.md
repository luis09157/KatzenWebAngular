# Spec 114 — Etapa D (parte sin tocar datos viejos): datos que faltan una vez y cliente repetido

**Estado:** implementado · **Nivel:** L2 · **Pidió:** Luis (2026-10-27 «continua ahorita»)

## A6 — Tamaño del perro una sola vez
- Nuevo baño: si es perro y su ficha no tiene `tamano_perro`/`tamano`, sale «Tamaño» (aunque no haya tarifas) con «Su ficha no tiene tamaño. Elígelo una vez y se guarda para la próxima.»
- Al guardar el baño se escribe `Katzen/Mascota/{id}.tamano_perro` (aditivo, solo si estaba vacío). Mascotas extra del mismo baño no se tocan.
- Sin tarifas: no se ofrece «Gato» ni pelo corto/largo.

## A7 — Cliente con teléfono repetido
- Alta de cliente (rápida y completa): si otro cliente activo tiene el mismo teléfono (normalizado a 10 dígitos), aviso naranja con su nombre. Solo avisa; no bloquea.

## Pendiente con OK de Luis (datos)
- A8 campaña de vacunas 2024 sin refuerzo (125).
- Limpieza de registros de prueba (Oreon, «Triple Felina (PRUEBA)», etc.).
- 23 teléfonos repetidos existentes (unir clientes).
