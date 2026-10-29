import {
  esImagenArchivoHistorial,
  esTipoPermitidoHistorial,
  medidasReducidas,
  nombreArchivoDeUrl,
  nombreComoJpg,
  nombreStorageArchivo,
  nombreVisibleArchivo,
  normalizarArchivosHistorial,
} from './historial-archivos.util';

describe('historial-archivos.util (spec 116.1)', () => {
  const urlFoto =
    'https://firebasestorage.googleapis.com/v0/b/katzen-a0e3e.appspot.com/o/historiales_clinicos%2Fpac1%2F1761758400000_0_herida.jpg?alt=media&token=abc';
  const urlPdf =
    'https://firebasestorage.googleapis.com/v0/b/katzen-a0e3e.appspot.com/o/historiales_clinicos%2Fpac1%2F1700000000000_laboratorio%20sangre.pdf?alt=media';

  it('lee la lista guardada en cualquier formato', () => {
    expect(normalizarArchivosHistorial([urlFoto, '', urlFoto, urlPdf])).toEqual([urlFoto, urlPdf]);
    expect(normalizarArchivosHistorial({ a: urlFoto, b: urlPdf })).toEqual([urlFoto, urlPdf]);
    expect(normalizarArchivosHistorial(urlFoto)).toEqual([urlFoto]);
    expect(normalizarArchivosHistorial('')).toEqual([]);
    expect(normalizarArchivosHistorial(undefined)).toEqual([]);
    expect(normalizarArchivosHistorial([1, null])).toEqual([]);
  });

  it('saca el nombre del archivo de la URL de Storage', () => {
    expect(nombreArchivoDeUrl(urlFoto)).toBe('1761758400000_0_herida.jpg');
    expect(nombreArchivoDeUrl(urlPdf)).toBe('1700000000000_laboratorio sangre.pdf');
    expect(nombreArchivoDeUrl('foto.png')).toBe('foto.png');
  });

  it('distingue foto de PDF', () => {
    expect(esImagenArchivoHistorial(urlFoto)).toBeTrue();
    expect(esImagenArchivoHistorial(urlPdf)).toBeFalse();
    expect(esImagenArchivoHistorial('x/IMG_1.HEIC')).toBeTrue();
  });

  it('nombre visible sin el prefijo de tiempo', () => {
    expect(nombreVisibleArchivo(urlFoto, 0)).toBe('herida.jpg');
    expect(nombreVisibleArchivo(urlPdf, 1)).toBe('laboratorio sangre.pdf');
    expect(nombreVisibleArchivo('', 2)).toBe('Archivo 3');
  });

  it('acepta fotos de cualquier tipo y PDF', () => {
    expect(esTipoPermitidoHistorial('image/jpeg')).toBeTrue();
    expect(esTipoPermitidoHistorial('image/heic')).toBeTrue();
    expect(esTipoPermitidoHistorial('application/pdf')).toBeTrue();
    expect(esTipoPermitidoHistorial('', 'IMG_2.HEIC')).toBeTrue();
    expect(esTipoPermitidoHistorial('video/mp4')).toBeFalse();
    expect(esTipoPermitidoHistorial('application/msword', 'a.doc')).toBeFalse();
  });

  it('nombre seguro para Storage', () => {
    expect(nombreStorageArchivo('Radiografía tórax 1.JPG', 123, 0)).toBe('123_0_Radiografia-torax-1.JPG');
    expect(nombreStorageArchivo('', 5, 2)).toBe('5_2_foto');
    expect(nombreStorageArchivo('a/b#c?.png', 1, 1)).toBe('1_1_a-b-c-.png');
    expect(nombreComoJpg('IMG_1.HEIC')).toBe('IMG_1.jpg');
    expect(nombreComoJpg('')).toBe('foto.jpg');
  });

  it('reduce solo si la foto es grande, manteniendo proporción', () => {
    expect(medidasReducidas(4032, 3024)).toEqual({ ancho: 1600, alto: 1200 });
    expect(medidasReducidas(3024, 4032)).toEqual({ ancho: 1200, alto: 1600 });
    expect(medidasReducidas(1200, 800)).toBeNull();
    expect(medidasReducidas(0, 800)).toBeNull();
  });
});
