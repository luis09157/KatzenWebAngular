# Spec: Enlace portal ↔ cliente clínico (sin duplicar)

**ID:** 047-enlace-portal-cliente-existente  
**Estado:** done (olas 1–3; deploy ola 3 pendiente OK Luis)  
**Fecha:** 2026-08-27  
**Autor:** Luis Alfonso Niño Martínez + agente  
**Relaciona:** 002 (portal usuarios), 013 (registro landing), 038 (Resend), 012 (dual)

---

## Problema

La clínica ya registra dueños y mascotas en `Katzen/Cliente` / `Mascota` cuando vienen a consulta (data interna). El portal debe mostrar **esas** mascotas, vacunas, recordatorios, etc.

Hoy:
- **Admin** puede provisionar portal sobre un cliente existente (bien), pero el flujo vive sobre todo en Usuarios — poco visible en la **ficha del cliente**.
- **Landing** (`registerPortalOwner`) **siempre crea un Cliente nuevo** → riesgo alto de **duplicar** dueños ya cargados.

Objetivo: **una sola ficha de dueño**; la cuenta Auth se **enlaza** a esa ficha (staff desde perfil, o dueño desde landing con match seguro).

---

## Principios

1. Un dueño clínico = un `clienteId`. Portal = Auth + `AuthPerfiles.clienteId` + `Cliente.authUid` / `portalActivo`.
2. Password temporal **solo servidor + correo**; staff **nunca** la ve ni se guarda en RTDB.
3. Matching de self-reg en **Cloud Function** (no filtrar padrón al browser público).
4. Cambios RTDB **aditivos**; no romper app móvil.

---

## User stories

### US-1 — Acceso portal desde ficha del cliente (ola 1)

Como **staff en Clientes**  
Quiero **ver el estado del portal y activar / reenviar acceso desde el detalle del dueño**  
Para **no ir a Usuarios y entender si ya puede entrar al portal**

**Criterios:**

- [ ] SC-001: En detalle cliente (`modoVer`): bloque «Acceso al portal» con estado Sin portal / Sin correo / Activo / Desactivado.
- [ ] SC-002: Con correo válido y sin portal activo → botón «Enviar acceso al portal» → `provisionPortalClient` · loading · éxito sin password en UI.
- [ ] SC-003: Con portal activo → «Reenviar acceso» → `resendPortalClientAccess` (misma regla de permisos que Usuarios).
- [ ] SC-004: Sin correo → CTA claro: agregar correo en Editar (no inventar mail).
- [ ] SC-005: Chip/badge opcional en listado clientes (Portal / Sin portal) sin romper tabla.

### US-2 — Self-reg vincula cliente existente por correo (ola 2)

Como **dueño en la landing**  
Quiero **registrarme y, si ya existo en la clínica con el mismo correo, usar esa ficha**  
Para **ver mis mascotas reales y no crear un doble registro**

**Criterios:**

- [x] SC-006: `registerPortalOwner`: si existe `Cliente` activo con mismo correo **sin** portal (o portal inactivo sin auth usable) → **vincular** Auth a ese `clienteId` (no crear Cliente nuevo). *(código listo; deploy pendiente T-022)*
- [x] SC-007: Si correo ya tiene portal activo / Auth → error claro (como hoy). *(código)*
- [x] SC-008: Si no hay match → crear Cliente nuevo (comportamiento actual). *(código)*
- [x] SC-009: Password nunca en response; correo vía Resend; rate-limit se mantiene. *(código)*

### US-3 — Match medio teléfono + confirmación (ola 3)

Como **dueño**  
Quiero **confirmar “¿eres el dueño de [mascota(s)]?”** cuando el match es por teléfono/nombre  
Para **evitar unir cuentas equivocadas**

**Criterios:**

