import { jsPDF } from 'jspdf'

// A4 dimensions in mm
const PAGE = {
  portrait:  { w: 210, h: 297, margin: 12 },
  landscape: { w: 297, h: 210, margin: 12 },
}

// Colors as RGB tuples
const C_BG      = [13, 13, 18]
const C_SURFACE = [26, 26, 36]
const C_GOLD    = [201, 168, 76]
const C_CREAM   = [220, 210, 185]
const C_MUTED   = [112, 96, 80]
const C_DIM     = [145, 130, 100]
const C_RAISE   = [201, 168, 76]
const C_CALL    = [52, 152, 219]
const C_FOLD    = [30, 30, 44]
const C_SEP     = [50, 48, 60]

export function createPdf(orientation) {
  return new jsPDF({ orientation, unit: 'mm', format: 'a4' })
}

export function fillBackground(pdf, orientation) {
  const p = PAGE[orientation]
  pdf.setFillColor(...C_BG)
  pdf.rect(0, 0, p.w, p.h, 'F')
}

// Draws the page header: logo left, "POSITION — SITUATION" right, gold separator line
export function drawPageHeader(pdf, position, situation, sitLabel, orientation) {
  const p = PAGE[orientation]
  const baseY = p.margin + 7

  // Brand left
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(...C_GOLD)
  pdf.text('PREFLOP VISION', p.margin, baseY)

  // Separator dot
  pdf.setFontSize(8)
  pdf.setTextColor(...C_GOLD)
  pdf.text(' *', p.margin + pdf.getStringUnitWidth('PREFLOP VISION') * 10 * 0.352778, baseY - 0.5)

  // Position + situation (right-aligned)
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...C_CREAM)
  pdf.text(`${position}  ${sitLabel}`, p.w - p.margin, baseY, { align: 'right' })

  // Gold line
  pdf.setDrawColor(...C_GOLD)
  pdf.setLineWidth(0.3)
  pdf.line(p.margin, baseY + 4, p.w - p.margin, baseY + 4)
}

// Returns the rect {x, y, size} where the matrix image should be placed
export function getMatrixRect(orientation, column = 0) {
  const p = PAGE[orientation]
  const headerH = 22   // header + separator
  const legendH = 16   // legend band
  const footerH = 10   // footer band
  const matrixY = p.margin + headerH

  if (orientation === 'landscape') {
    const colGap  = 8
    const fullW   = p.w - p.margin * 2
    const colW    = (fullW - colGap) / 2
    const maxH    = p.h - p.margin * 2 - headerH - legendH - footerH
    const size    = Math.min(colW, maxH)
    const x       = column === 0 ? p.margin : p.margin + colW + colGap
    return { x, y: matrixY, size }
  }

  // Portrait — full width, square
  const maxW = p.w - p.margin * 2
  const maxH = p.h - p.margin * 2 - headerH - legendH - footerH
  const size = Math.min(maxW, maxH)
  return { x: p.margin, y: matrixY, size }
}

// Adds the captured matrix canvas image to the PDF at the correct position
export function addMatrixImage(pdf, imgDataUrl, orientation, column = 0) {
  const { x, y, size } = getMatrixRect(orientation, column)
  pdf.addImage(imgDataUrl, 'PNG', x, y, size, size)
  return { x, y, size }
}

// Draws the color legend row
export function drawLegend(pdf, orientation, column = 0) {
  const p = PAGE[orientation]
  const { y: matrixY, size } = getMatrixRect(orientation, column)
  const legendY = matrixY + size + 5

  const items = [
    { label: 'Raise',     fill: C_RAISE, fill2: null },
    { label: 'Call',      fill: C_CALL,  fill2: null },
    { label: 'Mix R/F',   fill: C_RAISE, fill2: C_FOLD  },
    { label: 'Mix R/C',   fill: C_RAISE, fill2: C_CALL  },
    { label: 'Fold',      fill: C_FOLD,  fill2: null },
  ]

  let x = p.margin
  pdf.setFontSize(6.5)
  pdf.setFont('helvetica', 'normal')

  items.forEach(({ label, fill, fill2 }) => {
    const sw = 4.5, sh = 3.5
    if (fill2) {
      pdf.setFillColor(...fill)
      pdf.rect(x, legendY, sw, sh / 2, 'F')
      pdf.setFillColor(...fill2)
      pdf.rect(x, legendY + sh / 2, sw, sh / 2, 'F')
    } else {
      pdf.setFillColor(...fill)
      pdf.rect(x, legendY, sw, sh, 'F')
    }
    // Label
    pdf.setTextColor(...C_DIM)
    pdf.text(label, x + sw + 1.5, legendY + sh - 0.5)
    x += sw + 1.5 + pdf.getStringUnitWidth(label) * 6.5 * 0.352778 + 4
  })
}

// Draws footer line + URL text
export function drawFooter(pdf, orientation) {
  const p = PAGE[orientation]
  const y = p.h - p.margin

  pdf.setDrawColor(...C_SEP)
  pdf.setLineWidth(0.15)
  pdf.line(p.margin, y - 5, p.w - p.margin, y - 5)

  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...C_MUTED)
  pdf.text(
    'preflopvision.com  -  Para uso personal y educativo',
    p.w / 2, y - 1.5,
    { align: 'center' }
  )
}

// Landscape: draw a column label above the matrix (when 2 per page)
export function drawColumnLabel(pdf, position, sitLabel, orientation, column) {
  if (orientation !== 'landscape') return
  const { x, y, size } = getMatrixRect(orientation, column)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8.5)
  pdf.setTextColor(...C_CREAM)
  pdf.text(`${position}  ${sitLabel}`, x + size / 2, y - 2, { align: 'center' })
}
