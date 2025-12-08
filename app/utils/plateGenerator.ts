/**
 * Banko Plate Generator
 * 
 * Generates valid banko plates following Danish 90-ball banko rules:
 * - FN-110: 3 rows × 9 columns grid
 * - FN-111: Exactly 5 numbers per row
 * - FN-112: Exactly 15 numbers total
 * - FN-113: Column ranges (1-9, 10-19, ..., 80-90)
 * - FN-114: Max 3 numbers per column
 * - FN-116: Ascending order within columns
 * - G-101: Unique plates in batch
 * - IFN-100: 1000 plates in < 5 seconds
 */

import type { BankoPlate, BankoGrid } from './types'
import { BANKO_CONSTANTS, COLUMN_RANGES } from './types'
import { validatePlate } from './validator'

// ============================================================================
// Main Generation Functions
// ============================================================================

/**
 * Generates a single valid banko plate
 * Uses retry logic if generation fails validation
 * 
 * @returns A valid BankoPlate
 * @throws Error if unable to generate after max attempts
 */
export function generatePlate(): BankoPlate {
  const maxAttempts = 1000

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const plate = attemptPlateGeneration()
    const validation = validatePlate(plate)

    if (validation.isValid) {
      return plate
    }
  }

  throw new Error(`Failed to generate valid plate after ${maxAttempts} attempts`)
}

/**
 * Generates multiple unique banko plates
 * 
 * @param count - Number of plates to generate
 * @returns Array of unique valid plates
 * @throws Error if unable to generate required unique plates
 */
export function generatePlates(count: number): BankoPlate[] {
  if (count <= 0) {
    throw new Error('Count must be positive')
  }

  const plates: BankoPlate[] = []
  const seenHashes = new Set<string>()
  const maxAttempts = count * 10  // Allow retries for duplicates

  let attempts = 0
  while (plates.length < count && attempts < maxAttempts) {
    attempts++
    const plate = generatePlate()
    const hash = getPlateHash(plate)

    if (!seenHashes.has(hash)) {
      seenHashes.add(hash)
      plates.push(plate)
    }
  }

  if (plates.length < count) {
    throw new Error(`Could only generate ${plates.length} unique plates out of ${count} requested`)
  }

  return plates
}

// ============================================================================
// Core Generation Algorithm
// ============================================================================

/**
 * Attempts to generate a single plate
 * May produce invalid plates - caller should validate
 */
function attemptPlateGeneration(): BankoPlate {
  const id = generatePlateId()
  const grid = createEmptyGrid()

  // Step 1: Determine column distribution (how many numbers per column)
  const columnCounts = distributeColumnsToRows()

  // Step 2: Place numbers in grid based on distribution
  placeNumbersInGrid(grid, columnCounts)

  // Step 3: Sort numbers in each column (ascending order)
  sortColumnsAscending(grid)

  // Step 4: Extract all numbers from grid
  const numbers = extractNumbers(grid)

  return { id, grid, numbers }
}

/**
 * Creates an empty 3x9 grid filled with nulls
 */
function createEmptyGrid(): BankoGrid {
  return Array.from({ length: BANKO_CONSTANTS.ROWS }, () =>
    Array.from({ length: BANKO_CONSTANTS.COLUMNS }, () => null)
  )
}

/**
 * Distributes columns to rows ensuring:
 * - Each row has exactly 5 numbers
 * - Each column has 0-3 numbers
 * - Total is 15 numbers
 * 
 * @returns Array of 9 arrays, each containing row indices where that column has numbers
 */
