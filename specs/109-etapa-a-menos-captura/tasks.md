# Tareas 109

- [x] Terminar y cobrar en Peluquería
- [x] Cierre del día (aviso en Hoy + ventana)
- [x] Acciones rápidas en el expediente
- [x] Paginador en español
- [x] Carga inicial: `DashboardModule` fuera de `AppModule` (main ≈381 kB comprimido; el build ya no pasa el presupuesto)
- [x] QA (2026-10-27, datos reales, sin guardar):
  - Hoy: aviso «11 cosas quedaron abiertas»; ventana lista 5 citas (Oreon, de prueba), 5 baños y el ticket de Raquel ($450) con nombres; cerrada sin tocar nada.
  - Avisos, Ayuda y «Llegó un paciente» abren desde el menú/Hoy (siguen funcionando sin el import directo).
  - Peluquería: «Terminar y cobrar» en el baño en proceso; paginador «1 – 50 de 196 · Por página».
  - Expediente a 412 px: 5 botones (2 por renglón, Cobrar a lo ancho); «Baño» abre el diálogo y se canceló.
  - Cierre a 412 px: ventana 400 px, sin scroll lateral; botones subidos a 44 px de alto.
- [ ] Observación para Etapa C: «Llegó un paciente» sigue pidiendo primero al dueño (el resto ya busca por mascota).
