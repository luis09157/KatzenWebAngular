# Rotación del keystore Android — contraseñas expuestas en historial público

**Fecha del análisis:** 2026-09-04 · **Estado:** pendiente de decisión y ejecución por Luis. Este documento **no ejecuta nada**; describe el estado real y los pasos.

---

## 1. Contexto y estado real (verificado en el repo)

- Repo **público**: `github.com/luis09157/KatzenWebAngular` (GitHub API: `"visibility": "public"`).
- `android/keystore.properties` estuvo versionado en **4 commits** del historial:

  ```
  $ git log --all --name-status --oneline -- android/keystore.properties
  78935a8 2026-09-04  D  chore(repo): sacar keystore y basura de raíz del índice; gitignore   ← LOCAL, no pusheado
  8b45c51 2025-08-29  M  feat: implementar landing page completa ...
  b3bff85 2025-08-26  M  cambios visuales
  6ca4269 2025-08-26  M  mejoramos diseño e historial clinico
  56c36e4 2025-08-25  A  correccion historial
  ```

- Contenido expuesto (valores omitidos aquí a propósito): `storePassword=…`, `keyPassword=…`, `keyAlias=…`, `storeFile=katzenvet-new.keystore`. Las 4 líneas tienen valor real. El archivo local actual es **byte a byte idéntico** al del historial → las contraseñas filtradas son las **vigentes**.
- El commit que lo saca del índice (`78935a8`) existe solo en local: `origin/main` (HEAD `4ef7012`, 2026-08-31) **todavía contiene el archivo** en su HEAD, además de los 4 commits históricos. Hacer push de `78935a8` lo quita del HEAD pero **no** del historial.
- El **binario del keystore (`.keystore` / `.jks`) nunca estuvo en el repo** (`*.keystore` ignorado; `git log --all -- '*.keystore' '*.jks'` vacío) y tampoco está en este árbol local.
- `android/app/build.gradle` es un **fragmento** (`// ... existing code ...`) que lee `keystore.properties` desde `rootProject` y firma `release` con `signingConfigs.release` (`storeFile file(keystoreProperties['storeFile'])`). El proyecto Android completo (donde vive el keystore real) **no está en este repo**; hay que localizarlo (Android Studio de Luis / otro repo) antes de rotar.
- Nota: `storeFile=katzenvet-new.keystore` se resuelve relativo a `android/app/`, pero `android/scripts/generate-keystore.sh` lo genera en `android/`. Al regenerar, alinear la ruta.
- `.gitignore` local ya incluye `android/keystore.properties`, `android/local.properties`, `*.keystore` (commit `78935a8`).

## 2. Qué está en riesgo

| Activo | ¿Expuesto? | Impacto si lo usan |
|--------|-----------|--------------------|
| Contraseñas del keystore y de la llave + alias | **Sí**, públicas desde 2025-08-25 | Por sí solas **no** permiten firmar: hace falta el archivo `.keystore`. |
| Archivo `.keystore` | No (nunca versionado) | Si alguna vez se filtra (laptop, backup, Drive compartido, otro repo), con las contraseñas públicas cualquiera firma APKs como KatzenVet → podría distribuir una app maliciosa que Android instalaría **como actualización** de la legítima (misma firma). |
| Firebase `google-services.json` / API keys | No forma parte de este análisis | Revisar aparte si están en el repo público. |

Conclusión honesta: **riesgo hoy = medio**, no crítico, porque falta el binario. Pero las contraseñas están quemadas para siempre (internet archiva forks/clones), así que **el keystore actual debe considerarse comprometido a medio plazo** y conviene rotar en cuanto se pueda, además de dejar de exponerlas.

## 3. Opciones (no excluyentes)

### Opción A — Si la app está en Google Play con **Play App Signing** (recomendada)

Con Play App Signing, Google guarda la **llave de firma de la app** y tú solo usas una **upload key** para subir. La upload key **se puede resetear** sin afectar a los usuarios.

Cómo saber si aplica: Play Console → tu app → **Configuración → Integridad de la app → Firma de apps**. Si dice «Google administra y protege la clave de firma de tu app», aplica.

