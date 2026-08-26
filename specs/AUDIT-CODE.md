# Auditoría técnica de código — KatzenWebAngular

**Fecha:** 2026-08-25  
**Alcance:** código en `/Users/luisnino/Documents/GitHub/KatzenWebAngular`  
**Build al auditar:** `npm run build` exitoso — bundle inicial ~1.97 MB raw / ~398 KB gzip, sin warnings de compilación visibles.  
**Origen:** auditoría técnica integral (subagent `2d8c69b0`), alineada con `specs/memory/domain-context.md`, `specs/memory/constitution.md` y `AGENTS.md`.

> **Documento vivo:** actualizar este archivo tras implementar fixes. Marcar ítems resueltos con fecha y referencia a spec/PR. No eliminar hallazgos históricos — añadir columna o nota de estado.

---

## Resumen ejecutivo

KatzenVet Web tiene una base sólida: Angular 17 lazy-loaded, guards de auth/roles en frontend, Cloud Functions con patrón `isCallerAdmin`, transacciones RTDB en inventario (salidas) y arquitectura admin documentada (`docs/ADMIN-UI-ARCHITECTURE.md`) mayormente respetada.

**Actualización 2026-08-26 (política 011):** el negocio unificó acceso admin para **todo staff**; la “brecha” UI vs RTDB de 008 dejó de ser el modelo deseado. UI y rules operativas alinean en `role != 'client'`. Provision `Usuarios`/`AuthPerfiles` sigue solo administrador. Ver `specs/011-staff-acceso-admin-unificado/`.

Varias **reglas de negocio confirmadas** en `domain-context.md` siguen sin implementar: cascada de baja de cliente, registro self-service portal y UI perfil dual. Resueltas recientemente: agenda citas (003), revocación portal (006), política mermas MVP (007).

Hay **deuda técnica acumulada**: servicios que cargan colecciones RTDB completas, ~50+ usos de `any`, métodos legacy con `.remove()`, `mock-data.ts` sin adopción real, y Cypress concentrado en admin smoke sin cobertura portal/inventario.

El build compila limpio; el riesgo principal no es compilación sino **consistencia dominio ↔ código ↔ reglas RTDB** y escalabilidad de queries RTDB.

---

## Hallazgos por severidad

### 🔴 Crítico (seguridad / datos / producción)

#### 1. ~~RTDB no discrimina por `staffRole` — brecha UI vs backend~~ ✅ → **supersedido 011**

**Archivos:** `database.rules.json`, `src/app/core/config/staff-role.config.ts`  
**Estado 008:** Implementado granular por `staffRole` en repo.  
**Estado 011 (2026-08-26):** Política de negocio — todo staff con acceso admin operativo; rules simplificadas a `role != 'client'`; UI `STAFF_MODULE_ACCESS` = `*` para doctor/recepcionista/peluquero. Admin-only: Usuarios/AuthPerfiles. Spec: `011-staff-acceso-admin-unificado`.  
**Esfuerzo:** L → cerrado por cambio de política

#### 2. Reglas portal `Mascota` solo indexan/validan `idCliente`, no `cliente_id`

**Archivos:** `database.rules.json` (L17–24), `src/app/portal/services/portal-data.service.ts` (L28–38)  
**Descripción:** El portal consulta por `idCliente` y `cliente_id`, pero las reglas de lectura client solo autorizan query `orderByChild('idCliente')`. Mascotas legacy con solo `cliente_id` pueden fallar en lectura RTDB desde el portal nativo.  
**Recomendación:** Añadir `.indexOn: ["cliente_id"]` y ampliar reglas de query/read para ambos campos (aditivo, compatible móvil).  
**Esfuerzo:** M

#### 3. ~~Desactivar portal no revoca sesiones activas inmediatamente~~ ✅

**Archivos:** `functions/src/index.ts` (`deactivatePortalClient`)  
**Estado:** **Resuelto** en `specs/006-revocacion-sesiones-portal/` — `revokeRefreshTokens(uid)` tras `disabled: true`; si revoke falla se reporta `failed-precondition` sin rollback de disabled.  
**Deploy:** `functions:deactivatePortalClient` **OK** 2026-08-25.  
**Esfuerzo:** S

#### 4. ~~Movimientos tipo `merma` permiten stock negativo~~ ✅

**Archivos:** `src/app/inventario/inventario.service.ts`, `inventario-stock.util.ts`  
**Estado:** **Resuelto** 2026-08-25 — `specs/007-politica-mermas-inventario/` — `merma` valida stock como `salida`; `registrarMerma` + motivo obligatorio; ajuste con gate supervisor ligero (admin/doctor). Autorización dual formal = SC futuro.  
**Esfuerzo:** M

