# Extractor Eleventa (Firebird 2.5) — spec 064

**PDV** = Punto De Venta = el programa de caja **eleventa** de Windows (archivo `PDVDATA.FDB`).

## Reglas

- Trabajar solo con una **copia**. Nunca el `.FDB` que eleventa tiene abierto.
- Firebird **2.5** (ODS 10). Firebird 3/4/5 **no** abre este archivo sin backup/restore.
- No exportar `FACTURACION_CERTIFICADOS`, CSD, FIEL, `.cer`, `.key`.
- Salidas a `tmp/pdv-eleventa/` y `scripts/pdv-eleventa/out/` (gitignored).
- Emulador: `PDV_RTDB_WRITE=1 npm run pdv:import-emulator` (nunca katzen-a0e3e).
- Producción **solo** con OK de Luis: `PDV_RTDB_TARGET=prod PDV_CONFIRM_PROD=LUIS node scripts/pdv-eleventa/import-prod.mjs`
- Dry-run de mapeo IVA (sin RTDB): `node scripts/pdv-eleventa/import-emulator.mjs`

### Namespace del emulador

`import-emulator.mjs` escribe por defecto en el namespace **`katzen-a0e3e-default-rtdb`** del emulador local (`127.0.0.1:9000`). Es el mismo que lee `ng serve` con `useRtdbEmulator: true` (`environment.ts` → `databaseURL` de `katzen-a0e3e-default-rtdb` + `useEmulator`), y el que arranca `npm run emulators` (proyecto de `.firebaserc`). Así lo importado aparece en `/admin/inventario` local sin configurar nada más.

| Variable | Default | Uso |
|---|---|---|
| `PDV_RTDB_NAMESPACE` | `katzen-a0e3e-default-rtdb` | Override para importar a un namespace aislado, p. ej. `PDV_RTDB_NAMESPACE=demo-katzen-pdv PDV_RTDB_WRITE=1 npm run pdv:import-emulator`. Solo `[a-z0-9-]`. |
| `FIREBASE_DATABASE_EMULATOR_HOST` | `127.0.0.1:9000` | Host del emulador. **Debe** ser local (`127.0.0.1`, `localhost`, `0.0.0.0`, `[::1]`); cualquier otro valor aborta (exit 1). |
| `GCLOUD_PROJECT` | `demo-katzen-pdv` | Solo id de app para firebase-admin; **no** define el namespace. Si contiene `katzen-a0e3e` aborta. |

El nombre del namespace **no** es un indicador de producción: los datos van al host del emulador. El guard anti-prod exige host local, aborta con `PDV_RTDB_TARGET=prod`, con `GOOGLE_CLOUD_PROJECT`/`GCLOUD_PROJECT` de prod, y solo escribe bajo `Katzen/Inventario/*` y `Katzen/ServiciosClinica` (deny-list `Katzen/Producto*`).

## Mac (Docker)

```bash
# 1) Cerrar eleventa si la copia viene de la clínica (archivo en uso = corrupto).
# 2) Origen típico de Luis:
#    /Users/luisnino/Downloads/PDVDATA.FDB
bash scripts/pdv-eleventa/extract.sh
```

Este FDB es **ODS 10.1 / Windows 32-bit**. Firebird **64-bit** (incl. `jacobalberty/firebird:2.5-ss`) **no** lo abre (`is not a valid database`). El script usa **Firebird 2.5 Classic i386** (imagen local `katzenvet/firebird-2.5-i386:local`).

En este Mac no hace falta Docker Desktop. Ya quedó Colima:

```bash
export DOCKER_HOST="unix://${HOME}/.colima/docker.sock"
# si la VM no está: colima start --arch x86_64 --vm-type=qemu
bash scripts/pdv-eleventa/extract.sh
node scripts/pdv-eleventa/import-emulator.mjs   # reportes CSV + payload; no escribe RTDB
# Emulador (nunca katzen-a0e3e):
# Java 21 (firebase-tools 15+). Sin sudo:
#   export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
# npm run emulators            # auth + database, namespace katzen-a0e3e-default-rtdb (el de ng serve)
# PDV_RTDB_WRITE=1 npm run pdv:import-emulator
# Namespace aislado (no lo ve ng serve): PDV_RTDB_NAMESPACE=demo-katzen-pdv PDV_RTDB_WRITE=1 npm run pdv:import-emulator
```

Reportes (gitignored, `tmp/pdv-eleventa/`):

- `reporte-impacto-iva.csv` — precio eleventa vs web +16%
- `reporte-exclusiones-pos.csv` — uso interno / `UI*` / `MI*` (no caja)
- `reporte-stock-cero.csv` — negativos y servicios
- `reporte-costo-ge-vendible.csv` — costo ≥ precio que sí se venden


Si no hay Docker: el script sale **2**. **No detener** el resto del pipeline: `npm run test:ci` (antes `test:064`) cubre IVA + clasificación con samples.

## Windows (PC de la clínica)

1. Cerrar eleventa (nadie cobrando).
2. Copiar `PDVDATA.FDB` a `C:\temp\katzen-pdv\PDVDATA.FDB` (no trabajar sobre el original).
3. Instalar **Firebird 2.5 SuperServer** (no 3+).
4. Abrir `isql` (usuario típico Eleventa: `SYSDBA` / `masterkey`):

```
CONNECT "C:\temp\katzen-pdv\PDVDATA.FDB" USER SYSDBA PASSWORD masterkey;
INPUT C:\ruta\al\repo\scripts\pdv-eleventa\queries.sql;
```

O IBExpert → misma copia → `SHOW TABLE PRODUCTOS` + `COUNT(*)`.

5. Guardar la salida en `scripts/pdv-eleventa/out/isql-out.txt` (no commitear si trae nombres de clientes).
6. Gate: `COUNT(*)` de cada tabla = filas exportadas a JSON.

## Credenciales

Documentación pública Eleventa: `SYSDBA` / `masterkey`. Si la clínica las cambió, Luis las indica; no adivinar ni pegar secretos en git.

## Freeze (cutover)

Un día (o unas horas) **se deja de cobrar en eleventa**, se copia el FDB, se importa el stock de ese momento, y **desde ahí solo se cobra en la web**. No doble captura (cobrar en los dos = stock descuadrado).