- [x] SC-010: Match solo teléfono / nombre+mascota → pantalla de confirmación (no auto-vínculo). Correo (ola 2) sí auto-vincula (umbral alto).
- [x] SC-011: Rechazo → crea ficha nueva (`skipPhoneMatch`). Cancelar aborta. Ambiguo tras mascota → contactar clínica (no alta ciega).

---

## Fuera de alcance (047)

- Fusión masiva de duplicados ya creados (herramienta aparte).
- Cambiar reglas dual staff (012).
- Dominio Resend / FROM (038 fase B).
- App móvil nativa.

---

## Contratos de Datos y UI (Obligatorio)

### RTDB / Auth (aditivo)

| Nodo | Lectura | Escritura | Notas |
|------|---------|-----------|-------|
| `Katzen/Cliente/{id}` | staff / dueño propio | staff / Functions | reusa `authUid`, `portalActivo`, `portalEmail`, …; opcional `portalLinkedFrom: 'admin'\|'self_register_match'\|'self_register_match_phone'\|'self_register_new'`; opcional `telefonoNorm` (10 dígitos MX) |
| `Katzen/AuthPerfiles/{uid}` | staff / self | Functions | `clienteId` apunta a ficha clínica |
| `Katzen/Mascota` | sin cambio de esquema | — | se ven en portal por `idCliente`/`cliente_id` |
| `Katzen/PortalRegistroRate` | Functions | Functions | sin cambio |

**App móvil:** campos nuevos opcionales; no renombrar nodos.

### Matching ola 2 (servidor) — correo = auto-vínculo

1. Normalizar correo (trim, lower).
2. Buscar Cliente `activo !== false` con mismo `correo` (o `portalEmail`).
3. Si `portalActivo === true` y `authUid` → error duplicado.
4. Si hay ficha sin portal usable → provision Auth sobre **ese** id (misma lógica que `provisionPortalClient` interno).
5. Si ninguna → pasar a ola 3 (teléfono) o alta Cliente nueva (013).

### Matching ola 3 (servidor) — teléfono = sugerir + confirmar

1. Normalizar teléfono a 10 dígitos MX (`+52`, espacios, 044/045).
2. Candidatos linkables con el mismo número. Mascota opcional para desambiguar.
3. **Nunca** crear Auth en este paso: return `needsConfirmation` o `needsPetName`.
4. Segundo llamado con `confirmClienteId` revalida teléfono. `skipPhoneMatch` → ficha nueva.
5. Copy landing distinto si `matchKind === 'phone'`.

### UI

- Detalle cliente: sección portal (chip + botones).
- Landing: copy si se vinculó por **correo** (“Encontramos tu ficha…”) o por **teléfono** (“Confirmamos tu ficha…”).
- Campo opcional mascota + hint: no unimos a ciegas; Swal Sí / ficha nueva / Cancelar.
- Loading contextual; errores vía `ErrorMessagesService`.

### Mitigación / Rollback

- Ola 1: solo UI → revertir componente diálogo.
- Ola 2: revert callable; no borra Clientes; Auth creadas quedan (desactivar portal si hace falta).
- Ola 3: revert callable (preview no escribe Auth; confirmaciones ya hechas se desactivan portal a mano). `telefonoNorm` opcional no rompe móvil.
- No `firebase deploy` sin OK Luis.

---

## Roles

| Acción | Quién |
|--------|-------|
| Enviar / reenviar desde ficha | Mismos permisos que callables actuales (admin / staff clínica según 002–013) |
| Self-reg + vínculo | Público rate-limited |

---

## UI rutas

- `/admin/clientes` — detalle / listado (ola 1)
- Landing registro portal (ola 2)
- Sin ruta admin nueva

---

## Testing

- Build + smoke ficha cliente (estados portal).
- Emuladores / mocks para match correo (ola 2) y teléfono (ola 3); no prod desde agente.
- Unit: `functions/test/portal-phone-match.util.test.js`.
- Registrar en `tasks.md` antes de marcar done.
