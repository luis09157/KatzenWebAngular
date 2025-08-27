#!/bin/bash

echo "Generando nueva keystore para KatzenVet..."
echo ""

# Crear directorio android si no existe
mkdir -p android

# Generar la nueva keystore
keytool -genkey -v \
  -keystore android/katzenvet-new.keystore \
  -alias katzenvet \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "TU_PASSWORD_AQUI" \
  -keypass "TU_PASSWORD_AQUI" \
  -dname "CN=KatzenVet, OU=Development, O=KatzenVet, L=Ciudad, S=Estado, C=MX"

echo ""
echo "¡Keystore generada exitosamente!"
echo "Archivo: android/katzenvet-new.keystore"
echo ""
echo "IMPORTANTE:"
echo "1. Cambia 'TU_PASSWORD_AQUI' en android/keystore.properties"
echo "2. Guarda la keystore en un lugar seguro"
echo "3. Nunca compartas la keystore o contraseñas"
echo "4. Haz backup de la keystore"



