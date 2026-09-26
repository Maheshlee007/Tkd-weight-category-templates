/**
 * Renders a template into a .pdf Blob, in the browser, using the vendored
 * pdf-lib UMD build (global `PDFLib`). Unlike the DOCX path (which depends
 * on Word/LibreOffice's own text layout and so needed empirical
 * calibration), pdf-lib draws every line at coordinates we choose, so the
 * "fill the page" math here is exact rather than estimated.
 *
 * Font sizes and paragraph gaps mirror the DOCX renderer 1:1 (docx sizes
 * are half-points, spacing is in twips/20 = points) so both output formats
 * look the same.
 */

const PDF_PAGE_WIDTH = 612;  // US Letter, points
const PDF_PAGE_HEIGHT = 792;
const PDF_MARGIN = 45;
const PDF_COL1 = 105;
const PDF_HEADER_ROW_HEIGHT = 24;
const PDF_SAFETY_BUFFER = 12.5;
const PDF_MIN_ROW_HEIGHT = 30;

const TITLE_SIZE = 14, TITLE_GAP = 8;
const BODY_SIZE = 11, SCHOOL_GAP = 4, CATEGORY_GAP = 6;
const SEXHEAD_SIZE = 12, SEXHEAD_GAP = 8;
const WEIGHT_CELL_SIZE = 12;
const HEADER_CELL_SIZE = 11;

function pdfLineHeight(size, gap) {
  return size * 1.2 + gap;
}

const PDF_HEADER_BLOCK_HEIGHT =
  pdfLineHeight(TITLE_SIZE, TITLE_GAP) +
  pdfLineHeight(BODY_SIZE, SCHOOL_GAP) +
  pdfLineHeight(BODY_SIZE, CATEGORY_GAP) +
  pdfLineHeight(SEXHEAD_SIZE, SEXHEAD_GAP);

