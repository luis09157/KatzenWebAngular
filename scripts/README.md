# scripts/

Utilidades de desarrollo. **Ninguno toca producción sin `CONFIRM_PROD=katzen-a0e3e`** (guard en `lib/guard-prod.mjs`).

| Script                          | npm                                    | Qué hace                                                                                                               |
| ------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `emulators-start.mjs`           | `npm run emulators` / `emulators:full` | Arranca emuladores Auth + RTDB (+ Functions en `full`). Persiste en `./emulator-data` (gitignored).                    |
| `emulator-seed.mjs`             | `npm run emulators:seed`               | Crea 3 usuarios de prueba + `AuthPerfiles`, `Usuarios`, `Cliente` (portal) y `Mascota` en los emuladores.              |
| `specs-index.mjs`               | `npm run specs:index`                  | Regenera `specs/INDEX.md`.                                                                                             |
| `smoke-008-provision-roles.mjs` | `npm run smoke:008:*`                  | **Producción.** Provisiona usuarios efímeros para el smoke de roles. Requiere `CONFIRM_PROD`.                          |
| `pdv-eleventa/*`                | `npm run pdv:*`                        | Migración PDV Firebird (spec 064). Ver `pdv-eleventa/README.md`.                                                       |
| `lib/guard-prod.mjs`            | —                                      | `assertProdConfirmed()`: aborta si falta `CONFIRM_PROD=katzen-a0e3e`, si la URL no es prod o hay env vars de emulador. |

## Entorno local con emuladores (Auth + RTDB)

Requisitos: Java 21 (`export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"`), `firebase-tools` 15+.

```bash
# Terminal 1 — emuladores (UI en http://localhost:4000)
npm run emulators

# Terminal 2 — datos de prueba (solo la primera vez o para resetear)
npm run emulators:seed

# Terminal 3 — app apuntando a emuladores (environment.ts → useRtdbEmulator: true)
npm start
```

`src/app/core/firebase-emulator.ts` conecta RTDB (9000), Auth (9099) y Functions (5001) al emulador
cuando `environment.useRtdbEmulator` es `true` (nunca en `environment.prod.ts`). Para que las callables
funcionen usa `npm run emulators:full`; con `npm run emulators` (sin functions) las callables fallan
localmente en vez de pegarle a prod.

Al cerrar los emuladores (Ctrl+C) se exporta el estado a `emulator-data/`; el siguiente arranque lo importa.

### Usuarios creados por `emulators:seed`

| Rol             | Correo                  | Contraseña             | Nodos                                                                                                                           |
| --------------- | ----------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Admin staff     | `admin@katzen.test`     | `Katzen-Admin-2026!`   | `AuthPerfiles/seed-admin-uid`, `Usuarios/seed-admin-uid` (`staffRole: administrador`)                                           |
| Recepción staff | `recepcion@katzen.test` | `Katzen-Recep-2026!`   | `AuthPerfiles/seed-recepcion-uid`, `Usuarios/seed-recepcion-uid` (`staffRole: recepcionista`)                                   |
| Cliente portal  | `cliente@katzen.test`   | `Katzen-Cliente-2026!` | `AuthPerfiles/seed-cliente-uid` (`role: client`), `Cliente/seed-cliente-001` (`portalActivo: true`), `Mascota/seed-mascota-001` |

El seed también fija los custom claims (`role`, `staffRole`, `clienteId`) igual que `syncClaimsForUid`
en `functions/src/index.ts`, porque el trigger de `AuthPerfiles` no corre si Functions no está emulado.

Guard: el script aborta si faltan `FIREBASE_AUTH_EMULATOR_HOST` / `FIREBASE_DATABASE_EMULATOR_HOST`,
si no apuntan a localhost, si `GOOGLE_APPLICATION_CREDENTIALS` está definida o si la RTDB resuelta no
es `127.0.0.1`.

## Scripts hacia producción

Solo con autorización explícita de Luis:

```bash
CONFIRM_PROD=katzen-a0e3e npm run smoke:008:provision
CONFIRM_PROD=katzen-a0e3e PDV_RTDB_TARGET=prod PDV_CONFIRM_PROD=LUIS npm run pdv:import-prod
```
