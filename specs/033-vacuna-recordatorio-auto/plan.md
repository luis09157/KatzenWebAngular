# Plan técnico: Vacuna → recordatorio automático

**Spec:** `specs/033-vacuna-recordatorio-auto/spec.md`  
**Estado:** approved  

---

## Resumen

Centralizar la lógica de «asegurar recordatorio de refuerzo» en un util puro + métodos en `RecordatoriosService`, invocados desde `VacunasService` al crear/actualizar/baja lógica. El diálogo de vacuna deja de depender solo del checkbox + `fechaRecordatorio` en alta: cualquier vacuna con próxima fecha genera (o actualiza) un pendiente enlazado, sin duplicados. UI: hint/toast; edición/cancelación en módulo Recordatorios. Portal mapper amplía aliases de fecha. Sin CF nueva ni Resend.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/vacunas/vacuna-recordatorio.util.ts` | crear | fechas, título, dedupe key |
| `src/app/vacunas/vacuna-recordatorio.util.spec.ts` | crear | unit |
| `src/app/recordatorios/recordatorios.service.ts` | modificar | `asegurarRefuerzoDesdeVacuna`, `cancelarPendientesPorVacuna` |
| `src/app/vacunas/vacunas.service.ts` | modificar | hook post create/update/baja |
| `src/app/vacunas/vacuna-dialog.component.ts` | modificar | usar hook; toast; hint |
| `src/app/vacunas/vacuna-dialog.component.html` | modificar | copy hint refuerzo |
| `src/app/portal/utils/portal-mapper.util.ts` | modificar | fechas recordatorio |
| `src/app/portal/utils/portal-mapper.util.spec.ts` | modificar | alias fecha |
| `src/app/core/testing/mock-data.ts` | modificar | MOCK_VACUNA + recordatorio auto |

### Specs / docs

| Archivo | Acción |
|---------|--------|
| `specs/033-vacuna-recordatorio-auto/*` | crear |
| `specs/032-.../spec.md` + tasks | SC-017 → 033 |
| `specs/031-.../spec.md` | gap #3 → 033 |
| `specs/ROADMAP.md` | fila CxC/ops |
| `specs/memory/domain-context.md` | § Vacunas / Recordatorios |

### Firebase / Cypress

| Archivo | Acción |
|---------|--------|
| `database.rules.json` | sin cambio (salvo índice opcional — no requerido) |
| Cypress | smoke existente vacunas suficiente; sin ruta nueva |

---

## Modelo de datos

```text
Katzen/Vacunas/{id}
  idPaciente / paciente_id
  idCliente / cliente_id?
  vacuna, dosis, fechaAplicacion
  proximaAplicacion?, intervalo?, fechaRecordatorio?
  recordatorio?: boolean
  activo

Katzen/Recordatorios/{id}
  paciente_id, cliente_id?
  titulo, descripcion?, tipo: 'vacuna'
  fecha_hora_recordatorio, fecha_recordatorio?
  estado: 'pendiente' | 'completado' | 'cancelado'
  prioridad: 'alta'
  vacunaId?, vacuna_relacionada_id?   # opcionales aditivos
  origen?: 'vacuna_auto'              # opcional
  activo: boolean
```

---

## Flujos

### Flujo principal (guardar vacuna)

1. Staff guarda vacuna con `proximaAplicacion` o `fechaRecordatorio` o (`intervalo` + fecha aplicación).
2. Persist vacuna.
3. Resolver fecha objetivo del recordatorio.
4. Buscar pendiente activo con mismo `vacunaId` **o** (paciente + tipo vacuna + misma fecha día).
5. Si existe → actualizar fecha/título; si no → `push` recordatorio.
6. Toast si se creó/actualizó.

### Baja vacuna

1. `activo: false` en vacuna.
2. Buscar recordatorios con `vacunaId` / `vacuna_relacionada_id` pendientes activos → `activo: false`, `estado: cancelado`, flag opcional `canceladoPorVacuna`.

### Errores esperados

| Caso | Comportamiento |
|------|----------------|
| Falla write recordatorio | Log + vacuna OK; toast vacuna sin mencionar recordatorio o aviso suave |
| Sin próxima fecha | No crea recordatorio |
| Duplicado equivalente | Skip / update, no segundo nodo |

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:**

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/Recordatorios.vacunaId` | campo opcional | no | enlace |
  | `Katzen/Recordatorios.origen` | campo opcional | no | `vacuna_auto` |
  | `Katzen/Recordatorios.cliente_id` | opcional (ya usado en otros flujos) | no | |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura

- **Estrategia de Datos de Prueba:** `MOCK_VACUNA`, `MOCK_RECORDATORIO_VACUNA_AUTO` en mock-data. Sin producción.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia |
  |--------|------------|
  | Diálogo vacuna | `admin-dialog-shell` |
  | Alertas | SweetAlert2 |
  | Loading | `LoadingService` |
  | Recordatorios CRUD | `src/app/recordatorios/` |

  - [x] Sin librerías UI externas
  - [x] ADMIN-UI consultado
  - [x] Chips estado (módulo recordatorios) sin clip

---

## Plan de Mitigación y Rollback

- [x] Sin cambios destructivos en contratos.
- [ ] Compilación local (`npm run build`) antes de cerrar.
- [x] Rollback documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| Recordatorios duplicados en prod | Feature flag lógica: dejar de llamar `asegurar*`; baja lógica de duplicados por staff |
| UI rompe build | Revertir archivos de la feature |
| Cancelación agresiva de recordatorios | Solo cancela si hay `vacunaId`/`vacuna_relacionada_id` match |

---

## Deploy

```bash
npm run build
# hosting (con autorización Luis)
firebase deploy --only hosting
# database solo si se tocó rules (esta entrega: no)
```

Sin functions nuevas. Sin Resend.

---

## Riesgos

- Vacunas legacy sin `vacunaId` en recordatorios viejos: dedupe por paciente+título+fecha.
- Checkbox antiguo puede confundir: copy UI aclara auto-creación por próxima fecha.