async function generatePdf(template, schoolName, selectedIndices) {
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const boldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  const usableWidth = PDF_PAGE_WIDTH - PDF_MARGIN * 2;
  const usableHeight = PDF_PAGE_HEIGHT - PDF_MARGIN * 2;
  const col1 = PDF_COL1;
  const col2 = usableWidth - col1;
  const headerFill = rgb(0x1f / 255, 0x38 / 255, 0x64 / 255);
  const white = rgb(1, 1, 1);
  const black = rgb(0, 0, 0);
  const gridColor = rgb(0, 0, 0);

  function centerX(text, font, size, containerX, containerWidth) {
    const w = font.widthOfTextAtSize(text, size);
    return containerX + Math.max(0, (containerWidth - w) / 2);
  }

  const categories = selectedIndices.map((i) => template.categories[i]);

  categories.forEach((cat) => {
    const availableForData = usableHeight - PDF_HEADER_BLOCK_HEIGHT - PDF_HEADER_ROW_HEIGHT - PDF_SAFETY_BUFFER;
    const plan = computeRowPlan(cat.weights.length, availableForData, PDF_MIN_ROW_HEIGHT);

    plan.pages.forEach((rowIndices, pageIdx) => {
      const page = pdfDoc.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT]);
      let y = PDF_PAGE_HEIGHT - PDF_MARGIN;

      // --- Title ---
      {
        const size = TITLE_SIZE;
        const text = template.documentTitle || "STUDENTS LIST";
        const baseline = y - size;
        const x = centerX(text, bold, size, PDF_MARGIN, usableWidth);
        page.drawText(text, { x, y: baseline, size, font: bold, color: black });
        const textWidth = bold.widthOfTextAtSize(text, size);
        page.drawLine({ start: { x, y: baseline - 2 }, end: { x: x + textWidth, y: baseline - 2 }, thickness: 0.75, color: black });
        y -= pdfLineHeight(size, TITLE_GAP);
      }

      // --- School line ---
      {
        const size = BODY_SIZE;
        const label = "Name Of The School :- ";
        const value = schoolName && schoolName.trim()
          ? schoolName
          : "..........................................................................................";
        const baseline = y - size;
        page.drawText(label, { x: PDF_MARGIN, y: baseline, size, font: bold, color: black });
        const labelWidth = bold.widthOfTextAtSize(label, size);
        page.drawText(value, { x: PDF_MARGIN + labelWidth + 3, y: baseline, size, font: regular, color: black });
        y -= pdfLineHeight(size, SCHOOL_GAP);
      }

      // --- Category line ---
      {
        const size = BODY_SIZE;
        const label = "Category";
        const baseline = y - size;
        page.drawText(label, { x: PDF_MARGIN, y: baseline, size, font: bold, color: black });
        const colX = PDF_MARGIN + 140;
        page.drawText(":- ", { x: colX, y: baseline, size, font: regular, color: black });
        const prefixWidth = regular.widthOfTextAtSize(":- ", size);
        const valueX = colX + prefixWidth;
        page.drawText(cat.ageGroup, { x: valueX, y: baseline, size, font: boldItalic, color: black });
        const valueWidth = boldItalic.widthOfTextAtSize(cat.ageGroup, size);
        page.drawLine({ start: { x: valueX, y: baseline - 2 }, end: { x: valueX + valueWidth, y: baseline - 2 }, thickness: 0.75, color: black });
        y -= pdfLineHeight(size, CATEGORY_GAP);
      }

      // --- Sex heading ---
      {
        const size = SEXHEAD_SIZE;
        const text = `${cat.sex} Weights List${pageIdx > 0 ? " (contd.)" : ""}`;
        const baseline = y - size;
        const x = centerX(text, bold, size, PDF_MARGIN, usableWidth);
        page.drawText(text, { x, y: baseline, size, font: bold, color: black });
        y -= pdfLineHeight(size, SEXHEAD_GAP);
      }

      // --- Table ---
      const tableLeft = PDF_MARGIN;
      const tableTop = y;
      const rowHeight = plan.rowHeight;
      const tableWidth = usableWidth;

      // Header row background + text
      const headerRowTop = tableTop;
      const headerRowBottom = headerRowTop - PDF_HEADER_ROW_HEIGHT;
      page.drawRectangle({ x: tableLeft, y: headerRowBottom, width: tableWidth, height: PDF_HEADER_ROW_HEIGHT, color: headerFill });
      {
        const size = HEADER_CELL_SIZE;
        const label1 = "WEIGHTS (kg)";
        const label2 = "Name Of The Students";
        const baseline = headerRowBottom + (PDF_HEADER_ROW_HEIGHT - size) / 2 + 1;
        page.drawText(label1, { x: centerX(label1, bold, size, tableLeft, col1), y: baseline, size, font: bold, color: white });
        page.drawText(label2, { x: centerX(label2, bold, size, tableLeft + col1, col2), y: baseline, size, font: bold, color: white });
      }

      // Data rows
      let rowTop = headerRowBottom;
      rowIndices.forEach((idx) => {
        const rowBottom = rowTop - rowHeight;
        const text = cat.weights[idx];
        const size = WEIGHT_CELL_SIZE;
        const baseline = rowBottom + (rowHeight - size) / 2 + 1;
        page.drawText(text, { x: centerX(text, bold, size, tableLeft, col1), y: baseline, size, font: bold, color: black });
        rowTop = rowBottom;
      });

      const tableBottom = rowTop;
      const totalTableHeight = tableTop - tableBottom;

      // Outer border
      page.drawRectangle({ x: tableLeft, y: tableBottom, width: tableWidth, height: totalTableHeight, borderColor: gridColor, borderWidth: 1 });
      // Column divider
      page.drawLine({ start: { x: tableLeft + col1, y: tableTop }, end: { x: tableLeft + col1, y: tableBottom }, thickness: 1, color: gridColor });
      // Horizontal row dividers
      let lineY = headerRowBottom;
      page.drawLine({ start: { x: tableLeft, y: lineY }, end: { x: tableLeft + tableWidth, y: lineY }, thickness: 1, color: gridColor });
      rowIndices.forEach(() => {
        lineY -= rowHeight;
        page.drawLine({ start: { x: tableLeft, y: lineY }, end: { x: tableLeft + tableWidth, y: lineY }, thickness: 0.5, color: gridColor });
      });
    });
  });

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

window.generatePdf = generatePdf;
