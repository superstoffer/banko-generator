/**
 * Prank Mode Calculator
 * 
 * Calculates which numbers to exclude from the drawing bowl
 * to ensure only designated "winning" plates can achieve bingo.
 * 
 * Based on CLAUDE.md prank mode requirements:
 * - Calculate numbers that appear ONLY on winning plates
 * - These numbers should be excluded from the bowl
 * - Only winning plates can then achieve full house
 */

import type { 
  BankoPlate, 
  GenerationConfig, 
  GenerationResult, 
  PrankAnalysis,
  HostInstructions 
} from './types'
import { generatePlates } from './plateGenerator'

// ============================================================================
// Main Prank Functions
// ============================================================================

/**
 * Generates plates with prank mode configuration
 * 
 * @param config - Generation configuration with winning plate count
 * @returns GenerationResult with plates, winning IDs, and excluded numbers
 */
export function generatePrankPlates(config: GenerationConfig): GenerationResult {
  if (config.winningPlatesCount > config.totalPlates) {
    throw new Error('Winning plates count cannot exceed total plates')
  }
  if (config.winningPlatesCount <= 0) {
    throw new Error('Must have at least one winning plate for prank mode')
  }
  if (config.totalPlates <= 0) {
    throw new Error('Must generate at least one plate')
  }

  // Generate all plates
  const plates = generatePlates(config.totalPlates)

  // Select winning plates (first N plates for simplicity, could be randomized)
  const winningPlateIds = selectWinningPlates(plates, config.winningPlatesCount)

  // Mark winning plates
  plates.forEach(plate => {
    plate.isWinning = winningPlateIds.includes(plate.id)
  })

  // Calculate excluded numbers
  const prankResult = calculateExcludedNumbers(plates, winningPlateIds)

  return {
    plates,
    winningPlateIds,
    excludedNumbers: prankResult.excludedNumbers,
    summary: {
      totalPlates: config.totalPlates,
      winningPlates: config.winningPlatesCount,
      numbersToExclude: prankResult.excludedNumbers
    }
  }
}

/**
 * Calculates which numbers should be excluded from the drawing bowl
 * 
 * Numbers that appear ONLY on winning plates should be excluded.
 * This ensures non-winning plates can never complete a full house.
 * 
 * @param plates - All generated plates
 * @param winningPlateIds - IDs of designated winning plates
 * @returns Object with excluded numbers and analysis
 */
export function calculateExcludedNumbers(
  plates: BankoPlate[],
  winningPlateIds: string[]
): { excludedNumbers: number[]; analysis: string[] } {
  // Separate winning and non-winning plates
  const winningPlates = plates.filter(p => winningPlateIds.includes(p.id))
  const nonWinningPlates = plates.filter(p => !winningPlateIds.includes(p.id))

  // Get all numbers on winning plates
  const winningNumbers = new Set<number>()
  for (const plate of winningPlates) {
    for (const num of plate.numbers) {
      winningNumbers.add(num)
    }
  }

  // Get all numbers on non-winning plates
  const nonWinningNumbers = new Set<number>()
  for (const plate of nonWinningPlates) {
    for (const num of plate.numbers) {
      nonWinningNumbers.add(num)
    }
  }

  // Find numbers that are ONLY on winning plates (not on any non-winning plate)
  const excludedNumbers: number[] = []
  for (const num of winningNumbers) {
    if (!nonWinningNumbers.has(num)) {
      excludedNumbers.push(num)
    }
  }

  // Sort for display
  excludedNumbers.sort((a, b) => a - b)

  const analysis = [
    `Total numbers on winning plates: ${winningNumbers.size}`,
    `Total numbers on non-winning plates: ${nonWinningNumbers.size}`,
    `Numbers unique to winning plates: ${excludedNumbers.length}`
  ]

  return { excludedNumbers, analysis }
}

/**
 * Selects which plates should be winning plates
 * Uses random selection for fairness
 * 
 * @param plates - All plates
 * @param count - Number of winning plates to select
 * @returns Array of winning plate IDs
 */
function selectWinningPlates(plates: BankoPlate[], count: number): string[] {
  // Shuffle plates and take first N
  const shuffled = [...plates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(p => p.id)
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Analyzes the effectiveness of the prank configuration
 * 
 * @param result - Generation result with excluded numbers
 * @returns PrankAnalysis with recommendations
 */
export function analyzePrankEffectiveness(result: GenerationResult): PrankAnalysis {
  const { excludedNumbers, summary } = result
  const analysis: string[] = []
  const recommendations: string[] = []

  // Calculate effectiveness
  const effectiveness = Math.min(100, (excludedNumbers.length / 15) * 100)

  analysis.push(`${excludedNumbers.length} numre skal fjernes fra trækposen`)
  analysis.push(`${summary.winningPlates} ud af ${summary.totalPlates} plader kan vinde`)

  // Provide recommendations based on excluded count
  if (excludedNumbers.length === 0) {
    recommendations.push('⚠️ Ingen unikke numre fundet - alle plader kan potentielt vinde')
    recommendations.push('Prøv at reducere antallet af vindende plader')
  } else if (excludedNumbers.length < 5) {
    recommendations.push('⚠️ Få unikke numre - pranken er svag')
    recommendations.push('Overvej at reducere antallet af vindende plader for bedre effekt')
  } else if (excludedNumbers.length > 20) {
    recommendations.push('✅ Mange unikke numre - pranken er stærk')
    recommendations.push('Husk at fjerne alle numre fra posen før spillet starter')
  } else {
    recommendations.push('✅ God balance af unikke numre')
  }

  // Warn about suspicious number of exclusions
  if (excludedNumbers.length > 30) {
    recommendations.push('⚠️ Mange numre at fjerne - kan virke mistænkeligt')
  }

  return {
    analysis,
    recommendations,
    effectiveness
  }
}

/**
 * Generates instructions for the game host
 * 
 * @param result - Generation result
 * @param eventName - Optional event name
 * @returns HostInstructions with setup steps
 */
export function generateHostInstructions(
  result: GenerationResult,
  eventName?: string
): HostInstructions {
  const { excludedNumbers, winningPlateIds } = result

  const setup = [
    'Før spillet starter:',
    `1. Fjern følgende ${excludedNumbers.length} numre fra trækposen:`,
    `   ${excludedNumbers.join(', ')}`,
    '2. Bland de resterende numre grundigt',
    '3. Uddel pladerne til deltagerne',
    `4. De ${winningPlateIds.length} vindende plader har ID:`,
    ...winningPlateIds.map(id => `   - ${id}`)
  ]

  const warnings = [
    '⚠️ Hold disse instruktioner hemmelige!',
    '⚠️ Vis ikke denne side til andre deltagere',
    '⚠️ Destruer eller gem instruktionerne efter brug'
  ]

  if (eventName) {
    setup.unshift(`Arrangement: ${eventName}`)
  }

  return {
    excludedNumbers,
    winningPlateIds,
    setup,
    warnings
  }
}
