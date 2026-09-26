/**
 * Shared layout math for "fill the page" tables.
 *
 * Given how many weight-class rows a category has and how much vertical
 * space is available for the table body, decide:
 *   - if all rows comfortably fit on one page: stretch every row so the
 *     table fills the full available height (this is the normal case —
 *     SGFI's biggest category is 13 rows and easily fits with room to
 *     write several names per box).
 *   - if there are too many rows for one legible page (a custom template
 *     with, say, 40 weight brackets): fall back to a fixed minimum row
 *     height and spill the remaining rows onto additional pages, rather
 *     than shrinking rows until they're unusable.
 *
 * Units are whatever the caller uses consistently (twips for DOCX, points
 * for PDF) — this function is unit-agnostic.
 */
function computeRowPlan(numRows, availableHeight, minRowHeight) {
  if (numRows <= 0) {
    return { rowHeight: minRowHeight, pages: [[]] };
  }

  const evenHeight = Math.floor(availableHeight / numRows);

  if (evenHeight >= minRowHeight) {
    // Everything fits on one page — stretch rows to fill the space.
    return { rowHeight: evenHeight, pages: [Array.from({ length: numRows }, (_, i) => i)] };
  }

  // Too many rows to stay legible on one page — use the floor height and
  // paginate instead.
  const rowsPerPage = Math.max(1, Math.floor(availableHeight / minRowHeight));
  const pages = [];
  for (let start = 0; start < numRows; start += rowsPerPage) {
    const page = [];
    for (let i = start; i < Math.min(start + rowsPerPage, numRows); i++) page.push(i);
    pages.push(page);
  }
  return { rowHeight: minRowHeight, pages };
}

window.computeRowPlan = computeRowPlan;
