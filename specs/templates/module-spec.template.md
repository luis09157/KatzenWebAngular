# Spec: [Nombre de la feature / módulo]

**ID:** NNN-nombre-feature  
**Estado:** draft | in_progress | done  
**Fecha:** YYYY-MM-DD  
**Autor:**  

---

## Problema

¿Qué dolor resuelve en la clínica? (1–3 párrafos)

---

## User stories

### US-1 — [Título]

Como **[rol: admin / doctor / cliente portal]**  
Quiero **[acción]**  
Para **[beneficio]**

**Criterios de aceptación:**

- [ ] SC-001: ...
- [ ] SC-002: ...

### US-2 — [Título]

...

---

## Fuera de alcance

- ...
- ...

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** [Describir qué nodos se leerán/escribirán de forma aditiva. Confirmar que la app móvil no se verá afectada.]

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/...` | staff / client | staff / function | campos nuevos opcionales |

- **Estrategia de Datos de Prueba:** [Especificar el uso de mocks locales (`src/app/core/testing/mock-data.ts`) para desarrollo. Prohibido conectar a RTDB de producción (`katzen-a0e3e`).]

- **Patrones UI Reutilizados:** [Indicar qué modales, alertas, toasts o componentes de Angular 17 del sistema existente se emplearán — referencia: `docs/ADMIN-UI-ARCHITECTURE.md`, `src/app/clientes/`.]

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador | sí / no |
| doctor | |
| recepcionista | |

---

## UI (rutas y layout)

- Ruta admin: `/admin/...`
- Patrón: CRUD lista / diálogo / tabs (referencia: `clientes`, `usuarios`)
- KPIs esperados: ...
- Patrones reutilizados: ver sección **Contratos de Datos y UI** arriba

---

## Backend

- [ ] Cloud Function: `nombreFunction` — sí / no
- [ ] Reglas RTDB: sí / no
- [ ] Email / integración externa: ...

---

## Testing mínimo

Ver `tasks.md` sección Testing.

---

## Notas / decisiones

- ...
