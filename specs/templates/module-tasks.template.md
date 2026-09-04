# Tasks: [Nombre de la feature]

**Spec:** `specs/NNN-nombre-feature/spec.md`  
**Plan:** `specs/NNN-nombre-feature/plan.md` (solo L3)  
**Nivel de cambio:** L2 / L3 (ver `.cursor/rules/sdd-workflow.mdc`; L1 no usa este archivo)

---

## Implementación

### Setup

- [ ] Carpeta spec creada y alcance confirmado
- [ ] Plan aprobado (L3)

### Backend (si aplica)

- [ ] Reglas RTDB — aditivas
- [ ] Cloud Function
- [ ] `npm run functions:build`
- [ ] Deploy documentado (lo ejecuta/autoriza Luis)

### Frontend

- [ ] Módulo lazy + routing + StaffModule (módulo nuevo)
- [ ] Servicio(s) / util(s) con unit tests
- [ ] Componente lista + diálogos según `admin-ui-architecture`
- [ ] ErrorMessagesService contextos nuevos
- [ ] Menú admin (si aplica)

---

## Validación

> La ejecuta el agente. Checklist completa (fuente única): `specs/templates/qa-validation-guide.md`.  
> L2: registro corto (≤10 líneas). L3: guía completa + emulador + autorización de Luis.

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | pendiente | |
| Unit tests del util/servicio | pendiente | comando + resultado |
| Smoke local (mocks/emulador) 375 / 1280 | pendiente | pantallas tocadas; Cypress solo si hay ruta nueva |
| RTDB aditiva / compatible app móvil | pendiente | N/A si no toca datos |
| Chips completos + loading contextual no trabado | pendiente | N/A si no toca esos patrones |

```
# Output relevante (build / tests)
```

---

## Criterios spec (SC-xxx)

- [ ] SC-001: ...
- [ ] SC-002: ...

---

## Cierre

- [ ] Validación del nivel registrada arriba
- [ ] `spec.md` estado → `done` + `node scripts/specs-index.mjs`
- [ ] Commit / deploy — solo si Luis lo pidió
