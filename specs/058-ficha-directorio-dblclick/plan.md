# Plan técnico: Ficha rápida al doble clic (Directorio)

**Spec:** `specs/058-ficha-directorio-dblclick/spec.md`  
**Estado:** approved  

---

## Resumen

Abrir un diálogo grande (`admin-dialog-shell`) desde la fila del Directorio: cabecera de ficha (foto, chips, dueño) + pestañas clínicas de **solo lectura** alimentadas por los mismos servicios del expediente. CTA navega a `/admin/paciente?id=`. No se incrusta `PacientesComponent` ni se duplica su CRUD. En Clientes, dblclick reutiliza `verCliente()` (ficha + mascotas ya existentes).

---

## Archivos a crear / modificar

### Angular

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/app/core/config/admin-ui.config.ts` | modificar | `ADMIN_DIALOG_FICHA` (~1080px) |
| `src/app/pacientes-admin/paciente-ficha-dialog.component.ts` | crear | diálogo ficha + carga clínica |
| `src/app/pacientes-admin/paciente-ficha-dialog.component.html` | crear | shell + tabs |
| `src/app/pacientes-admin/paciente-ficha-dialog.component.scss` | crear | layout overlay (no `.admin-content`) |
| `src/app/pacientes-admin/pacientes-admin.module.ts` | modificar | declarar diálogo + `MatTabsModule` |
| `src/app/pacientes-admin/pacientes-admin.component.ts` | modificar | dblclick / Enter / selección |
| `src/app/pacientes-admin/pacientes-admin.component.html` | modificar | fila interactiva + stopPropagation |
| `src/app/pacientes-admin/pacientes-admin.component.css` | modificar | cursor/focus fila |
| `src/app/clientes/clientes.component.ts` | modificar | mismo patrón → `verCliente` |
| `src/app/clientes/clientes.component.html` | modificar | fila interactiva |
| `src/app/clientes/clientes.component.scss` | modificar | cursor/focus fila |
| `src/styles/admin-table.scss` | modificar | `.data-row--interactive` / `--selected` |
| `src/app/core/config/admin-module-pages.config.ts` | modificar | copy directorio (doble clic) |

### Firebase

Sin cambios.

### Cypress

Sin ruta nueva. Smoke existente de directorio / clientes.

---

## Modelo de datos

Sin cambios de contrato. Lectura hidratada (spec 057): `id` = key RTDB; queries duales `paciente_id` / `idPaciente`.

---

## Flujos

### Flujo principal

1. Staff en Directorio hace doble clic (o Enter) en una fila.
2. Se abre `PacienteFichaDialog` con paciente + dueño ya cargados en memoria.
3. El diálogo lee historial/vacunas/recordatorios (loading interno, sin overlay global duplicado).
4. CTA «Abrir expediente completo» cierra y navega a `/admin/paciente?id=`.
5. Icono carpeta sigue navegando directo al expediente (sin modal).

### Errores esperados

| Caso | Código / mensaje usuario |
|------|--------------------------|
| Fallo de una sección clínica | toast `ErrorMessagesService`; las otras pestañas siguen |
| Paciente sin `id` | no abre el modal |

---

## Servicios

- `HistorialesService.getHistorialesPorPaciente(id, extraIds)`
- `VacunasService.getVacunasPorPaciente(id, extraIds)`
- `RecordatoriosService.getRecordatoriosPorPaciente(id, extraIds)`
- `collectRelatedIds` (key + `idLegacy` + aliases)

---

## UI (admin)

- Diálogo: `admin-dialog-shell` + `admin-dialog-shell--readonly` + `ADMIN_DIALOG_FICHA`
- Chips `.tag` / `.estado-badge` completos
- Filas: `tabindex="0"`, `data-row--interactive`
- Acciones: `stopPropagation` en la celda `.row-actions`

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Solo lectura. Sin delete, rename ni campos nuevos de escritura.

  | Nodo / campo | Acción | ¿App móvil afectada? | Notas |
  |--------------|--------|----------------------|-------|
  | `Katzen/Mascota` | leer | no | fila ya en memoria |
  | `Katzen/Cliente` | leer | no | dueño en memoria |
  | `Historiales_Clinicos` | leer | no | dual id (057) |
  | `Vacunas` | leer | no | dual id |
  | `Recordatorios` | leer | no | dual id |

  - [x] Sin eliminar ni renombrar nodos existentes
  - [x] Campos nuevos opcionales con defaults seguros en lectura (no hay campos RTDB nuevos)

- **Estrategia de Datos de Prueba:** localhost + mocks existentes. Prohibido RTDB producción.

- **Patrones UI Reutilizados:**

  | Patrón | Referencia en repo |
  |--------|-------------------|
  | Diálogo detalle | `admin-dialog-shell`, `paciente-admin-dialog` modo ver |
  | Expediente clínico | servicios de `pacientes.component` (no el componente página) |
  | Ficha cliente | `ClienteDialogComponent` `modoVer` |
  | Alertas | `ErrorMessagesService` |
  | Loading | spinner **dentro** del diálogo; no `LoadingService.show` al abrir (evita overlay trabado) |
  | Tabla acciones | `.row-actions` + `stopPropagation` |
  | Badges | `.estado-badge` + `adminEstadoClass` |

  - [x] Sin librerías UI externas
  - [x] `docs/ADMIN-UI-ARCHITECTURE.md` consultado
  - [x] Chips/badges de estado visibles enteros (no truncados)

---

## Plan de Mitigación y Rollback

- [x] Verificado que no hay cambios destructivos en contratos de datos.
- [x] Compilación local exitosa (`npm run build`).
- [x] Plan de reversión documentado en caso de fallos inesperados.

| Escenario | Acción de rollback |
|-----------|-------------------|
| UI rompe build | Revertir archivos de spec 058 |
| Modal lento | CTA al expediente; las queries son las mismas que Buscar paciente |

---

## Deploy

```bash
npm run build
# hosting: no, salvo que Luis lo pida
```

---

## Riesgos

- Diálogo con listas largas: scroll del `mat-dialog-content`; no paginar RTDB de nuevo.
