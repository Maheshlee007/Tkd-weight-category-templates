/**
 * Renders a template into a .docx Blob, in the browser, using the vendored
 * docx.js UMD/IIFE build (global `docx`). Mirrors the layout tuned earlier
 * against real Word/LibreOffice rendering: a calibrated header-block height
 * plus a safety buffer, so tables reliably fill the page without spilling
 * a row onto a second page.
 */

const DOCX_PAGE_WIDTH = 12240; // US Letter, twips
const DOCX_PAGE_HEIGHT = 15840;
const DOCX_MARGIN = 900;
const DOCX_COL1 = 2100; // weights column
const DOCX_HEADER_BLOCK_HEIGHT = 1700; // title + school line + category line + sex heading
const DOCX_HEADER_ROW_HEIGHT = 480;
const DOCX_SAFETY_BUFFER = 250;
const DOCX_MIN_ROW_HEIGHT = 600; // floor before a category spills to extra pages

async function generateDocx(template, schoolName, selectedIndices) {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, AlignmentType, BorderStyle, ShadingType, VerticalAlign,
    PageBreak, UnderlineType, HeightRule
  } = window.docx;

  const usableWidth = DOCX_PAGE_WIDTH - DOCX_MARGIN * 2;
  const usableHeight = DOCX_PAGE_HEIGHT - DOCX_MARGIN * 2;
  const col1 = DOCX_COL1;
  const col2 = usableWidth - col1;

  function headerCell(text, width) {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: "1F3864" },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 22 })]
      })]
    });
  }

  function weightCell(text) {
    return new TableCell({
      width: { size: col1, type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 120, bottom: 120, left: 120, right: 120 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, size: 24 })]
      })]
    });
  }

  function nameCell() {
    return new TableCell({
      width: { size: col2, type: WidthType.DXA },
      verticalAlign: VerticalAlign.TOP,
      margins: { top: 120, bottom: 120, left: 150, right: 150 },
      children: [new Paragraph({ children: [new TextRun({ text: "", size: 22 })] })]
    });
  }

  function buildHeaderParagraphs(cat, continued) {
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [new TextRun({
          text: template.documentTitle || "STUDENTS LIST",
          bold: true, underline: { type: UnderlineType.SINGLE }, size: 28
        })]
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: "Name Of The School :- ", bold: true, size: 22 }),
          new TextRun({ text: schoolName || "................................................................................................", size: 22 })
        ]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: "Category", bold: true, size: 22 }),
          new TextRun({ text: "\t\t\t:- ", size: 22 }),
          new TextRun({ text: cat.ageGroup, bold: true, italics: true, underline: { type: UnderlineType.SINGLE }, size: 22 })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [new TextRun({
          text: `${cat.sex} Weights List${continued ? " (contd.)" : ""}`,
          bold: true, size: 24
        })]
      })
    ];
  }

  function buildTable(cat, rowIndices, rowHeight) {
    const headerRow = new TableRow({
      tableHeader: true,
      height: { value: DOCX_HEADER_ROW_HEIGHT, rule: HeightRule.ATLEAST },
      children: [headerCell("WEIGHTS (kg)", col1), headerCell("Name Of The Students", col2)]
    });

    const rows = [headerRow];
    rowIndices.forEach((idx) => {
      rows.push(new TableRow({
        height: { value: rowHeight, rule: HeightRule.ATLEAST },
        children: [weightCell(cat.weights[idx]), nameCell()]
      }));
    });

    return new Table({
      width: { size: usableWidth, type: WidthType.DXA },
      columnWidths: [col1, col2],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "000000" }
      },
      rows
    });
  }

  const categories = selectedIndices.map((i) => template.categories[i]);
  let docChildren = [];

  categories.forEach((cat, catIdx) => {
    const availableForData = usableHeight - DOCX_HEADER_BLOCK_HEIGHT - DOCX_HEADER_ROW_HEIGHT - DOCX_SAFETY_BUFFER;
    const plan = computeRowPlan(cat.weights.length, availableForData, DOCX_MIN_ROW_HEIGHT);

    plan.pages.forEach((rowIndices, pageIdx) => {
      docChildren = docChildren.concat(buildHeaderParagraphs(cat, pageIdx > 0));
      docChildren.push(buildTable(cat, rowIndices, plan.rowHeight));

      const isVeryLastPage = catIdx === categories.length - 1 && pageIdx === plan.pages.length - 1;
      if (!isVeryLastPage) {
        docChildren.push(new Paragraph({ children: [new PageBreak()] }));
      }
    });
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: DOCX_PAGE_WIDTH, height: DOCX_PAGE_HEIGHT },
          margin: { top: DOCX_MARGIN, bottom: DOCX_MARGIN, left: DOCX_MARGIN, right: DOCX_MARGIN }
        }
      },
      children: docChildren
    }]
  });

  return Packer.toBlob(doc);
}

window.generateDocx = generateDocx;
