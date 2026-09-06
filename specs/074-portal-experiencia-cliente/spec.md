# Spec: Portal — experiencia de dueño

**ID:** 074-portal-experiencia-cliente  
**Estado:** in_progress  
**Fecha:** 2026-09-04  
**Autor:** Agente (pedido de Luis Alfonso Niño Martínez)  
**Nivel:** L2 (UI/lógica portal + landing; sin rules nuevas; sin wizard de cita)

---

## Problema

El dueño llega a la landing y al portal, pero el camino «soy cliente → ver a mis perros → cuándo los bañaron / próxima vacuna → avisos» no se siente claro ni completo:

1. El menú mezcla staff y dueño; el login habla de credenciales/servidor.
2. El home del portal solo lista mascotas; no anticipa último baño, próxima vacuna ni recordatorio.
3. La cartilla por mascota es un grid de secciones; los baños existen en routing (`/banos`) y mapper, pero no destacan en un timeline.
4. «Activar avisos» está enterrado en perfil; el inbox vacío no invita a activarlos; si el SW/token falla, el copy suena a Firebase.
5. Hay CTAs de «Agendar» en landing que suenan a alta en línea. **Hoy no hay agendar por dueño.**

---

## User stories

### US-1 — Landing y login de dueño

Como **dueño de mascota**  
Quiero **encontrar «Soy cliente / Entrar al portal» sin confundirme con el personal**  
Para **entrar a ver a mis mascotas**

**Criterios de aceptación:**

- [ ] SC-001: Navbar y menú móvil muestran **Soy cliente** / **Entrar al portal** (tap ≥ 44px en móvil). El acceso staff queda aparte (footer / línea «¿Eres personal?»), no como CTA principal.
- [ ] SC-002: Login portal (pantalla y modal landing): copy humano; errores con qué hacer (correo/contraseña, portal inactivo → llama a la clínica, cuenta de personal → Acceso staff). Sin jerga Firebase/claims/token.
- [ ] SC-003: CTAs cuyo texto es «Agendar» / «Agendar cita» en landing quedan **ocultos** (`*ngIf="false"` + comentario spec 074). Se conserva «Contactar» / WhatsApp / teléfono. No se borra routing.

### US-2 — Home y cartilla

Como **dueño**  
Quiero **ver «Tus mascotas» con chips de última actividad y, al entrar, una cartilla cronológica con baños**  
Para **saber cuándo bañaron a los perros y el resto del expediente**

**Criterios de aceptación:**

- [ ] SC-004: Home `/portal/mascotas`: título «Tus mascotas»; cada tarjeta muestra chips (último baño, próxima vacuna, recordatorio) si hay dato.
- [ ] SC-005: Detalle de mascota: cartilla cronológica (baño, vacuna, cita, historial, recordatorio, pensión, visita). Baño muestra fecha y tipo. `oculto_portal` / `ocultoPortal` sigue ocultando historial (y cualquier registro con esa bandera).
- [ ] SC-006: Listado `/mascotas/:id/banos` sigue usando `mapBanio` (sin costos/caja). Query portal por `paciente_id` y, si hay `clienteId`, también `cliente_id` (rules actuales).

### US-3 — Avisos FCM / PWA

Como **dueño**  
Quiero **activar avisos con un CTA visible y mensajes humanos si falla**  
Para **enterarme de refuerzos D-7/D-0 y avisos de la clínica**

**Criterios de aceptación:**

- [ ] SC-007: Perfil: bloque «Activar avisos» destacado (no un renglón al final).
- [ ] SC-008: `/portal/notificaciones` vacío: CTA a activar avisos. Si SW/token/permiso falla: copy humano; en iPhone: «Compartir → Añadir a inicio, luego Activar avisos». Sin «FCM», «token», «VAPID» ni «Firebase» en UI.
- [ ] SC-009: No hay backend FCM nuevo. Se reutilizan `PortalFcmService`, SW y scheduler 052 (D-7/D-0).

### US-4 — Citas solo lectura

Como **dueño**  
Quiero **ver mis citas próximas y pasadas, y saber cómo pedir una**  
Para **no creer que puedo agendar en línea**

**Criterios de aceptación:**

- [ ] SC-010: Citas portal: read-only, próximas / pasadas. Banner: «Para agendar, llama a la clínica» + teléfono (environment / landing; `Katzen/Config/clinica` no es legible por cliente hoy — ver notas).
- [ ] SC-011: Cero UI de alta/solicitud de cita. Flag `PORTAL_CITA_SOLICITUD_ENABLED = false`. Si existe botón, `*ngIf` del flag + comentario 074.

---

## Fuera de alcance

- Wizard / formulario de solicitud de cita.
- Nodo RTDB `CitasSolicitud` (solo documentado abajo).
- Cambiar `database.rules.json` para que el cliente lea `Config/clinica` (L3).
- Deploy functions FCM / Resend / Hosting.
- App móvil nativa.

---

