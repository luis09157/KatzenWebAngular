# Inventario del FDB Eleventa (fase 0)

**Archivo origen (NO copiado al repo):** `/Users/luisnino/Downloads/PDVDATA.FDB`  
**Tamaño:** 9.0 MB (9 486 336 bytes) · 579 páginas de 16 384 bytes  
**Fecha del archivo:** 2026-08-31  
**Software:** **eleventa** (Bambu Code / AbarrotesPDV · `PDVDATA.FDB`)  
**Caja en datos:** `Caja Principal` / nombre de negocio `KATZEN-VET`  
**Motor:** Firebird embebido (Eleventa MonoCaja usa FB 2.0.x; MultiCaja `FirebirdSQL20`). Header ODS ≈ **10** (compatible FB 2.0/2.5).  
**Credenciales típicas Eleventa (documentación pública, no se usaron contra prod):** `SYSDBA` / `masterkey`.  
**Charset de datos:** texto en **CP1252 / WIN1252** (el motor lista también WIN1250, ISO8859_1, NONE). Migración → UTF-8.

## Cómo se inspeccionó

**2026-08-31 (fase 0):** no hay `isql` / Docker / fórmula Homebrew `firebird` en este Mac ARM. **No se abrió sesión SQL.**  
Se recorrieron páginas Firebird y cadenas CP1252, cruzadas con el esquema público de Eleventa.

**2026-08-31 (fase 1 intento):** se copió el FDB a `tmp/pdv-eleventa/PDVDATA.FDB` (gitignored; el original de Downloads no se montó en escritura). `bash scripts/pdv-eleventa/extract.sh` → **GATE FAIL**: Docker/colima/podman/isql **no instalados**.

**2026-08-31 (fase 1 SQL):** Colima + Docker CLI (`linux/x86_64`). `jacobalberty/firebird:2.5-ss` **64-bit** lee el header (`gstat` ODS 10.1, Implementation ID 16) pero `isql`/`gbak` dicen *not a valid database* (FDB Win32; ODS &lt; 11 no es portable 32↔64). Abrió con **Firebird 2.5 Classic i386** (`i386/debian:jessie`, imagen local `katzenvet/firebird-2.5-i386:local`). `extract.sh` reejecutable. `pdv-extract.json` gitignored (685 filas). **No** se exportó `FACTURACION_*`.

## Tablas de negocio (generadores `GEN_*` + PK)

| Tabla | Evidencia | `COUNT(*)` SQL 2026-08-31 | Rol |
|-------|-----------|---------------------------|-----|
| `PRODUCTOS` | PK = `CODIGO` | **685** | Catálogo vivo |
| `PRODUCTOS_BASE` | PK `CODIGO` | **9469** | Snapshot histórico de nombres (no anaquel) |
| `MEDIDAS` | PK, `GEN_MEDIDAS_ID` | catálogo chico | Unidad (enteros vs granel) |
| `DEPARTAMENTOS` / `DEPTS` | ambas con PK | 14 depts + DEPTS ofuscados | Categoría |
| `VENTATICKETS` | PK `ID` | **4739** | Encabezado ticket (ola C) |
| `VENTATICKETS_ARTICULOS` | PK `ID` | **9395** | Líneas + 208 con BOM |
| `TICKETS` / `TICKET_ARTICULOS` | no aparecen en `SHOW TABLES` | — | No hay tablas legacy con esos nombres |
| `VENTAS` | `SHOW TABLES` | no contar para import | **No importar** (recalcular) |
| `HISTORIAL_INVENTARIO` | PK | **9708** | Kardex (más que el GEN de fase 0) |
| `MOVIMIENTOS` / `OPERACIONES` | PK | pendiente COUNT | Caja/gastos/compras |
| `CLIENTES` | PK | **0** | No hay clientes PDV que fusionar; walk-in `__mostrador__` |
| `USUARIOS` | PK | **pocos** (visible: admin tienda Eleventa) | Cajeros — **no** Firebase |
| `CAJAS` | PK | **1** (`Caja Principal`) | Sucursal única |
| `IMPUESTOS` | PK | **IVA** presente | Impuesto |
| `PROV` | PK `GEN_PROV_ID` | proveedores | Compras |
| `ABONOS` / `CREDCUENTAS` / `CREDABONOS` / `CREDHISTORIAL` | PK | crédito tienda | CxC Eleventa |
| `PROMOCIONES_POR_CANTIDAD` | PK | promociones | No clonar 1:1 |
| `CONFIGURACION` | claves `impuestos.*`, `porcentajeganancia.*` | margen default **40%**; flags IVA | |
| `FACTURAS` + `FACTURACION_*` | certificados, folios, emisores, informes, clientes SAT | módulo CFDI Eleventa | **No** copiar CSD/FIEL al repo ni a RTDB |
| `FOLIOS` / `INFORMES` / `SCHEMA_INFO` / `COMPONENTES` | meta | | |
| `HISTORIAL_USUARIOS` | auditoría cajeros | | No migrar passwords |

