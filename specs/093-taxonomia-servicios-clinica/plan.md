# Plan técnico: Taxonomía servicios clínica — Fase 2 (SC-008)

**Spec:** `specs/093-taxonomia-servicios-clinica/spec.md`  
**Estado:** implemented (código + script; **apply prod solo Luis**)  
**Nivel:** L3 (migración RTDB aditiva; sin deploy database rules)

---

## Resumen

Migración suave de nodos legacy `Katzen/ServiciosClinica/{id}` con `tipo: 'domicilio'` → `tipo: 'consulta'` + `esDomicilio: true`. Aditiva: no borra campos ni reescribe `Visitas`. KPIs admin usan `contarKpisServiciosClinica` (consulta ≠ diagnóstico; domicilio = flag). Caja/P&L: **sin** categoría nueva `diagnostico` (fuera de alcance hasta decisión Luis); `diagnostico` sigue mapeando a bucket `consulta`.

---

## Contratos de Datos y UI

| Nodo | Cambio | Notas |
|------|--------|-------|
| `Katzen/ServiciosClinica/{id}` | update aditivo: `tipo`, `esDomicilio`, `updated_at` | Solo si `tipo === 'domicilio'`. Idempotente. |
| `Katzen/Visitas/{id}.lineas[]` | sin cambio | Snapshots históricos intactos |
| `CajaCategoria` / `VisitaLineaCategoria` | sin valor nuevo | `diagnostico` catálogo → línea/caja `consulta` |

UI: sin cambio de rutas; KPIs ya existentes consumen util de conteo.

---

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/app/servicios-clinica/servicios-clinica.util.ts` | `planPatchMigracionDomicilio`, `planMigracion…`, `contarKpis…`, `labelTipoClinicoParaReporte` |
| `src/app/servicios-clinica/servicios-clinica.util.spec.ts` | tests SC-008 + KPIs |
| `src/app/servicios-clinica/servicios-clinica.component.ts` | KPIs vía util |
| `scripts/migrate-servicios-clinica-domicilio.mjs` | dry-run default; apply emulador / prod con guards |
| `package.json` | `migrate:093:domicilio` (+ `:emulator`) |

---

## Plan de Mitigación y Rollback

| Riesgo | Mitigación | Rollback |
|--------|------------|----------|
| Escritura accidental en prod | Dry-run default; prod exige `CONFIRM_PROD` + `MIGRATE_CONFIRM=LUIS` + `--apply`; agente no aplica prod | N/A si no se aplicó |
| Patch incorrecto | Util + tests; patch mínimo (3 campos) | Re-poner `tipo: 'domicilio'` manualmente en nodos afectados (app sigue leyendo legacy) o dejar `consulta`+`esDomicilio` (estado deseado) |
| App móvil | Nodo no consumido hoy (056); cambio aditivo de valores | Lectura legacy permanece en `hidratarServicioClinica` |
| Visitas/caja rotas | No se mutan tickets | — |

---

## Cómo ejecutar (Luis)

### Emulador (agente o Luis)

```bash
npm run emulators   # terminal aparte
# seed opcional si hace falta catálogo
FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 npm run migrate:093:domicilio
# revisar lista; luego:
FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 npm run migrate:093:domicilio -- --apply
```

### Producción (solo Luis; agente no ejecuta)

```bash
# 1) Dry-run lectura:
CONFIRM_PROD=katzen-a0e3e GOOGLE_APPLICATION_CREDENTIALS=<sa.json> \
  node scripts/migrate-servicios-clinica-domicilio.mjs --target=prod

# 2) Apply tras revisar lista:
CONFIRM_PROD=katzen-a0e3e MIGRATE_CONFIRM=LUIS GOOGLE_APPLICATION_CREDENTIALS=<sa.json> \
  node scripts/migrate-servicios-clinica-domicilio.mjs --target=prod --apply
```

No requiere `firebase deploy` de database/functions/hosting para esta migración.

---

## Decisión P&L pendiente (no en esta entrega)

Categoría caja/línea `diagnostico` queda **opcional Fase 2+** (spec Fuera de alcance). Reportes admin distinguen por tipo de catálogo; ingresos por servicio en Finanzas siguen buckets 021/022.