## Contratos de Datos y UI

- **Impacto en Firebase RTDB:** ninguno en esta entrega. Lectura de nodos ya permitidos al cliente (`Mascota`, `Banios`, `Vacunas`, `Citas`, `Historiales_Clinicos` sin `oculto_portal`, `Recordatorios`, `Pension/Estancias`, `Visitas`, `Consentimientos`, `Notificaciones/{clienteId}`, `FcmTokens` propio). Escritura: solo `Notificaciones/.../leida` y token FCM existente.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Banios` | client query `paciente_id` / `cliente_id` | no | mapper sin costos |
  | `Katzen/Notificaciones/{clienteId}` | client propio | `leida: true` | inbox |
  | `Katzen/FcmTokens/{uid}` | self | self (token) | existente 023 |
  | `Katzen/Config/clinica` | **no client** | staff | teléfono portal = environment/landing |
  | `Katzen/CitasSolicitud` | — | — | **solo spec, no implementar** |

- **Estrategia de prueba:** emulador / mocks (`src/app/core/testing/mock-data.ts`). Seed típico `cliente@katzen.test`. Prohibido prod `katzen-a0e3e`.
- **Patrones UI:** shells portal (`.portal-login-wrap`, `.portal-page`, `.portal-btn`); landing existente; toasts Swal; sin librerías nuevas.

---

## Futuro — citas validadas (NO implementar)

Cuando la clínica esté lista, el dueño **pide** y las doctoras **validan** antes de que exista una cita en `Katzen/Citas`.

```
Dueño → solicitud (portal)
     → Katzen/CitasSolicitud/{id}
        estado: pendiente_validacion
     → vet confirma en admin
     → se crea Katzen/Citas (pendiente/confirmada)
     → o rechaza (motivo visible al dueño)
```

**Propuesta de nodo (aditivo, L3 futuro):**

| Campo | Tipo | Notas |
|-------|------|--------|
| `cliente_id`, `paciente_id` | string | dueño + mascota |
| `fecha_solicitada`, `hora_solicitada` | string | preferencia, no slot bloqueado |
| `motivo` | string | texto dueño |
| `estado` | enum | `pendiente_validacion` \| `confirmada` \| `rechazada` \| `cancelada_dueño` |
| `cita_id?` | string | set al confirmar |
| `motivo_rechazo?` | string | visible portal |
| `creado_en`, `decidido_por_uid?` | string | auditoría |

Rules futuras: client create solo su `clienteId`; write de estado solo staff/Functions. Encender UI con `PORTAL_CITA_SOLICITUD_ENABLED = true` + spec nueva.

---

## FCM — qué sigue dependiendo de Luis

El código de token + inbox + scheduler D-7/D-0 **ya existe** (023 / 052). Esta spec solo arregla UX y copy.

| Dependencia | Quién | Por qué |
|-------------|-------|---------|
| iOS Safari | Luis / dueño | Push web exige PWA (Compartir → Inicio). Sin eso el permiso/token falla. |
| Deploy scheduler `onVacunaPushSchedule` | Luis | Functions FCM; el agente no despliega. |
| Resend / DNS | Luis | Correo de acceso y recordatorios por mail (038). Push ≠ correo. |
| VAPID en Console | ya en `environment` | Si se rota, actualizar ambos environments. |
| `Config/clinica.telefono` al dueño | L3 + Luis | Hoy rules bloquean lectura client; el banner usa teléfono de landing. |

---

## Roles

| Rol | ¿Accede? |
|-----|----------|
| Cliente portal | sí (superficie de esta spec) |
| Dual | portal con atajo admin si la sesión no está locked |
| Staff | landing «Acceso staff» aparte; no usa este dashboard |

---

## UI (rutas)

- `/` landing — CTAs dueño vs staff; sin «Agendar» self-serve
- `/portal/login` — Soy cliente / Entrar al portal
- `/portal/mascotas` — Tus mascotas + chips
- `/portal/mascotas/:id` — cartilla + secciones
- `/portal/mascotas/:id/citas` — read-only + banner teléfono
- `/portal/notificaciones`, `/portal/perfil` — activar avisos

---

## Backend

- [ ] Cloud Function nueva — **no**
- [ ] Reglas RTDB — **no**
- [ ] Email / FCM nuevo — **no**

---

## Testing mínimo

Ver `tasks.md`. Unit tests de cartilla (baño visible), flag de solicitud oculta, copy FCM humano. `npm run build` exit 0. Smoke 375 / 1280.

---

## Notas / decisiones

- Teléfono clínica en portal: `environment.clinicaTelefonoDisplay` (mismo 81 3602 4090 de landing). No leer Config hasta L3.
- Copy destructivo admin no aplica. Loading portal: spinners locales existentes.
- Specs relacionadas: 013 login/registro, 023/052 FCM+PWA, 028 baños portal, 033/052 vacunas, 038 Resend, 047 vínculo ficha, 060 modal landing.
