# Spec: Ficha rápida al doble clic (Directorio)

**ID:** 058-ficha-directorio-dblclick  
**Estado:** done  
**Fecha:** 2026-08-31  
**Autor:** Cursor (Grok) / Luis Alfonso Niño Martínez  

---

## Problema

En **Directorio de pacientes** (`/admin/pacientes-admin`) el staff debe ir al icono «Ver expediente» (navegación a otra ruta) para ver dueño + datos clínicos. Un doble clic en la fila no abre nada. Hace falta una **ficha modal** con lo necesario (paciente, dueño, historial/vacunas/recordatorios) sin duplicar la página completa de Buscar paciente.

---

## User stories

### US-1 — Ficha al doble clic en Directorio

Como **staff**  
Quiero **doble clic (o Enter en la fila) para abrir la ficha completa en un modal**  
Para **revisar dueño y expediente sin salir del directorio**

**Criterios de aceptación:**

- [x] SC-001: `(dblclick)` en la fila abre un diálogo `admin-dialog-shell` grande (sin `mat-dialog-title`) con foto, especie/raza, peso, sexo, estado vivo/fallecido, dueño (nombre, teléfono, correo) y chips de edad.
- [x] SC-002: El modal muestra pestañas o bloques **Historial / Vacunas / Recordatorios** con datos reales (mismos servicios que el expediente).
- [x] SC-003: CTA «Abrir expediente completo» navega a `/admin/paciente?id={key}`. El icono de carpeta sigue yendo al expediente completo.
- [x] SC-004: Clic/doble clic en botones de acciones **no** abre la ficha (`stopPropagation`).
- [x] SC-005: Enter (y Espacio) en la fila enfocada también abre la ficha.

### US-2 — Mismo patrón en Clientes (opcional, bajo esfuerzo)

Como **staff**  
Quiero **doble clic en un cliente para ver su ficha + mascotas**  
Para **no buscar el icono de ojo**

**Criterios de aceptación:**

- [x] SC-006: Doble clic / Enter en fila de `/admin/clientes` abre el diálogo de detalle existente (contacto + mascotas vinculadas). Acciones no disparan la ficha.

---

## Fuera de alcance

- Unificar menú Directorio + Buscar paciente
- CRUD clínico dentro del modal (alta/edición de historial, vacunas, recordatorios)
- Escrituras RTDB nuevas o cambios de contrato
- Deploy

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Solo **lectura** con los mismos nodos y queries duales de spec 057. Sin campos nuevos. App móvil no afectada.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Mascota` | staff | no (este flujo) | ficha usa la fila ya hidratada |
  | `Katzen/Cliente` | staff | no | dueño: nombre / tel / correo |
  | `Katzen/Historiales_Clinicos` | staff | no | `paciente_id` + `idPaciente` |
  | `Katzen/Vacunas` | staff | no | dual id |
  | `Katzen/Recordatorios` | staff | no | dual id |

- **Estrategia de Datos de Prueba:** Mocks locales / sesión staff en localhost. **Prohibido** RTDB producción (`katzen-a0e3e`).

- **Patrones UI Reutilizados:** `admin-dialog-shell`, `ADMIN_DIALOG_*`, `.estado-badge`, chips `.tag`, pestañas Material, empty states, servicios de expediente (`HistorialesService`, `VacunasService`, `RecordatoriosService`). No duplicar `pacientes.component` (~1000 líneas). En clientes: `ClienteDialogComponent` modo ver.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí |
| doctor | sí (módulos paciente / pacientes-admin / clientes) |
| recepcionista | sí si el módulo está en su matriz |

---

## UI (rutas y layout)

- `/admin/pacientes-admin` — tabla: dblclick / Enter → modal ficha
- `/admin/paciente?id=` — expediente completo (CTA)
- `/admin/clientes` — tabla: dblclick / Enter → ficha cliente existente

---

## Backend

- [ ] Cloud Function: no
- [ ] Reglas RTDB: no (sin cambio)
- [ ] Email / integración externa: no

---

## Testing

- [ ] `npm run build`
- [ ] Smoke local `:4200` (login staff): dblclick, Enter, stopPropagation en acciones, CTA expediente

---

## Riesgos

- Modal con muchos registros clínicos: scroll interno del diálogo; CTA al expediente completo.
- No incrustar `PacientesComponent` (página con búsqueda) para evitar estados rotos en overlay.
