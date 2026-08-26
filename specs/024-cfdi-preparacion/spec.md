# Spec: CFDI / SAT — preparación (fase controlada)

**ID:** 024-cfdi-preparacion  
**Estado:** done  
**Fecha:** 2026-08-26  
**Autor:** Agent (pedido Luis Alfonso Niño Martínez)  

---

## Problema

La clínica cobrará con caja (014+) pero **no hay datos fiscales** del cliente ni roadmap claro hacia CFDI. Integrar un PAC de pago **sin** OK explícito de Luis es riesgoso.

Esta entrega captura datos mínimos y documenta fase 2 — **sin timbrar**.

---

## User stories

### US-1 — Datos fiscales en ficha cliente

Como **recepcionista / admin**  
Quiero guardar RFC, uso CFDI y flag “requiere factura” en el cliente  
Para estar listos cuando haya PAC.

**Criterios:**

- [x] SC-001: Campos aditivos en `Katzen/Cliente`: `rfc?`, `razonSocial?`, `usoCfdi?`, `regimenFiscal?`, `codigoPostalFiscal?`, `requiereFactura?`
- [x] SC-002: UI sección «Datos fiscales» en diálogo cliente (form + vista)
- [x] SC-003: Nota visible «timbrado fase 2»
- [x] SC-004: Validación RFC opcional (mismo patrón proveedores)
- [x] SC-005: **No** integrar PAC / timbrado real
- [x] SC-006: Roadmap fiscal documentado en esta spec + ROADMAP

### US-2 — Modelo factura futuro (solo contrato)

- [x] SC-007: Documentar nodo futuro `Katzen/Facturas/{id}` con `uuid?`, `estatus: borrador|timbrada|cancelada`, `clienteId`, `cajaMovimientoId?` — **sin implementar escritura**

---

## Fuera de alcance

- Timbrado real / PAC de pago
- Cancelación CFDI, series, folios
- XML/PDF factura
- IVA desglose formal SAT

---

## Contratos de Datos y UI (Obligatorio)

| Nodo | Lectura | Escritura | Notas |
|------|---------|-----------|-------|
| `Katzen/Cliente.*fiscales` | staff | staff | opcionales legacy-safe |
| `Katzen/Facturas` | — | — | **solo doc** fase 2 |

- **Pruebas:** mocks / UI dialog; nunca timbrar en prod.
- **UI:** `admin-dialog-shell`, sección en `cliente-dialog`.

---

## Roadmap fiscal

| Fase | Qué | Condición |
|------|-----|-----------|
| **1 (esta)** | Captura datos fiscales cliente | Hecho |
| **2** | Elegir PAC + secret + CF `timbrarFactura` | **OK explícito Luis + proveedor** |
| **3** | UI emitir desde caja / pensión | Tras 2 |
| **4** | Cancelación / PDF portal | Opcional |

Campo futuro en movimiento caja o Facturas: `cfdiUuid?` (aditivo).

---

## Roles

Staff con acceso a `clientes` (misma política 011).

---

## Backend

- [ ] PAC — **bloqueado** sin OK Luis
- [x] Solo campos Cliente aditivos (sin rules nuevas: Cliente ya staff)
