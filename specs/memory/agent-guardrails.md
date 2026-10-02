# Guardrails para agentes — KatzenVet

Checklist **obligatoria** antes de implementar. Complementa `constitution.md` (principios) y `domain-context.md` (dominio).  
**No** sustituye la guía QA completa (`specs/templates/qa-validation-guide.md`).

**Última revisión:** 2026-10-01 · Specs **075**–**085** (peluquería flujo fácil planificado)

---

## ANTES DE CODEAR (en este orden)

1. **Leer** `specs/memory/constitution.md` (siempre).
2. **Leer este archivo** (`agent-guardrails.md`).
3. Si toca entidades, flujos clínicos, RTDB o portal → **leer** `specs/memory/domain-context.md` (secciones relevantes).
4. **Clasificar L1 / L2 / L3** (`.cursor/rules/sdd-workflow.mdc`). Ante duda → nivel superior.
5. **Buscar en** `specs/INDEX.md` **y** `rg` / tabla anti-duplicación abajo — **antes** de reinventar o abrir carpeta nueva. No inventar segundo POS, segundo expediente, segundo wizard de alta, etc.
6. Si hay spec activa (`specs/NNN-*/`): leer `spec.md` (+ `plan.md`/`tasks.md` si existen) y **no salirse del alcance**.
7. Si el cambio cruza módulos → consultar `specs/memory/module-map.md` (límites Admin / Portal / Landing / Core).
8. Solo entonces: implementar. Diff mínimo. Reutilizar `core/` y `shared/` antes de duplicar.

---

## DESPUÉS DE CODEAR / AL CERRAR (obligatorio)

Las specs y la memoria deben **actualizarse en la misma entrega** para no repetir código ni retrabajar. Proceso: spec **078**.

1. **Actualizar `tasks.md`** de la spec activa: registro QA del nivel + **qué se extrajo / dónde vive el código** (ruta de utils, módulos, callables).
2. Si extrajiste utils/módulos o cambió un límite Admin/Portal/Core → **`specs/memory/module-map.md`**.
3. Si hubo **decisión de negocio** nueva → fila en «Decisiones tomadas» aquí **o** nota en `domain-context.md` (no solo en el chat).
4. Si cambió `Estado:` o el nombre/título de la spec → `node scripts/specs-index.mjs`.
5. Antes de la **siguiente** feature: re-chequear INDEX + esta tabla anti-duplicación + `module-map` — no abrir un segundo camino paralelo.

Checklist corta también en plantilla `specs/templates/module-tasks.template.md` («Memoria actualizada»).

---

## Prohibiciones duras (siempre)

| # | Prohibido | Alternativa |
|---|-----------|-------------|
| 1 | `git commit` / `git push` / `firebase deploy` sin autorización **explícita** de Luis Alfonso Niño Martínez | Documentar pasos; pedir OK |
| 2 | Conectar, leer o escribir producción (`katzen-a0e3e`) | Localhost, emuladores Firebase, mocks (`src/app/core/testing/mock-data.ts`) |
| 3 | Cambios RTDB destructivos / renombrar nodos que consume la app móvil | Solo **aditivo** (campos/nodos opcionales) |
| 4 | Rewrite masivo de la app o refactor fuera de la spec activa | Plan + cortes seguros; confirmar con Luis |
| 5 | Importador Excel de clientes/pacientes a producción | **No construir** (decidido 2026-09). PDV Firebird = spec **064** (`scripts/pdv-eleventa`), no Excel clínico |
| 6 | Agendar citas desde portal dueño | Portal = **solo lectura** de citas (spec **074**). Solicitud futura `CitasSolicitud` solo documentada |
| 7 | Exigir cliente registrado para venta petshop/mostrador | Mostrador (`__mostrador__` / `esMostrador`) es válido (specs **046**, **065**, PLAN-UX) |
| 8 | Usar `Cliente.expediente` como folio de mascota | Folio clínico = `Mascota.expediente` (spec **068**) |
| 9 | Copy «Baja lógica» / «Dar de baja» en UI | UI siempre **«Borrar»**; técnicamente `activo: false` |
| 10 | `mat-dialog-title` en diálogos admin | `admin-dialog-shell` + `h2.admin-dialog-title` |

---

## Decisiones de negocio ya tomadas (065–074) — no reabrir

Lista corta. Detalle en la spec citada / `domain-context.md` §11.

| Tema | Decisión | Spec |
|------|----------|------|
| Venta rápida POS | Abre en mostrador; cliente/mascota solo si el servicio es clínico | **065**, PLAN-UX |
| Kits POS | Explotan `kitComponentes`; sin BOM **no** inventar componentes | **070** |
| Turno / ticket | `Caja/Turnos/{fecha}` aditivo; folio `KV-YYYYMMDD-NNN`; ticket 80 mm | **071** |
| Menú / roles | 6 grupos; `STAFF_MODULE_ACCESS` por rol (ya no `*` para todos) | **072** |
| Expediente visible | Folio en **mascota**; Excel clínico 1 fila = 1 mascota; **sin** import Excel en repo | **068** |
| WhatsApp recordatorios | Canal `wa.me` + métrica uso; no reemplaza FCM | **066** |
| Respaldo RTDB | Backup semanal Storage; restore = Luis + destructivo documentado | **067** |
| Doble clic fila | = Ver detalle; `.row-actions` con `stopPropagation` | **073** |
| Portal dueño | Cartilla + baños + avisos UX; citas **read-only**; no wizard agendar | **074** |
| Resend | **Activado** 2026-08-26 (038). Pendiente dominio propio (Fase B). No “re-diferir” ni re-implementar mailer | **038** |
| Hosting | Una versión live; no historial como backup (063) | **063** |
| 048 / 049 / 050 | **Superseded** → **054** | INDEX |