function distributeColumnsToRows(): number[][] {
  const columnCounts: number[][] = Array.from({ length: BANKO_CONSTANTS.COLUMNS }, () => [])

  // Track how many numbers each row has
  const rowCounts = [0, 0, 0]

  // We need to place 15 numbers total (5 per row)
  // Strategy: randomly assign columns to rows while respecting constraints

  // First, ensure each column can have at least some numbers
  // Shuffle column order for randomness
  const columnOrder = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8])

  for (const col of columnOrder) {
    // Determine how many numbers this column should have (1-3)
    const maxForColumn = BANKO_CONSTANTS.MAX_PER_COLUMN
    const minForColumn = 1  // Each column should have at least 1 number ideally

    // Find rows that can still accept numbers
    const availableRows = [0, 1, 2].filter(row => (rowCounts[row] ?? 0) < BANKO_CONSTANTS.NUMBERS_PER_ROW)

    if (availableRows.length === 0) continue

    // Randomly decide how many numbers in this column (1 to min of maxForColumn and availableRows)
    const count = Math.min(
      randomInt(minForColumn, maxForColumn),
      availableRows.length
    )

    // Randomly select which rows get numbers in this column
    const selectedRows = shuffleArray(availableRows).slice(0, count)

    for (const row of selectedRows) {
      const currentCount = rowCounts[row] ?? 0
      if (currentCount < BANKO_CONSTANTS.NUMBERS_PER_ROW) {
        const colArray = columnCounts[col]
        if (colArray) {
          colArray.push(row)
          rowCounts[row] = currentCount + 1
        }
      }
    }
  }

  // Verify we have exactly 5 numbers per row, adjust if needed
  for (let row = 0; row < BANKO_CONSTANTS.ROWS; row++) {
    const currentRowCount = rowCounts[row] ?? 0
    while (currentRowCount < BANKO_CONSTANTS.NUMBERS_PER_ROW && (rowCounts[row] ?? 0) < BANKO_CONSTANTS.NUMBERS_PER_ROW) {
      // Find a column that can accept more numbers and doesn't have this row yet
      const availableColumns = columnOrder.filter(col => {
        const colData = columnCounts[col]
        return colData && colData.length < BANKO_CONSTANTS.MAX_PER_COLUMN && !colData.includes(row)
      })

      if (availableColumns.length === 0) break

      const colIdx = randomInt(0, availableColumns.length - 1)
      const col = availableColumns[colIdx]
      if (col !== undefined) {
        const colArray = columnCounts[col]
        if (colArray) {
          colArray.push(row)
          rowCounts[row] = (rowCounts[row] ?? 0) + 1
        }
      }
    }
  }

  return columnCounts
}

/**
 * Places random numbers in the grid based on column distribution
 */
function placeNumbersInGrid(grid: BankoGrid, columnCounts: number[][]): void {
  for (let col = 0; col < BANKO_CONSTANTS.COLUMNS; col++) {
    const rows = columnCounts[col]
    if (!rows || rows.length === 0) continue

    const range = COLUMN_RANGES[col]
    if (!range) continue

    // Generate unique random numbers for this column
    const numbers = generateUniqueNumbersInRange(range.min, range.max, rows.length)

    // Place numbers in the specified rows
    rows.forEach((rowIdx, i) => {
      const num = numbers[i]
      if (num !== undefined) {
        const gridRow = grid[rowIdx]
        if (gridRow) {
          gridRow[col] = num
        }
      }
    })
  }
}

/**
 * Sorts numbers within each column in ascending order (top to bottom)
 */
function sortColumnsAscending(grid: BankoGrid): void {
  for (let col = 0; col < BANKO_CONSTANTS.COLUMNS; col++) {
    // Extract numbers from this column with their row indices
    const entries: { row: number; value: number }[] = []
    for (let row = 0; row < BANKO_CONSTANTS.ROWS; row++) {
      const gridRow = grid[row]
      if (gridRow) {
        const cell = gridRow[col]
        if (cell !== null && cell !== undefined) {
          entries.push({ row, value: cell })
        }
      }
    }

    if (entries.length <= 1) continue

    // Sort by value
    entries.sort((a, b) => a.value - b.value)

    // Get original row positions (sorted)
    const originalRows = entries.map(e => e.row).sort((a, b) => a - b)

    // Place sorted values back into original row positions
    for (let i = 0; i < entries.length; i++) {
      const rowIdx = originalRows[i]
      const entry = entries[i]
      if (rowIdx !== undefined && entry !== undefined) {
        const row = grid[rowIdx]
        if (row) {
          row[col] = entry.value
        }
      }
    }
  }
}

/**
 * Extracts all numbers from the grid and returns them sorted
 */
function extractNumbers(grid: BankoGrid): number[] {
  const numbers: number[] = []
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== null) {
        numbers.push(cell)
      }
    }
  }
  return numbers.sort((a, b) => a - b)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a unique plate ID
 */
function generatePlateId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 11)
  return `plate_${timestamp}_${random}`
}

/**
 * Creates a hash of a plate for uniqueness checking
 */
function getPlateHash(plate: BankoPlate): string {
  return plate.numbers.join(',')
}

/**
 * Generates n unique random numbers within a range
 */
function generateUniqueNumbersInRange(min: number, max: number, count: number): number[] {
  const available = []
  for (let i = min; i <= max; i++) {
    available.push(i)
  }

  if (count > available.length) {
    throw new Error(`Cannot generate ${count} unique numbers in range ${min}-${max}`)
  }

  const result: number[] = []
  for (let i = 0; i < count; i++) {
    const idx = randomInt(0, available.length - 1)
    const num = available[idx]
    if (num !== undefined) {
      result.push(num)
      available.splice(idx, 1)
    }
  }

  return result
}

/**
 * Generates a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i)
    const temp = result[i]
    result[i] = result[j] as T
    result[j] = temp as T
  }
  return result
}
