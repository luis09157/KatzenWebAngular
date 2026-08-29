# Spec: Vacunas — esquemas por especie, confirmación vet, push y PWA portal

**ID:** 052-vacunas-esquemas-push-pwa  
**Estado:** done  
**Fecha:** 2026-08-28  
**Autor:** Agent (pedido Luis Alfonso Niño Martínez — **olas 1–3 implementadas**; deploy functions-fcm scheduler sigue pendiente de autorización)

**Anexo clínico (tablas, URLs, MDA, México):** [`PROTOCOLOS.md`](./PROTOCOLOS.md)

---

## Problema

Hoy el módulo de vacunas registra el acto (`Katzen/Vacunas`) y, con spec **033**, puede auto-crear un **recordatorio** si hay `proximaAplicacion` o `intervalo`. Eso no alcanza para una clínica:

1. El **intervalo es un número libre** (o 0). No hay motor que sepa que un cachorro de 8 semanas con DHPP necesita serie cada 3–4 semanas **hasta ≥16 semanas**, que la leptospira es **2 dosis + anual** (nunca trienal), ni que en **México la rabia es anual por NOM** y no se debe copiar el default AAHA de 3 años.
2. El catálogo fallback mezcla core, non-core y productos que WSAVA **no recomienda** (Giardia, CCoV) sin avisos.
3. Las especies de paciente son `CANINO`, `FELINO`, `AVE`, `REPTIL`, `OTRO` — **no hay conejo**. Aves/reptiles no deben heredar esquema de perro/gato.
4. El push FCM (**023**) dispara al **escribir** el recordatorio. Si se crea un refuerzo a 12 meses, el dueño puede recibir el aviso **el día que se vacunó**, no cuando toca volver — eso es spam.
5. El portal tiene token FCM (`PortalFcmService` + `firebase-messaging-sw.js`) pero **no** es una PWA instalable (calendario de vacunas en el teléfono).

Esta spec define **qué** debe hacer el producto en olas. **Ola 1** (motor + diálogo + CONEJO), **ola 2** (scheduler push + PWA portal) y **ola 3** (tipos conejo + hint hurón) están implementadas (2026-08-28).

---

## Principio no negociable de producto

> **Todo default es sugerencia. El veterinario confirma o edita siempre.**  
> KatzenVet no practica medicina: sugiere intervalos alineados a WSAVA/AAHA/AAFP + **NOM mexicana de rabia**, y deja el criterio clínico en el diálogo de confirmación. La etiqueta del lote manda.

---

## Relación con specs existentes (no pisar)

| Spec | Relación |
|------|----------|
| **033** | Base: vacuna → recordatorio. 052 **enriquece** cómo se calcula `intervalo` / `proximaAplicacion`. |
| **023** | Push al write. 052 ola 2 **programa** avisos cerca de la fecha (anti-spam). |
| **017** | Fallecido archiva recordatorios. 052 **no reactiva**. |
| **034** | Alergias: hint cruzado al vacunar (ya hay patrón). |
| **035** | UID del vet en la vacuna. |
| **051** | Login auto-redirect — **no tocar**. |
| **053** (futuro) | Desparasitación — **fuera de 052**. |

---

## User stories

### US-1 — Sugerir esquema al aplicar vacuna (perro/gato)

Como **veterinaria / staff**  
Quiero que, al elegir paciente + tipo de vacuna, el sistema proponga **próxima fecha e intervalo** según especie, edad aproximada y categoría (core / non-core / rabia MX / lepto)  
Para no inventar 7 días ni poner rabia a 3 años por copiar AAHA.

**Criterios de aceptación:**

