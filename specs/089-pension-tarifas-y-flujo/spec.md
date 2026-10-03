# Spec: Pensión — tarifas oficiales y flujo de alta (Fase 0+)

**ID:** 089-pension-tarifas-y-flujo  
**Estado:** done  
**Fecha:** 2026-10-02  
**Autor:** Cursor / Luis Alfonso Niño Martínez  
**Nivel:** L2 (Fase 0–1 UI/defaults; sin functions)  

---

## Problema

Al registrar pensión en el **web**, el staff ve varios inputs numéricos (precio/día, total, costo) en lugar de las **tarifas fijas por tamaño** que ya usan en Eleventa. Además reportaron un alta de pensión que «quedó como corte de baño».

Confirmado por Luis (2026-10-02):
- El alta problemática fue en **web** (no solo PDV).
- Precios oficiales **por día** (hoy):

| Paquete | Rango | Precio / día |
|---------|-------|--------------|
| Chico o gato | 0–10 kg | **$250** |
| Mediano | 10.1–15 kg | **$300** |
| Grande | 15.1–30 kg | **$400** |
| Gigante | >30 kg | **$500** |

---

## User stories

### US-0 — Fase 0: congelar hechos + fallback de tarifas (esta entrega)

Como **equipo**  
Quiero **tarifas oficiales en código y defaults que no queden en $0**  
Para **que al elegir tamaño ya salga el precio correcto**, y dejar documentado el hallazgo del bug

**Criterios de aceptación:**

- [x] SC-001: Constantes oficiales en `pension-tarifas.util.ts` (250/300/400 + gigante 500 documentado).
- [x] SC-002: Si `DefaultsPensionPorTamano` falta o trae `precioDia: 0`, el servicio usa la tarifa oficial (sin escribir prod desde el agente).
- [x] SC-003: Auditoría: `PensionDialog` / `crearEstancia` **no** escriben en `Katzen/Banios`; Alta rápida mapea `pension` → `PensionDialog` y `banio` → `BanioDialog` sin cruce de código.
- [x] SC-004: Chips Alta rápida diferencian copy Baño (peluquería/corte) vs Pensión (hospedaje).
- [x] SC-005: Spec + plan de Fases 1–2 en `tasks.md`; memoria actualizada.

### US-1 — Fase 1: paquetes en UI + gigante

Como **doctora**  
Quiero **elegir el paquete de pensión (4 opciones) sin teclear precios**  
Para **registrar más rápido y sin errores**

**Criterios de aceptación:**

- [x] SC-006: Tamaño `gigante` en modelo + defaults + diálogo (aditivo en RTDB).
- [x] SC-007: UI de paquetes (cards) con precio visible; inputs de precio/costo en «Ajuste manual».
- [x] SC-008: Total = precio×días (resumen); override opcional en avanzado. Sugerencia por peso al elegir mascota.

### US-2 — Fase 2: cobro con nombre de paquete + alta activa

Como **recepción / caja**  
Quiero **ver «Pensión · Mediano…» en el ticket y en por cobrar**  
Para **no confundirlo con baño/corte**, y que la estancia nueva salga lista para cobrar hoy

**Criterios de aceptación:**

- [x] SC-009: `descripcionCobroPension` / `conceptoCajaPension` en util; usados en cobro caja, agregar a visita y «Por cobrar hoy».
- [x] SC-010: Categoría de línea / movimiento sigue siendo `pension` (nunca `banio`/`corte`).
- [x] SC-011: Alta nueva default `estado: activa` (aparece en por cobrar el mismo día sin check-in extra).

---

## Fuera de alcance (Fase 0–2)

- Deploy hosting/functions sin OK de Luis
- Escritura a RTDB prod de defaults (Luis puede guardar desde Finanzas tras ver precios)
- Rediseño completo del cobro POS
- Borrado/migración de baños mal etiquetados

---

## Contratos de Datos y UI

- **RTDB:** Lectura de `Katzen/Finanzas/DefaultsPensionPorTamano` (existente). Fallback en cliente si 0/ausente. Estancias siguen en `Katzen/Pension/Estancias`. App móvil: sin cambio de contrato (campos opcionales iguales).
- **Pruebas:** mocks + unit tests util; smoke localhost. Sin prod.
- **UI:** diálogo pensión existente; chips Alta rápida.

---

## Hallazgo bug «pensión → corte» (Fase 0)

| Pregunta | Resultado |
|----------|-----------|
| ¿`PensionService.crearEstancia` escribe baños? | **No** — solo `Katzen/Pension/Estancias` |
| ¿Alta rápida cruza acciones? | **No** — `abrirAtencionAltaRapida` abre diálogos distintos |
| ¿Causa probable? | Confusión UX Baño vs Pensión (chips cercanos; Baño incluye «corte») o cobro posterior en otro módulo |
| Mitigación Fase 0 | Copy más claro en chips |
| Fase 1–2 | Paquetes pensión + reforzar diferenciación visual |

Si reaparece: anotar paciente/fecha y revisar nodos `Pension/Estancias` vs `Banios` (Luis / emulador; agente no lee prod).

---

## Testing mínimo

Ver `tasks.md`.

---

## Notas

- Gigante ($500) queda en constantes Fase 0; UI modelo en Fase 1.
- Finanzas → Defaults pensión: al cargar con 0, la UI mostrará oficiales vía normalize; «Guardar defaults» persiste (acción manual admin).