Páginas data: 285 · índices: 156 · **sin páginas blob** (triggers/source no extraíbles como SQL CREATE).

## Columnas — catálogo `PRODUCTOS`

**DDL real (`SHOW TABLE PRODUCTOS`, isql 2.5 i386).** No existen `ID`, `PFINAL` ni `ELIMINADO_EN`.

| Campo | Tipo | Notas |
|-------|------|--------|
| `CODIGO` | `VARCHAR(20)` PK | EAN o interno (`KTZ*`, `VAC*`, `V002`–`V009`, `BACO*`) |
| `DESCRIPCION` | `VARCHAR(255)` | Nombre al público |
| `TVENTA` | `CHAR(1)` | `U` = unidad (muestra) |
| `PCOSTO` | `FLOAT` | Costo; **no** lleva IVA |
| `PVENTA` | `FLOAT` | Precio que cobra el cajero (usar como `PFINAL` en el mapeo IVA) |
| `MAYOREO` | `FLOAT` | Precio mayoreo (a menudo 0) |
| `DEPT` | `INTEGER` | FK `DEPARTAMENTOS.ID` |
| `PROVID` / `UMEDIDA` | `INTEGER` | Proveedor / medida |
| `DINVENTARIO` | `DOUBLE PRECISION` | Stock («Hay») |
| `DINVMINIMO` / `DINVMAXIMO` | `DOUBLE PRECISION` | Mín/máx |
| `PORCENTAJE_GANANCIA` | `SMALLINT` default 0 | |
| `COMPONENTES` | `VARCHAR(255)` | BOM kits: `V002=3;V003=1;V004=1;` |
| `IMPUESTOS` | `VARCHAR(255)` | Vacío en el catálogo; IVA global **apagado** |

**UI Eleventa (importador):** precio mayoreo, cantidad inventario («Hay»), mínimo, máximo, tipo de venta (unidad/granel), impuestos, claves SAT, proveedor.

**No apareció en cadenas del FDB:** `EXISTENCIA`, `ELIMINADO_EN`, `CADUCIDAD`, `LOTE`, `PASSWORD` (stock y baja viven en campos binarios/nombres distintos o no indexados como texto).

## Columnas — líneas `VENTATICKETS_ARTICULOS`

Extraídas del metadato / triggers:

| Campo | Significado |
|-------|-------------|
| `TICKET_ID` | FK encabezado |
| `PRODUCTO_CODIGO` / `PRODUCTO_NOMBRE` | snapshot |
| `CANTIDAD` | |
| `PRECIO_USADO` | precio cobrado (puede ser mayoreo) |
| `PORCENTAJE_DESCUENTO` | |
| `GANANCIA` | margen de la línea |
| `IMPUESTOS_USADOS` / `IMPUESTO_UNITARIO` | |
| `DEPARTAMENTO_ID` | |
| `CLIENTE_ID` | opcional |
| `USA_MAYOREO` | |
| `COMPONENTES` | **kits** (`VAC010=1;VAC003=1;VAC005=1;`) |
| `FUE_DEVUELTO` / `CANTIDAD_DEVUELTA` / `TOTAL_DEVUELTO` | devoluciones |
| `PORCENTAJE_PAGADO` | pago parcial / mixto |
| `PAGADO_EN` / `VENDIDO_EN` | timestamps |
| `CAJA_ID` / `CAJERO_ID` | |

Encabezado `VENTATICKETS` / `FACTURAS`: `FOLIO`, `SERIE`, `SUBTOTAL`, `IMPUESTOS`, `TOTAL`, `CANCELADA_EN`, `CLIENTE_ID`.

## Relaciones

```
DEPARTAMENTOS 1──N PRODUCTOS (DEPT)
MEDIDAS 1──N PRODUCTOS (MEDIDA_ID)
PROV 1──N PRODUCTOS (si módulo compras)
CAJAS 1──N VENTATICKETS
USUARIOS (cajero) 1──N VENTATICKETS
CLIENTES 0..1──N VENTATICKETS
VENTATICKETS 1──N VENTATICKETS_ARTICULOS
PRODUCTOS.CODIGO ── VENTATICKETS_ARTICULOS.PRODUCTO_CODIGO  (snapshot, no solo FK)
VENTATICKETS_ARTICULOS.COMPONENTES ── explode a hijos VAC/KTZ
HISTORIAL_INVENTARIO N──1 PRODUCTOS
ABONOS / CRED* ── CLIENTES (crédito tienda)
FACTURAS ── VENTATICKET_ID (CFDI Eleventa)
```

