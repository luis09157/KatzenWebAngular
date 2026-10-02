# Tasks: Vacunas y consultas → cola de cobro

**Spec:** `specs/086-clinicos-cola-cobrar/spec.md`  
**Nivel:** L2  

---

## Implementación

### Setup

- [x] Carpeta spec + anti-duplicación (040 / 085 / POS existentes)

### Frontend

- [x] Util `pendientes-clinicos.util.ts` + unit tests
- [x] POS: cards pendientes vacuna + historial en riel consulta
- [x] Persist: religar huérfanos clínicos + baños
- [x] Atajo consulta: priorizar pendiente única
- [x] Vacunas: CTA fila «Enviar a cobrar»
- [x] Historiales: copy «Enviar a cobrar»
- [x] `por-cobrar-hoy` usa `esVacunaPendienteDeTicket`

### Integración

- [x] Sin ruta nueva; sin menú nuevo

---

## Código tocado / utils

| Qué | Ruta |
|-----|------|
| Spec | `specs/086-clinicos-cola-cobrar/` |
| Util pendientes | `visitas/pendientes-clinicos.util.ts` |
| POS | `visitas/visita-dialog.component.*` |
| Por cobrar | `visitas/por-cobrar-hoy.util.ts` |
| CTA vacuna / historial | `vacunas/*.html`, `historiales/*.html` |
| Reutilizado | `pendientes-visita` (baño), `vincularOrigenesDesdeLineas`, 040 |

---

## Validación (L2)

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| Unit tests util | **17/17 OK** | pendientes-clinicos + por-cobrar + pendientes-visita |
| `npm run build` | **exit 0** | 2026-10-02 |
| Smoke 375/1280 | pendiente Luis | aplicar vacuna → Cobrar ticket dueño → card → cobrar → sale |
| RTDB aditiva | N/A | campos existentes |

```
QA agente 2026-10-02:
- Spec 086 molde peluquería → vacuna/consulta
- Cards POS riel Consulta + CTA Enviar a cobrar
- Tests 17/17 · build exit 0
- Deploy hosting 2026-10-02 (con fix logout 051) — autorizado por Luis
```

---

## Memoria

- [x] `agent-guardrails` anti-dup 086
- [x] `module-map` visitas + 086
- [x] `node scripts/specs-index.mjs`
