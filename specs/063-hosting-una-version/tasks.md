# Tasks: Hosting una versión live

**Spec:** `specs/063-hosting-una-version/spec.md`  
**Plan:** `specs/063-hosting-una-version/plan.md`  

---

## Implementación

### Setup

- [x] Carpeta spec creada (`specs/063-hosting-una-version/`)
- [x] Plan aprobado (autorización explícita de Luis: hosting sin backups)

### Backend / ops

- [ ] N/A reglas RTDB
- [ ] N/A Cloud Functions
- [x] Confirmar que `firebase.json` no tiene keys inventadas de retención
- [x] Documentar CLI vs REST (15.19.1 no tiene `hosting:releases:list` / `sites:update`)
- [x] PATCH `retainedReleaseCount: 1` en canal `live`
- [x] Tras deploy hosting: listar releases, borrar no-live, confirmar mínimo

### Frontend

- [ ] N/A

### Integración

- [x] `AGENTS.md`, `constitution.md`, `sdd-workflow.mdc`, `specs/README.md` actualizados

---

## Testing

> **Quién ejecuta:** el agente. Ops Hosting, no formularios UI.

- [x] `npm run build` — exit 0 (antes de deploy)
- [x] `firebase deploy --only hosting` — OK
- [x] Releases listadas (REST)
- [x] Versiones no live borradas (no la servida)
- [x] Queda 1 (o mínimo Firebase) release
- [x] Sitio https://katzen-a0e3e.web.app responde

**Resultado:** OK — 2026-08-31

```
npm run build → exit 0 (Hash 49455bba876a7f77)
firebase deploy --only hosting → Deploy complete! https://katzen-a0e3e.web.app
PATCH retainedReleaseCount=1 → 200
Había 298 releases post-deploy; DELETE 297 versiones (200 cada una).
Queda 1 FINALIZED (live 9d75f5eb76563f4a). Tombstones DELETED pueden seguir en releases.list (la API no tiene releases.delete).
```

---

## Testing y validación exhaustiva

> Guía QA de formularios **no aplica** (sin UI). Validación ops + build del front que se despliega (spec 062 en el mismo commit).

### Checklist pre-entrega

- [x] Guía QA UI: N/A para 063; 062 ya validada en su `tasks.md`
- [x] `npm run build` OK y reportado
- [x] Hosting live con retención mínima
- [x] Tabla de resultados rellenada

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios / modales / chips / picker / 059 / 061 | N/A | spec ops Hosting |
| `firebase.json` sin keys inválidas | OK | no se modificó |
| CLI sin subcomando releases | OK | REST documentado |
| Mínimo retainedReleaseCount | OK | **1** (Firebase lo acepta; no exige 2) |
| Releases pre-limpieza | OK | 298 tras el deploy (297 viejas + 1 live) |
| Releases post-limpieza | OK | 297 `DELETED`; **1 FINALIZED** live. REST aún lista tombstones; no hay `releases.delete`. |
| Sitio live responde | OK | https://katzen-a0e3e.web.app HTTP 200; `main.f1a4fcf32e548cb0.js` |
| Build `npm run build` | OK | exit 0; warning de budget 2.37 MB (preexistente) |

