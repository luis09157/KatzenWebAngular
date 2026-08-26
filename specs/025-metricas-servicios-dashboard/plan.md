# Plan técnico: Métricas + Dashboard dueño

**Spec:** `specs/025-metricas-servicios-dashboard/spec.md`  
**Estado:** approved  

---

## Resumen

Enriquecer KPIs por módulo (client-side) y convertir `/admin/inicio` en dashboard dueño con filtros de período, agregados de caja + operación, tops y serie diaria SVG/CSS. Sin Chart.js ni nodos RTDB nuevos.

---

## Archivos

### Shared / utils

| Archivo | Acción |
|---------|--------|
| `src/app/core/utils/periodo-filtro.util.ts` | crear |
| `src/app/shared/admin/admin-stat-card.*` | displayValue (money strings) |
| `src/app/core/testing/mock-data.ts` | mocks dashboard |

### Dashboard dueño

| Archivo | Acción |
|---------|--------|
| `src/app/dashboard/owner-dashboard.models.ts` | crear |
| `src/app/dashboard/owner-dashboard.service.ts` | crear |
| `src/app/dashboard/dashboard.component.*` | potenciar |
| `src/app/dashboard/dashboard.module.ts` | FormsModule + MatInput |

### Módulos KPI

| Módulo | Cambio |
|--------|--------|
| banios | período + ingresos/valor/margen |
| citas | citas hoy |
| vacunas | del mes |
| clientes | nuevos mes |
| pension | finalizadas |
| productos / proveedores / ordenes / movimientos | KPI grid nuevo |

### Docs

| Archivo | Acción |
|---------|--------|
| `docs/ADMIN-UI-ARCHITECTURE.md` | regla KPIs obligatorios |
| `specs/README.md`, `ROADMAP.md` | índice 025 |

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto RTDB:** solo lectura agregada. Sin writes nuevos.

  | Nodo / campo | Acción | ¿App móvil? | Notas |
  |--------------|--------|-------------|-------|
  | Caja/Banios/Citas/Cliente/Productos/Pension | lectura | no | client-side |

  - [x] Sin eliminar ni renombrar nodos
  - [x] Sin campos nuevos obligatorios

- **Pruebas:** mocks + `npm run build` + smoke localhost + Cypress admin (no bloquear por auth flaky).
- **UI:** admin pattern; loading contextual; empty states.

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos
- [ ] `npm run build` OK
- [x] Rollback: revertir commit dashboard + KPI HTMLs; redeploy hosting

| Escenario | Rollback |
|-----------|----------|
| Dashboard lento | reducir combineLatest / cargar lazy |
| KPI confunde | ajustar labels/hints |
| Build fail | revert archivos |

---

## Deploy

```bash
npm run build
firebase deploy --only hosting
```

(NO functions, NO Resend, NO database.)
