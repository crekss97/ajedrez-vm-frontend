import {
  MAX_EVENT_IMAGE_BYTES,
  validateEventImage,
} from './event-image.validation';

describe('validateEventImage', () => {
  it('acepta una imagen cuadrada dentro de los limites', () => {
    expect(validateEventImage({ size: 500_000 }, { width: 1080, height: 1080 })).toEqual({
      error: '',
      warning: '',
    });
  });

  it('rechaza una imagen de mas de 2 MiB', () => {
    const result = validateEventImage(
      { size: MAX_EVENT_IMAGE_BYTES + 1 },
      { width: 1080, height: 1080 },
    );

    expect(result.error).toContain('máximo permitido es 2 MiB');
  });

  it('rechaza un lado menor a 800 px', () => {
    const result = validateEventImage({ size: 500_000 }, { width: 799, height: 1200 });

    expect(result.error).toContain('lado menor debe tener al menos 800 px');
  });

  it('rechaza lados mayores a 4096 px', () => {
    const result = validateEventImage({ size: 500_000 }, { width: 4097, height: 1000 });

    expect(result.error).toContain('Ningún lado puede superar 4096 px');
  });

  it('rechaza imagenes de mas de 12 megapixeles', () => {
    const result = validateEventImage({ size: 500_000 }, { width: 4000, height: 4000 });

    expect(result.error).toContain('máximo de 12 megapíxeles');
  });

  it('advierte una proporcion extrema sin rechazarla', () => {
    const result = validateEventImage({ size: 500_000 }, { width: 1600, height: 800 });

    expect(result.error).toBe('');
    expect(result.warning).toContain('Recomendamos 1080 × 1080 px');
  });
});
