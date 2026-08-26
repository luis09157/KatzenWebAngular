# Spec: Permisos RTDB granulares por rol

**ID:** 008-rtdb-permisos-granulares  
**Estado:** done (histórico; **supersedida** en granularidad por `011-staff-acceso-admin-unificado`)  
**Fecha:** 2026-08-25  
**Autor:** agente (autorizado Luis Alfonso Niño Martínez)

> **2026-08-26:** Luis unificó acceso admin para todo staff. Ver `specs/011-staff-acceso-admin-unificado/`. Esta spec queda como registro de la matriz granular previa.

---

## Problema

La UI restringe módulos por `staffRole` (`staff-role.config.ts`), pero las reglas RTDB permitían write a cualquier staff (`role != 'client'`). Un recepcionista o peluquero podía modificar historiales/inventario vía cliente Firebase directo (AUDIT #1).

---

## User stories

### US-1 — Escrituras clínicas acotadas

Como **administrador de seguridad**  
Quiero **que historiales, vacunas e inventario respeten el rol en claims**  
Para **cerrar la brecha UI vs backend**

**Criterios de aceptación:**

- [x] SC-001: Write `Historiales_Clinicos` / `Vacunas` / catálogos clínicos solo admin|doctor (o fallback sin `staffRole`)
- [x] SC-002: Write `Inventario` solo admin|admin alias (o fallback)
- [x] SC-003: Write operativo (Cliente, Mascota, Citas, Recordatorios) admin|doctor|recepcionista
- [x] SC-004: Write Banios/Peluqueros admin|doctor|recepcionista|peluquero
- [x] SC-005: Nodos legacy móvil (`Producto`, `Productos`, `Venta`, `Gasolina`, `Campaña`) sin restricción nueva por rol
- [x] SC-006: Si `auth.token.staffRole` ausente → fallback seguro (comportamiento previo: cualquier staff)

---

## Fuera de alcance

- Deploy de `database` a producción sin confirmación adicional (rules en repo; deploy pendiente)
- Tests unitarios `@firebase/rules-unit-testing` (no existe en repo; plan documentado)
- Rol `super_admin` / dueño

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Solo cambian expresiones `.write` / índices aditivos (`cliente_id` en Mascota). Sin renombrar/eliminar nodos. App móvil: si claims tienen `staffRole`, aplica matriz; si no, fallback legacy.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Historiales_Clinicos` | sin cambio | admin/doctor (+fallback) | AUDIT #1 |
  | `Katzen/Inventario` | sin cambio | admin (+fallback) | |
  | `Katzen/Producto(s)` | sin cambio | staff genérico | móvil |

- **Estrategia de Datos de Prueba:** mocks / emulador; no RTDB prod para pruebas del agente.
- **Patrones UI:** N/A (solo rules).

---

## Roles

| Rol staff | Write clínico | Inventario | Ops | Baños |
|-----------|---------------|------------|-----|-------|
| administrador | sí | sí | sí | sí |
| doctor | sí | no | sí | sí |
| recepcionista | no | no | sí | sí |
| peluquero | no | no | no | sí |
| sin staffRole | sí (fallback) | sí (fallback) | sí | sí |

---

## Backend

- [x] Reglas RTDB: `database.rules.json`
- [ ] Deploy database: **pendiente** (riesgo móvil; confirmar con Luis)

---

## Notas / decisiones

- Preferir `auth.token.staffRole` (sincronizado por `syncMyClaims` / `onAuthPerfilWrite`).
- Fallback sin claim = no romper móvil legacy.
- **NO desplegar rules** hasta smoke staff+portal+móvil o confirmación explícita.
