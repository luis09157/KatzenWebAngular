# Tasks: Número de expediente visible

**Spec:** `specs/068-numero-expediente-visible/spec.md`  
**Nivel:** L2 — sin `plan.md`

## Implementación

- [x] Util: capturado de mascota gana; KV solo fallback; dueño ignorado; `resolverExpedienteParaPersistir`
- [x] UI header + ficha perfil + ficha modal; chip completo
- [x] Campo `expediente` en diálogo paciente (alta/edición/vista; colapsado en modo rápido)
- [x] Persistencia aditiva al crear/editar (`PacientesService`); no migración masiva
- [x] Unit tests del util (capturado Excel, dueño no se usa, persistir)

## QA (2026-09-04)

- [x] `npm run lint` — 0 errores (542 warnings preexistentes)
- [x] `ng test --include=folio-expediente-paciente.util.spec.ts` — 7/7 SUCCESS
- [x] `npm run build` — exit 0 (Hash b6aa65974da4e9d2; budget inicial preexistente)
- [x] `ng serve` compiló OK. Campo «N° de expediente» en diálogo (alta/edición/vista + modo rápido colapsado). Ficha/header usan el util (capturado o KV).

### Follow-up 2026-10-24 — consecutivo del año

- Alta nueva: año + 0 fijo + consecutivo pegado. `202601`, `202609`, `2026010`. El 0 no se quita.
- Código: `siguienteExpedienteAnual` en `folio-expediente-paciente.util.ts`. `PacientesService.crearPaciente` lo asigna si el campo viene vacío. El diálogo lo muestra al abrir una mascota nueva.
- Una mascota que ya tiene número no se reescribe. El expediente del dueño no se toca. Al editar, si lo dejan vacío, sigue el `KV-` de antes.
- QA util: el caso del 10 queda en `2026010`.
- QA en el módulo (2026-10-24): alta de mascota abrió con `202601` (en las mascotas guardadas todavía no hay otro de este año). Se creó «QA expediente borrar», FELINO, dueño Luis. Al editar seguía `202601`. Se cambió el nombre y el número a `QA-BORRAR` para no gastar el 202601, y se borró. Al abrir otra alta volvió a salir `202601`. Tests 8/8. `npm run build` exit 0.

### Follow-up 2026-10-24 — copiar folio Excel a la mascota

- El número de la carga `excel-supermamalon` vive en `Cliente.expediente` (`260115`, `250239`, `240328`). La mascota no lo tenía.
- Se copia a `Mascota.expediente` solo si la mascota está vacía y el del dueño es `YY0NNN` (6 dígitos, 0 en medio). Teléfonos de RG23/RG24 no se copian.
- El alta nueva sigue esa serie: el más alto de 2026 es `260115`, el siguiente es `260116`.
- Dos mascotas del mismo dueño quedan con el mismo número, porque la carga solo guardó uno por dueño.
- Hecho: 1,253 mascotas recibieron el folio del dueño. 123 se dejaron vacías (no tenían folio clínico, sobre todo RG23/RG24). El más alto de 2026 sigue en `260115`. Alta nueva en local abre con `260116`. Tests 8/8.
