# Plan técnico: Hosting una versión live

**Spec:** `specs/063-hosting-una-version/spec.md`  
**Estado:** approved  

---

## Resumen

Política permanente: el sitio Hosting `katzen-a0e3e` (canal `live`) no acumula historial. `retainedReleaseCount` al mínimo real de Firebase (**1**). Tras cada deploy hosting autorizado se listan las releases y se borran las versiones que **no** están siendo servidas. No se toca `firebase.json` (no hay campo oficial de retención). No se toca RTDB ni Functions.

---

## Archivos a crear / modificar

### Angular

Ninguno.

### Docs / reglas (para que el agente lo recuerde)

| Archivo | Acción | Notas |
|---------|--------|-------|
| `specs/063-hosting-una-version/spec.md` | crear | regla permanente |
| `specs/063-hosting-una-version/plan.md` | crear | este plan |
| `specs/063-hosting-una-version/tasks.md` | crear | checklist + QA ops |
| `AGENTS.md` | modificar | comandos deploy + retención Hosting |
| `specs/memory/constitution.md` | modificar | principio operativo Hosting |
| `.cursor/rules/sdd-workflow.mdc` | modificar | post-deploy hosting autorizado |
| `specs/README.md` | modificar | índice 063 |
| `firebase.json` | no tocar | no hay key oficial `retainedReleaseCount` |

### Firebase

| Recurso | Acción |
|---------|--------|
| Canal `live` sitio `katzen-a0e3e` | `retainedReleaseCount: 1` (PATCH REST) |
| Versiones Hosting no live | DELETE REST (nunca la versión servida) |
| Cloud Functions / RTDB / Storage | no |

### Cypress

Ninguno.

---

## Modelo de datos

Sin cambios RTDB.

```text
# Hosting REST (no es RTDB)
projects/katzen-a0e3e/sites/katzen-a0e3e/channels/live
  retainedReleaseCount: 1   # mínimo real Firebase
```

---

## Flujos

### Flujo principal (tras `firebase deploy --only hosting` autorizado)

1. `npm run build` exit 0.
2. `firebase deploy --only hosting` (proyecto `katzen-a0e3e`).
3. PATCH canal `live` → `retainedReleaseCount: 1` (idempotente).
4. GET releases del canal `live` (paginar).
5. Identificar la versión del `release` actual del canal (la servida).
6. DELETE cada `versions/{id}` que no sea la live.
7. Confirmar que queda 1 release (o el mínimo si Firebase retiene 2).

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| Intentar borrar la versión live | 400/409 — no borrar; dejarla |
| ADC sin quota project | 403 — header `x-goog-user-project: katzen-a0e3e` |
| CLI sin subcomando releases | usar REST; no inventar flags |

---

## Servicios

Ninguno Angular. Auth CLI: `firebase login` / `gcloud auth`.

---

## UI (admin)

N/A.

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Ninguno.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | — | no | no | solo Hosting estático |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura (N/A)

- **Estrategia de Datos de Prueba:** N/A. No hay mocks. No se consulta RTDB.

- **Patrones UI Reutilizados:** N/A.

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` no aplica (ops)
  - [x] Chips/badges N/A

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos (RTDB intacto).
- [x] Compilación local (`npm run build`) antes del deploy hosting.
- [x] Plan de reversión: **nuevo deploy del commit git local**. El código sigue en git; **no** se usa el historial de Hosting como backup (eso es lo que Luis quiere).

| Escenario | Acción de rollback |
|-----------|-------------------|
| Deploy hosting con UI rota | Revertir/checkout en git y `firebase deploy --only hosting` (autorizado) |
| Se borró por error la versión live | Mismo rollback: rebuild + deploy desde git |
| PATCH retención rechazado | Dejar el mínimo que acepte la API (documentar 1 vs 2) |
| UI rompe build | No deploy; no hay cambio RTDB que revertir |

---

## Deploy

```bash
npm run build
firebase deploy --only hosting
# luego PATCH retainedReleaseCount=1 y DELETE versiones no live
# NUNCA: firebase deploy functions / database / storage sin Luis
```

---

## Riesgos

- Borrar la versión live deja el sitio sin servir → mitigación: identificar `channel.release.version.name` antes de cada DELETE.
- `retainedReleaseCount: 1` no limpia el historial ya acumulado → hay que borrar a mano (esta entrega).
