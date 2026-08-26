# Spec: Cliente-Paciente Picker (regla global admin)

**ID:** 029-cliente-paciente-picker  
**Estado:** in_progress  
**Fecha:** 2026-08-26  
**Autor:** Agente Cursor / Luis Alfonso Niño Martínez  

---

## Problema

Varios módulos admin (pensión, citas, baños, vacunas, historiales, recordatorios) enlazan registros clínicos a **Cliente** (dueño) y **Paciente** (mascota) en RTDB. Algunos formularios aún usan **inputs de texto libre** (`paciente: "dadsad"`, `cliente: "Luis"`), lo que:

- Rompe la integridad referencial (`cliente_id`, `paciente_id` quedan en `manual` o inconsistentes).
- Impide autocompletar datos enlazados (contacto, tamaño, defaults financieros).
- Dificulta búsquedas y reportes operativos.

Se requiere un **componente reutilizable** y una **regla global de UI**: siempre **cliente primero → paciente después**, con buscador/autocomplete y IDs RTDB.

---

## User stories

### US-1 — Picker reutilizable en formularios admin

Como **staff admin**  
Quiero **buscar cliente y luego elegir una de sus mascotas**  
Para **registrar estancias, citas y servicios con datos enlazados correctos**

**Criterios de aceptación:**

- [ ] SC-001: Existe `app-cliente-paciente-picker` en `src/app/shared/admin/` exportado por `SharedModule`
- [ ] SC-002: Orden fijo **cliente → paciente**; paciente deshabilitado hasta elegir cliente
- [ ] SC-003: Búsqueda de clientes por nombre, apellidos, teléfono, correo, expediente
- [ ] SC-004: Lista de pacientes filtrada al `cliente_id` seleccionado (solo activos, no fallecidos)
- [ ] SC-005: Autorrellena `cliente_id`, `paciente_id`, nombres display y emite `selectionChange` con entidades completas
- [ ] SC-006: **Prohibido** texto libre para cliente/paciente donde deba haber enlace RTDB

### US-2 — Migración módulos prioritarios

Como **equipo de desarrollo**  
Quiero **migrar los modales obvios al picker**  
Para **unificar UX y datos**

**Criterios de aceptación:**

- [ ] SC-007: Modal **Nueva estancia pensión** migrado (captura reportada por Luis)
- [ ] SC-008: Documentados módulos pendientes de migración (citas ya parcial, baños vía diálogo previo, etc.)

---

## Fuera de alcance

- Refactor completo de todos los diálogos `seleccionar-cliente-*` standalone en esta entrega
- Cambios RTDB / Cloud Functions
- Portal dueños (solo admin en esta spec)

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Solo **lectura** de `Katzen/Cliente` y `Katzen/Mascota`. Escrituras siguen usando los mismos campos `cliente_id` / `paciente_id` que ya consumen app móvil. Sin campos nuevos.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Cliente` | staff | — | Autocomplete |
  | `Katzen/Mascota` | staff | — | Filtro por `idCliente` / `cliente_id` |

- **Estrategia de Datos de Prueba:** Mocks en `src/app/core/testing/mock-data.ts` (`MOCK_CLIENTE`, `MOCK_MASCOTA`, `MOCK_CLIENTE_LUIS`). Desarrollo localhost / emuladores — **nunca** producción.

- **Patrones UI Reutilizados:** `admin-dialog-shell`, `admin-form-layout`, `app-cliente-paciente-picker`, utilidades `cliente-search.util.ts` / `paciente-search.util.ts`, referencia previa `cita-dialog` y `seleccionar-cliente-banio-dialog`.

---

## Módulos que deben usar el picker

| Módulo | Estado migración | Notas |
|--------|------------------|-------|
| **Pensión** | ✅ esta entrega | Modal estancia |
| **Citas** | Parcial | `cita-dialog` tiene patrón inline; migrar a componente compartido |
| **Baños** | Parcial | Flujo `seleccionar-cliente-banio-dialog` + summary en `banio-dialog` |
| **Vacunas** | Pendiente | `seleccionar-cliente-vacuna-dialog` + entity-summary |
| **Historiales** | Pendiente | `seleccionar-cliente-dialog` + entity-summary |
| **Recordatorios** | Pendiente | `seleccionar-cliente-recordatorio-dialog` |
| **Expediente paciente** | N/A | Contexto ya fijado por ruta |
| **Pacientes admin** | Parcial | Autocomplete cliente en alta mascota |

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí |
| doctor | sí |
| recepcionista | sí |
| peluquero | según módulo |

---

## UI (rutas y layout)

- Componente: `app-cliente-paciente-picker` dentro de `admin-form-layout` / `form-grid`
- Cliente: `mat-autocomplete` + icono `person_search`
- Paciente: `mat-select` (default) o autocomplete opcional `[pacienteAutocomplete]="true"`
- Spec diseño: `docs/ADMIN-UI-ARCHITECTURE.md` § Cliente-Paciente Picker

---

## Backend

- [ ] Cloud Function — no
- [ ] Reglas RTDB — no

---

## Notas / decisiones

- Reutilizar lógica de filtrado de `seleccionar-cliente-banio-dialog` y `cita-dialog`, centralizada en utils.
- IDs legacy `manual` en pensión existente: en edición se restauran si hay IDs reales; creación exige IDs válidos.