- [x] SC-001: Motor puro (util + unit tests) con reglas de [`PROTOCOLOS.md`](./PROTOCOLOS.md): cachorro 6–8 sem, intervalo 14–28 días, cierre serie **≥16 sem**, mínimo **3 dosis** core canino AAHA si la serie empieza en cachorro.
- [x] SC-002: Diálogo de confirmación (`admin-dialog-shell`): muestra sugerencia + fuente corta («WSAVA/AAHA; rabia NOM anual») + campos editables (fecha, intervalo, no agendar).
- [x] SC-003: Guardar vacuna **no** ocurre hasta confirmar o elegir «sin recordatorio».
- [x] SC-004: Rabia: `intervalo` default **365**; la UI **no** ofrece 3 años como preset. Hint NOM vs etiqueta 12 sem.
- [x] SC-005: Leptospira (sola o detectada en séxtuple): 2ª dosis a 14–28 días si es inicio; adulto **365**; **nunca** hereda 1095 del core MLV.
- [x] SC-006: FeLV: hint test antígeno **sin** bloquear guardado; core sugerido si edad &lt;1 año; indoor adulto = no auto-esquema (hint).
- [x] SC-007: FVRCP refuerzo post-serie: default Katzen **1 año**, preset opcional **6 meses** (WSAVA/AAFP).
- [x] SC-008: Giardia y CCoV: hint «WSAVA no recomienda de rutina»; no auto-serie.
- [x] SC-009: Intervalo &lt;14 días en core MLV: soft-warn, vet puede forzar.
- [x] SC-010: Hints (no hard-block): enfermo/fiebre, gestación, rabia &lt;12 sem clínica privada.
- [x] SC-011: Mascota `Fallecido`: no crear recordatorio (017).
- [x] SC-012: Especie ave/reptil/`OTRO` (no conejo): copy «Sin esquema sugerido. Indica intervalo o no agendar.»

### US-2 — Catálogo de tipos con semántica (aditivo)

Como **admin de clínica**  
Quiero que `TiposVacunas` (o campos opcionales) distingan especie, categoría y flags (`nuncaTrienal`, `dosisInicio`)  
Para no hardcodear solo el fallback actual.

**Criterios:**

- [x] SC-013: Campos aditivos en tipos (ver plan). Fallback actual se **mapea**, no se borra (`puppy`, `quintuple`, …).
- [x] SC-014: Seed/documentación de defaults MX en spec; carga inicial **no** pisa tipos activos legacy.
- [x] SC-015: Añadir especie paciente **`CONEJO`** al diálogo de alta (aunque el esquema rico sea ola 3).

### US-3 — Conejo (ola 3)

Como **vet que atiende conejos de compañía**  
Quiero registrar mixomatosis / RHD / «Otra» con intervalo **manual** (default 365 si elige agendar)  
Para no fingir que Nobivac PLUS está en el inventario mexicano.

**Criterios:**

- [x] SC-016: Tipos `mixomatosis`, `rhdv_rhdv2`, `otra_conejo` + copy de honestidad MX ([`PROTOCOLOS.md`](./PROTOCOLOS.md) §3).
- [x] SC-017: Sin auto-serie europea si no hay biológico confirmado por la clínica.

### US-4 — Hurón / exóticos (ola 3, mínima)

Como **vet**  
Quiero un hint si la especie parece hurón y elijo combo canino  
Para no aplicar DHPP off-label sin criterio.

**Criterios:**

- [x] SC-018: Hint AFA: no combo canino; Preferir producto hurón; MX: Nobivac Rabia **sí** lista hurón (anual). Disponibilidad Purevax en LATAM: **confirmar proveedor**.

### US-5 — Push sin spam (ola 2)

Como **dueño en portal**  
Quiero un aviso **cerca** de la fecha de refuerzo (p. ej. 7 días y 1 día antes), no el día que vacunaron a 12 meses vista  
Para que el push sea útil.

**Criterios:**

- [x] SC-019: No enviar FCM al crear recordatorio si `fecha_hora_recordatorio` está a más de N días (config; default 8).
- [x] SC-020: Scheduler (Function programada o cola) respeta 017, `activo`, `estado pendiente`, tope **2** pushes/recordatorio, fingerprint anti-duplicado (023).
- [x] SC-021: Quiet hours opcionales (p. ej. no 23:00–08:00 hora clínica). Fallback: inbox `Notificaciones` sigue existiendo.

### US-6 — PWA portal (ola 2)

Como **dueño**  
Quiero instalar el portal (icono, manifesto) y ver vacunas/recordatorios en el teléfono, con push ya existente  
Para no depender de recordar la URL.

**Criterios:**

