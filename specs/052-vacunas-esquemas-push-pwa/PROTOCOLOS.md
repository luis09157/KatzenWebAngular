# Anexo clínico — protocolos de vacunación (KatzenVet)

**Spec:** `specs/052-vacunas-esquemas-push-pwa/`  
**Fecha de investigación:** 2026-08-28  
**Uso en producto:** defaults **sugeridos**. El veterinario **siempre confirma**. No sustituye etiqueta del biológico ni juicio clínico.

> **Disclaimer médico:** este documento resume guías internacionales y normas mexicanas para **diseñar software** (intervalos, hints, catálogo). No es un protocolo clínico oficial de la clínica ni una receta. Duración de inmunidad, vía y edad mínima se leen en la **etiqueta del lote** que se aplique.

---

## Fuentes citadas (URLs)

| Código | Fuente | URL |
|--------|--------|-----|
| WSAVA-2024 | WSAVA Vaccination Guidelines 2024 (JSAP / PDF oficial) | https://wsava.org/wp-content/uploads/2024/05/2024-Guidelines-for-the-Vaccination-of-Dogs-and-Cats.pdf |
| WSAVA-2024b | Mismo documento (copia abril 2024) | https://wsava.org/wp-content/uploads/2024/04/WSAVA-Vaccination-guidelines-2024.pdf |
| WSAVA-JSAP | Artículo JSAP Wiley | https://onlinelibrary.wiley.com/doi/10.1111/jsap.13718 |
| WSAVA-DOG-T | Tabla core/non-core perros (2025) | https://wsava.org/wp-content/uploads/2025/06/Dogs-Vaccination-Table.pdf |
| WSAVA-CAT-T | Tabla core/non-core gatos (2025) | https://wsava.org/wp-content/uploads/2025/06/Cats-Vaccination-Table.pdf |
| AAHA-2022 | AAHA Canine Vaccination Guidelines 2022 (tabla core/non-core) | https://www.aaha.org/wp-content/uploads/globalassets/02-guidelines/2022-aaha-canine-vaccination-guidelines/resources/2022-aaha-core-and-noncore-vaccines-for-dogs.pdf |
| AAHA-2022-WEB | Recomendaciones core/non-core caninas | https://www.aaha.org/resources/2022-aaha-canine-vaccination-guidelines/recommendations-for-core-and-noncore-canine-vaccines/ |
| AAHA-CPV | CPV / MDA / dosis ≥16 sem | https://www.aaha.org/resources/2022-aaha-canine-vaccination-guidelines/canine-parvovirus-cpv/ |
| AAHA-CDV | CDV / MDA | https://www.aaha.org/resources/2022-aaha-canine-vaccination-guidelines/canine-distemper-virus-cdv/ |
| AAFP-2020-PDF | 2020 AAHA/AAFP Feline Vaccination Guidelines | https://www.aaha.org/wp-content/uploads/2020/08/2020-aahaa-afp-feline-vaccination-guidelines.pdf |
| AAFP-2020-JFMS | JFMS full text | https://journals.sagepub.com/doi/full/10.1177/1098612X20941784 |
| AAFP-TABLE | Tabla práctica felina | https://www.aaha.org/wp-content/uploads/globalassets/02-guidelines/feline-vaccination-guidlines/feline-vaccine-table.pdf |
| NOM-011 | NOM-011-SSA2-2011 rabia humana/perros/gatos (DOF) | https://www.dof.gob.mx/normasOficiales/4570/salud/salud.htm |
| CENAPRECE | Lineamientos SNVACyF 2015 | http://www.cenaprece.salud.gob.mx/programas/interior/zoonosis/descargas/pdf/lineamientos_SNVACyF2015.pdf |
| NOBIVAC-MX | Ficha Nobivac® Rabia México (MSD) | https://www.msd-salud-animal.mx/wp-content/uploads/sites/43/2021/07/Nobivac-Rabia.pdf |
| NOBIVAC-MX2 | Producto Nobivac Rabia MX | https://www.msd-salud-animal.mx/productos/nobivac-rabia/ |
| NOBIVAC-PLUS | SPC Nobivac Myxo-RHD PLUS (UK VMD) | https://www.vmd.defra.gov.uk/productinformationdatabase/files/QRD_Documents/QRD-Auth_2207416.PDF |
| RWAF | Rabbit Welfare Association — vacunas | https://rabbitwelfare.co.uk/welfare-need/vaccines/ |
| FILAVAC-SPC | Filavac VHD K C+V SPC (UK) | https://vmd.defra.gov.uk/ProductInformationDatabase/files/SPC_Documents/SPC_1170567.PDF |
| PRONABIVE | VEHC-2-BIVE (México, RHDV2) | https://www.gob.mx/pronabive/articulos/centro-de-informacion-vehc-2-bive?idiom=es |
| BM-MX | Mixomatosis / RHDV2 contexto México | https://bmeditores.mx/entorno-pecuario/vacunar-a-los-conejos-de-ahora-en-adelante-y-por-que/ |
| AFA-2025 | American Ferret Association Vaccination Policy (rev. 2026) | https://www.ferret.org/pdfs/health/AFA_Vaccination_Policy_March2026.pdf |
| AFA-OFFLABEL | AFA: única excepción off-label Nobivac Puppy DPv | https://www.ferret.org/pdfs/health/TiterLetter.pdf |
| PMC-CDV | Disponibilidad Purevax / LATAM | https://pmc.ncbi.nlm.nih.gov/articles/PMC9862170/ |

