# Tasks: Portal — experiencia de dueño

**Spec:** `specs/074-portal-experiencia-cliente/spec.md`  
**Nivel de cambio:** L2

---

## Implementación

### Setup

- [x] Carpeta spec 074 + alcance L2 (sin `plan.md`)

### Frontend

- [x] Utils: cartilla, chips, citas split, FCM copy, teléfono, flag solicitud
- [x] Unit tests mapper/cartilla/FCM/teléfono
- [x] Landing + login dueño (Soy cliente / Entrar al portal; Agendar oculto)
- [x] Home «Tus mascotas» + chips; detalle cartilla con baños
- [x] Citas read-only + banner teléfono; `PORTAL_CITA_SOLICITUD_ENABLED = false`
- [x] Perfil / inbox: Activar avisos + copy iPhone

---

## Validación

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` (exit 0) | OK | exit 0; warning budget 2.93 MB (preexistente) |
| Unit tests del util | OK | 36 SUCCESS (`portal/utils/*.spec.ts`) |
| Smoke local 375 / 1280 | OK | landing 1280 + 375; login portal 1280. Seed `cliente@katzen.test` falló (Auth emulador no levantado) |
| RTDB aditiva / móvil | N/A | sin writes nuevos; `oculto_portal` se respeta |
| Chips + loading | OK | chips home; spinner login; hide en success/error FCM |

### Fix login overlay (2026-09-04)

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `npm run build` | OK | exit 0; budget warning 2.93 MB preexistente |
| Lint | OK | 0 errores |
| Unit tests | OK | 60 SUCCESS (utils login/claims + auth/session) |
| Backdrop / z-index | OK | overlay `z-index:4000`, fondo `rgba(15,23,42,0.82)` |
| Error inline | OK | alerta dentro del card; sin Swal tapado |
| Banner emu | OK | `#firebase-emulator-warning` hidden; Auth emu OFF |
| Chooser dual | OK | `/auth/contexto` «¿A dónde quieres entrar?» |
| URL cliente | OK | overlay en `/`; `/admin/login` es staff |
| Screenshots | OK | `/tmp/kz-074-login/` |

### Fix localhost→prod Auth+RTDB (2026-09-04)

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| `useRtdbEmulator` / Auth / Functions | OK | `false` / `false` / off vía early return |
| Banner PDV emu | OK | oculto si flag false (`*ngIf="rtdbEmulator"`) |
| Dual Soy cliente → contexto | OK | no rechaza staff+dueño; `/auth/contexto` |
| Errores wrong-password vs perfil | OK | copy distinto en modal / staff |
| Backdrop sólido | OK | rgba 0.92, sin blur, z-index 4000 |
| `curl -sI :4200` | OK | 200 tras reinicio `npm start` |
| `npm run build` | OK | exit 0; budget warning 2.93 MB preexistente |
| Unit tests login error | OK | 6 SUCCESS |

```
npm run build → exit 0
ng test --include='src/app/portal/utils/portal-login-error.util.spec.ts' → 6 SUCCESS
curl -sI localhost:4200 → 200
```

### Fix copy + scroll expediente (2026-09-04)

| Verificación | Resultado | Notas |
|--------------|-----------|-------|
| Copy H1 / timeline | OK | H1 «Expediente de {nombre}»; timeline «Actividad»; sin «Cartilla» duplicado |
| Home CTA | OK | «Ver expediente» |
| Scroll `.portal-main` | OK | shell `100dvh` + `overflow:hidden`; main `min-height:0` + `overflow-y:auto` |
| Smoke 1280 / 375 | OK | `canScroll` + `scrolled` true (fixture CSS) |
| Screenshots | OK | `/tmp/kz-074-scroll/` |
| `npm run build` | OK | exit 0; budget warning 2.93 MB preexistente |

```
npm run build → exit 0
screenshots → /tmp/kz-074-scroll/{desktop-1280,mobile-375}-{top,bottom}.png
```

---

## Criterios spec (SC-xxx)

- [x] SC-001 Soy cliente / staff aparte / tap 44px
- [x] SC-002 login copy humano
- [x] SC-003 Agendar oculto (`*ngIf="false"`)
- [x] SC-004 home chips
- [x] SC-005 cartilla + baños + oculto_portal
- [x] SC-006 mapBanio + query paciente_id/cliente_id
- [x] SC-007 Activar avisos destacado
- [x] SC-008 inbox CTA + copy iPhone
- [x] SC-009 sin backend FCM nuevo
- [x] SC-010 citas read-only + banner teléfono
- [x] SC-011 flag solicitud false

---

## Cierre

- [ ] Validación L2 registrada
- [ ] `spec.md` → `done` + `node scripts/specs-index.mjs`
- [ ] Commit / deploy — solo si Luis lo pidió