- [x] SC-022: Web App Manifest + iconos; criterio installable en portal (no hace falta PWA del admin).
- [x] SC-023: SW: reutilizar / complementar `firebase-messaging-sw.js`; no romper FCM 023/031.
- [x] SC-024: Offline **best-effort** de última ficha cacheada (no escritura clínica offline).
- [x] SC-025: CTA «Activar avisos» existente no spamea el permiso.

### US-7 — Portal: transparencia del esquema

Como **dueño**  
Quiero ver próxima vacuna y que el texto no parezca orden médica automática  
Para entender que lo confirmó la clínica.

**Criterios:**

- [x] SC-026: Copy «Fecha acordada en clínica» / «Refuerzo programado»; no «el sistema te obliga a vacunar el día X».

---

## Catálogo de reglas de negocio (resumen ejecutivo)

Detalle y citas: [`PROTOCOLOS.md`](./PROTOCOLOS.md).

### Perro

- Core MLV: DHPP/DAPP (CDV+CAV+CPV). Inicio 6–8 sem, cada **2–4 sem** hasta **≥16 sem**, **≥3 dosis** si serie de cachorro. Dosis ≥16 sem **crítica por MDA**.
- Refuerzo post-serie: 6 meses (WSAVA 2024) o 12 meses; luego 1 vs 3 años **solo** fracción MLV. Default Katzen post-serie: **1 año editable**.
- Rabia MX: **anual**. NOM campañas: 1 mes → 3 meses → anual de por vida. Clínica privada: ~**12 sem** etiqueta. **Prohibido default trienal AAHA.**
- Lepto: 2 dosis inicio, **anual**, `nuncaTrienal`.
- Bordetella: non-core; IN 1 dosis vs SQ 2 dosis; anual.
- CIV: non-core 2+anual; **disponibilidad MX no asumida**.
- Giardia / CCoV: **no sugerir** (WSAVA not recommended).

### Gato

- FVRCP: 6–8 sem, cada **3–4 sem** hasta **16–20 sem**. Refuerzo 6 meses (AAFP/WSAVA) vs **1 año default Katzen editable**.
- Rabia: igual MX anual.
- FeLV: core &lt;1 año (2 dosis); indoor adulto = decisión vet; **test = hint**.

### Conejo

- Mixoma + RHDV/RHDV2. Europa: Nobivac PLUS desde 5 sem anual; Filavac desde 10 sem anual.
- MX: VEHC-2-BIVE (PRONABIVE) RHDV2 granjas ≥8 sem; **no** afirmar que los kits UK están en la clínica. Default: especie + tipos + intervalo manual.

### Exóticos

- Hurón: CDV con producto adecuado; **no** combo perro sin criterio; rabia según etiqueta (Nobivac MX hurón anual).
- Ave/reptil: **sin esquema mamífero**.

---

## Olas de entrega

| Ola | Qué | Código |
|-----|-----|--------|
| **0** | Investigación + SDD (este paquete) | Solo specs |
| **1** | Motor + diálogo confirmación + flags catálogo + especie CONEJO + hints; sigue 033 para crear recordatorio | Angular + util + tests; RTDB aditivo |
| **2** | Scheduler push anti-spam + PWA portal | `functions-fcm` + Angular portal + manifest |
| **3** | Conejo tipos + hint hurón | Catálogo + copy + especie `HURON` (código 2026-08-28) |
| **053** (fuera) | Desparasitación | Otra spec |

---

## Fuera de alcance (052)

- Implementar Angular/Functions **en esta entrega de spec** (ola 0).
- Desparasitación, esterilización, titers como motor.
- Inventar SKUs o stock de vacunas en México.
- SMS / WhatsApp / Resend para refuerzos.
- Cambiar spec **051**.
- `.remove()` de vacunas (sigue **019** / baja lógica).
- Protocolo de refugio/shelter distinto (WSAVA tiene tablas shelter; no ola 1).
- Deploy producción.

---

## Contratos de Datos y UI (Obligatorio)

> Detalle de nodos y rollback: `plan.md`. Resumen:

