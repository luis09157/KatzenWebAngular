# Investigación POS — KatzenVet (055)

**Fecha:** 2026-08-30 · **Actualizado:** 2026-08-30 (UI redo táctil)  
**Autor:** agente (pedido Luis Alfonso Niño Martínez)  
**Alcance:** prompt maestro + UI táctil con foto. Lógica de cobro **reutilizada**, no reescrita.  
**Spec activa:** `specs/055-pos-movil-ticket/` · Relaciona 032, 039, 043, 044, 045, 046, 049, 050, 054, 024.

KatzenVet es clínica + petshop + peluquería en México. El POS no es un clon de Pulpos ni de Square: vende **tres mundos en el mismo ticket**. Esta nota documenta qué vale la pena copiar como *patrón* (no como marca) y qué queda fuera.

---

## 1. Resumen ejecutivo

| Tipo de sistema | Qué hace bien | Qué Katzen debe tomar | Qué Katzen NO debe copiar ahora |
|-----------------|---------------|----------------------|----------------------------------|
| **Pulpos (MX)** | Venta en 4 pasos, inventario en la misma transacción, ticket o CFDI en cobro, corte de caja | Flujo buscar → carrito → cobrar → comprobante; walk-in; no abrir 3 programas | Timbrado CFDI, WhatsApp, tienda en línea, crédito/CxC avanzado desde caja |
| **Square / Shopify POS** | Grid táctil, search + UPC/SKU, scanner HID o cámara, Charge sticky, carrito guardable | Scanner que agrega al carrito sin teclear; search exacto; +/−; CTA cobro imposible de perder | Hardware Square, Apple Pay, loyalty, cart-sharing multi-device |
| **Lightspeed / pet retail** | Productos + servicios + work order de grooming + ficha de mascota | Baño como work order que cae al mismo ticket; perfil mascota ya existe en clínica | eCom, marketplaces, loyalty Marsello, multi-sucursal |
| **PIMS vet** (Digitail, Provet, ezyVet, Avimark) | Un invoice: consulta + producto + vacuna; cargo automático al documentar | Riel Consulta + 1 tap con precio; medicamento descuenta stock; no caja paralela | Bundles/billing triggers complejos, labs, insurance, SOAP→factura automática |

**Conclusión para Luis:** la ola 1.5 (home + 3 rieles + cobro unificado) ya cubre el *modelo mental* correcto. El hueco que más duele en mostrador, según todos los POS retail, es **agregar SKU en 1 segundo (scanner)** y, en clínica/peluquería, **servicios con precio sugerido (1 tap)**. CFDI y WhatsApp no aceleran la caja de hoy.

**Ola vigente (2026-08-30):** **UI redo táctil con foto** (grid tap-to-add, sticky cliente + Cobrar, no mutar maestros).  
**Siguiente ola recomendada después:** **P0 — Scanner** (cámara + pegar código 043). No toca contratos de cobro.

---

## 2. Hallazgos por tipo de sistema

### 2.1 Pulpos (México) — POS de negocio, no de clínica

