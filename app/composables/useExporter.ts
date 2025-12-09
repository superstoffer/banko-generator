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
      
      // Calculate layout based on plates per page
      // 3 plates = 1 column, 3 rows (full width cards)
      // 6 plates = 2 columns, 3 rows
      const cols = options.platesPerPage <= 3 ? 1 : 2
      const rows = Math.ceil(options.platesPerPage / cols)
      const gap = 8
      
      const plateWidth = (pageWidth - margin * 2 - (cols - 1) * gap) / cols
      const plateHeight = (pageHeight - margin * 2 - (rows - 1) * gap) / rows

      let plateIndex = 0

      for (const plate of plates) {
        const positionOnPage = plateIndex % options.platesPerPage
        
        // Add new page if needed
        if (positionOnPage === 0 && plateIndex > 0) {
          doc.addPage()
        }

        // Calculate position
        const col = positionOnPage % cols
        const row = Math.floor(positionOnPage / cols)
        const x = margin + col * (plateWidth + gap)
        const y = margin + row * (plateHeight + gap)

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
   * Draws a single plate on the PDF - Simple traditional Danish banko style
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
    // Calculate square cell size based on available space
    const maxCellWidth = width / BANKO_CONSTANTS.COLUMNS
    const maxCellHeight = height / BANKO_CONSTANTS.ROWS
    const cellSize = Math.min(maxCellWidth, maxCellHeight) // Square cells
    
    // Calculate actual grid dimensions
    const gridWidth = cellSize * BANKO_CONSTANTS.COLUMNS
    const gridHeight = cellSize * BANKO_CONSTANTS.ROWS
    
    // Center the grid in the available space
    const gridX = x + (width - gridWidth) / 2
    const gridY = y + (height - gridHeight) / 2

    // Draw winner indicator outside the card (to the left)
    if (options.includeWinningMarkers && plate.isWinning) {
      doc.setFillColor(251, 191, 36)
      doc.roundedRect(gridX - 22, gridY + gridHeight / 2 - 5, 20, 10, 2, 2, 'F')
      doc.setTextColor(0)
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.text('VINDER', gridX - 12, gridY + gridHeight / 2 + 2, { align: 'center' })
    }

    // Draw outer card border
    doc.setDrawColor(0)
    doc.setLineWidth(0.8)
    doc.rect(gridX, gridY, gridWidth, gridHeight, 'S')

    // Draw grid with square cells
    for (let row = 0; row < BANKO_CONSTANTS.ROWS; row++) {
      for (let col = 0; col < BANKO_CONSTANTS.COLUMNS; col++) {
        const cellX = gridX + col * cellSize
        const cellY = gridY + row * cellSize

        const gridRow = plate.grid[row]
        const cell = gridRow ? gridRow[col] : null

        // Fill cell background
        if (cell !== null && cell !== undefined) {
          doc.setFillColor(255, 255, 255) // White for numbers
        } else {
          doc.setFillColor(240, 240, 240) // Light gray for empty
        }
        doc.rect(cellX, cellY, cellSize, cellSize, 'F')

        // Draw cell border
        doc.setDrawColor(0)
        doc.setLineWidth(0.3)
        doc.rect(cellX, cellY, cellSize, cellSize, 'S')

        // Draw number if present (centered in square cell)
        if (cell !== null && cell !== undefined) {
          doc.setTextColor(0)
          const fontSize = cellSize * 0.90 // Bigger font
          doc.setFontSize(fontSize)
          doc.setFont('helvetica', 'bold')
          doc.text(
            cell.toString(),
            cellX + cellSize / 2,
            cellY + cellSize / 2 + fontSize * 0.15, // True vertical center
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