#### 5. Métodos `.remove()` legacy aún presentes (riesgo de pérdida de datos)

**Archivos:** `src/app/vacunas/vacunas.service.ts` (L129), `src/app/banios/banios.service.ts` (L155), `src/app/pacientes/banios-paciente.service.ts` (L164), `src/app/shared/peluquero.service.ts` (L173)  
**Descripción:** Negocio confirmó baja lógica; la UI usa `bajaLogica*` en la mayoría de flujos, pero los métodos `remove()` siguen exportados y pueden reintroducirse por error o script externo.  
**Recomendación:** Deprecar/eliminar métodos `remove()`, marcar `@deprecated`, añadir regla RTDB que impida delete en nodos auditables (donde sea compatible móvil).  
**Esfuerzo:** M

---

### 🟠 Alto (bugs probables, reglas negocio rotas)

#### 6. Citas: sin validación de solapamiento por veterinario

**Estado:** ✅ Resuelto 2026-08-25 — `specs/003-validacion-agenda-citas/` (`cita-agenda.util.ts` + `CitasService.guardarCita`)

**Archivos:** `src/app/citas/citas.service.ts`, `src/app/citas/cita-dialog.component.ts`  
**Descripción:** No hay chequeo de conflicto horario por vet ni campo `duracion_minutos` (default 30 min confirmado). Doble booking del mismo veterinario es posible.  
**Recomendación:** Validar en `guardarCita()` contra citas activas del mismo `veterinario` + ventana `[fecha, fecha+duracion]`.  
**Esfuerzo:** M

#### 7. Citas: `veterinario` no es obligatorio

**Estado:** ✅ Resuelto 2026-08-25 — `specs/003-validacion-agenda-citas/`

**Archivos:** `src/app/citas/cita-dialog.component.ts` (L143)  
**Descripción:** Campo sin `Validators.required`; domain-context exige un veterinario por cita.  
**Recomendación:** `Validators.required` + validación en servicio antes de persistir.  
**Esfuerzo:** S

#### 8. Citas: fechas pasadas bloqueadas para todos los roles

**Estado:** ✅ Resuelto 2026-08-25 — excepción doctor/administrador vía `staffRoleIsVeterinarioOperativo`

