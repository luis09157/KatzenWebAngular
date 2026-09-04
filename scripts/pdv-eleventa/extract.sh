#!/usr/bin/env bash
# Spec 064 — extractor local Firebird 2.5 32-bit (ODS 10.1 Windows).
# El FDB de eleventa es Implementation ID 16 (Win32). Firebird 64-bit
# responde "is not a valid database" (gstat sí lee el header).
# Nunca monta en escritura el FDB original de Downloads.
# Nunca exporta CSD / FACTURACION_CERTIFICADOS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC_DEFAULT="${PDV_FDB_SRC:-$HOME/Downloads/PDVDATA.FDB}"
WORK="$ROOT/tmp/pdv-eleventa"
OUT="$ROOT/scripts/pdv-eleventa/out"
QUERIES="$ROOT/scripts/pdv-eleventa/queries.sql"
EXPORT_SQL="$ROOT/scripts/pdv-eleventa/export-productos.sql"
IMAGE="${FIREBIRD_IMAGE:-katzenvet/firebird-2.5-i386:local}"
CONTAINER="${FIREBIRD_CONTAINER:-fb32}"

if [[ -S "${HOME}/.colima/docker.sock" && -z "${DOCKER_HOST:-}" ]]; then
  export DOCKER_HOST="unix://${HOME}/.colima/docker.sock"
fi

echo "=== Katzen 064 extractor Eleventa ==="
echo "Repo: $ROOT"

if ! command -v docker >/dev/null 2>&1; then
  cat <<'EOF'

GATE FASE 1 FALLIDO: no hay Docker en PATH.

En este Mac: Colima + docker CLI (no hace falta Docker Desktop):
  brew install colima docker qemu lima-additional-guestagents
  colima start --arch x86_64 --vm-type=qemu
  export DOCKER_HOST="unix://${HOME}/.colima/docker.sock"

Luego re-ejecutar: bash scripts/pdv-eleventa/extract.sh
EOF
  exit 2
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker no responde. Si usas Colima: colima start --arch x86_64 --vm-type=qemu"
  exit 2
fi

mkdir -p "$WORK" "$OUT"
if [[ ! -f "$SRC_DEFAULT" && ! -f "$WORK/PDVDATA.FDB" ]]; then
  echo "No está el origen: $SRC_DEFAULT"
  echo "Pasa PDV_FDB_SRC=/ruta/a/copia.FDB"
  exit 2
fi

if [[ -f "$SRC_DEFAULT" ]]; then
  echo "Copiando FDB a tmp (el original no se monta)…"
  chmod u+w "$SRC_DEFAULT" 2>/dev/null || true
  cp "$SRC_DEFAULT" "$WORK/PDVDATA.FDB"
fi
chmod 644 "$WORK/PDVDATA.FDB"

ensure_fb32() {
  if docker image inspect "$IMAGE" >/dev/null 2>&1; then
    return 0
  fi
  echo "Imagen $IMAGE no está. Construyendo Firebird 2.5 Classic i386 (Jessie, ~1–2 min)…"
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  docker run -d --name "$CONTAINER" --platform linux/386 i386/debian:jessie sleep 7200
  docker exec "$CONTAINER" bash -c 'cat > /etc/apt/sources.list <<EOF
deb http://archive.debian.org/debian jessie main
deb http://archive.debian.org/debian-security jessie/updates main
EOF
echo "Acquire::Check-Valid-Until false;" > /etc/apt/apt.conf.d/99no-check
echo "APT::Get::AllowUnauthenticated true;" > /etc/apt/apt.conf.d/99unauth
echo "Acquire::AllowInsecureRepositories true;" >> /etc/apt/apt.conf.d/99unauth
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y --force-yes firebird2.5-classic firebird2.5-classic-common'
  docker commit "$CONTAINER" "$IMAGE"
}

ensure_fb32

if ! docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  docker run -d --name "$CONTAINER" --platform linux/386 "$IMAGE" sleep 7200
elif [[ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER")" != "true" ]]; then
  docker start "$CONTAINER" >/dev/null
fi

echo "Copiando FDB al FS del contenedor (evita mmap de bind-mount macOS)…"
docker cp "$WORK/PDVDATA.FDB" "$CONTAINER:/tmp/PDVDATA.FDB"
docker cp "$QUERIES" "$CONTAINER:/tmp/queries.sql"
docker cp "$EXPORT_SQL" "$CONTAINER:/tmp/export-productos.sql"
docker exec "$CONTAINER" chmod 666 /tmp/PDVDATA.FDB

echo "isql-fb (32-bit) contra ODS 10.1…"
set +e
docker exec "$CONTAINER" isql-fb -q /tmp/PDVDATA.FDB -user SYSDBA -password masterkey \
  -i /tmp/queries.sql -o /tmp/isql-out.txt
QSTATUS=$?
docker exec "$CONTAINER" isql-fb -q /tmp/PDVDATA.FDB -user SYSDBA -password masterkey \
  -i /tmp/export-productos.sql -o /tmp/productos-list.txt
ESTATUS=$?
set -e

docker cp "$CONTAINER:/tmp/isql-out.txt" "$WORK/isql-out.txt"
docker cp "$CONTAINER:/tmp/productos-list.txt" "$WORK/productos-list.txt"
cp "$WORK/isql-out.txt" "$OUT/isql-out.txt"
cp "$WORK/productos-list.txt" "$OUT/productos-list.txt"

if [[ $QSTATUS -ne 0 || $ESTATUS -ne 0 ]]; then
  echo "isql terminó con queries=$QSTATUS export=$ESTATUS (revisar $OUT/isql-out.txt)"
fi

if [[ ! -s "$WORK/isql-out.txt" ]]; then
  echo "GATE FASE 1 FALLIDO: no se escribió isql-out.txt"
  exit 2
fi

node "$ROOT/scripts/pdv-eleventa/parse-isql-list.mjs" \
  "$WORK/productos-list.txt" \
  "$WORK/pdv-extract.json"

echo "OK SQL → $OUT/isql-out.txt"
echo "OK JSON → $WORK/pdv-extract.json (gitignored)"
echo "Siguiente: node scripts/pdv-eleventa/import-emulator.mjs  (no escribe RTDB)"