---

## Principio de producto (todas las especies)

| Principio | Valor Katzen |
|-----------|----------------|
| Default | **Sugerencia** de intervalo / próxima fecha |
| Confirmación | Diálogo: vet confirma o edita antes de guardar |
| Etiqueta | Edad mínima, vía y DOI del **lote** mandan sobre el default |
| Intervalo mínimo entre dosis MLV core | **14 días** (WSAVA: no vacunar más frecuente que cada 2 semanas) |
| MDA | La dosis de cierre de serie a **≥16 semanas** es la crítica |
| Fallecido | No reactivar recordatorios (spec **017**) |
| Push | No spamear (ver plan ola 2) |

---

## 1. Perro (canino)

### 1.1 Clasificación core vs non-core

**WSAVA 2024 — core mundial (todos los perros):** CDV + CAV + CPV (combinación tipo DHPP/DAPP; parainfluenza a menudo va en el mismo vial pero **no** es core mundial por sí sola).

**WSAVA 2024 — rabia:** core donde la enfermedad es endémica **o** la ley lo exige. **México: sí** (NOM-011).

**WSAVA 2024 — Leptospira:** pasó de non-core genérico a **core regional** donde hay leptospirosis canina, serogrupos conocidos y vacuna adecuada. En México hay leptospirosis; Katzen la trata como **core sugerida regional** (vet confirma serogrupos del biológico local).

**AAHA 2022 — core EE.UU.:** CDV, CAV-2, CPV-2, **leptospirosis 4-serovar** y **rabia**. Non-core: Bordetella, Lyme, CIV, toxoide de cascabel.

**Katzen (México) — defaults de catálogo:**

| Código catálogo | Antígenos típicos | Categoría Katzen | Refuerzo adulto default |
|-----------------|-------------------|------------------|-------------------------|
| `dhpp` / `dapp` / `quintuple` / `sextuple` / `puppy` | CDV+CAV+CPV ± CPI ± lepto según vial | **core** (el combo MLV) | Tras serie: 6–12 meses; luego **3 años** solo para fracción MLV core **si** el vet lo confirma. Default MX práctica frecuente: **anual** editable. |
| `antirrabica` | Rabia | **core legal MX** | **365 días. Nunca default 3 años.** |
| `lepto` (si va aparte del sextuple) | Leptospira (serogrupos del lote) | **core regional MX** | **2 dosis inicio, luego anual. Nunca lógica trienal del core MLV.** |
| `bordetella` | *B. bronchiseptica* ± CPI | **non-core** | Anual (o según vía/etiqueta) |
| `civ` | Influenza H3N8/H3N2 | **non-core** | 2 dosis + anual. **Disponibilidad MX: confirmar con proveedor. WSAVA 2024 indica que CIV está disponible principalmente en EE.UU.** |
| `giardia` | Giardia | **no recomendada (WSAVA)** | No sugerir esquema. Permitir registro manual (`Otra` / tipo existente) con hint. |
| `coronavirus` / CCoV | Coronavirus entérico canino | **no recomendada (WSAVA)** | Igual: no sugerir; registro manual con hint. |

