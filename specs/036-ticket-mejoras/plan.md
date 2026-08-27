# Plan técnico: Mejoras ticket / visita / CxC

**Spec:** `specs/036-ticket-mejoras/spec.md`  
**Estado:** approved  

---

## Resumen

Pulido UI/UX sobre el módulo 032: filtros KPI en lista, presets de líneas y print CSS en diálogo, reuso de visita del día al crear, prompt de monto en cita/baño→visita, filtro «Con deuda» en clientes. Sin cambios RTDB ni Resend.

---

## Archivos a crear / modificar

| Archivo | Acción |
|---------|--------|
| `src/app/visitas/visitas.component.ts/html/scss` | filtros KPI (hoy/abiertas/saldo) |
| `src/app/visitas/visita-dialog.component.ts/html/scss` | presets, cobrar UX, print, anti-huérfana |
| `src/app/citas/citas.component.ts` | prompt monto si 0 |
| `src/app/banios/banios.component.ts` | prompt monto si 0 |
| `src/app/clientes/clientes.component.ts/html` | filtro con deuda |
| `specs/ROADMAP.md`, `domain-context` | 036 + 037 pending |
| `specs/037-consentimientos-clinicos/` | stub siguiente |

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB:** ninguno. Solo lectura/escritura de nodos 032.
- **Mocks:** existentes.
- **UI:** admin shell, chips completos, print media query.

---

## Plan de Mitigación y Rollback

| Riesgo | Mitigación | Rollback |
|--------|------------|----------|
| Print rompe layout admin | `@media print` solo oculta chrome; cuerpo ticket con clase print | quitar botón Imprimir |
| Reuso visita confunde | Swal confirmación explícita | crear siempre (flag off) |
| Monto 0 en atajos | Swal.input number | monto 0 + abrir ticket (legacy) |

---

## Fuera de alcance

Consentimientos (037), Resend, CFDI.
