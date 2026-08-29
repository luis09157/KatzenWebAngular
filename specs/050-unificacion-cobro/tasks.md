# Tasks: Unificación de cobro

**Spec:** `specs/050-unificacion-cobro/spec.md`  
**Plan:** `specs/050-unificacion-cobro/plan.md`

---

## Implementación

- [x] Ocultar «Registrar en caja» en baños, citas, pensión, historiales
- [x] Copy «Agregar al ticket del día»
- [x] Finanzas: flow-hint + «Registrar cobro» solo admin
- [x] salida-dialog: default visita, radio caja solo admin

---

## Testing y validación exhaustiva

| Escenario | Resultado | Notas |
|-----------|-----------|-------|
| cobro-integridad.util.spec | OK | test:039 |
| por-cobrar-hoy.util.spec | OK | test:040 |
| visita-mostrador.util.spec | OK | test:046 |
| Build | OK | exit 0 |
| Métodos TS registrarEnCaja | OK | conservados, UI oculta |

---

## Criterios spec

- [x] SC-001 a SC-006