### 1.2 Anticuerpos maternos (MDA) — por qué ≥16 semanas es crítica

Los MDA interfieren de forma sustancial con vacunas MLV core (CDV, CAV, CPV). El nivel varía **entre camadas y dentro de la camada**. Por eso:

1. Se da una **serie** (no una sola dosis temprana).
2. Intervalo **2–4 semanas** (WSAVA; AAHA 2–4 sem).
3. **No** intervalos de 7 días para core MLV (WSAVA: vacunar más frecuente que cada 2 semanas **no** se aconseja).
4. La dosis administrada a **≥16 semanas** es la más importante: para entonces los MDA han bajado en la gran mayoría y el cachorro puede responder.
5. AAHA CPV/CDV: en zonas de alto riesgo preferible continuar hasta **18–20 semanas**.
6. Si solo se puede aplicar **una** dosis (restricción de costo), WSAVA: esa dosis a **16+ semanas**, no a las 6.
7. Una minoría aún tiene MDA a las 16 semanas → WSAVA 2024 recomienda **revacunar a las ~26 semanas (≈6 meses)** en lugar de esperar a los 12–16 meses, para cerrar la ventana de susceptibilidad.

**Copy UI (hint, no bloqueo):** «Los anticuerpos de la madre pueden anular dosis tempranas. La dosis de cierre debe ser a las 16 semanas o más.»

### 1.3 Esquema cachorro — core MLV (DHPP/DAPP)

| Etapa | Edad | Intervalo | Nº dosis | Fuente |
|-------|------|-----------|----------|--------|
| Inicio | **6–8 semanas** (no antes de 6 sem WSAVA/AAHA) | — | 1ª | WSAVA-2024, AAHA-2022 |
| Serie | Hasta **≥16 semanas** (alto riesgo: 18–20) | **2–4 semanas** (mínimo 14 días) | AAHA: **al menos 3 dosis** entre 6 y 16 sem | AAHA-2022 tabla |
| Perro que empieza **>16 sem** | Adulto/joven sin serie | 2 dosis MLV combo, 2–4 sem | 2 | AAHA-2022 |
| Refuerzo post-serie | **6 meses** (WSAVA 2024 preferido) **o** 12 meses (clásico) | — | 1 | WSAVA-2024 vs práctica tradicional |
| Mantenimiento core MLV | Tras ese refuerzo | **hasta 3 años** (DOI MLV) **o anual** (práctica MX frecuente) | — | WSAVA / etiqueta / vet |
| Default Katzen post-serie | Configurable en `Config/Vacunacion` | Default producto: **365 días** (1 año), editable a 183 (6 meses) o 1095 (3 años) **solo para core MLV, nunca rabia/lepto** | — | Decisión producto |

### 1.4 Rabia — México vs AAHA