Fuentes: [pulpos.com](https://pulpos.com/), [implementar POS](https://pulpos.com/blog/como-implementar-un-punto-de-venta-sin-problemas/), [facturar y vender](https://pulpos.com/blog/facturar-y-vender-al-mismo-tiempo/), [POS + CFDI](https://pulpos.com/blog/punto-de-venta-con-facturacion-mexico/), [cortes de caja](https://pulpos.com/blog/cortes-caja-refaccionaria-credito-talleres/).

**Flujo de venta (4 pasos, idéntico en su ayuda):**

1. Buscar producto (nombre, código de barras o categoría). Lector → entra al carrito.
2. Carrito: cantidades y descuentos.
3. Cobrar: efectivo / tarjeta / transferencia; calcula cambio.
4. Ticket (imprimir o WhatsApp/correo) **o** factura CFDI 4.0 en la misma pantalla.

**Cliente:** catálogo con RFC para facturar; venta a público en general sin ficha. Crédito: la venta no entra a efectivo del turno; el abono se registra en la ficha del cliente y el corte lo separa.

**Inventario:** baja en la **misma transacción** que la venta (y que el CFDI, si se pide). Clave SAT por producto (irrelevante para Katzen hasta PAC).

**Qué adaptar a Katzen (ya parcialmente hecho en 055):**

- Una sola pantalla de caja; no “abrir finanzas”.
- Buscar + pegar código + carrito + COBRAR grande.
- Walk-in / mostrador para anaquel.
- Ticket interno (comprobante de operación), no factura.

**Qué no clonar:**

- Facturar en el mismo tap (Katzen no tiene PAC; ver §6).
- Compartir ticket por WhatsApp (054 P2; Resend/WhatsApp diferidos).
- Tienda en línea, pedidos WhatsApp, Mercado Pago checkout.
- Crédito de taller / consignación.

### 2.2 Square POS y Shopify POS — patrones móviles

Fuentes: [Square — Build the cart](https://squareup.com/help/us/en/article/8238-build-your-customer-s-cart-in-the-square-retail-pos-app), [Square — scanners](https://squareup.com/help/ca/en/article/5143-bar-code-scanners-with-square-point-of-sale), [Shopify — barcode scanners](https://help.shopify.com/en/manual/sell-in-person/hardware/barcode-scanners), [Shopify — barcode inventory 2026](https://www.shopify.com/blog/barcode-inventory-management), [Stripe mobile checkout](https://stripe.com/au/resources/more/mobile-checkout-ui), [Shopify checkout UX 2026](https://cartylabs.com/blog/shopify-checkout-ux-best-practices/), [Shopify mobile search](https://www.sparq.ai/blogs/mobile-search-ux-shopify-patterns).

**Cómo se arma el carrito (Square):**

| Camino | Comportamiento |
|--------|----------------|
| Item grid | Tap en tile → al carrito (si hay variantes, sheet de detalle) |
| Categorías | Tile de categoría → lista → tap |
| Scanner | HID/Bluetooth o **cámara del dispositivo**; GTIN/UPC asociado al ítem |
| Search | Keyword, UPC o SKU → tap → Add to cart |

**Shopify POS (patrón crítico):** un lector HID (teclado) debe agregar al carrito **sin** enfocar el search. La cámara **sí** pide un tap en el ícono de código (no “escucha” en background). Staff se queja si hay que abrir search, escanear, cerrar search, repetir.

**Cobro:** Charge / Pay now **sticky abajo**. Resumen colapsable en móvil. Métodos claros. Express wallets (Apple/Google Pay) son e-commerce; en mostrador Katzen el análogo es efectivo/tarjeta/transferencia ya existentes.

**Accesibilidad de cobro (Stripe + Shopify UX):**

- Targets **44×44 pt** (Apple HIG) / **48×48 dp** (Material 3).
- CTA primaria **bottom-sticky**.
- Teclado numérico en montos (`inputmode="numeric"`).
- Autocomplete visual + **quick-add** (`+`) en resultados de search (no abrir ficha de producto).

**Qué Katzen ya tiene:** search sticky, `+` ≥44px (48px), carrito sticky, sheet qty, cobro grande, pegar código.

**Gap vs Square/Shopify:** cámara; HID que agregue sin sheet; search con foto + match exacto de `codigo_barras` (043) en un tap.

### 2.3 Lightspeed Retail / POS petshop

Fuentes: [Lightspeed pet store POS](https://www.lightspeedhq.com/pos/retail/pet-shop-point-of-sale/), [Lightspeed AU pet](https://www.lightspeedhq.com/au/pos/retail/pet-shop-point-of-sale/), [caso Woouf](https://www.lightspeedhq.com/au/customers/woouf/), [Franpos pet POS 2026](https://franpos.com/best-pet-store-pos), [RetaPOS pet 2026](https://www.retapos.com/blog/best-pos-system-pet-stores-2026), [EloERP grooming + retail](https://www.eloerpsuite.com/pet-store-pos-software-animal-tracking-vaccination-grooming/).

Patrón de pet retail serio:

1. **Inventario** (caducidad, lotes, reorden, bundles “new pup essentials”).
2. **Servicios** (grooming, daycare) como **work order** + calendario, no solo SKU.
3. **Ficha mascota** (raza, notas, historial de grooms) en el mismo cliente.
4. **Un ticket** al recoger: baño + croqueta + collar.
5. Walk-in de anaquel **sin** romper la agenda de groomers.

Lightspeed a menudo **integra** agenda (Booxi) en vez de nacer como PIMS clínico. Franpos / Elo enfatizan: si retail y grooming viven en dos sistemas, recepción reconcilia a mano.

**Katzen ya tiene** el modelo más fuerte que Lightspeed “puro retail”: `Katzen/Banios` + ticket + clínica. No necesita Booxi. El patrón a conservar: **pendientes de peluquería → misma caja**, no un POS de petshop separado.

### 2.4 Software veterinario — cómo mezclan clínica + retail

#### Digitail

Fuentes: [digitail.com](https://digitail.com/), [inventory tracking](https://digitail.com/blog/you-cant-manage-what-you-cant-track-a-better-way-to-handle-inventory/), [services](https://help.digitail.io/en/articles/5046084-add-and-manage-services), [bulk products](https://help.digitail.io/en/articles/5055432-add-new-products-in-bulk).

- Servicio facturable (consulta, vacuna) tiene precio, tax, barcode/SKU.
- Se pueden **ligar productos** al servicio: al agregar el servicio al SOAP/record, el stock baja.
- Invoice + payments en el mismo PIMS. Charge capture para no “olvidar” cargos.
- Productos clínicos vs consumibles vs retail en un directorio, con tax por ítem.

#### Provet Cloud

Fuentes: [provet.cloud](https://www.provet.cloud/veterinary-software-solution), [treatment items](https://support.provet.com/hc/en-gb/articles/11371582659485-Add-and-Manage-Treatment-Items-in-a-Consultation), [invoicing](https://support.provet.com/hc/en-gb/categories/16202190664732-Invoicing-and-Payments).

- En la **consulta** se agregan procedures, medicines, foods, supplies.
- Esos ítems **son** las líneas de factura. Bundles = paquete a precio fijo.
- Estimate → invoice → pay en un flujo. Fondo: no hay “caja de finanzas” paralela para el acto clínico.

#### ezyVet

Fuentes: [invoicing](https://www.ezyvet.com/features/invoicing-and-transactions), [billing triggers](https://docs.ezyvet.com/en/browse-documentation/ezyvet/invoicing/getting-started/billing-triggers/billing-trigger-products), [bundles](https://www.ezyvet.com/webinar/product-bundles), [time wasters / Scan](https://www.ezyvet.com/blog/the-6-biggest-time-wasters-in-your-veterinary-practice-and-how-to-fix-them).

- **Billing trigger:** “Consulta 15 min” dispara productos/precios a la factura.
- **Bundles:** vacuna + jeringa + consulta en un tap; inventario al día.
- **ezyVet Scan:** cámara del celular para códigos; el stock se actualiza en todos los dispositivos.

#### Avimark (Covetrus, on-prem)

Fuentes: [Avimark](https://covetrus.com/covetrus-platform/workflow-and-productivity-tools/avimark/), [review](https://tradetechguide.com/p/avimark-software-review-for-veterinarians), [setup inventory](https://covetrus.com/wp-content/uploads/How-to-Setup-Avimark-Inventory-2024.pdf).

- Tratamiento en ficha → **fee capture** a invoice (el cargo nace del acto, no de una caja suelta).
- Action codes: impuesto, fee de dispensación, cargo de inyección.
- Inventario farmacéutico + retail en el mismo listado, con unidades de medida distintas (frasco vs dosis).

**Patrón común PIMS (traducido a Katzen):**

```text
Acto clínico o baño  →  línea en ticket  →  un cobro  →  stock si hay producto
```

No: baño cobra en finanzas **y** ticket. Eso ya lo cerró **050 / 054**. Digitail/ezyVet van un paso más: el precio del acto es **plantilla**, no teclado cada vez. Eso es la **ola 3 / P1** de 055 (`SC-012`).

### 2.5 Best practices POS pet (grooming, tax, walk-in)

Fuentes pet POS: Franpos, RetaPOS, EloERP (arriba). Tax US grooming: [LegalClarity](https://legalclarity.org/dog-grooming-tax-sales-tax-rules-and-business-deductions/), [resale vs service supplies](https://resalecertificate.org/articles/pet-store-groomer-resale-certificate-guide/). México IVA: ver §6.

| Práctica | Implicación Katzen |
|----------|-------------------|
| Un ticket: groom + retail | Ya: riel Peluquería + Petshop en `visita-dialog` |
| Walk-in no rompe agenda ni ficha clínica | Ya: `puedeUsarRiel` — mostrador **solo petshop** |
| Grooming = servicio con duración, notas, staff | Baños en Atención clínica; POS solo cobra / “Nuevo baño” |
| Separar stock **usado en el servicio** vs **vendido en anaquel** | P2: no mezclar shampoo de peluquería (consumo) con el de góndola; hoy todo es `Producto` |
| Tax distinto medical vs retail | Control interno `iva_aplicable` / `tasa_iva` (043). **No** es CFDI. Ver nota SAT abajo |
| Perfil mascota para recomendar alimento | Ya en expediente; no hace falta CRM Lightspeed |
| Caducidad / FEFO en alimento y vacuna | Inventario 007/043; POS solo respeta stock al agregar |

**Walk-in (046 + 055 SC-019):** industria petshop permite público general en anaquel. Consulta, vacuna y baño **exigen** dueño + mascota (expediente, alergias, CxC). Correcto; no relajar.

### 2.6 México: ticket vs factura (CFDI) — fuera de alcance POS

Katzen **no tiene PAC**. 024 solo guardó datos fiscales en cliente (`rfc?`, `requiereFactura?`, etc.) **sin timbrar**. 054 lista CFDI/PAC como P2 Luis-only.

| Documento | Qué es | ¿Katzen hoy? |
|-----------|--------|----------------|
| **Ticket / nota / comprobante de operación** | Recibo interno (folio, líneas, total, método). Sirve al cliente como recordatorio de pago. **No** es CFDI. | Sí: ticket de visita / impresión |
| **CFDI 4.0 nominativo** | Factura electrónica timbrada por un PAC ante el SAT. Requiere RFC, nombre, CP, régimen, uso CFDI. | No. Campos en cliente (024) solamente |
| **CFDI global** | Una factura de periodo (día/semana/mes) a `XAXX010101000` / `PUBLICO EN GENERAL` / régimen `616` / uso `S01` por ventas sin factura individual (RMF 2.7.1.22). | No |

Fuentes: [Alegra CFDI 4.0 2026](https://blog.alegra.com/mexico/que-es-cfdi-4-0/), [SenHub factura global](https://senhub.mx/blog/factura-global-ventas-publico-general), [Fiscalapi factura global](https://fiscalapi.com/blog/factura-global), [Luces del Siglo — facturar desde POS](https://lucesdelsiglo.com/2026/08/24/facturar-desde-el-punto-de-venta-las-dudas-mas-frecuentes-negocios/), [Guía SAT CFDI global 4.0 (PDF)](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/Guia_llenado_CFDI_global.pdf), Pulpos blogs CFDI (arriba).

**Hechos para no confundir a recepción:**

- Cobrar ≠ facturar. El voucher de terminal **no** sustituye CFDI (CFF arts. 29 y 29-A).
- El ticket de Katzen es válido como **control interno y comprobante de venta al cliente**; la obligación fiscal de emitir CFDI (individual o global) la cubre el **contador / PAC**, no esta app.
- Pulpos vende precisamente “venta + timbrado + stock en un tap”. Eso exige CSD, PAC y claves SAT. **Fase tardía / spec 024 fase 2**, no ola POS.

**Decisión de producto (2026-08-30):** CFDI, PAC, factura global, autofactura, XML/PDF y WhatsApp de ticket = **fuera de 055**. Si un cliente pide factura, el flujo operativo sigue siendo: cobrar en POS → el admin/contador emite CFDI fuera (o en 024 fase 2 cuando Luis contrate PAC).

#### IVA interno (no SAT)

`domain-context` §3.8: `iva_aplicable` + `tasa_iva` son **control interno**. Defaults actuales: medicamento/vacuna/quirúrgico/diagnóstico → 0 % sugerido; alimento/accesorio/peluquería → 16 %.

Marco SAT vigente (no es asesoría fiscal; el contador de Luis manda):

- Alimento **procesado para mascotas** (perros, gatos, especies de hogar): **IVA 16 %**. Tasa 0 % es para alimentación humana / pecuaria, no croquetas de compañía. [Notas Fiscales](https://notasfiscales.com.mx/el-alimento-para-nuestras-mascotas-y-el-impuesto-al-valor-agregado/), [criterio SAT 7/IVA/N](https://sdv.com.mx/compendio/criterios-normativos-sat/criterio-7-iva-n/).
- Medicinas de patente **humanas** → tasa 0 %; **veterinarias** → tasa general 16 % (mismo criterio SAT).
- Iniciativas 2025–2026 para quitar IVA a croquetas/medicinas vet **no están vigentes** ([AMEXFAL](https://www.amexfal.com/en/blog/industry-news-articles-1/propuesta-fiscal-para-mascotas-puede-mexico-eliminar-el-iva-en-croquetas-y-servicios-veterinarios-107)).

**Acción POS:** no “arreglar” IVA en esta feature. Si Luis + contador cambian defaults, es inventario/043, no scanner.

### 2.7 Accesibilidad touch, bottom bar, scanner

| Estándar | Mínimo | Fuente |
|----------|--------|--------|
| Apple HIG | **44×44 pt** hit target | [Buttons HIG](https://developer.apple.com/design/human-interface-guidelines/buttons) |
| Material 3 / Android | **48×48 dp** (~9 mm); separación ≥8 dp | [M3 designing](https://m3.material.io/foundations/designing/structure), [Android a11y](https://support.google.com/accessibility/android/answer/7101858) |
| Bottom / navigation bar | 3–5 destinos; icono + label | Material NavigationBar |
| Scanner cámara | Target 44+ en flash/cerrar; feedback háptico/visual al leer | Shopify/Square + HIG |
| HID / pistol | Modo teclado: el foco vive en search o listener global; beep al match | Shopify HID, Square Bluetooth |

**Katzen hoy:** `+` 48px, dock home **Caja | Tickets | Productos**, carrito sticky. Sheet scanner = **pegar texto** (`abrirScanner` / `aplicarCodigoEscaneado`), no `getUserMedia`.

**Regla de implementación (ola scanner):**

1. Pegar / HID (ya): match exacto `codigo_barras` (043, `KZ-…` o EAN) → `agregarProductoRapido`.
2. Cámara: Barcode Detection API o equivalente **sin** librería UI nueva fuera del design system; pedir permiso; cerrar al leer; si falla, caer a pegar.
3. No persistir video. No tocar producción. HTTPS localhost OK.
4. Targets ≥44px (ideal 48) en captura, flash, cerrar, “Usar código”.

---

## 3. Qué YA tiene Katzen vs gap

Código leído: `visita-dialog.*`, `visitas.component.*` (home tiles + dock), `pos-rieles.util.ts` (+ spec), `visita-mostrador.util.ts`, specs **043, 046, 050, 054/CIERRE**, `domain-context` §3.8–3.8d.

### Ya está (no reabrir)

| Capacidad | Dónde |
|-----------|--------|
| Wizard dueño → caja → cobrar (054) | `visita-dialog` |
| Home POS: Nueva venta, Mostrador, Tickets hoy, Productos | `/admin/visitas` |
| Bottom bar Caja \| Tickets \| Productos | `pos-home__dock` |
| 3 rieles Petshop \| Consulta \| Peluquería | `pos-rieles.util.ts` |
| Walk-in solo petshop; consulta/peluquería piden dueño+mascota | `puedeUsarRiel` |
| `+` táctil, carrito sticky, sheet qty, foto 043 | diálogo POS |
| Pegar código / QR texto → match `filtrarProductos` | `aplicarCodigoEscaneado` |
| Cobro inline efectivo/tarjeta/transferencia + `visitaId` | `confirmarCobro` · **039/050** |
| Salida inventario al persistir producto; guarda `movimientoInventarioId` | `InventarioService.registrarSalida` |
| `CLIENTE_MOSTRADOR` | 046 |
| QR imprimible + `imagen_url` | 043 |
| Un camino de cobro (no «Registrar en caja» clínico) | 050 / 054 |
| IVA flag interno, no PAC | 043 + 024 |
| Tests 046 (mostrador+rieles), 039, 040 | `tasks.md` 055 |

### Gap (prioridad)

| # | Gap | Ola | Riesgo si se hace mal |
|---|-----|-----|------------------------|
| G1 | Cámara / HID continuo (Square-like) | **P0** | Bajo si no toca cobro |
| G2 | Servicios 1 tap con precio de plantilla (022 defaults / `precioSugeridoCliente`) | **P1** | Medio: no inventar precios; fallback a prompt actual |
| G3 | Search visual (thumb + quick-add) y match exacto de código sin sheet | P1 | Bajo |
| G4 | Auditoría touch 44/48 en dock, chips, wizard | P1 | Bajo |
| G5 | Consumo de peluquería vs venta anaquel (mismo SKU) | P2 | Datos |
| G6 | CFDI / PAC / global / WhatsApp ticket | **No 055** | Legal + costo |
| G7 | Bundles tipo ezyVet (consulta+vacuna+jeringa) | P2 | Complejidad clínica |
| G8 | Offline (Pulpos app) | No | Constitución: nube RTDB |

**Contratos que no se tocan en ninguna ola 055:** nodos RTDB, `CajaService.crearMovimiento({ visitaId })`, `registrarSalida`, walk-in sentinel, reglas 050 (no reabrir caja en baños/citas).

---

## 4. Plan de trabajo por olas (P0–P2) — post-investigación

Esfuerzo = días de agente con QA autónomo (`build` + tests 046/039 + smoke `:4200`). Una ola = una autorización de Luis.

### P0 — Scanner (ola 2 de spec) · ~1–1.5 días · **siguiente**

**Objetivo:** recepción agrega croqueta/accesorio en &lt;3 s con el teléfono, como Square/Shopify/Pulpos.

- Cámara en sheet scanner (permiso, overlay, cerrar al match).
- Seguir aceptando pegar / HID en el mismo campo (`codigo_barras` 043).
- Match exacto → `agregarProductoRapido`; si no hay match, mensaje + lista filtrada (no silenciar).
- Solo riel petshop (el código ya fuerza `posTab = 'petshop'`).
- Tests unitarios del match; no cambiar `confirmarCobro`.
- SC-011.

**No hacer en P0:** HID driver nativo, impresora térmica, cajón, CFDI, precios 1 tap.

### P1 — Servicios 1 tap + pulido search/touch · ~1.5–2.5 días

**Objetivo:** patrón PIMS (Digitail/ezyVet billing trigger light).

- Consulta / Vacuna / Baño con **precio sugerido** desde defaults ya existentes (`Katzen/Finanzas/DefaultsBanioPorTamano`, plantillas `precioSugeridoCliente`, o default clínica documentado). Si no hay precio → prompt actual (no bloquear).
- Search: thumb 043 + `+` en cada hit (Shopify quick-add).
- Pass de 44/48 px en dock y chips.
- SC-012 + polish SC-003/017.

**No hacer en P1:** bundles multi-línea automáticos, SOAP, labs.

### P2 — Diferido (no bloquea clínica)

| Ítem | Notas |
|------|--------|
| CFDI / PAC / factura global | 024 fase 2; contrato PAC; **Luis + contador** |
| WhatsApp ticket | 054 P2; sin dominio Resend tampoco hay correo masivo |
| Bundles / billing triggers | Solo si recepción lo pide tras P1 |
| Consumo vs venta (shampoo) | Inventario, no POS |
| Multi-sucursal, loyalty, eCom | Lightspeed; una sucursal hoy |
| Offline | No |
| Corte de caja desde POS | Finanzas ya existe; 055 no enlaza reportes (SC-015) |

### Qué no hacer (explícito)

- **No** integrar PAC ni mostrar “Facturar” en cobro.
- **No** WhatsApp / compartir ticket por API.
- **No** reabrir «Registrar en caja» en baños, citas, pensión, historiales (050).
- **No** clonar marca Pulpos/Square (copy Katzen: Punto de venta / Nueva venta).
- **No** librerías UI ajenas al design system.
- **No** commit / `firebase deploy` sin Luis.
- **No** tocar RTDB producción (`katzen-a0e3e`).
- **No** mezclar `Katzen/Medicamentos` (receta) con inventario en el scanner.

---

## 5. Mapa de decisiones (para el prompt)

```text
¿Qué vende recepción?
  ├─ Anaquel (croqueta, collar)     → riel Petshop → walk-in OK → stock al cobrar
  ├─ Consulta / vacuna / medicamento → riel Consulta → dueño+mascota → ticket, no finanzas
  ├─ Baño / corte                   → riel Peluquería → pendiente Banios o Nuevo baño
  └─ Gasto / reporte de caja        → /admin/finanzas (fuera del POS)
```

Persistencia (inalterable):

```text
VisitasService.persistir
  → líneas producto: InventarioService.registrarSalida (si no hay movimientoInventarioId)
  → cobro: CajaService.crearMovimiento({ visitaId })
```

---

## 6. Fuentes (URLs citadas)

### Pulpos
- https://pulpos.com/
- https://pulpos.com/blog/como-implementar-un-punto-de-venta-sin-problemas/
- https://pulpos.com/blog/facturar-y-vender-al-mismo-tiempo/
- https://pulpos.com/blog/punto-de-venta-con-facturacion-mexico/
- https://pulpos.com/blog/cortes-caja-refaccionaria-credito-talleres/

### Square / Shopify / checkout móvil
- https://squareup.com/help/us/en/article/8238-build-your-customer-s-cart-in-the-square-retail-pos-app
- https://squareup.com/help/ca/en/article/5143-bar-code-scanners-with-square-point-of-sale
- https://help.shopify.com/en/manual/sell-in-person/hardware/barcode-scanners
- https://www.shopify.com/blog/barcode-inventory-management
- https://stripe.com/au/resources/more/mobile-checkout-ui
- https://cartylabs.com/blog/shopify-checkout-ux-best-practices/
- https://www.sparq.ai/blogs/mobile-search-ux-shopify-patterns

### Lightspeed / pet POS
- https://www.lightspeedhq.com/pos/retail/pet-shop-point-of-sale/
- https://www.lightspeedhq.com/au/pos/retail/pet-shop-point-of-sale/
- https://www.lightspeedhq.com/au/customers/woouf/
- https://franpos.com/best-pet-store-pos
- https://www.retapos.com/blog/best-pos-system-pet-stores-2026
- https://www.eloerpsuite.com/pet-store-pos-software-animal-tracking-vaccination-grooming/

### PIMS veterinario
- https://digitail.com/
- https://digitail.com/blog/you-cant-manage-what-you-cant-track-a-better-way-to-handle-inventory/
- https://help.digitail.io/en/articles/5046084-add-and-manage-services
- https://www.provet.cloud/veterinary-software-solution
- https://support.provet.com/hc/en-gb/articles/11371582659485-Add-and-Manage-Treatment-Items-in-a-Consultation
- https://www.ezyvet.com/features/invoicing-and-transactions
- https://docs.ezyvet.com/en/browse-documentation/ezyvet/invoicing/getting-started/billing-triggers/billing-trigger-products
- https://www.ezyvet.com/blog/the-6-biggest-time-wasters-in-your-veterinary-practice-and-how-to-fix-them
- https://covetrus.com/covetrus-platform/workflow-and-productivity-tools/avimark/
- https://tradetechguide.com/p/avimark-software-review-for-veterinarians

### México fiscal
- https://blog.alegra.com/mexico/que-es-cfdi-4-0/
- https://senhub.mx/blog/factura-global-ventas-publico-general
- https://fiscalapi.com/blog/factura-global
- https://lucesdelsiglo.com/2026/08/24/facturar-desde-el-punto-de-venta-las-dudas-mas-frecuentes-negocios/
- http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/Guia_llenado_CFDI_global.pdf
- https://sdv.com.mx/compendio/criterios-normativos-sat/criterio-7-iva-n/
- https://notasfiscales.com.mx/el-alimento-para-nuestras-mascotas-y-el-impuesto-al-valor-agregado/
- https://www.amexfal.com/en/blog/industry-news-articles-1/propuesta-fiscal-para-mascotas-puede-mexico-eliminar-el-iva-en-croquetas-y-servicios-veterinarios-107
- Spec interna: `specs/024-cfdi-preparacion/spec.md`

### Accesibilidad
- https://developer.apple.com/design/human-interface-guidelines/buttons
- https://m3.material.io/foundations/designing/structure
- https://support.google.com/accessibility/android/answer/7101858

### Katzen (interno)
- `specs/055-pos-movil-ticket/spec.md`, `plan.md`, `tasks.md`
- `specs/054-cierre-sistema/CIERRE.md`
- `specs/050-unificacion-cobro/spec.md`
- `specs/046-ux-intuitiva-guiada/spec.md`
- `specs/043-producto-imagen-qr/spec.md`
- `specs/memory/constitution.md`, `specs/memory/domain-context.md`

---

## 7. PROMPT MAESTRO — UI redo táctil + no mutar maestros (autorización vigente)

> Pegar en Cursor. Prioridad absoluta = **interfaz**. La lógica de cobro / inventario / walk-in **se reutiliza**.  
> Pruebas add/edit/delete **solo en líneas del ticket**. **Nunca** crear/editar/borrar fichas de Productos, Clientes ni Pacientes (prod ni emulador de maestros).

```text
Eres el agente de KatzenVet Web (Angular 17 + Firebase RTDB).
Workspace: /Users/luisnino/Documents/GitHub/KatzenWebAngular
Idioma: español latino.
NO git commit. NO firebase deploy. NO tocar producción katzen-a0e3e.

## Constitución (obligatorio)
Lee ANTES de codear:
1. specs/memory/constitution.md — aislamiento prod; RTDB aditivo; UI design system; sin deploy.
2. specs/memory/domain-context.md — §3.8 inventario (imagen_url 043), §3.8d Visitas / ticket.
3. specs/055-pos-movil-ticket/spec.md + plan.md + tasks.md + este archivo.
4. docs/ADMIN-UI-ARCHITECTURE.md
5. specs/templates/qa-validation-guide.md

## Qué quiere Luis (esta autorización)
REHACER TODA la interfaz del Punto de venta. NO reescribir la lógica de negocio.
Touch tipo celular en web: seleccionar, agregar, quitar, TODO CON IMAGEN.

### Interfaz (prioridad absoluta)
Rehace visita-dialog + home /admin/visitas como POS táctil web:
- Grid de productos/servicios con FOTO (Producto.imagen_url 043; placeholder icono si no hay).
- Tap en la foto/tile = agregar al carrito (agregarProductoRapido / aplicarPreset / incluirBanio).
- +/− y quitar GRANDES (≥48×48 px) en tile y en línea del ticket.
- Sticky abajo: chip cliente/mostrador + botón Cobrar $XXX.
- 3 rieles: Petshop | Consulta | Peluquería (pos-rieles.util.ts).
- Mostrador solo petshop.
- Consulta/peluquería piden dueño con app-cliente-paciente-picker (SOLO elegir; no crear cliente/paciente).
- Look celular 375–430 px y usable en tablet (≥721: grid + panel ticket).

### Lógica: REUTILIZAR, no reescribir
NO tocar contratos de:
- VisitasService.crearVisita / actualizarVisita / persistir del diálogo
- confirmarCobro (el existente; no inventar otro)
- CajaService.crearMovimiento({ visitaId })
- InventarioService.registrarSalida (solo al cobrar/guardar, si línea producto sin movimientoInventarioId)
- cobro-integridad, walk-in CLIENTE_MOSTRADOR, pos-rieles.util, filtrarProductos (044)
NO registrar en caja en paralelo (050). NO «Registrar en caja» en baños/citas.

### Maestros: SOLO LECTURA
Permiso de pruebas add/edit/delete SOLO en líneas del ticket (array lineas[] en memoria / Katzen/Visitas).
PROHIBIDO escribir a:
- Katzen/Cliente
- Katzen/Mascota (pacientes)
- Katzen/Inventario/Productos
- Katzen/Productos o Katzen/Producto (legado móvil)
No abrir producto-dialog ni cliente-dialog desde el POS.
Catálogo: getProductos() lectura o mocks src/app/core/testing/mock-data.ts (MOCK_PRODUCTOS_POS).
Dueño: picker de fichas YA existentes.

### Archivos UI esperados
- src/app/visitas/visita-dialog.component.{html,scss,ts} — UI; helpers de foto en pos-foto.util.ts
- src/app/visitas/visitas.component.{html,scss} — home táctil
- src/app/visitas/pos-foto.util.ts + .spec.ts
- docs + spec/plan/tasks 055

### Tests
- Unit/UI con mocks (MOCK_PRODUCTOS_POS, MOCK_CLIENTE — no writes).
- npm run test:055 (foto + rieles + mostrador)
- npm run test:046, test:039, test:040
- npm run build
- npm start → http://localhost:4200 — smoke visual; NO cobrar contra prod.
- NUNCA writes a Katzen/Cliente, Katzen/Mascota, Katzen/Inventario/Productos.

### Prohibido
- PAC / Facturar / WhatsApp / Resend
- App nativa
- Librerías UI ajenas al design system
- Commit / deploy / credenciales / katzen-a0e3e

### Entrega
Cómo se usa, dónde está este prompt, archivos tocados, build/tests, URL :4200.
Spec 055 sigue in_progress (P0 scanner / P1 1-tap siguen diferidos).
```

---

## 7.1 Prompt diferido — P0 Scanner (cuando Luis lo autorice aparte)

No mezclar con el UI redo. El prompt anterior de cámara/HID (SC-011) sigue válido como **siguiente ola**, sin tocar `confirmarCobro`.

---

## 8. Recomendación final

**Implementar P0 Scanner** en la próxima sesión autorizada. Es el único hueco que todos los POS de mostrador (Pulpos, Square, Shopify, ezyVet Scan) tratan como *caja de verdad*, y Katzen ya tiene el 80 % (código 043 + sheet + match). Riesgo de cobro: nulo si no se toca `confirmarCobro`.

P1 (1 tap) espera a que recepción use precios de baño/consulta en el teléfono y confirme que teclear monto sí duele. P2 fiscal no es software de esta spec.
