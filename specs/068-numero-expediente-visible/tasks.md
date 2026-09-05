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
