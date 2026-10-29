# Tasks — Spec 116

## 116.1 Fotos en la consulta
- [x] Util puro + tests (`historial-archivos.util.spec.ts`)
- [x] Diálogo: bloque visible, cámara/galería, miniaturas, conservar al editar, no guardar si falla la subida (+5 tests)
- [x] Galería + visor en detalle y fichas
- [x] CI verde (lint · test · build) — PR #41
- [x] QA preview 29 oct, sin guardar: 375 → Nuevo historial muestra «Fotos y estudios» con Tomar foto / Elegir; foto 4000×3000 + PDF → 2 miniaturas «Nueva»; ✕ quita. 1280 → ficha y expediente de Oreon (Luis) abren; Editar «Control de rutina (PRUEBA)» muestra el bloque. Sin errores.
- [ ] QA subida real (foto de prueba en consulta de prueba y quitarla) — con OK de Luis

## 116.2 Receta para el dueño
- [x] Util puro + tests (`receta-documento.util.spec.ts`): vista, fecha sin brincar de día, peso, mensaje sin diagnóstico, enlace wa.me, nombre del PDF
- [x] PDF A4 multi-hoja + diálogo con WhatsApp / Imprimir
- [x] Accesos: detalle, menú Historiales, expediente
- [ ] CI verde
- [ ] QA preview 375 y 1280 (abrir receta de «Control de rutina (PRUEBA)» de Oreon; PDF; WhatsApp abre el chat, sin enviar)