---

## Reglas contradictorias — fuente de verdad

| Tema | Fuente canónica | No usar como verdad |
|------|-----------------|---------------------|
| Resend | `specs/038-resend-correo-portal/notas-resend.md` + AGENTS.md (activado) | Textos viejos de “Resend diferido al final” en backlog sin actualizar |
| UI admin | `docs/ADMIN-UI-ARCHITECTURE.md` + rule `admin-ui-architecture.mdc` (`alwaysApply: false`, globs `src/app/**`) | Inventar layouts / cards ajenos |
| Niveles QA | `sdd-workflow.mdc` + `qa-validation-guide.md` (solo L3 completa) | Duplicar checklist de 17 filas en rules always-applied |
| Acceso staff por URL | `staff-role.config.ts` (**072**) | Política 011 “todo es `*`” (histórico) |
| Expediente | `folio-expediente-paciente.util.ts` + **068** | `Cliente.expediente` como folio de paciente |

---

## Anti-duplicación — no reimplementar

Antes de crear un util/diálogo/flujo nuevo, **reutilizar** lo existente. Detalle de límites: `module-map.md`.

| Qué buscas | Ya vive en | Spec |
|------------|------------|------|
| Copy / mensajes POS | `visitas/pos-copy.util.ts` | **075** |
| Pasos wizard POS / destino | `visitas/pos-wizard.util.ts` | **076** |
| Hints / bloqueos / puedeGuardar POS | `visitas/pos-bloqueo.util.ts` | **076** |
| Sheets táctiles (qty, escáner, monto) | `visitas/pos-sheet.util.ts` | **077** |
| Sheets UI (panel / cantidad / scanner / carrito) | `visitas/pos-sheet-panel|cantidad|scanner|carrito.component` | **081**, **082** |
| Orquestación guardar/cobrar POS | `visitas/pos-orquestacion.util.ts` | **079** |
| Persistir ticket + salidas kit/stock POS | `visitas/pos-persistir.util.ts` | **080** |
| Ticket WhatsApp POS | `visitas/pos-ticket-whatsapp.util.ts` | **071** / POS |
| Folio expediente mascota | `core/utils/folio-expediente-paciente.util.ts` | **068** |
| Recordatorio → `wa.me` | `recordatorios/recordatorio-whatsapp.util.ts` | **066** |
| Alta «Llegó un paciente» | `alta-rapida/` (+ `alta-rapida-atencion.helper` + `alta-rapida-prefill.util`) — diálogos con `paciente_id` **no** vuelven a pedir dueño/mascota | **070**, **085** |
| Login errors / FCM copy | `core/utils/login-error-copy` · `fcm-copy` | **076** |
| SweetAlert marca | `core/ui/katzen-swal.ts` (`KatzenSwal` mixin) | **084** |
| Loading global | `LoadingService` + `LOADING_MESSAGES` (incl. `charging`, `loadingCatalog`); hide en success **y** error; spec **005** | **005** |
| Grids densos / catálogo POS | Nombre visible; CSS global overlay; baños `BACO` → `productoDescuentaInventarioPos` (no `productoSinStock` ciego). Lecciones en **084** US-7 | **084** |
| Captura rápida baño | `banios/banio-captura-rapida.util.ts` + diálogo modo Rápido/Completo | **085** A |
| Cola mostrador baños | `visitas/banio-cola-mostrador.util.ts` + `por-cobrar-hoy` — solo completados del día; al cobrar salen | **085** |
| Fecha / edad / timeline expediente | `pacientes/paciente-fecha.util` · `paciente-timeline.util` | **077** |
| Pickers cliente/paciente/producto | `shared/admin/` | **029**, **044** |
| Timepicker | `shared/timepicker/` | **004** |
| Venta rápida / mostrador | flujo en `visita-dialog` + utils POS + sheets UI (**081**–**082**) | **065**, **046**, **079**–**082** |
| Correo portal (Resend) | Functions 038 — **no** segundo mailer | **038** |

---

## Al entregar

- Cumplir **DESPUÉS DE CODEAR / AL CERRAR** (arriba).
- Reportar `npm run build` (exit code). Lint: 0 errores.
- Mantener `npm start` vivo si hubo cambio UI.
- L2/L3: registro corto en `tasks.md`; `spec.md` → `done` solo con validación del nivel.
- Regenerar índice: `node scripts/specs-index.mjs`.
- **Sin** commit / push / deploy salvo que Luis lo pida en el mismo mensaje.
