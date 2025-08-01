import json

entrada = 'codigospostales.json'
salida = 'codigospostales_limpio.json'

# Índices según el archivo original
IDX_COLONIA = 0
IDX_TIPO_ASENTA = 1
IDX_MUNICIPIO = 2
IDX_ESTADO = 3

with open(entrada, 'r', encoding='utf-8') as f:
    data = json.load(f)

codigos = {}
for item in data:
    # Saltar encabezado
    claves = list(item.keys())
    clave_cp = [k for k in claves if k != 'null']
    if not clave_cp:
        continue
    cp = item[clave_cp[0]]
    # Saltar si es encabezado
    if cp == 'd_codigo':
        continue
    arr = item['null']
    registro = {
        'colonia': arr[IDX_COLONIA],
        'tipo_asenta': arr[IDX_TIPO_ASENTA],
        'municipio': arr[IDX_MUNICIPIO],
        'estado': arr[IDX_ESTADO]
    }
    if cp not in codigos:
        codigos[cp] = []
    codigos[cp].append(registro)

with open(salida, 'w', encoding='utf-8') as f:
    json.dump(codigos, f, ensure_ascii=False, indent=2)

print(f'Archivo convertido guardado como: {salida}') 