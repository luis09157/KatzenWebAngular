# Tasks: Mejoras ticket / visita / CxC

**Spec:** `specs/036-ticket-mejoras/spec.md`  
**Plan:** `specs/036-ticket-mejoras/plan.md`  

---

## Implementación

- [x] Spec + plan con contratos + mitigación
- [x] Filtros KPI / chips en `/admin/visitas`
- [x] Presets de línea + cobro con saldo visible
- [x] Imprimir ticket (`window.print` + CSS)
- [x] Anti-huérfana: reusar visita abierta mismo cliente+fecha
- [x] Cita/baño → visita: pedir monto si falta
- [x] Clientes: filtro «Con deuda»
- [x] ROADMAP + stub 037 consentimientos
- [x] Sin Resend

---

## Testing y validación exhaustiva

### Checklist pre-entrega

- [x] Guía QA aplicada (§1–§4 relevantes)
- [x] `npm run build` OK (exit 0)
- [x] Live preview :4200 (proceso activo, HTTP 200)
- [x] Tabla de resultados rellenada
- [x] Chips / loading / diálogos

### Registro de resultados QA

| Escenario | Resultado | Notas |
|-----------|----------|-------|
| Formularios — cliente required | OK | Validators + throw en persistir |
| Formularios — línea monto min | OK | Validators.min(0.01) |
| UI — chips estado completos | OK | columna estado ≥148px; label «Pago parcial» |
| Modales — apertura/cierre | OK | visita + caja cobro |
| UI — presets líneas | OK | Consulta/Baño/Producto/Vacuna |
| UI — print | OK | botón Imprimir + CSS `@media print` |
| UI — filtros KPI | OK | hoy / abiertas / con saldo / chips |
| UI — cobrar copy | OK | muestra saldo; parcial vs 100% |
| UI — loading contextual | OK | Guardando / Eliminando |
| UI — loading no trabado | OK | finally hide |
| Edge — monto 0 cita/baño | OK | Swal.input number |
| Edge — ticket abierto mismo día | OK | confirm reusar |
| Clientes — filtro deuda | OK | KPI + banner toggle |
| Servidor local :4200 | OK | LISTEN + HTTP |
| Build `npm run build` | OK | exit 0; budget warn histórico |

```
Build at: 2026-08-27T03:28:50.037Z - Hash: 2fd88655601c3f95 - Time: 9792ms
EXIT:0
Warning: bundle initial budget (histórico, no bloqueante).
```

---

## Criterios spec

- [x] SC-001 … SC-010

---

## Cierre

- [x] Validación pre-entrega
- [x] `spec.md` → done
- [ ] Commit + push + deploy hosting (autorizado Luis)
