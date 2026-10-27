# Tasks — spec 110

- [x] Tipos Cepillado / Baño con cepillado + etiquetas (listado, portal)
- [x] Util `banio-varias-mascotas` + unit tests
- [x] Chips «¿Trae más mascotas?» y guardado de N baños
- [x] Campo Hora de regreso
- [x] Precio al final: «Iniciar» sin precio; se pide al terminar/cobrar
- [x] QA en preview (1280 y 412) — ver registro abajo

## Registro QA
2026-10-27 · preview QA con datos reales, sin guardar:
- 1280: chips Cepillado / Baño con cepillado; Hora 05:49 p.m. junto a Fecha.
- Maruca (Alejandra Berlanga) → «¿Trae más mascotas?» con Coco, Nacho, Tina; marcadas → botón «Guardar 4 baños». Cancelado.
- Lista: baños sin precio muestran ▶ Iniciar; «Terminar y cobrar ahora» pregunta «¿Cuánto se cobra por Coco?». Cancelado.
- 412: chips y hora en una columna, sin scroll lateral.
- CI verde (Lint · Test · Build).