| Contexto | Edad inicio | Refuerzo | Fuente |
|----------|-------------|----------|--------|
| **Campañas NOM-011** (puestos gratuitos) | Desde **1 mes**; revacunar a los **3 meses**; luego **cada año de por vida** | Anual | NOM-011-SSA2-2011 §8.3.2.1 |
| **Clínica privada — etiqueta típica MX** (Nobivac® Rabia) | Desde **3 meses (12 semanas)**; si se vacuna más joven, revacunar a los 3 o 6 meses | Etiqueta: DOI perro/gato **3 años**; **«las regulaciones locales pueden exigir revacunación más temprana»** | NOBIVAC-MX |
| **AAHA 2022** | Según ley estatal EE.UU.; hay productos 1 y 3 años | Según ley / DOI | AAHA-2022 |
| **Default Katzen** | Hint: no sugerir rabia **antes de ~12 sem** en consulta privada; si el paciente llegó de campaña NOM a 1 mes, hint de refuerzo a 3 meses | **Intervalo 365 días. Prohibido default 1095 días (3 años) para rabia.** El vet puede acortar, no alargar por default. | Producto + NOM |

**Regla de negocio dura (software):** `antirrabica.intervaloDiasDefault = 365` y `permiteTrienal = false`.

### 1.5 Leptospira — no mezclar con core trienal

| Item | Valor | Fuente |
|------|-------|--------|
| Inicio cachorro | Típicamente **desde 8–12 sem** (seguir etiqueta; AAHA 4-serovar desde 12 sem) | WSAVA-2024, AAHA-2022 |
| Serie inicial | **Siempre 2 dosis**, 2–4 semanas | Ambas |
| Adulto naïve | **2 dosis**, 2–4 sem, cualquiera sea la edad | AAHA-2022 |
| Mantenimiento | **Anual** (bacterina; DOI ~1 año) | WSAVA-2024, AAHA-2022 |
| Si “caducó” la anual | Precaución WSAVA: **reiniciar serie de 2 dosis** | WSAVA-2024 |
| Software | Flag `nuncaTrienal: true`. Si el combo es séxtuple (core+lepto), el recordatorio de **lepto** sigue anual aunque el vet ponga core MLV a 3 años — **dos líneas de refuerzo** o el más corto manda con hint. | Producto |

### 1.6 Non-core frecuentes

| Vacuna | Serie | Refuerzo | Notas | Fuente |
|--------|-------|----------|-------|--------|
| Bordetella IN/oral | **1 dosis** (mucosa) | Anual | Algunas etiquetas desde 3–8 sem | WSAVA-DOG-T, AAHA-2022 |
| Bordetella parenteral | **2 dosis** 2–4 sem | Anual | No copiar lógica IN | Idem |
| CIV H3N8/H3N2 | **2 dosis** 2–4 sem desde ~6 sem | Anual | **Disponibilidad MX no confirmada en esta investigación; WSAVA: “currently available only in USA”.** Catálogo: tipo opcional + hint «confirmar proveedor». | WSAVA-2024 |
| CPiV (si no va en combo) | Serie 2–4 sem hasta 16+ | Anual | Non-core; DOI incierta | WSAVA-2024 |

### 1.7 No recomendadas (WSAVA) — no borrar del historial si ya existen

| Vacuna | Por qué | UI Katzen |
|--------|---------|-----------|
| CCoV (coronavirus entérico) | Evidencia débil como patógeno primario en adultos; diarrea leve en cachorros; vacuna parenteral no induce IgA intestinal protectora; no cubre cepas pantropicas | Hint «WSAVA no la recomienda de rutina». No auto-esquema. |
| Giardia | No amenaza vital; responde a terapia; no hay evidencia sólida de que evite shedding | Mismo patrón. El fallback actual **ya incluye** `giardia` — se conserva para registro, no para sugerir. |

---

## 2. Gato (felino)

### 2.1 Core vs non-core (AAFP/AAHA 2020 + WSAVA 2024)

| Vacuna | Categoría | Notas |
|--------|-----------|-------|
| FVRCP (FPV + FHV-1 + FCV) = triple felina | **Core mundial** | WSAVA-CAT-T, AAFP-2020 |
| Rabia | **Core en MX** (endémica / NOM) | Igual que perro: **anual default**, no 3 años |
| FeLV | **Core en gatitos y gatos &lt;1 año** (susceptibilidad por edad). Adulto indoor de bajo riesgo = **non-core / decisión vet** | AAFP-2020 |
| *Chlamydia*, Bordetella felina, FIV, FIP | Non-core o no recomendadas según producto | Fuera de defaults ola 1; `Otra` |

