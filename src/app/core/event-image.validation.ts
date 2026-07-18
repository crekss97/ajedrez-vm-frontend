export const MAX_EVENT_IMAGE_BYTES = 2 * 1024 * 1024;
export const MIN_EVENT_IMAGE_SIDE = 800;
export const MAX_EVENT_IMAGE_SIDE = 4096;
export const MAX_EVENT_IMAGE_PIXELS = 12_000_000;
export const MIN_RECOMMENDED_ASPECT_RATIO = 3 / 4;
export const MAX_RECOMMENDED_ASPECT_RATIO = 4 / 3;

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface EventImageValidation {
  error: string;
  warning: string;
}

export function validateEventImage(
  file: Pick<File, 'size'>,
  dimensions: ImageDimensions,
): EventImageValidation {
  const { width, height } = dimensions;
  const detectedSize = `${width} × ${height} px`;

  if (file.size > MAX_EVENT_IMAGE_BYTES) {
    return {
      error: `La imagen pesa ${formatMebibytes(file.size)} MiB. El máximo permitido es 2 MiB.`,
      warning: '',
    };
  }

  if (Math.min(width, height) < MIN_EVENT_IMAGE_SIDE) {
    return {
      error: `La imagen mide ${detectedSize}. El lado menor debe tener al menos 800 px.`,
      warning: '',
    };
  }

  if (Math.max(width, height) > MAX_EVENT_IMAGE_SIDE) {
    return {
      error: `La imagen mide ${detectedSize}. Ningún lado puede superar 4096 px.`,
      warning: '',
    };
  }

  if (width * height > MAX_EVENT_IMAGE_PIXELS) {
    return {
      error: `La imagen mide ${detectedSize} y supera el máximo de 12 megapíxeles.`,
      warning: '',
    };
  }

  const aspectRatio = width / height;
  const warning = aspectRatio < MIN_RECOMMENDED_ASPECT_RATIO || aspectRatio > MAX_RECOMMENDED_ASPECT_RATIO
    ? 'La imagen se puede usar, pero una proporción entre 3:4 y 4:3 aprovecha mejor la cartelera. Recomendamos 1080 × 1080 px.'
    : '';

  return { error: '', warning };
}

export function readImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    const release = () => URL.revokeObjectURL(imageUrl);
    image.onload = () => {
      const dimensions = { width: image.naturalWidth, height: image.naturalHeight };
      release();
      resolve(dimensions);
    };
    image.onerror = () => {
      release();
      reject(new Error('No se pudieron leer las dimensiones de la imagen.'));
    };
    image.src = imageUrl;
  });
}

function formatMebibytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2).replace('.', ',');
}
