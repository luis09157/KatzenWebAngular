# Spec: Loading contextual y overlay no trabado

**ID:** 005-loading-feedback-ux  
**Estado:** done  
**Fecha:** 2026-08-25  
**Autor:** Cursor agent / Luis Alfonso Niño Martínez  

---

## Problema

Al guardar una cita desde el diálogo admin, el overlay global de carga quedaba **trabado** (no desaparecía). La causa era un doble `LoadingService.show()` (diálogo + padre) con un solo `hide()`, dejando el contador interno en `1`.

Además, el overlay siempre mostraba el texto genérico «Cargando...», sin distinguir lectura, guardado o eliminación — el staff no sabía qué operación estaba en curso.

---

## User stories

### US-1 — Overlay que siempre cierra

Como **staff admin**  
Quiero **que el loading desaparezca al terminar de guardar/actualizar/eliminar una cita**  
Para **poder seguir usando el panel sin recargar la página**

**Criterios de aceptación:**

- [x] SC-001: Tras guardar cita (éxito), el overlay desaparece
- [x] SC-002: Tras error al guardar, el overlay desaparece y se muestra mensaje de error
- [x] SC-003: No se llama `show()` en el diálogo y otra vez en el padre al cerrar con resultado

### US-2 — Mensajes contextuales

Como **staff admin**  
Quiero **ver un mensaje acorde a la operación** («Guardando…», «Eliminando…», etc.)  
Para **entender qué está pasando sin ambigüedad**

**Criterios de aceptación:**

- [x] SC-004: `LoadingService.show(message?)` acepta mensaje opcional; default «Cargando…»
- [x] SC-005: Guardar cita muestra «Guardando…»
- [x] SC-006: Cambiar estado muestra «Actualizando…»; baja lógica «Eliminando…»
- [x] SC-007: Overlay en `app.component` muestra el mensaje del servicio

---

## Fuera de alcance

- Migrar todos los módulos admin al mensaje contextual en esta entrega (solo citas + API reutilizable)
- Reemplazar SweetAlert de éxito/error
- Cambios RTDB / Cloud Functions

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** ninguno. Solo UI / servicio Angular.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | — | — | — | sin cambios de datos |

- **Estrategia de Datos de Prueba:** mocks locales / emuladores; no producción (`katzen-a0e3e`).

- **Patrones UI Reutilizados:** overlay global en `app.component` + `LoadingService`; alertas SweetAlert2 existentes; diálogos `admin-dialog-shell`.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí (módulo citas) |
| doctor | sí |
| recepcionista | sí (según matriz citas) |

---

## UI (rutas y layout)

- Ruta: `/admin/citas` (flujo guardar / estado / baja)
- Overlay: `.global-loading-overlay` + texto dinámico
- Spec de regla permanente: `docs/ADMIN-UI-ARCHITECTURE.md` § Loading

---

## Backend

- [ ] Cloud Function — no
- [ ] Reglas RTDB — no
- [ ] Email / integración externa — no

---

## Success metrics

- Overlay no queda trabado tras guardar cita (manual QA)
- Mensaje «Guardando…» visible durante persistencia
- `npm run build` exit 0

---

## Nota SDD (herencia)

Los criterios de loading contextual y overlay no trabado forman parte de la **validación pre-entrega obligatoria** del agente (`specs/templates/qa-validation-guide.md` §2.2 / §2.4). Toda feature posterior que toque async admin debe verificarlos antes de entregar; el usuario no es el QA por defecto.