**Test FeLV antes de vacunar:** AAFP «Test to establish FeLV antigen status prior to vaccination». **Katzen:** hint UI, **no** hard-block (el vet puede vacunar sin test documentado en el sistema).

### 2.2 Esquema gatito — FVRCP

| Etapa | Edad | Intervalo | Fuente |
|-------|------|-----------|--------|
| Inicio parenteral | **No antes de 6 semanas** (IN FHV/FCV sin FPV puede empezar ~4 sem en alto riesgo — no default Katzen) | — | AAFP-2020, WSAVA-CAT-T |
| Serie | Cada **3–4 semanas** hasta **16–20 semanas** | Mínimo 14 días | AAFP tabla, WSAVA |
| Gato que empieza &gt;16 sem | 1–2 dosis combo (AAFP: una o dos) | 3–4 sem si dos | AAFP-2020 |
| Refuerzo post-serie | **6 meses** (AAFP 2020 y WSAVA: sustituye el “anual” clásico de FVRCP para cerrar MDA; hasta 1/3 de gatitos pueden no responder a la dosis de 16 sem) **o 1 año** (práctica tradicional / logística) | — | AAFP-2020, WSAVA-2024 |
| **Default Katzen FVRCP post-serie** | **1 año (365 días), editable** a 6 meses (183 días) | Configurable | Pedido Luis |
| Adulto low-risk FVRCP | Cada **3 años** (SQ) posible; alto riesgo / pensión: hasta **anual**; IN a menudo **anual** | Hint, no forzar | WSAVA-CAT-T, AAFP |
| Gestación | Evitar MLV FPV (hipoplasia cerebelosa teórica) | Hint | AAFP-2020 |

### 2.3 FeLV

| Item | Valor | Fuente |
|------|-------|--------|
| Inicio | Desde **~8 semanas**, **2 dosis** 3–4 sem | AAFP-2020 |
| Adulto naïve | 2 dosis 3–4 sem | AAFP |
| Refuerzo | 12 meses tras la serie; luego **anual si alto riesgo**; 2–3 años si bajo riesgo y hay DOI | AAFP-2020 |
| Indoor adulto | Decisión vet (non-core) | AAFP |
| Default Katzen | Sugerir serie en &lt;1 año; en adulto indoor **no** auto-agendar FeLV — hint «¿sale / convive con gatos de estatus desconocido?» | Producto |

### 2.4 Rabia felina MX

Misma regla que canina: NOM anual de por vida en campañas; clínica privada etiqueta ~12 sem; **Katzen intervalo 365 días**.

---

## 3. Conejo (lagomorfo) — ola posterior

### 3.1 Enfermedades objetivo

| Enfermedad | Agente | Vacunas de referencia (Europa/UK) | México |
|------------|--------|-----------------------------------|--------|
| Mixomatosis | Myxoma virus | Nobivac Myxo-RHD / Myxo-RHD **PLUS** (vector mixoma + RHDV1/RHDV2); Mixohipra® (HIPRA) | **No inventar stock de clínica.** Mixomatosis endémica en varios países; biológicos europeos **no** están confirmados en el mostrador MX de compañía. **Confirmar con proveedor local / SENASICA.** |
| RHD / RHDV1 | Calicivirus clásico | Filavac VHD K C+V, Eravac, Nobivac PLUS | Brotes RHDV2 documentados en MX desde 2020 (Chihuahua → difusión nacional). |
| RHDV2 | Variante 2010 | Nobivac PLUS, Filavac, YURVAC RHD, Eravac | **VEHC-2-BIVE** (PRONABIVE): inactivada, ≥8 semanas, IM; generada para **granjas**; distribución coordinada DGSA/CPA. Autoridades también mencionaron conejos de compañía, pero el producto **no** es el esquema europeo de mascota. |

