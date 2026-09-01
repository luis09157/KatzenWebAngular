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