Pasos:

1. Generar keystore nuevo (sección 5) y **exportar su certificado**:
   ```bash
   keytool -export -rfc \
     -keystore katzenvet-2026.keystore \
     -alias katzenvet \
     -file upload_certificate_2026.pem
   ```
2. Play Console → Integridad de la app → Firma de apps → **«Solicitar restablecimiento de la clave de carga»** (Request upload key reset). Adjuntar el `.pem`, explicar «clave de carga comprometida».
3. Google responde por correo (suele tardar 1–2 días hábiles). Cuando confirmen, la upload key vieja **deja de servir**.
4. Actualizar `keystore.properties` local (sección 5) y compilar un release de prueba; subir a pista interna para verificar que Play acepta la firma.
5. Destruir el keystore viejo (o guardarlo cifrado fuera de línea si quieres conservar evidencia).

Efecto para usuarios: **ninguno**. La firma que ven los dispositivos es la de Google y no cambia.

### Opción B — Si la app **no** usa Play App Signing (firma directa con tu keystore)

Aquí la verdad incómoda: **la firma de una app Android no se puede cambiar**. Android exige que toda actualización esté firmada con la misma llave que la instalación original. Si rotas el keystore:

- Los usuarios actuales **no podrán actualizar**; tendrían que desinstalar e instalar la «nueva app» (pierden datos locales de la app, no los de Firebase).
- En Play tendrías que publicar con **otro `applicationId`** (p. ej. `com.katzenvet.app2`) o migrar la app a Play App Signing.

Alternativas reales en este caso:

1. **Migrar a Play App Signing** (Play Console → Firma de apps → «Usar Play App Signing» → subir la llave actual cifrada con la herramienta PEPK). Una vez migrada, la llave actual pasa a ser la de firma (custodiada por Google) y generas una **upload key nueva** → ya estás en la Opción A y el keystore viejo deja de ser necesario para subir. Esto es lo más razonable si la app está en Play.
2. Si la app se distribuye **fuera de Play** (APK directo a la clínica): rotar = publicar app nueva con id nuevo, pedir a los usuarios desinstalar/instalar. Con pocos dispositivos (personal de la clínica) es viable y honesto; documentar el procedimiento a los usuarios.
3. Si decides **no** rotar: al menos custodia el `.keystore` (cifrado, sin copias en nube compartida) y cambia las contraseñas del keystore. Cambiar las contraseñas **no cambia la firma**, así que las actualizaciones siguen funcionando:
   ```bash
   # cambia storepass y keypass del keystore existente (la llave/firma no cambia)
   keytool -storepasswd -keystore katzenvet-new.keystore
   keytool -keypasswd  -keystore katzenvet-new.keystore -alias katzenvet
   ```
   Esto neutraliza la filtración de contraseñas aunque el binario siga siendo el mismo.

### Opción C — Sacar los secretos del historial público (hacer en cualquier caso)

C.1 **Hacer el repo privado** (rápido, sin reescribir historia): GitHub → Settings → General → Danger Zone → *Change visibility* → Private. Los forks públicos existentes conservan el historial; GitHub los desvincula pero no los borra. Cero riesgo técnico para el equipo.

C.2 **Purgar el historial con `git filter-repo`** (elimina el archivo de todos los commits; reescribe SHAs):

```bash
# Requisitos: python3 + git-filter-repo (brew install git-filter-repo). Trabajar en un clon FRESCO.
git clone --mirror git@github.com:luis09157/KatzenWebAngular.git katzen-mirror.git
cd katzen-mirror.git
git filter-repo --invert-paths --path android/keystore.properties
# (opcional, si también se quieren limpiar otros secretos: --path otro/archivo)
# filter-repo borra el remote 'origin' por seguridad; volver a agregarlo y empujar TODO reescrito:
git remote add origin git@github.com:luis09157/KatzenWebAngular.git
git push --mirror --force origin
```

Advertencias obligatorias:

