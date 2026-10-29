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
- [x] CI verde — PR #42 (incluye #41)
- [x] QA preview 29 oct (solo lectura, nada enviado): 375 → en el expediente de Oreon (Luis) un toque abre la consulta «Control de rutina (PRUEBA)», botón Receta → vista con clínica, 5 de junio de 2026, Oreon · Felino · Peso 5 kg, Dueño, Indicaciones «Vitamina B12 oral por 5 días», Atendió. WhatsApp (interceptado, sin abrir): `wa.me/528112464359` con «Hola Luis, te compartimos la receta de Oreon…», sin diagnóstico. 1280 → ícono 💊 del expediente abre la receta; Imprimir / PDF → PDF A4 de 1 hoja revisado a ojo (encabezado, datos, indicaciones, firma), sin diagnóstico.
- Ajustes tras QA: botones apilados en celular; saludo «Hola Luis» aunque el nombre esté en mayúsculas; en celular un toque abre la consulta (antes no había forma).

## 116.3 «¿Cobrar ahora?»
- [x] Util puro + tests (cuándo preguntar; línea de consulta/vacuna; día local)
- [x] Servicio + tests (Después / Cobrar ahora / cancelar monto / sin dueño / error)
- [x] Consulta: 4 tests (nueva pregunta y cierra después; cita no; editar no; error no bloquea)
- [x] Vacuna aplicada nueva: un solo aviso con refuerzo
- [x] CI verde — PR #43 (incluye #41 y #42): lint + todas las pruebas unitarias + build
- [x] QA preview 29 oct (solo lectura): formularios de consulta y vacuna abren sin errores con el servicio nuevo; Historiales, Citas, Cobrar, Vacunas y Hoy cargan sin errores de consola.
- [ ] QA con guardado real: bloqueado para el agente (la vista previa escribe en producción). Pendiente con Luis: consulta de prueba en Oreon → «Después» → borrar; y otra → «Cobrar ahora» $1 → quitar la línea del ticket.
