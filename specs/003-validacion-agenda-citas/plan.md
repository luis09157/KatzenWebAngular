# Plan técnico: Validación de agenda de citas

**Spec:** `specs/003-validacion-agenda-citas/spec.md`  
**Estado:** approved  

---

## Resumen

Endurecer el flujo de citas en Angular: validaciones en `CitasService` + formulario `cita-dialog` + control de rol en lista/menú; campos RTDB aditivos `duracion_minutos` y `motivo_cancelacion`; portal solo mapea/muestra el motivo. Sin Functions ni cambios de rules.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/citas/cita-agenda.util.ts` | crear | solapamiento, parse inicio, default duración |
| `src/app/citas/cita-agenda.util.spec.ts` | crear | tests con mocks locales |
| `src/app/citas/citas.service.ts` | modificar | validar vet, duración, solape, cancelación, revert |
| `src/app/citas/cita-dialog.component.ts` | modificar | required vet/duración/motivo; fechas pasadas por rol |
| `src/app/citas/cita-dialog.component.html` | modificar | campos UI + errores |
| `src/app/citas/citas.component.ts` | modificar | cancelar con motivo; revert por rol |
| `src/app/citas/citas.component.html` | modificar | menú Cancelar / Revertir condicional |
| `src/app/core/models.ts` | modificar | campos Cita |
| `src/app/core/config/staff-role.config.ts` | modificar | helper `staffRoleIsVeterinarioOperativo` |
| `src/app/core/testing/mock-data.ts` | modificar | citas con duración/motivo |
| `src/app/core/error-messages.service.ts` | modificar | contextos solape / permiso |
| `src/app/portal/utils/portal-mapper.util.ts` | modificar | `motivo_cancelacion` |
| `src/app/portal/list-section/portal-list-section.component.html` | modificar | mostrar motivo |

### Firebase

| Archivo | Acción |
|---------|--------|
| — | Sin cambios (campos opcionales, sin rules nuevas) |

### Cypress

| Archivo | Acción |
|---------|--------|
| — | Sin ruta nueva; smoke existente cubre `/admin/citas` |

---

## Modelo de datos

```text
Katzen/Citas/{id}
  cliente_id, paciente_id, fecha, fecha_hora, hora, motivo, estado, veterinario, ...
  duracion_minutos?: number   # default 30 en escritura web; opcional legacy
  motivo_cancelacion?: string # obligatorio si estado === cancelada (web)
  activo?: boolean
```

---

## Flujos

### Flujo principal (guardar)

1. Formulario exige veterinario + duración (≥ 5).
2. Si fecha &lt; hoy y rol no operativo → error UI.
3. Servicio: default duración 30; exige veterinario; si cancelada → motivo; comprueba solape vs citas activas no canceladas del mismo vet.
4. Persist RTDB `set`/`push`.

### Cancelar desde lista

1. SweetAlert input motivo → `estado: cancelada` + `motivo_cancelacion`.
2. Servicio valida motivo no vacío.

### Revertir

1. UI oculta si no es vet operativo.
2. Servicio vuelve a validar rol antes de persistir.

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| Sin veterinario | “Debes asignar un veterinario a la cita.” |
| Solapamiento | “El veterinario ya tiene una cita en ese horario.” |
| Sin motivo cancelación | “Indica el motivo de cancelación.” |
| Fecha pasada (recepción) | mat-error fechaPasada |
| Revertir sin permiso | “Solo veterinarias pueden revertir una cita completada.” |

---

## Servicios

- `CitasService.guardarCita` — validaciones de negocio + RTDB
- `AuthProfileService.getEffectiveStaffRole` — fechas pasadas / revert
- `cita-agenda.util` — lógica pura de ventanas

---

## UI (admin)

- Contenedor existente `.citas-contenedor`
- Diálogo: `admin-dialog-shell` + campos Material
- Menú: Cancelar + Revertir condicional

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:**

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/Citas.duracion_minutos` | campo opcional | no | default lectura 30 |
  | `Katzen/Citas.motivo_cancelacion` | campo opcional | no | portal lo muestra si existe |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura

- **Estrategia de Datos de Prueba:** `mock-data.ts` + unit tests de `cita-agenda.util` sin Firebase. Prohibido RTDB producción.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Página CRUD citas | `src/app/citas/` |
  | Diálogo | `admin-dialog-shell` |
  | Alertas | SweetAlert2 + `ErrorMessagesService` |
  | Portal lista | `portal-list-section` |
  | Badges estado | `.estado-badge` enteros (sin clip); `src/styles/admin-table.scss` |
  | Nombres persona (tabla) | Columna veterinario / tags `.tag`: nombre completo en desktop ancho; wrap ≤2 líneas en mediana; sin ellipsis agresivo (`admin-table.scss`) |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado
  - [x] Chips de estado visibles completos (columna `estado` ≥ ~148px; no truncar pill)
  - [x] Nombres de veterinario visibles completos en pantallas anchas (sin `...` si hay espacio)

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [x] Compilación local exitosa (`npm run build`).
- [x] Plan de reversión documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| UI rompe build | Revertir archivos de `src/app/citas/` + portal mapper/list + staff-role helper |
| Validación demasiado estricta en prod | Desactivar checks en servicio (hotfix) o revertir deploy hosting (solo con autorización Luis) |
| Campos nuevos confunden móvil | Ningún riesgo: opcionales; móvil ignora |

---

## Deploy

```bash
npm run build
# hosting solo con autorización explícita de Luis
# firebase deploy --only hosting
```

No Functions ni `database` en esta feature.

---

## Riesgos

- Comparación de veterinario por **nombre** (string) — mismo patrón actual del formulario; dos strings distintos del mismo doctor no colisionan.
- Carga completa de citas para validar solape (ya existe `getCitas()`); aceptable hasta paginación (AUDIT #13).