**Archivos:** `src/app/citas/cita-dialog.component.ts` (`validarFecha`)  
**Descripción:** Rechaza cualquier fecha `< hoy` sin excepción para veterinarias/admin operativo (decisión #5).  
**Recomendación:** Condicionar validador con `AuthProfileService.getEffectiveStaffRole()` (doctor/admin).  
**Esfuerzo:** S

#### 9. Citas canceladas sin `motivo_cancelacion` obligatorio

**Estado:** ✅ Resuelto 2026-08-25 — dialog + menú cancelar + portal

**Archivos:** `src/app/citas/citas.component.ts`, `src/app/citas/cita-dialog.component.html`, portal mapper/list  
**Descripción:** Se puede pasar a `cancelada` sin capturar motivo; portal no muestra motivo (`portal-mapper.util.ts`, `portal-list-section.component.html`).  
**Recomendación:** Diálogo obligatorio al cancelar; persistir campo; mostrarlo en portal.  
**Esfuerzo:** M

#### 10. Revertir completada → confirmada sin control de rol

**Estado:** ✅ Resuelto 2026-08-25 — UI + validación en servicio

**Archivos:** `src/app/citas/citas.component.html`, `citas.service.ts`  
**Descripción:** Menú visible para cualquier staff con acceso al módulo; negocio limita a veterinarias/perfil veterinario (#3).  
**Recomendación:** Ocultar acción según rol + validar en servicio.  
**Esfuerzo:** S

#### 11. Baja de cliente sin cascada

**Archivos:** `src/app/clientes/clientes.service.ts` (`bajaLogicaCliente`, L111–116)  
**Descripción:** Solo marca cliente inactivo + `portalActivo: false`; no desactiva mascotas, citas futuras ni revoca Auth en cascada (decisión #22).  
**Recomendación:** Callable admin `deactivateClienteCascade` o transacción multi-nodo con Cloud Function.  
**Esfuerzo:** M

#### 12. `syncMyClaims` en cada navegación admin/portal

**Archivos:** `src/app/auth/auth.guard.ts`, `src/app/portal/guards/portal-auth.guard.ts`  
**Descripción:** Callable en cada `canActivate` → latencia + costo Functions; claims ya sincronizan vía trigger `onAuthPerfilWrite`.  
**Recomendación:** Sync solo en login y tras operaciones que cambien perfil; cache con TTL en sesión.  
**Esfuerzo:** M

#### 13. Queries RTDB de colección completa en servicios críticos

**Archivos:** `src/app/citas/citas.service.ts` (`getCitas`), `src/app/clientes/clientes.service.ts` (`getClientes`), `src/app/inventario/inventario.service.ts` (`getTodosLosMovimientos`, `getMovimientosPorProducto`)  
**Descripción:** `snapshotChanges()` sobre nodos enteros; usado en listas, KPIs y diálogos (8+ diálogos llaman `getClientes()` completo). Escala mal con volumen clínico real.  
**Recomendación:** Extender patrón `RtdbPagedListService` (ya usado en clientes paginados) a citas/movimientos; queries `orderByChild` + índices.  
**Esfuerzo:** L

#### 14. Cobertura E2E portal casi inexistente

**Archivos:** `cypress/e2e/admin-smoke.cy.ts` (solo carga login portal), resto de specs admin  
**Descripción:** No hay flujos E2E de login portal autenticado, mascotas, notificaciones, cambio de contraseña, ni inventario.  
**Recomendación:** Specs Cypress portal con mocks/emuladores; ampliar `cy:admin` o crear `cy:portal`.  
**Esfuerzo:** M

#### 15. Registro self-service portal — **cerrado en 013**

**Archivos:** `specs/013-registro-portal-cliente-landing/`, `registerPortalOwner`, landing modal  
**Estado:** implementado overnight 2026-08-26. Operativo: configurar `RESEND_API_KEY` para self-reg y correos admin.  
**Esfuerzo:** L → hecho

---

### 🟡 Medio (deuda técnica, mantenibilidad)

#### 16. Componentes monolíticos

**Archivos:** `src/app/pacientes/pacientes.component.ts` (961 líneas), `src/app/vacunas/vacuna-dialog.component.ts` (705), `src/app/historiales/historial-dialog.component.ts` (481)  
**Descripción:** Mezclan tabs, CRUD, diálogos y lógica de negocio; difícil testear y mantener.  
**Recomendación:** Extraer sub-componentes por tab (vacunas, historial, baños) y facades de servicio.  
**Esfuerzo:** L

#### 17. Uso extensivo de `any` (~50 archivos)

**Archivos:** Destacan `pacientes.component.ts` (31), `banios.component.ts` (16), `cita-dialog.component.ts` (11)  
**Descripción:** Pierde type-safety; errores de campo legacy (`idCliente`/`cliente_id`) no se detectan en compile.  
**Recomendación:** Tipar contra `core/models.ts` e `inventario.models.ts`; habilitar `strict` incremental.  
**Esfuerzo:** M

#### 18. `console.log` en servicios de producción

**Archivos:** `citas.service.ts`, `inventario.service.ts`, `clientes.service.ts`, múltiples diálogos  
**Descripción:** Logs verbosos con emojis en paths calientes; ruido en consola y posible filtración de datos en prod.  
**Recomendación:** Usar `LoggerService` con niveles; eliminar logs de debug en servicios.  
**Esfuerzo:** S

#### 19. Suscripciones sin `takeUntil` en diálogos

**Archivos:** `src/app/citas/cita-dialog.component.ts` (3 subscribes sin destroy), varios diálogos de selección de cliente  
**Descripción:** Riesgo de leak si el diálogo se abre/cierra repetidamente en la misma sesión.  
**Recomendación:** Patrón `destroy$` estándar en todos los diálogos con subscribe.  
**Esfuerzo:** S

#### 20. Inventario alertas fuera del design system admin

**Archivos:** `src/app/inventario/alertas/alertas.component.html` (`.alertas-container`, no `admin-page`)  
**Descripción:** Inconsistente con `docs/ADMIN-UI-ARCHITECTURE.md` y smoke Cypress (`.alertas-container`).  
**Recomendación:** Refactor a `admin-page` + KPI grid + data panel.  
**Esfuerzo:** M

#### 21. Órdenes de compra: transición borrador → enviada sin autorización vet

**Archivos:** `src/app/inventario/inventario.service.ts`, `src/app/inventario/ordenes/ordenes.component.ts`  
**Descripción:** Decisión #14 (solo veterinarias autorizan envío) no implementada; no hay flujo explícito de “enviar”.  
**Recomendación:** Acción “Enviar orden” con guard de rol + estado en servicio.  
**Esfuerzo:** M

#### 22. Mascota `Fallecido` no archiva recordatorios automáticamente

**Archivos:** `src/app/pacientes-admin/paciente-admin-dialog.component.ts` (valida fecha fallecimiento), sin trigger en `recordatorios.service.ts`  
**Descripción:** Decisión #11 confirmada; solo se filtra Fallecido en diálogos de selección.  
**Recomendación:** Al guardar estado Fallecido, batch update recordatorios `activo: false`.  
**Esfuerzo:** M

#### 23. `mock-data.ts` sin uso en el codebase

**Archivos:** `src/app/core/testing/mock-data.ts`  
**Descripción:** Archivo creado para SDD pero ningún componente/servicio lo importa aún; workflow SDD incompleto en práctica.  
**Recomendación:** Integrar en specs unitarios y harness de desarrollo; documentar en `AGENTS.md`.  
**Esfuerzo:** S

#### 24. Perfil dual sin selector post-login

**Archivos:** `src/app/portal/services/portal-auth.service.ts`, `src/app/core/services/auth-profile.service.ts` (`isDual`)  
**Descripción:** Caso real confirmado (#17); staff+cliente redirige a admin o portal sin elegir contexto.  
**Recomendación:** Pantalla `/auth/contexto` cuando `dualAccess === true`.  
**Esfuerzo:** M

#### 25. `clearMustChangePassword` sin verificar rol client

**Archivos:** `functions/src/index.ts` (L608–625)  
**Descripción:** Cualquier usuario autenticado puede invocar el callable; impacto bajo pero inconsistente con least privilege.  
**Recomendación:** Validar `role === 'client'` o presencia de `clienteId` en claims.  
**Esfuerzo:** S

---

### 🟢 Bajo (nice-to-have, polish)

#### 26. Bundle principal grande (~1.75 MB raw)

**Archivos:** `angular.json`, lazy chunks  
**Descripción:** Main chunk concentra Firebase + Material + SweetAlert2; lazy loading ayuda pero main sigue pesado.  
**Recomendación:** Analizar `ng build --stats-json`; lazy-load SweetAlert2; tree-shake Material icons.  
**Esfuerzo:** M

#### 27. Autocomplete sin debounce generalizado

**Archivos:** Solo `autocomplete-field.component.ts` y `seleccionar-cliente-*-dialog` usan `debounceTime`  
**Descripción:** Filtros en memoria sobre listas completas; UX lag con datasets grandes.  
**Recomendación:** Debounce 200–300 ms + paginación server-side.  
**Esfuerzo:** S

#### 28. Placeholders analytics sin configurar

**Archivos:** `src/index.html` (`GTM-XXXXXXX`, `G-XXXXXXXXXX`)  
**Descripción:** IDs ficticios; sin impacto funcional pero confuso en prod si no se reemplazan.  
**Recomendación:** Variables de entorno o eliminar hasta tener IDs reales.  
**Esfuerzo:** S

#### 29. Rol `super_admin` / `dueño` documentado pero ausente

**Archivos:** `staff-role.config.ts`, `domain-context.md` §5.1  
**Recomendación:** Implementar cuando haya spec dedicada.  
**Esfuerzo:** M

#### 30. XSS: sin vectores obvios

**Archivos:** codebase Angular (sin `innerHTML`/`bypassSecurityTrust` detectados)  
**Descripción:** Interpolación Angular default es segura; correo portal escapa HTML en `portal-mail.ts`.  
**Recomendación:** Mantener prohibición de `innerHTML`; revisar templates portal con datos RTDB no confiables.  
**Esfuerzo:** S

---

## Top 10 mejoras priorizadas (roadmap sugerido)

| # | Mejora | Impacto | Esfuerzo | Fase sugerida |
|---|--------|---------|----------|---------------|
| 1 | Reglas RTDB granulares por rol/operación (historiales, inventario) | Seguridad crítica | L | Fase 1 |
| 2 | ~~Validación agenda citas~~ — **hecho** `specs/003-validacion-agenda-citas/` | Negocio core | M | ✅ |
| 3 | ~~`revokeRefreshTokens` en desactivar portal~~ | Seguridad sesiones | S | **Hecho** 006 (pendiente deploy) |
| 4 | Política mermas/stock negativo unificada | Integridad inventario | M | Fase 1 |
| 5 | Cascada baja lógica cliente + revocación Auth | Negocio + seguridad | M | Fase 2 |
| 6 | Paginación/queries indexadas (citas, clientes en diálogos, movimientos) | Performance | L | Fase 2 |
| 7 | ~~Motivo cancelación citas + UX portal~~ — **hecho** en 003 | Portal UX / negocio | M | ✅ |
| 8 | Cypress portal + inventario (flujos críticos) | Calidad | M | Fase 2 |
| 9 | Deprecar `.remove()` y alinear baja lógica en todos los módulos | Auditoría datos | M | Fase 3 |
| 10 | Registro self-service portal + UI perfil dual | Producto | L | Fase 3 |

---

## Alineación domain-context vs código (tabla gaps)

| Regla / decisión | Estado en código | Gap |
|------------------|------------------|-----|
| RTDB write operativo | Cualquier staff (`role != 'client'`) | **Alineado** política 011 |
| 1 vet/cita, sin solapamiento, 30 min default | `cita-agenda.util` + servicio | **Hecho** (003) |
| `veterinario` obligatorio por cita | required form + servicio | **Hecho** (003) |
| Fechas pasadas solo veterinarias | excepción doctor/admin | **Hecho** (003) |
| `motivo_cancelacion` obligatorio al cancelar | dialog + menú + servicio | **Hecho** (003) |
| Citas canceladas visibles en portal con motivo | mapper + list-section | **Hecho** (003) |
| Revertir completada → confirmada (solo vets) | UI + servicio | **Hecho** (003) |
| `medico_atendio` obligatorio historial | `Validators.required` en dialog | **Implementado** |
| Notas internas historial (solo staff) | No hay campos | **Pendiente** |
| Baja lógica vacunas (no `remove()`) | UI usa baja lógica; servicio tiene `remove()` | **Parcial** |
| Recordatorios → push Firebase | Sin bridge FCM | **Pendiente** |
| Mascota Fallecido → archivar recordatorios | Solo UI filtros | **Pendiente** |
| Bloqueo stock negativo + merma con motivo | Salida OK; merma tipada con check + motivo (007) | **Hecho (MVP)** |
| Ajuste con autorización supervisor | Sin control de rol | **Pendiente** |
| OC borrador → enviada (solo vets) | Sin flujo/autorización | **Pendiente** |
| Baja cliente en cascada | Solo flags cliente | **Pendiente** |
| Desactivar portal revoca sesiones | `disabled: true` + `revokeRefreshTokens` | **Hecho** (006; pendiente deploy) |
| Registro self-service portal landing | Solo login | **Pendiente** |
| UI perfil dual post-login | Redirección binaria admin/portal | **Pendiente** |
| Rol super_admin / dueño | Documentado, no en config | **Pendiente** |
| Portal lee mascotas legacy `cliente_id` | App sí; rules RTDB no | **Parcial / riesgo** |
| Convivencia nodos legacy `Producto`/`Productos` | Sin UI web; rules abiertas a staff | **OK web**; no tocar sin spec móvil |
| Admin UI unificada | Mayoría módulos OK; alertas inventario diverge | **Parcial** |
| SDD mocks (`mock-data.ts`) | Archivo existe, sin uso | **Parcial** |

---

## Notas adicionales por área auditada

**Cloud Functions:** Patrón sólido (`isCallerAdmin`, rollback Auth, passwords server-side, audit `PortalProvisionLog`). `revokeRefreshTokens` en `deactivatePortalClient` (006). Mejoras pendientes: validación rol en `clearMustChangePassword`, evitar password staff en payload cliente (`provisionStaffUser` recibe password del admin UI — aceptable operativamente pero conviene generación server-side opcional).

**Auth guards:** `AuthGuard` + `StaffRoleGuard` + `PortalAuthGuard`/`PortalGuestGuard` bien encadenados; `PortalSessionService` valida `portalActivo` y cliente activo.

**Testing:** 13 specs unitarios (.spec.ts), Cypress 10 specs (admin-heavy). Sin tests de integración inventario transaccional ni portal autenticado.

**Performance build:** Lazy chunks correctos (inventario 225 KB, pacientes 140 KB); cuello de botella en runtime será RTDB full-scan, no bundle.

---

## Acción recomendada inmediata

Priorizar spec `specs/NNN-rtdb-granular-permisos/` y `specs/NNN-validacion-agenda-citas/` antes de cualquier deploy de rules o cambios de negocio en producción.

---

## Historial de actualizaciones

| Fecha | Cambio |
|-------|--------|
| 2026-08-25 | Auditoría inicial — 30 hallazgos documentados |
| 2026-08-25 | Spec 003: ítems 6–10 citas resueltos (agenda, motivo, roles) |
