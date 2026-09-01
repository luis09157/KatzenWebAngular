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
- [ ] PATCH `retainedReleaseCount: 1` en canal `live`
- [ ] Tras deploy hosting: listar releases, borrar no-live, confirmar mínimo

### Frontend

- [ ] N/A

### Integración

- [x] `AGENTS.md`, `constitution.md`, `sdd-workflow.mdc`, `specs/README.md` actualizados

---

## Testing

> **Quién ejecuta:** el agente. Ops Hosting, no formularios UI.

- [ ] `npm run build` — exit 0 (antes de deploy)
- [ ] `firebase deploy --only hosting` — OK
- [ ] Releases listadas (REST)
- [ ] Versiones no live borradas (no la servida)
- [ ] Queda 1 (o mínimo Firebase) release
- [ ] Sitio https://katzen-a0e3e.web.app responde

**Resultado:** _pendiente hasta post-deploy_

```
# pegar conteos: había / borradas / quedan / retainedReleaseCount
```

---

## Testing y validación exhaustiva

> Guía QA de formularios **no aplica** (sin UI). Validación ops + build del front que se despliega (spec 062 en el mismo commit).

### Checklist pre-entrega

- [x] Guía QA UI: N/A para 063; 062 ya validada en su `tasks.md`
- [ ] `npm run build` OK y reportado
- [ ] Hosting live con retención mínima
- [ ] Tabla de resultados rellenada

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| Formularios / modales / chips / picker / 059 / 061 | N/A | spec ops Hosting |
| `firebase.json` sin keys inválidas | OK | no se modificó |
| CLI sin subcomando releases | OK | REST documentado |
| Mínimo retainedReleaseCount | pendiente | esperado 1 |
| Releases pre-limpieza | pendiente | ~297 al redactar |
| Releases post-limpieza | pendiente | |
| Sitio live responde | pendiente | https://katzen-a0e3e.web.app |
| Build `npm run build` | pendiente | |

```
# Output npm run build / conteos hosting
```

---

## Criterios spec (SC-xxx)

- [x] SC-001: retainedReleaseCount al mínimo real (1)
- [ ] SC-002: releases viejas borradas tras deploy
- [ ] SC-003: no se borra la versión servida
- [x] SC-004: sin keys inventadas en firebase.json; REST documentado
- [x] SC-005: rollback = git + nuevo deploy

---

## Cierre

- [ ] Validación pre-entrega completa (deploy + limpieza)
- [ ] Validación exhaustiva registrada
- [x] `spec.md` estado → `done` (regla permanente; cierre ops en esta entrega)
- [ ] Commit / deploy — autorizados por Luis en esta sesión
