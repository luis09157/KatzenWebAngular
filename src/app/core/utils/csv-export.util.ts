export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

function escapeCsvCell(value: unknown): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Exporta filas a CSV (compatible con Excel). */
export function exportToCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  if (!rows.length) {
    return;
  }

  const header = columns.map(column => escapeCsvCell(column.header)).join(',');
  const body = rows
    .map(row => columns.map(column => escapeCsvCell(column.value(row))).join(','))
    .join('\n');
  const blob = new Blob([`\uFEFF${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
