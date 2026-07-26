import { MAX_PUBLICATION_PDF_BYTES, validatePublicationPdf } from './pdf.validation';

describe('validatePublicationPdf', () => {
  it('acepta un PDF con firma y extensión válidas', async () => {
    const file = new File(['%PDF-1.7\ncontenido'], 'bases.PDF', { type: 'application/pdf' });

    expect(await validatePublicationPdf(file)).toBe('');
  });

  it('rechaza una extensión incorrecta aunque el contenido tenga firma PDF', async () => {
    const file = new File(['%PDF-1.7'], 'bases.txt', { type: 'application/pdf' });

    expect(await validatePublicationPdf(file)).toContain('extensión .pdf');
  });

  it('rechaza un archivo que no es PDF y archivos mayores a 2 MiB', async () => {
    const notPdf = new File(['texto'], 'bases.pdf', { type: 'application/pdf' });
    const tooLarge = new File([new Uint8Array(MAX_PUBLICATION_PDF_BYTES + 1)], 'bases.pdf', {
      type: 'application/pdf',
    });

    expect(await validatePublicationPdf(notPdf)).toContain('no parece ser un PDF');
    expect(await validatePublicationPdf(tooLarge)).toContain('superar 2 MiB');
  });
});
