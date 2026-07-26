export const MAX_PUBLICATION_PDF_BYTES = 2 * 1024 * 1024;

export async function validatePublicationPdf(file: File): Promise<string> {
  const fileName = file.name.trim();

  if (!fileName) {
    return 'El PDF necesita un nombre de archivo.';
  }

  if (!/\.pdf$/i.test(fileName)) {
    return 'El archivo debe tener la extensión .pdf.';
  }

  if (file.size === 0) {
    return 'El PDF no puede estar vacío.';
  }

  if (file.size > MAX_PUBLICATION_PDF_BYTES) {
    return 'El PDF no puede superar 2 MiB.';
  }

  if (fileName.length > 180) {
    return 'El nombre del PDF no puede superar 180 caracteres.';
  }

  try {
    const signature = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
    return signature.startsWith('%PDF-') ? '' : 'El archivo no parece ser un PDF válido.';
  } catch {
    return 'No se pudo leer el PDF. Elegí otro archivo.';
  }
}