## Configuración hallada (sin PII)

| Clave | Valor observado |
|-------|-----------------|
| `impuestos.usa` | **0** (IVA no se usa en eleventa) |
| `impuestos.desglosar` | 0 |
| `porcentajeganancia.usa` | 0 |
| `porcentajeganancia.valor` | **40** |
| Impuesto catálogo | `IVA` 16% — `ACTIVO=f` `DEFECTO=f` |
| `ultima.version.enlared` | versión Eleventa en red |

Katzen: precio al público **incluye IVA**; costo neto; ganancia = neta − costo; default 16% MX; cajero **no** ve/edita costo (032/056).

## Departamentos (sample)

Activos (nombres normalizados): **Medicamento, Grooming, Farmacia, Ropa, Petshop, Alimento, Consultorio, Paquetes, Equipo, UsoInterno**, «Sin Departamento».  
Eliminados en PDV: Medicamento (2024-04-04), Exámenes de laboratorio (2024-04-04), UsoInterno (2024-04-01), Premios (2023-08-02).

## SKU internos (Katzen ya los usa en Eleventa)

| Prefijo | `COUNT` real | Uso |
|---------|--------------|-----|
| `KTZ*` | **61** | SKU clínica + 10 paquetes (dept 8) |
| `VAC*` | **6** | Vacunas (además `V002`–`V009`) |
| `V002`–`V009` | **8** | Vacunas usadas en BOM de paquetes |
| `BACO001`–`BACO014` | **14** | Baños / grooming (precios 200–450) |
| `EXAM*` | **8** | Estudios |
| EAN ≥12 dígitos | **269** | Fábrica |
| Kits `COMPONENTES` no vacío | **10** | Paq Cachorro/Perro/Gato/FeLV; BOM `V00x`/`EXAM009`; **0 huérfanos** |

Extracto 685: 491 con stock &gt; 0 (valuación costo ≈ $277 552 / venta ≈ $380 228); **88** stock negativo; **156** con `PCOSTO ≥ PVENTA` (revisar, muchos UsoInterno). No hay precio 0.

## Muestra de productos (sin PII, 5 filas ilustrativas)

| CODIGO (tipo) | DESCRIPCION | Depto probable |
|---------------|-------------|----------------|
| `V003` / vacuna | Vacuna Bordetella | Consultorio / Medicamento |
| EAN `75015564…` | Carda Para Gato | Petshop |
| (alimento) | Nupec Adulto 2kg | Alimento |
| `BACO014` | Baño Gato Pelo Largo | Grooming |
| (kit) | Paq Perro Mini (0-5kg) | Paquetes |

Otros nombres reales en catálogo: Vacuna Quintuple, Vacuna Rabia, Tobracetil 5ml, Full Trust Adulto 2Kg, Nexgard Sp 7.6-15kg, Domicilio (servicio cobrado como producto).

## Operaciones / proveedores (rel. movimientos; PII enmascarada)

Tipos: Salida, Devolución, gastos (Gasolina, Almuerzo, sueldos — **no importar nómina**).  
Proveedores mencionados en movimientos: **GoPet, Surtipet, Petiklar, Whippet** (nombres comerciales, no personas).

## Usuarios cajero

Visible: `Administrador de la Tienda` / login `admin` + email de **soporte Eleventa** (plantilla del software). **No migrar contraseñas Firebird.** Mapear cajeros reales a `Katzen/Usuarios` (Firebase Auth) a mano.

## Clientes PDV vs clínica

`COUNT(*)` de `CLIENTES` = **0**. No hay fusión que revisar. Tickets → walk-in `__mostrador__`. `DEPTS.NOMBRE` está ofuscado; usar `DEPARTAMENTOS` (nombres claros).

## Certificados fiscales

Tabla `FACTURACION_CERTIFICADOS` y página data con blobs tipo CSD (~41 registros). **Prohibido** copiar al git, a mocks o a RTDB. CFDI Eleventa ≠ PAC Katzen (spec 024: datos fiscales sí; timbrado no).

## Limitaciones de esta inspección

- Fase 0 (strings/páginas) inflaba volúmenes; **fuente de verdad = `COUNT(*)` de esta sección**.
- Precios son `FLOAT` (ruido tipo 82.489998). Redondear a 2 decimales en el mapeo.
- No se exportó historial de tickets a JSON todavía (ola C).
- Certificados no se tocaron.
