/**
 * Banko Generator - Type Definitions
 * 
 * Based on requirements from docs/requirements.md:
 * - FN-110: 3 rows × 9 columns grid
 * - FN-111: Exactly 5 numbers per row
 * - FN-112: Exactly 15 numbers total
 * - FN-113: Column ranges (1-9, 10-19, ..., 80-90)
 * - FN-114: Max 3 numbers per column
 * - FN-116: Ascending order within columns
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Core banko plate constants based on Danish 90-ball banko rules
 */
export const BANKO_CONSTANTS = {
  ROWS: 3,
  COLUMNS: 9,
  NUMBERS_PER_ROW: 5,
  BLANKS_PER_ROW: 4,
  TOTAL_NUMBERS: 15,
  MAX_PER_COLUMN: 3,
  MIN_NUMBER: 1,
  MAX_NUMBER: 90
} as const

/**
 * Column ranges for number placement
 * Column 1: 1-9, Column 2: 10-19, ..., Column 9: 80-90
 */
export const COLUMN_RANGES: readonly { min: number; max: number }[] = [
  { min: 1, max: 9 },    // Column 0 (1-9)
  { min: 10, max: 19 },  // Column 1 (10-19)
  { min: 20, max: 29 },  // Column 2 (20-29)
  { min: 30, max: 39 },  // Column 3 (30-39)
  { min: 40, max: 49 },  // Column 4 (40-49)
  { min: 50, max: 59 },  // Column 5 (50-59)
  { min: 60, max: 69 },  // Column 6 (60-69)
  { min: 70, max: 79 },  // Column 7 (70-79)
  { min: 80, max: 90 }   // Column 8 (80-90) - 11 numbers available
] as const

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Represents a single banko plate
 * 
 * @property id - Unique identifier for the plate (UX-100)
 * @property grid - 3x9 matrix where null represents blank cells
 * @property numbers - Array of all 15 numbers on the plate
 * @property isWinning - Optional flag for prank mode
 */
export interface BankoPlate {
  id: string
  grid: (number | null)[][]  // 3 rows × 9 columns
  numbers: number[]          // All 15 numbers, sorted
  isWinning?: boolean
}

/**
 * Configuration for plate generation
 * 
 * @property totalPlates - Number of plates to generate (G-100)
 * @property winningPlatesCount - Number of winning plates for prank mode
 * @property eventName - Optional event name for branding (UX-102)
 */
export interface GenerationConfig {
  totalPlates: number
  winningPlatesCount: number
  eventName?: string
}

/**
 * Result of plate generation including prank mode data
 */
export interface GenerationResult {
  plates: BankoPlate[]
  winningPlateIds: string[]
  excludedNumbers: number[]
  summary: GenerationSummary
}

/**
 * Summary statistics for generation result
 */
export interface GenerationSummary {
  totalPlates: number
  winningPlates: number
  numbersToExclude: number[]
}

/**
 * Result of plate validation
 * 
 * @property isValid - Whether the plate passes all validation rules
 * @property errors - List of validation error messages
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Analysis of prank mode effectiveness
 */
export interface PrankAnalysis {
  analysis: string[]
  recommendations: string[]
  effectiveness: number  // Percentage 0-100
}

/**
 * Instructions for the game host in prank mode
 */
export interface HostInstructions {
  excludedNumbers: number[]
  winningPlateIds: string[]
  setup: string[]
  warnings: string[]
}

// ============================================================================
// PDF Export Types
// ============================================================================

/**
 * Options for PDF export
 */
export interface PdfExportOptions {
  platesPerPage: number
  filename: string
  includeWinningMarkers: boolean
  eventName?: string
}

/**
 * Options for JSON export
 */
export interface JsonExportOptions {
  filename: string
  includeMetadata: boolean
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type for a single row in the grid (9 cells)
 */
export type BankoRow = (number | null)[]

/**
 * Type for the complete grid (3 rows × 9 columns)
 */
export type BankoGrid = BankoRow[]

/**
 * Column index type (0-8)
 */
export type ColumnIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/**
 * Row index type (0-2)
 */
export type RowIndex = 0 | 1 | 2
