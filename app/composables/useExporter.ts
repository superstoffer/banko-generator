/**
 * Exporter Composable
 * 
 * Handles exporting plates to PDF, JSON, and text formats.
 * Uses jsPDF for PDF generation.
 */

import { jsPDF } from 'jspdf'
import type { 
  BankoPlate, 
  GenerationResult,
  PdfExportOptions,
  JsonExportOptions
} from '~/utils/types'
import { BANKO_CONSTANTS } from '~/utils/types'

/**
 * Composable for exporting banko plates
 */
export const useExporter = () => {
  // ============================================================================
  // State
  // ============================================================================

  const isExporting = ref(false)
  const exportError = ref<string | null>(null)

  // ============================================================================
  // PDF Export
  // ============================================================================

  /**
   * Exports plates to PDF
   * 
   * @param plates - Plates to export
   * @param options - PDF export options
   */
  const exportToPdf = async (
    plates: BankoPlate[],
    options: PdfExportOptions
  ): Promise<void> => {
    isExporting.value = true
    exportError.value = null

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = 210
      const pageHeight = 297
      const margin = 15
      const plateWidth = (pageWidth - margin * 2 - 10) / 2  // 2 columns
      const plateHeight = (pageHeight - margin * 2 - 20) / 3  // 3 rows

      let currentPage = 0
      let plateIndex = 0

      for (const plate of plates) {
        const positionOnPage = plateIndex % options.platesPerPage
        
        // Add new page if needed
        if (positionOnPage === 0 && plateIndex > 0) {
          doc.addPage()
          currentPage++
        }

        // Calculate position
        const col = positionOnPage % 2
        const row = Math.floor(positionOnPage / 2)
        const x = margin + col * (plateWidth + 10)
        const y = margin + row * (plateHeight + 10)

        // Draw plate
        drawPlateOnPdf(doc, plate, x, y, plateWidth, plateHeight, options)

        plateIndex++
      }

      // Add header to first page
      if (options.eventName) {
        doc.setPage(1)
        doc.setFontSize(16)
        doc.text(options.eventName, pageWidth / 2, 8, { align: 'center' })
      }

      // Save
      doc.save(options.filename)
    } catch (err) {
      exportError.value = err instanceof Error ? err.message : 'PDF export failed'
      throw err
    } finally {
      isExporting.value = false
    }
  }

  /**
   * Draws a single plate on the PDF
   */
  const drawPlateOnPdf = (
    doc: jsPDF,
    plate: BankoPlate,
    x: number,
    y: number,
    width: number,
    height: number,
    options: PdfExportOptions
  ): void => {
    const cellWidth = width / BANKO_CONSTANTS.COLUMNS
    const cellHeight = (height - 8) / BANKO_CONSTANTS.ROWS  // Leave room for ID

    // Draw plate border
    doc.setDrawColor(100)
    doc.setLineWidth(0.5)
    doc.rect(x, y, width, height)

    // Draw plate ID
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(plate.id, x + 2, y + 5)

    // Draw winning marker if applicable
    if (options.includeWinningMarkers && plate.isWinning) {
      doc.setTextColor(255, 165, 0)
      doc.text('★ VINDER', x + width - 20, y + 5)
    }

    // Draw grid
    const gridY = y + 8
    doc.setTextColor(0)
    doc.setFontSize(12)

    for (let row = 0; row < BANKO_CONSTANTS.ROWS; row++) {
      for (let col = 0; col < BANKO_CONSTANTS.COLUMNS; col++) {
        const cellX = x + col * cellWidth
        const cellY = gridY + row * cellHeight

        // Draw cell border
        doc.setDrawColor(180)
        doc.setLineWidth(0.2)
        doc.rect(cellX, cellY, cellWidth, cellHeight)

        // Draw number if present
        const gridRow = plate.grid[row]
        const cell = gridRow ? gridRow[col] : null
        if (cell !== null && cell !== undefined) {
          // Fill cell background
          doc.setFillColor(245, 245, 245)
          doc.rect(cellX, cellY, cellWidth, cellHeight, 'F')
          doc.rect(cellX, cellY, cellWidth, cellHeight, 'S')

          // Draw number
          doc.setFontSize(11)
          doc.text(
            cell.toString(),
            cellX + cellWidth / 2,
            cellY + cellHeight / 2 + 3,
            { align: 'center' }
          )
        }
      }
    }
  }

  // ============================================================================
  // JSON Export
  // ============================================================================

  /**
   * Exports plates to JSON file
   */
  const exportToJson = (
    result: GenerationResult,
    options: JsonExportOptions
  ): void => {
    isExporting.value = true
    exportError.value = null

    try {
      const data = options.includeMetadata
        ? {
            generatedAt: new Date().toISOString(),
            totalPlates: result.plates.length,
            winningPlates: result.winningPlateIds.length,
            excludedNumbers: result.excludedNumbers,
            plates: result.plates
          }
        : { plates: result.plates }

      const json = JSON.stringify(data, null, 2)
      downloadFile(json, options.filename, 'application/json')
    } catch (err) {
      exportError.value = err instanceof Error ? err.message : 'JSON export failed'
      throw err
    } finally {
      isExporting.value = false
    }
  }

  // ============================================================================
  // Instructions Export
  // ============================================================================

  /**
   * Exports prank instructions as text file
   */
  const exportInstructions = (
    result: GenerationResult,
    eventName?: string
  ): void => {
    isExporting.value = true
    exportError.value = null

    try {
      const lines = [
        '═══════════════════════════════════════════════════════════',
        '           HEMMELIGE INSTRUKTIONER - KUN TIL ARRANGØR',
        '═══════════════════════════════════════════════════════════',
        ''
      ]

      if (eventName) {
        lines.push(`Arrangement: ${eventName}`)
        lines.push('')
      }

      lines.push(`Dato: ${new Date().toLocaleDateString('da-DK')}`)
      lines.push('')
      lines.push('───────────────────────────────────────────────────────────')
      lines.push('NUMRE DER SKAL FJERNES FRA TRÆKPOSEN:')
      lines.push('───────────────────────────────────────────────────────────')
      lines.push('')
      lines.push(result.excludedNumbers.join(', '))
      lines.push('')
      lines.push(`Antal numre at fjerne: ${result.excludedNumbers.length}`)
      lines.push('')
      lines.push('───────────────────────────────────────────────────────────')
      lines.push('VINDENDE PLADER:')
      lines.push('───────────────────────────────────────────────────────────')
      lines.push('')
      
      for (const id of result.winningPlateIds) {
        lines.push(`  • ${id}`)
      }
      
      lines.push('')
      lines.push(`Antal vindende plader: ${result.winningPlateIds.length}`)
      lines.push('')
      lines.push('───────────────────────────────────────────────────────────')
      lines.push('INSTRUKTIONER:')
      lines.push('───────────────────────────────────────────────────────────')
      lines.push('')
      lines.push('1. Fjern alle ovenstående numre fra trækposen FØR spillet')
      lines.push('2. Bland de resterende numre grundigt')
      lines.push('3. Uddel pladerne til deltagerne')
      lines.push('4. Kun de markerede plader kan opnå fuld plade')
      lines.push('')
      lines.push('⚠️  ADVARSEL: Hold disse instruktioner hemmelige!')
      lines.push('⚠️  Destruer eller gem dokumentet efter brug')
      lines.push('')
      lines.push('═══════════════════════════════════════════════════════════')

      const content = lines.join('\n')
      const filename = eventName 
        ? `instruktioner_${eventName.replace(/\s+/g, '_')}.txt`
        : 'prank_instruktioner.txt'
      
      downloadFile(content, filename, 'text/plain')
    } catch (err) {
      exportError.value = err instanceof Error ? err.message : 'Instructions export failed'
      throw err
    } finally {
      isExporting.value = false
    }
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  /**
   * Downloads a file to the user's device
   */
  const downloadFile = (content: string, filename: string, mimeType: string): void => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    isExporting: readonly(isExporting),
    exportError: readonly(exportError),

    // Methods
    exportToPdf,
    exportToJson,
    exportInstructions
  }
}