### 3.2 Esquemas Europa/UK (referencia, no default MX)

| Producto | Edad mínima | Serie | Refuerzo | Fuente |
|----------|-------------|-------|----------|--------|
| Nobivac Myxo-RHD PLUS | **5 semanas** (algunos materiales: 7 sem para DOI 12 meses completa) | **1 dosis** | **Anual** (DOI 1 año; inicio inmunidad 3 sem) | NOBIVAC-PLUS, RWAF |
| Filavac VHD K C+V | **10 semanas** | **1 dosis** (si &lt;10 sem off-label: 2ª dosis al cumplir 10 sem) | **Anual** (DOI 1 año; inicio ~7 días) | FILAVAC-SPC |
| YURVAC RHD | Según etiqueta HIPRA | No mezclar el mismo día con Nobivac; **≥2 semanas** de separación (RWAF) | Según etiqueta | RWAF 2025 |

### 3.3 Default Katzen ola 3 (honesto)

1. Añadir especie **`CONEJO`** al catálogo de pacientes (hoy: CANINO, FELINO, AVE, REPTIL, OTRO — **no hay conejo**).
2. Tipos de vacuna: `mixomatosis`, `rhdv_rhdv2`, `otra_conejo`.
3. Intervalo default **365 días** + **intervalo 100 % manual**.
4. Copy: «Muchos biológicos de mixoma/RHD europeos **pueden no estar** en México. Confirma el producto con tu proveedor. Si no hay biológico, registra “Otra” o no agendes.»
5. No importar ciegamente Nobivac PLUS / Filavac como si estuvieran en inventario Katzen.

---

## 4. Hurón y otros exóticos

### 4.1 Hurón (*Mustela putorius furo*)

| Vacuna | Recomendación seria | Off-label | México |
|--------|---------------------|-----------|--------|
| Moquillo (CDV) | Producto **licenciado para hurón** (Purevax® Ferret Distemper, NeoVac® FD en EE.UU. AFA 2025) | AFA: la **única** excepción off-label que respaldan es **Nobivac Puppy DPv** (antígeno limitado). **No** combos caninos multivalentes (DHPP/séxtuple) de rutina | Purevax: disponibilidad LATAM **limitada** (literatura: no disponible en varios países de América Latina). **Confirmar proveedor.** |
| Rabia | Producto etiquetado para hurón (p. ej. Nobivac® Rabia MX **incluye hurón**; DOI hurón **1 año**; desde 3 meses) | — | Ficha MSD MX: hurón anual / SC |

**Regla de producto:** no sugerir «aplicar la misma quíntuple del perro». Hint fuerte. Especie `HURON` puede vivir en `OTRO` en ola 1; ola 3+ tipos opcionales.

Serie típica AFA (kits): varias dosis CDV ~ cada 3 semanas hasta ~14 sem, luego anual — **solo si hay biológico adecuado**.

### 4.2 Aves y reptiles

**No hay calendario tipo mamífero** (no DHPP, no FVRCP, no rabia de rutina en clínica de perros/gatos).

Vacunas aviares (p. ej. Newcastle, viruela) son de **producción / aviario**, no de consulta de compañía estándar. Reptiles: inmunología distinta; no forzar esquema.

**Regla de producto (ola 1):** especie **no** perro/gato/conejo → mensaje fijo:

> «Sin esquema sugerido. Indica intervalo o no agendar.»

No copiar intervalos de `quintuple`/`triple_felina`.

---

## 5. Contraindicaciones y hints UX (nunca hard-block médico)