- **Impacto RTDB:** solo **aditivo**. No renombrar `Katzen/Vacunas`, `TiposVacunas`, `Recordatorios`. App móvil ignora campos nuevos.

  | Nodo | Lectura | Escritura | Notas |
  |------|---------|-----------|-------|
  | `Katzen/Vacunas` | staff / client filtrado | staff | opcionales: `esquemaCodigo?`, `intervaloSugeridoDias?`, `intervaloConfirmadoDias?`, `confirmadoPorUid?` |
  | `Katzen/TiposVacunas` | staff | staff | opcionales semánticos |
  | `Katzen/Config/Vacunacion` | staff | staff | **nuevo opcional** defaults clínica |
  | `Katzen/Recordatorios` | igual 033/023 | staff + functions | opcionales `skipPushOnCreate?`, `pushCount?`, `pushKindsSent?`, `pushDueStatus?` |
  | `Katzen/NotificacionesClinica` | staff | Functions (Admin SDK) | **nuevo** inbox clínica; cliente no lee |
  | `Katzen/Mascota.especie` | — | staff | valores nuevos `CONEJO`, `HURON` (string libre; aditivos; móvil ignora) |

- **Estrategia de prueba:** mocks `src/app/core/testing/mock-data.ts`. Motor con unit tests, **sin** RTDB `katzen-a0e3e`.
- **Patrones UI:** `admin-dialog-shell` (vacuna + confirmación), `LoadingService`, `ErrorMessagesService`, `app-cliente-paciente-picker`, hints 048, SweetAlert2 existente, portal list-section. **Sin** librerías UI nuevas. PWA: manifesto estándar.

---

## Roles

| Rol staff | ¿Accede? |
|-----------|----------|
| administrador / doctor / recepcionista / peluquero | Sí (política 011: admin operativo completo) |
| Cliente portal | Lectura vacunas/recordatorios propios; instalar PWA; activar push |

---

## UI (rutas y layout)

- Admin: `/admin/vacunas` diálogo existente + paso confirmación esquema.
- Opcional ola 1: expediente paciente → “próximos refuerzos” (read).
- Portal: vacunas + recordatorios; ola 2 install PWA + avisos.
- Config defaults: o bien campos en diálogo (presets), o pantalla mínima en config clínica si ya hay patrón — **no** módulo ERP nuevo.
- Chips de categoría (`core` / `non-core` / `legal-MX`) **completos** (sin clip).
- Timepicker si hay hora de recordatorio (`app-timepicker-field`).

---

## Backend

- [x] Ola 1: Function nueva **no** (cálculo en cliente + 033).
- [x] Ola 2: sí — scheduler `onVacunaPushSchedule` diario 10:00 `America/Mexico_City` en codebase **`functions-fcm`**. Gate `shouldDeferVaccineWritePush` en `onRecordatorioWritePush`.
- [x] Reglas RTDB: `Katzen/NotificacionesClinica` (staff read, client no) + `Katzen/Config/Vacunacion` write staff. **Deploy database pendiente** (autorización Luis).
- [ ] Email: no.

---

## Testing mínimo

Ver `tasks.md`. En ola 0 **no** hay `npm run build` de feature. Al implementar ola 1+: QA guide completo, build, mocks, unit del motor, Cypress smoke vacunas.

---

## Notas / decisiones de producto (Luis)

| # | Tema | Default propuesto | Estado |
|---|------|-------------------|--------|
| 1 | Rabia intervalo | 365 días; sin preset 3 años | Propuesto (alineado NOM + pedido) |
| 2 | FVRCP post-serie | 1 año editable; alternativa 6 meses | Propuesto (pedido Luis) |
| 3 | Core MLV adulto | 1 año editable; 3 años solo si vet lo elige | Propuesto (práctica MX vs WSAVA DOI) |
| 4 | Lepto | 2 + anual; nunca trienal | Propuesto (WSAVA/AAHA) |
| 5 | Conejo | Especie + tipos; biológicos EU no dados por existentes en MX | Propuesto |
| 6 | CIV / Purevax / Nobivac PLUS | «Confirmar proveedor local» | Propuesto (honestidad) |
| 7 | Desparasitación | Spec 053 futura | Propuesto |

Si Luis cambia un default (p. ej. refuerzo felino 6 meses), se actualiza `Config/Vacunacion` y esta spec **antes** de codear.
