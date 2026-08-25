# Spec: Baseline — KatzenVet Web

**ID:** 001-baseline  
**Estado:** done  
**Fecha:** 2026-08-25  

---

## Producto

Sistema web para clínica veterinaria KatzenVet:

1. **Landing** (`/`) — marketing y contacto
2. **Admin** (`/admin/*`) — staff clínica
3. **Portal** (`/portal/*`) — dueños de mascotas

---

## Módulos admin actuales

| Ruta | Módulo | Roles típicos |
|------|--------|---------------|
| `/admin/inicio` | Dashboard | todos staff |
| `/admin/clientes` | Clientes CRUD | admin, doctor, recepcionista |
| `/admin/paciente` | Expediente búsqueda | doctor, recepcionista, peluquero |
| `/admin/pacientes-admin` | Alta pacientes | doctor, recepcionista |
| `/admin/citas` | Citas | doctor, recepcionista |
| `/admin/historiales` | Historial clínico | doctor |
| `/admin/vacunas` | Vacunas | doctor |
| `/admin/recordatorios` | Recordatorios | doctor, recepcionista |
| `/admin/banios` | Peluquería/baños | doctor, recepcionista, peluquero |
| `/admin/inventario/*` | Inventario | administrador |
| `/admin/usuarios` | Staff + portal clientes | administrador |
| `/admin/contactos-web` | Leads landing | admin, recepcionista |

---

## Auth

- Firebase Auth email/password
- Claims desde `Katzen/AuthPerfiles` + `syncMyClaims`
- Guards: `AuthGuard`, `StaffRoleGuard`, `PortalAuthGuard`
- Sesión persistente opcional (7 días)

---

## RTDB principal

```
Katzen/
  Cliente, Mascota, Citas, Historiales_Clinicos, Vacunas,
  Recordatorios, Usuarios, AuthPerfiles, Inventario/...,
  ContactosWeb, PortalProvisionLog, ...
```

---

## Testing baseline

- Cypress admin autenticado: 48 tests (`npm run e2e`)
- Build producción: `npm run build`

---

## Referencias

- `README.md`
- `docs/ADMIN-UI-ARCHITECTURE.md`
- `AGENTS.md`