```
Build at: 2026-09-01T02:58:56.627Z exit 0
Hosting: 298 → se borraron 297 versiones; queda 1 FINALIZED. retainedReleaseCount=1.
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: retainedReleaseCount al mínimo real (1)
- [x] SC-002: releases viejas borradas tras deploy
- [x] SC-003: no se borra la versión servida
- [x] SC-004: sin keys inventadas en firebase.json; REST documentado
- [x] SC-005: rollback = git + nuevo deploy

---

## Cierre

- [x] Validación pre-entrega completa (deploy + limpieza)
- [x] Validación exhaustiva registrada
- [x] `spec.md` estado → `done` (regla permanente; cierre ops en esta entrega)
- [x] Commit / deploy — autorizados por Luis en esta sesión

### Nota ops post-deploy (2026-10-01)

Tras deploy 079–082 (`d2149be`): PATCH `retainedReleaseCount=1` OK; DELETE 7 versiones no live; queda 1 FINALIZED `5a965cc69cf76f10`; sitio HTTP 200.

Tras deploy 084 (`92d396e`): PATCH `retainedReleaseCount=1` OK; queda 1 FINALIZED `3ee13255ab4952f7`; sitio HTTP 200.

Tras deploy 085 (`c3e16d6`): PATCH `retainedReleaseCount=1` OK; DELETE 3 no live; queda 1 FINALIZED `a99eb70b8a3f57ef`; sitio HTTP 200.

Tras deploy prefill Llegó un paciente (`75fc6d3`): PATCH `retainedReleaseCount=1` OK; queda 1 FINALIZED `c5235f331baae716`; sitio HTTP 200.

Tras deploy loading US-3 (`4e5ec84`): PATCH `retainedReleaseCount=1` OK; sitio HTTP 200.

Tras deploy footer diálogos 059 (`fc00c89`): PATCH `retainedReleaseCount=1` OK; queda 1 FINALIZED `2560dc8a4843b8dd`; sitio HTTP 200.

Tras deploy POS baños cola 085 (`7e941d2`): PATCH `retainedReleaseCount=1` OK; queda 1 FINALIZED `95330ff1b8860308`; sitio HTTP 200.

Tras deploy logout-fix 051 + clínicos 086 (2026-10-02): PATCH `retainedReleaseCount=1` OK; DELETE no live; queda 1 FINALIZED `ed89a5ec1cfa46b2`; sitio HTTP 200.

Tras deploy splash+auth+portrait POS (`7207d1f`): PATCH `retainedReleaseCount=1` OK; DELETE no live; queda 1 FINALIZED `111f0b04b6d26a0f`; sitio HTTP 200.

Tras deploy inventario alertas densas (`c6c1be4`): PATCH `retainedReleaseCount=1` OK; DELETE no live; queda 1 FINALIZED `74edc228749d3b09`; sitio HTTP 200.

Tras deploy pensión 089 F0–F2 + PWA/layout (2026-10-02): PATCH `retainedReleaseCount=1` OK; DELETE 6 no live; queda 1 FINALIZED `e854ad70ebb241a0`; sitio HTTP 200.

Tras deploy pensión diálogo simplificado (fechas×paquete, sin costos) 2026-10-02 noche: PATCH `retainedReleaseCount=1` OK; DELETE 1 no live; queda 1 FINALIZED `29560627248d336e`; sitio HTTP 200.

Tras deploy datepicker 090 + pensión/datepicker locales (2026-10-02): PATCH `retainedReleaseCount=1` OK; DELETE no live; queda 1 FINALIZED `f5d4cff42d9e6ccf`; sitio HTTP 200.

Tras deploy fix costo_dia undefined (pensión payload) + datepicker 090 en working tree (2026-10-02): PATCH `retainedReleaseCount=1` OK; DELETE 1 no live (`f5d4cff42d9e6ccf`); queda 1 FINALIZED `0d687d371abd0fb9`; sitio HTTP 200.

Tras deploy datepicker 090 + fix costo_dia + POS riel pensión 091 + legibilidad ticket (2026-10-02): PATCH `retainedReleaseCount=1` OK; DELETE 1 no live (`0d687d371abd0fb9`); queda 1 FINALIZED `3b332e9068e1ee25`; sitio HTTP 200.

Tras deploy working tree: sanitize líneas visita (citaId undefined) + ticket digital PDF CSS 092 + pendientes (2026-10-02): PATCH `retainedReleaseCount=1` OK; DELETE 2 no live (`3b332e9068e1ee25`, `0be715febd6f4793`); queda 1 FINALIZED `dd0d706c197d332a`; sitio HTTP 200; `main.5c32cbc8052212bf.js`.

Tras deploy `9d53615` (loading hide antes de Swal, sanitize RTDB, ticket PDF 092, docs antipatrones) 2026-10-03: PATCH `retainedReleaseCount=1` OK; DELETE 1 no live (`dd0d706c197d332a`); queda 1 FINALIZED `6e6be6aad15604a4`; sitio HTTP 200; `main.4964905709596658.js`.

Tras deploy working tree CTA «Pagar ya» POS + pendientes locales (2026-10-03): PATCH `retainedReleaseCount=1` OK; DELETE 3 no live (`c0cab92a486c39c4`, `4128700604e7d5c2`, `6e6be6aad15604a4`); queda 1 FINALIZED `4b417c41a449b784`; sitio HTTP 200; `main.e2c3c60332b46508.js` (CTA confirmado en bundle).

Tras deploy `ca45a12` (093 taxonomía servicios Fase 1+2 + CTA Pagar ya + script migración dry-run) 2026-10-04: PATCH `retainedReleaseCount=1` OK; DELETE 1 no live (`4b417c41a449b784`); queda 1 FINALIZED `9ef3f1921d94382f`; sitio HTTP 200; `main.7e6edffe3a9dad35.js`.