- **Force-push reescribe todas las ramas** (`main`, `PROD`). Cualquier clon existente (tu laptop, la de otros, CI) queda con historia divergente: **todos deben re-clonar**, no `pull`. Tus 17 commits locales sin pushear (`origin/main..HEAD`) tendrías que rebasearlos sobre la historia nueva o pushearlos **antes** de purgar (y purgar después).
- GitHub conserva los commits viejos accesibles por SHA un tiempo y en **forks**; para borrarlos del todo hay que pedirlo a GitHub Support ("remove cached views / sensitive data") y los forks siguen fuera de tu control.
- Los PRs cerrados que referencien SHAs viejos quedan con enlaces rotos.
- Por todo esto: **purgar sirve para que deje de estar a un clic, no para «des-filtrar»**. Las contraseñas se consideran quemadas igual → rotar/cambiar contraseñas (A/B) sigue siendo necesario.

Orden recomendado: **C.1 hoy** (privado) → push del commit `78935a8` que quita el archivo del HEAD → decidir A o B → C.2 solo si quieres limpiar la historia además.

## 4. Verificación rápida (solo lectura, puedes correrla cuando quieras)

```bash
git log --all --oneline -- android/keystore.properties        # commits que lo tocaron
git cat-file -e origin/main:android/keystore.properties && echo "sigue en origin/main"
rg -n 'signingConfigs|storeFile' android/app/build.gradle       # cómo se usa
git ls-files | rg -i 'keystore|\.jks'                          # nada debe salir salvo scripts/
```

## 5. Generar keystore nuevo y actualizar `keystore.properties` (local, ignorado)

Hacerlo **en la máquina del proyecto Android real**, fuera de cualquier carpeta versionada o dentro de una ruta ignorada.

```bash
# 1) Keystore nuevo (contraseñas fuertes; NO las pongas en la línea de comandos si el shell guarda historial: keytool las pedirá)
keytool -genkeypair -v \
  -keystore katzenvet-2026.keystore \
  -alias katzenvet \
  -keyalg RSA -keysize 4096 \
  -validity 10000 \
  -dname "CN=KatzenVet, OU=Clinica, O=KatzenVet, L=Monterrey, ST=Nuevo Leon, C=MX"

# 2) Verificar
keytool -list -v -keystore katzenvet-2026.keystore -alias katzenvet | head -20
```

`android/keystore.properties` (archivo **ignorado** por git; jamás versionar):

```properties
storePassword=<nueva contraseña del keystore>
keyPassword=<nueva contraseña de la llave>
keyAlias=katzenvet
storeFile=../katzenvet-2026.keystore
```

Notas:

- `storeFile` se resuelve relativo a `android/app/` (por `file()` en el módulo). Con el keystore en `android/`, la ruta correcta es `../katzenvet-2026.keystore`. Actualizar también `android/scripts/generate-keystore.sh` si se sigue usando (hoy genera en `android/` con alias `katzenvet` y contraseña placeholder `TU_PASSWORD_AQUI`).
- Guardar el `.keystore` y sus contraseñas en un gestor de contraseñas (1Password/Bitwarden) + copia cifrada fuera de línea. Perder el keystore en la Opción B = no poder actualizar nunca más la app.
- Confirmar antes de borrar el viejo: `git check-ignore -v android/keystore.properties` debe mostrar la regla del `.gitignore`.

## 6. Checklist para Luis

- [ ] Localizar el proyecto Android real y el `.keystore` actual; confirmar que no está en ningún repo.
- [ ] Play Console: ¿la app usa Play App Signing? → define A o B.
- [ ] C.1: poner el repo en privado (o aceptar que siga público y purgar con C.2).
- [ ] Pushear `78935a8` (quita `keystore.properties` del HEAD) — con tu autorización de push.
- [ ] Generar keystore nuevo (sección 5) y actualizar `keystore.properties` local.
- [ ] A: solicitar reset de upload key. B: migrar a Play App Signing o cambiar contraseñas del keystore actual (`keytool -storepasswd` / `-keypasswd`).
- [ ] Compilar release de prueba y subir a pista interna.
- [ ] Revisar si `google-services.json` u otras claves están en el repo público (fuera de este doc).
