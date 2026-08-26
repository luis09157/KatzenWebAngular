# Spec: Acceso admin unificado para todo staff

**ID:** 011-staff-acceso-admin-unificado  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** agente (política Luis Alfonso Niño Martínez)

---

## Problema

La spec 008 restringió writes RTDB y módulos UI por `staffRole` (doctor sin inventario, recepcionista sin historiales, peluquero solo baños).  
Luis cambió la política de negocio: los **roles staff deben existir** (identidad/organización), pero **cualquier staff** (excepto portal cliente) debe operar el panel admin completo.

---

## User stories

### US-1 — Staff con acceso admin completo

Como **empleado de la clínica (cualquier rol staff)**  
Quiero **entrar a inventario, citas, historiales, pacientes, etc.**  
Para **operar la clínica sin bloqueos por rol de UI/RTDB**

**Criterios de aceptación:**

- [x] SC-001: `STAFF_MODULE_ACCESS` da `*` a administrador, doctor, recepcionista, peluquero
- [x] SC-002: `database.rules.json` write operativo = `auth.token.role != 'client'` (sin matriz staffRole)
- [x] SC-003: `Usuarios` / `AuthPerfiles` write sigue solo administrador
- [x] SC-004: Portal client sigue restringido a lectura propia / sin write clínico
- [x] SC-005: Cypress roles smoke espera ALLOW / módulos visibles (no DENIED inventario)

---

## Fuera de alcance

- Rol `super_admin` / dueño
- Cambiar callables `provisionStaffUser` (siguen exigiendo admin)
- Gate app de ajuste inventario supervisor (admin/doctor) — opcional futuro

---

## Contratos de Datos y UI (Obligatorio)

- **Impacto en Firebase RTDB:** Solo expresiones `.write`. Sin renombrar nodos. App móvil: staff con `role != 'client'` escribe operativo como pre-008.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | Operativo (Citas, Historiales, Inventario, Vacunas, …) | sin cambio | cualquier staff | revert 008 granular |
  | `Usuarios` / `AuthPerfiles` | sin cambio | solo administrador | provision staff |
  | `PortalProvisionLog` | staff | false (Functions) | sin cambio |
  | Portal client | datos propios | clínico no | sin cambio |

- **Estrategia de Datos de Prueba:** Cypress + script smoke roles; no passwords en repo.
- **Patrones UI:** sin cambio de layout; menú muestra todos los módulos a todo staff.

---

## Roles

| Rol | Módulos UI | Write RTDB operativo | Write Usuarios/AuthPerfiles |
|-----|------------|----------------------|-----------------------------|
| administrador | todos | sí | sí |
| doctor | todos | sí | no |
| recepcionista | todos | sí | no |
| peluquero | todos | sí | no |
| portal client | N/A (portal) | no clínico | no |

**Decisión documentada:** Usuarios/AuthPerfiles write = solo administrador (recomendado e implementado).

---

## Backend

- [x] Reglas RTDB simplificadas
- [x] Deploy database (autorizado por cambio de política)

---

## Notas

- Spec 008 queda **supersedida** en la parte granular por rol; se conserva como histórico.
- Roles siguen en Auth/Usuarios para identidad y futuros reportes.
- Continuación perfiles dual / dueñas: `specs/012-perfiles-dual-y-duenas/`.
