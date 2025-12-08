/**
 * Banko Plate Validator
 * 
 * Validates plates against Danish 90-ball banko rules:
 * - FN-110: 3 rows × 9 columns grid
 * - FN-111: Exactly 5 numbers per row
 * - FN-112: Exactly 15 numbers total
 * - FN-113: Column ranges (1-9, 10-19, ..., 80-90)
 * - FN-114: Max 3 numbers per column
 * - FN-116: Ascending order within columns
 * - IFN-200: Uniqueness guarantee
 */

import type { BankoPlate, ValidationResult } from './types'
import { BANKO_CONSTANTS, COLUMN_RANGES } from './types'

// ============================================================================
// Main Validation Functions
// ============================================================================

/**
 * Validates a single banko plate against all rules
 * 
 * @param plate - The plate to validate
 * @returns ValidationResult with isValid flag and any errors
 */
export function validatePlate(plate: BankoPlate): ValidationResult {
  const errors: string[] = []

  // Validate grid dimensions (FN-110)
  validateGridDimensions(plate, errors)

  // Validate numbers per row (FN-111)
  validateNumbersPerRow(plate, errors)

  // Validate total numbers (FN-112)
  validateTotalNumbers(plate, errors)

  // Validate column ranges (FN-113)
  validateColumnRanges(plate, errors)

  // Validate max per column (FN-114)
  validateMaxPerColumn(plate, errors)

  // Validate ascending order (FN-116)
  validateAscendingOrder(plate, errors)

  // Validate no duplicates
  validateNoDuplicates(plate, errors)

  // Validate grid matches numbers array
  validateGridMatchesNumbers(plate, errors)

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates that all plates in a batch are unique (IFN-200)
 * 
 * @param plates - Array of plates to check
 * @returns ValidationResult with uniqueness status
 */
export function validatePlatesUniqueness(plates: BankoPlate[]): ValidationResult {
  const errors: string[] = []
  const seen = new Set<string>()

  for (const plate of plates) {
    const hash = getPlateHash(plate)
    if (seen.has(hash)) {
      errors.push(`Duplicate plate found: ${plate.id}`)
    }
    seen.add(hash)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// ============================================================================
// Individual Validation Rules
// ============================================================================

/**
 * FN-110: Grid must be 3 rows × 9 columns
 */
function validateGridDimensions(plate: BankoPlate, errors: string[]): void {
  if (plate.grid.length !== BANKO_CONSTANTS.ROWS) {
    errors.push(
      `Grid must have exactly ${BANKO_CONSTANTS.ROWS} rows, got ${plate.grid.length}`
    )
    return
  }

  for (let i = 0; i < plate.grid.length; i++) {
    const row = plate.grid[i]
    if (row && row.length !== BANKO_CONSTANTS.COLUMNS) {
      errors.push(
        `Row ${i + 1} must have exactly ${BANKO_CONSTANTS.COLUMNS} columns, got ${row.length}`
      )
    }
  }
}

/**
 * FN-111: Each row must have exactly 5 numbers
 */
function validateNumbersPerRow(plate: BankoPlate, errors: string[]): void {
  for (let i = 0; i < plate.grid.length; i++) {
    const row = plate.grid[i]
    if (!row) continue
    const numbersInRow = row.filter(cell => cell !== null).length
    if (numbersInRow !== BANKO_CONSTANTS.NUMBERS_PER_ROW) {
      errors.push(
        `Row ${i + 1} must have exactly ${BANKO_CONSTANTS.NUMBERS_PER_ROW} numbers, got ${numbersInRow}`
      )
    }
  }
}

/**
 * FN-112: Plate must have exactly 15 numbers total
 */
function validateTotalNumbers(plate: BankoPlate, errors: string[]): void {
  if (plate.numbers.length !== BANKO_CONSTANTS.TOTAL_NUMBERS) {
    errors.push(
      `Plate must have exactly ${BANKO_CONSTANTS.TOTAL_NUMBERS} numbers, got ${plate.numbers.length}`
    )
  }

  // Also count from grid
  let gridCount = 0
  for (const row of plate.grid) {
    gridCount += row.filter(cell => cell !== null).length
  }
  if (gridCount !== BANKO_CONSTANTS.TOTAL_NUMBERS) {
    errors.push(
      `Grid must have exactly ${BANKO_CONSTANTS.TOTAL_NUMBERS} numbers, got ${gridCount}`
    )
  }
}

/**
 * FN-113: Numbers must be in correct column ranges
 */
function validateColumnRanges(plate: BankoPlate, errors: string[]): void {
  for (let rowIdx = 0; rowIdx < plate.grid.length; rowIdx++) {
    const row = plate.grid[rowIdx]
    if (!row) continue
    for (let col = 0; col < row.length; col++) {
      const cell = row[col]
      if (cell !== null && cell !== undefined) {
        const range = COLUMN_RANGES[col]
        if (range && (cell < range.min || cell > range.max)) {
          errors.push(
            `Number ${cell} at row ${rowIdx + 1}, column ${col + 1} is outside valid range ${range.min}-${range.max}`
          )
        }
      }
    }
  }
}

/**
 * FN-114: Each column can have maximum 3 numbers
 */
function validateMaxPerColumn(plate: BankoPlate, errors: string[]): void {
  for (let col = 0; col < BANKO_CONSTANTS.COLUMNS; col++) {
    let count = 0
    for (let rowIdx = 0; rowIdx < plate.grid.length; rowIdx++) {
      const row = plate.grid[rowIdx]
      if (row && row[col] !== null && row[col] !== undefined) {
        count++
      }
    }
    if (count > BANKO_CONSTANTS.MAX_PER_COLUMN) {
      errors.push(
        `Column ${col + 1} has ${count} numbers, maximum is ${BANKO_CONSTANTS.MAX_PER_COLUMN}`
      )
    }
  }
}

/**
 * FN-116: Numbers in each column must be in ascending order top to bottom
 */
function validateAscendingOrder(plate: BankoPlate, errors: string[]): void {
  for (let col = 0; col < BANKO_CONSTANTS.COLUMNS; col++) {
    const numbersInColumn: number[] = []
    for (let rowIdx = 0; rowIdx < plate.grid.length; rowIdx++) {
      const row = plate.grid[rowIdx]
      if (!row) continue
      const cell = row[col]
      if (cell !== null && cell !== undefined) {
        numbersInColumn.push(cell)
      }
    }

    // Check ascending order
    for (let i = 1; i < numbersInColumn.length; i++) {
      const current = numbersInColumn[i]
      const previous = numbersInColumn[i - 1]
      if (current !== undefined && previous !== undefined && current <= previous) {
        errors.push(
          `Column ${col + 1} numbers are not in ascending order: ${numbersInColumn.join(', ')}`
        )
        break
      }
    }
  }
}

/**
 * Validate no duplicate numbers on the plate
 */
function validateNoDuplicates(plate: BankoPlate, errors: string[]): void {
  const seen = new Set<number>()
  for (const num of plate.numbers) {
    if (seen.has(num)) {
      errors.push(`Duplicate number found on plate: ${num}`)
    }
    seen.add(num)
  }
}

/**
 * Validate that grid numbers match the numbers array
 */
function validateGridMatchesNumbers(plate: BankoPlate, errors: string[]): void {
  const gridNumbers: number[] = []
  for (const row of plate.grid) {
    for (const cell of row) {
      if (cell !== null) {
        gridNumbers.push(cell)
      }
    }
  }

  const sortedGrid = [...gridNumbers].sort((a, b) => a - b)
  const sortedNumbers = [...plate.numbers].sort((a, b) => a - b)

  if (JSON.stringify(sortedGrid) !== JSON.stringify(sortedNumbers)) {
    errors.push('Grid numbers do not match numbers array')
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a unique hash for a plate based on its numbers
 * Used for uniqueness checking
 */
function getPlateHash(plate: BankoPlate): string {
  return [...plate.numbers].sort((a, b) => a - b).join(',')
}

/**
 * Quick validation check - returns true if plate is valid
 */
export function isValidPlate(plate: BankoPlate): boolean {
  return validatePlate(plate).isValid
}

/**
 * Get column index for a given number
 */
export function getColumnForNumber(num: number): number {
  if (num < 1 || num > 90) {
    throw new Error(`Invalid banko number: ${num}`)
  }
  if (num <= 9) return 0
  if (num >= 80) return 8
  return Math.floor(num / 10)
}
