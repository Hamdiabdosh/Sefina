import { jsPDF } from 'jspdf';
import { formatEthiopianDate, getCurrentEthiopianMonthYear } from '../../../lib/ethiopian';
import { toEthiopian } from 'ethiopian-date';

export const exportTablePdf = (
  title: string,
  headers: string[],
  rows: string[][],
  filename: string
) => {
  const doc = new jsPDF({ orientation: rows[0] && rows[0].length > 5 ? 'landscape' : 'portrait' });
  const now = new Date();
  const [y, m, d] = toEthiopian(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const generated = formatEthiopianDate(y, m, d);

  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.text(`Generated: ${generated}`, 14, 22);

  let yPos = 30;
  const colWidth = (doc.internal.pageSize.getWidth() - 28) / headers.length;

  doc.setFontSize(8);
  headers.forEach((h, i) => {
    doc.text(h, 14 + i * colWidth, yPos, { maxWidth: colWidth - 2 });
  });
  yPos += 6;

  rows.forEach((row) => {
    if (yPos > doc.internal.pageSize.getHeight() - 14) {
      doc.addPage();
      yPos = 16;
    }
    row.forEach((cell, i) => {
      doc.text(String(cell ?? ''), 14 + i * colWidth, yPos, { maxWidth: colWidth - 2 });
    });
    yPos += 5;
  });

  doc.save(`${filename}.pdf`);
};

export const defaultReportRange = () => {
  const { month, year } = getCurrentEthiopianMonthYear();
  return { fromMonth: month, fromYear: year, toMonth: month, toYear: year };
};
