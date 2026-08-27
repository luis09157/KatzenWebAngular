# Plan técnico: Staff UID por acto clínico

**Spec:** `specs/035-staff-uid-acto/spec.md`  
**Estado:** approved  

---

## Resumen

Componente compartido `app-staff-picker` que carga staff activos de `Katzen/Usuarios`, filtra por rol (doctor / peluquero / all) y escribe en el FormGroup el **UID canónico** + **nombre denormalizado**. Se integra en diálogos de citas, historiales, vacunas y baños (visitas opcionales). Lectura legacy: si no hay UID, se muestra el nombre texto.

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/shared/admin/staff-picker.models.ts` | crear | fields + filtros |
| `src/app/shared/admin/staff-picker.util.ts` | crear | resolve display, match legacy |
| `src/app/shared/admin/staff-picker.component.ts\|html\|scss` | crear | mat-select + sync uid/nombre |
| `src/app/shared/shared.module.ts` | modificar | declarar/exportar |
| `src/app/core/models.ts` | modificar | tipar campos UID en Cita/Historial |
| `src/app/citas/cita-dialog.*` | modificar | picker + veterinario_id |
| `src/app/historiales/historial-dialog.*` | modificar | picker + medico_atendio_uid |
| `src/app/vacunas/vacuna-dialog.*` | modificar | picker + veterinario_id |
| `src/app/banios/banio-dialog.*` | modificar | picker + peluquero nombre |
| `src/app/visitas/visita-dialog.*` + models | modificar | atendidoPor* opcional |
| listados (citas/historiales/vacunas/baños) | modificar leve | chip “Atendido por” si aplica |
| `src/app/core/testing/mock-data.ts` | modificar | UIDs + nombres |
| `specs/memory/domain-context.md` | modificar | § campos staff UID |
| `specs/ROADMAP.md` | modificar | 035 |

### Firebase

Sin cambios de rules ni functions (aditivo bajo nodos existentes).

### Cypress

Sin ruta nueva; smoke visual localhost + build.

---

## Modelo de datos

```text
Katzen/Citas/{id}
  veterinario: string          # nombre display (legacy + denorm)
  veterinario_id?: string      # Auth UID staff (aditivo)

Katzen/Historiales_Clinicos/{id}
  medico_atendio: string
  medico_atendio_uid?: string  # aditivo

Katzen/Vacunas/{id}
  veterinario: string
  veterinario_id?: string      # aditivo

Katzen/Banios/{id}
  peluquero_id: string         # ya existía
  peluquero?: string           # denorm al guardar (aditivo / reforzado)

Katzen/Visitas/{id}
  atendidoPorUid?: string
  atendidoPorNombre?: string
```

---

## Flujos

### Flujo principal (alta)

1. Abrir diálogo → picker carga staff activos filtrados.
2. Prefill: UID del usuario logueado si está en la lista.
3. Guardar → payload incluye UID + nombre.
4. Listado / detalle muestran nombre (desde denorm o legacy).

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| Sin staff en lista | Select vacío + mat-error si required |
| Fallo carga Usuarios | SweetAlert / ErrorMessagesService |

---

## Servicios

- `UsuariosService.getUsuarios()` — fuente
- `CurrentStaffService.getStaffId()` + lectura `Katzen/Usuarios/{uid}` para nombre fiable en prefill
- Util `staff-picker.util.ts` — helpers display / match

---

## UI (admin)

- Diálogo: `ADMIN_DIALOG_FORM` existente
- Picker: `mat-form-field` + `mat-select` (mismo look que selects actuales)
- Listados: `.tag.tag-muted` con nombre; opcional prefijo “Atendido por”

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:**

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Citas.veterinario_id` | añadir opcional | no | UID Auth |
  | `Historiales_Clinicos.medico_atendio_uid` | añadir opcional | no | |
  | `Vacunas.veterinario_id` | añadir opcional | no | |
  | `Banios.peluquero` | denorm nombre | no | id ya existía |
  | `Visitas.atendidoPorUid/Nombre` | añadir opcional | no | |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura

- **Estrategia de Datos de Prueba:** mocks locales en `mock-data.ts`. Prohibido RTDB producción.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Diálogo | `admin-dialog-shell` |
  | Picker form | `cliente-paciente-picker` (mismo SharedModule) |
  | Loading | `LoadingService` |
  | Tags listado | `.tag` / `admin-table.scss` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado
  - [x] Chips/badges de estado visibles enteros (no truncados)

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [x] Compilación local exitosa (`npm run build`).
- [x] Plan de reversión documentado.

| Escenario | Acción de rollback |
|-----------|-------------------|
| UI rompe build / diálogos | Revertir commit feature 035 / archivos staff-picker + diálogos |
| Datos con UID incorrecto | Corregir registro; campos nombre legacy siguen visibles |
| App móvil | Ignora campos nuevos; sin acción |

---

## Deploy

```bash
npm run build
firebase deploy --only hosting   # con autorización explícita de Luis
```

Sin deploy de functions ni database rules.

---

## Riesgos

- Filtros de perfil inconsistentes previos (`doctor` vs includes) — el picker unifica con filtro configurable.
- Prefill incorrecto si el perfil del logueado no pasa el filtro (ej. recepcionista en historial) — no forzar; dejar vacío.
- Vacuna-dialog tenía bug al mapear Object.keys sobre array — el picker elimina esa ruta frágil.
