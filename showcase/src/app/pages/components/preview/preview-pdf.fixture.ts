const encoder = new TextEncoder();

function stream(contents: string): string {
  return `<< /Length ${encoder.encode(contents).byteLength} >>\nstream\n${contents}\nendstream`;
}

/**
 * Builds a deterministic, dependency-free PDF used by the showcase.
 *
 * The fixture intentionally has three pages and a real PDF Outlines tree so
 * the advanced outline/continuous example exercises those features offline.
 */
export function createPreviewPdfFixture(): Uint8Array {
  const pageContents = [
    'BT /F1 24 Tf 72 720 Td (SDCoreJS PDF Preview - Overview) Tj ET',
    'BT /F1 24 Tf 72 720 Td (SDCoreJS PDF Preview - Search) Tj ET',
    'BT /F1 24 Tf 72 720 Td (SDCoreJS PDF Preview - Continuous) Tj ET',
  ];
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R /Outlines 10 0 R /PageMode /UseOutlines >>',
    '<< /Type /Pages /Kids [3 0 R 5 0 R 7 0 R] /Count 3 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 9 0 R >> >> /Contents 4 0 R >>',
    stream(pageContents[0]),
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 9 0 R >> >> /Contents 6 0 R >>',
    stream(pageContents[1]),
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 9 0 R >> >> /Contents 8 0 R >>',
    stream(pageContents[2]),
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Outlines /First 11 0 R /Last 13 0 R /Count 3 >>',
    '<< /Title (Overview) /Parent 10 0 R /Dest [3 0 R /Fit] /Next 12 0 R >>',
    '<< /Title (Search) /Parent 10 0 R /Dest [5 0 R /Fit] /Prev 11 0 R /Next 13 0 R >>',
    '<< /Title (Continuous mode) /Parent 10 0 R /Dest [7 0 R /Fit] /Prev 12 0 R >>',
  ];

  let pdf = '%PDF-1.7\n%SDCoreJS deterministic fixture\n';
  const offsets = [0];
  for (let index = 0; index < objects.length; index++) {
    offsets.push(encoder.encode(pdf).byteLength);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdf).byteLength;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return encoder.encode(pdf);
}
