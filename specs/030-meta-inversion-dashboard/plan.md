# Plan técnico: Meta de inversión dashboard

**Spec:** `specs/030-meta-inversion-dashboard/spec.md`  
**Estado:** in_progress  

---

## Resumen

Servicio `ClinicConfigService` lee/escribe `Katzen/Config/inversionMeta`. `OwnerDashboardService.gananciaAcumulada$()` reutiliza lógica financiera de spec 025 sin filtro de período. Dashboard muestra barra + diálogo de edición.

---

## Contratos de Datos y UI (Obligatorio)

| Nodo / campo | Acción | ¿App móvil? | Notas |
|--------------|--------|-------------|-------|
| `Config/inversionMeta.montoMeta` | nuevo opcional | ignora | number > 0 |
| `Config/inversionMeta.updatedAt` | audit | ignora | ISO |
| `Config/inversionMeta.updatedBy` | audit | ignora | uid staff |

**UI:** extender panel «Meta de inversión» en `dashboard.component.html`; diálogo `InversionMetaDialogComponent`.

---

## Plan de Mitigación y Rollback

| Escenario | Rollback |
|-----------|----------|
| Meta incorrecta | borrar nodo o poner montoMeta = 0 |
| Rules Config | revert `database.rules.json` + deploy database |
| UI regresión dashboard | revert dashboard component |

---

## Deploy

```bash
npm run build
firebase deploy --only hosting,database
```