| Situación | Hint (español) | ¿Bloqueo? |
|-----------|----------------|-----------|
| Enfermo / fiebre | «No se recomienda vacunar un animal enfermo o con fiebre. Reprograma si el criterio clínico lo indica.» | No |
| Gestación | «Algunas vacunas MLV (p. ej. FPV) se evitan en gestación. Revisa etiqueta y criterio.» | No |
| Intervalo &lt; 14 días en core MLV | «El protocolo típico es 21–28 días, mínimo 14. No sugerimos 7 días.» | Soft-warn; vet puede forzar |
| Rabia &lt; ~12 sem clínica privada | «Etiqueta habitual: desde 12 semanas. Las campañas NOM pueden vacunar desde 1 mes con refuerzo a los 3.» | Soft-warn |
| FeLV sin test | «AAFP recomienda test de antígeno FeLV antes de vacunar.» | No |
| Hurón + vacuna de perro combo | «No uses el combo canino off-label sin criterio y producto adecuado.» | Soft-warn |
| Fallecido (017) | No crear/reactivar recordatorios ni push | **Sí** (ya implementado / no revertir) |
| Dueño sin token push | No reintentar en loop; `skipped_no_tokens` | — |

---

## 6. Qué NO es vacuna (fuera de 052 ola 1)

| Tema | Tratamiento |
|------|-------------|
| Desparasitación interna/externa | **No** meter en 052. Candidata **053** si Luis lo pide (calendario distinto, no es inmunización). |
| Esterilización | Fuera de alcance |
| Títulos de anticuerpos (titers) | Nota opcional en UI: «El titer no sustituye este registro»; no motor de titers |
| Alergias a vacuna | Ya hay **034** (alergias mascota, hint cruzado) |

---

## 7. Mapeo al catálogo actual Katzen (`tiposVacunasFallback`)

Hoy el diálogo usa, entre otros: `puppy`, `quintuple`, `sextuple`, `triple_felina`, `antirrabica`, `bordetella`, `leucemia_felina`, `giardia`, `otra`.

| Legacy | Esquema 052 | Acción |
|--------|-------------|--------|
| puppy / quintuple / sextuple | core canino MLV ± extras del vial | Semántica por especie + flags lepto si el nombre implica séxtuple |
| triple_felina | FVRCP | Core felino |
| antirrabica | rabia MX anual | Flag `nuncaTrienal` |
| bordetella | non-core | Serie según vía (default anual 1 dosis; vet elige IN vs SQ) |
| leucemia_felina | FeLV | Core &lt;1 año |
| giardia | no recomendada | Hint; sin auto-serie |
| otra | manual | Intervalo obligatorio si se pide recordatorio |
| *(nuevo)* lepto, civ, mixomatosis, rhdv_rhdv2 | ver olas | Aditivo en `TiposVacunas` |

Especies paciente hoy: `CANINO`, `FELINO`, `AVE`, `REPTIL`, `OTRO`. **Falta `CONEJO`.** Normalización ya existe para perro/gato en `entity-stats.util.ts` (`canino`/`perro`, `felino`/`gato`).

---

## 8. Constantes sugeridas para el motor (no código aún)

```text
INTERVALO_MINIMO_DIAS_MLV_CORE = 14
INTERVALO_SERIE_DEFAULT_DIAS   = 21   # 3 semanas; rango UI 14–28
EDAD_INICIO_CACHORRO_SEM       = 6
EDAD_CIERRE_SERIE_SEM          = 16
EDAD_CIERRE_ALTO_RIESGO_SEM    = 20
EDAD_MIN_RABIA_CLINICA_SEM     = 12
RABIA_INTERVALO_DEFAULT_DIAS   = 365  # MX; nunca 1095 por default
LEPTO_DOSIS_INICIO             = 2
LEPTO_INTERVALO_ADULTO_DIAS    = 365
FELV_DOSIS_INICIO              = 2
FVRCP_REFUERZO_DEFAULT         = 365  # editable 183
FVRCP_REFUERZO_ALT_WSAVA_DIAS  = 183  # 6 meses
CONEJO_INTERVALO_DEFAULT_DIAS  = 365
PUSH_ANTICIPACION_DIAS         = [7, 1]  # no al crear si faltan meses
PUSH_MAX_POR_RECORDATORIO      = 2
```

Revisión de este anexo: al implementar, re-leer etiquetas de los lotes que la clínica compre (SAGARPA) — los defaults no sustituyen el inserto.
