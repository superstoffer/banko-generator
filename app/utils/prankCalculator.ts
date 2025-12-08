/**
 * Prank Mode Calculator
 * 
 * Calculates which numbers to exclude from the drawing bowl
 * to ensure only designated "winning" plates can achieve bingo.
 * 
 * Strategy:
 * 1. Generate all plates normally
 * 2. Select which plates should be winners
 * 3. Find numbers that appear on non-winning plates but NOT on winning plates
 * 4. These numbers must be KEPT in the bowl (they block non-winners)
 * 5. The numbers to EXCLUDE are those that would allow non-winners to complete
 * 
 * Actually, the correct approach:
 * - For each non-winning plate, at least one of its numbers must NEVER be drawn
 * - We find the minimal set of numbers to exclude such that:
 *   - All winning plates can still complete (all their numbers are drawable)
 *   - No non-winning plate can complete (each has at least one excluded number)
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
 * Uses smart selection to find winning plates that maximize prank effectiveness
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

  // Find the best combination of winning plates
  const { winningPlateIds, excludedNumbers } = findOptimalWinningPlates(
    plates, 
    config.winningPlatesCount
  )

  // Mark winning plates
  plates.forEach(plate => {
    plate.isWinning = winningPlateIds.includes(plate.id)
  })

  return {
    plates,
    winningPlateIds,
    excludedNumbers,
    summary: {
      totalPlates: config.totalPlates,
      winningPlates: config.winningPlatesCount,
      numbersToExclude: excludedNumbers
    }
  }
}

/**
 * Finds the optimal set of winning plates that maximizes prank effectiveness
 * 
 * Strategy: Try multiple random selections and pick the one with the best
 * excluded numbers ratio (fewest exclusions that still block all non-winners)
 */
function findOptimalWinningPlates(
  plates: BankoPlate[],
  winningCount: number
): { winningPlateIds: string[]; excludedNumbers: number[] } {
  const maxAttempts = 100
  let bestResult: { winningPlateIds: string[]; excludedNumbers: number[] } | null = null
  let bestScore = -1

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Randomly select winning plates
    const shuffled = [...plates].sort(() => Math.random() - 0.5)
    const candidateWinners = shuffled.slice(0, winningCount)
    const candidateWinnerIds = candidateWinners.map(p => p.id)

    // Calculate excluded numbers for this selection
    const result = calculateExcludedNumbers(plates, candidateWinnerIds)

    // Score: we want excluded numbers > 0 but not too many
    // Ideal is having some exclusions (prank works) but not too many (suspicious)
    const score = result.excludedNumbers.length > 0 
      ? (result.excludedNumbers.length <= 20 ? 100 - result.excludedNumbers.length : 50 - result.excludedNumbers.length)
      : -1000

    if (score > bestScore) {
      bestScore = score
      bestResult = {
        winningPlateIds: candidateWinnerIds,
        excludedNumbers: result.excludedNumbers
      }
    }

    // If we found a good result, we can stop early
    if (result.excludedNumbers.length >= 5 && result.excludedNumbers.length <= 15) {
      break
    }
  }

  return bestResult || {
    winningPlateIds: plates.slice(0, winningCount).map(p => p.id),
    excludedNumbers: []
  }
}

/**
 * Calculates which numbers should be excluded from the drawing bowl
 * 
 * Logic:
 * 1. Get all numbers that appear on winning plates (these must be drawable)
 * 2. For each non-winning plate, find numbers that are NOT on any winning plate
 * 3. We need to KEEP at least one such number per non-winning plate in the bowl
 *    (so they can never complete)
 * 4. Actually, we need to EXCLUDE numbers that are on non-winning plates
 *    but ensure winning plates can still complete
 * 
 * Correct logic:
 * - Numbers to EXCLUDE = numbers that appear ONLY on non-winning plates
 * - This way: winning plates have all their numbers available
 * - Non-winning plates are missing some numbers (the excluded ones)
 * 
 * Wait, that's still wrong. Let me think again:
 * - We want winning plates to be able to complete = all their numbers must be drawn
 * - We want non-winning plates to NOT complete = at least one number per plate not drawn
 * 
 * So: exclude numbers that are on non-winning plates but NOT on winning plates
 * This ensures:
 * - Winning plates: all numbers can be drawn (none excluded)
 * - Non-winning plates: have at least one excluded number (can't complete)
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

  // Get all numbers on winning plates - these MUST be drawable
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

  // Find numbers that are ONLY on non-winning plates (not on any winning plate)
  // These can be safely excluded - winning plates don't need them
  const safeToExclude: number[] = []
  for (const num of nonWinningNumbers) {
    if (!winningNumbers.has(num)) {
      safeToExclude.push(num)
    }
  }

  // Now we need to find the minimal set of exclusions that blocks ALL non-winning plates
  // Each non-winning plate must have at least one of its numbers excluded
  const excludedNumbers = findMinimalExclusionSet(nonWinningPlates, safeToExclude)

  // Sort for display
  excludedNumbers.sort((a, b) => a - b)

  const analysis = [
    `Tal på vindende plader: ${winningNumbers.size}`,
    `Tal på ikke-vindende plader: ${nonWinningNumbers.size}`,
    `Tal der kan ekskluderes sikkert: ${safeToExclude.length}`,
    `Tal der skal ekskluderes: ${excludedNumbers.length}`
  ]

  return { excludedNumbers, analysis }
}

/**
 * Finds the minimal set of numbers to exclude that blocks all non-winning plates
 * Uses a greedy algorithm: pick the number that blocks the most unblocked plates
 */
function findMinimalExclusionSet(
  nonWinningPlates: BankoPlate[],
  safeToExclude: number[]
): number[] {
  if (nonWinningPlates.length === 0) return []
  if (safeToExclude.length === 0) return []

  const excluded: number[] = []
  const blockedPlates = new Set<string>()

  // Create a map of number -> plates that have this number
  const numberToPlates = new Map<number, Set<string>>()
  for (const num of safeToExclude) {
    numberToPlates.set(num, new Set())
  }
  
  for (const plate of nonWinningPlates) {
    for (const num of plate.numbers) {
      if (numberToPlates.has(num)) {
        numberToPlates.get(num)!.add(plate.id)
      }
    }
  }

  // Greedy: keep picking the number that blocks the most unblocked plates
  while (blockedPlates.size < nonWinningPlates.length) {
    let bestNum = -1
    let bestCount = 0

    for (const num of safeToExclude) {
      if (excluded.includes(num)) continue

      const platesWithNum = numberToPlates.get(num)
      if (!platesWithNum) continue

      // Count how many NEW plates this would block
      let newBlocks = 0
      for (const plateId of platesWithNum) {
        if (!blockedPlates.has(plateId)) {
          newBlocks++
        }
      }

      if (newBlocks > bestCount) {
        bestCount = newBlocks
        bestNum = num
      }
    }

    if (bestNum === -1 || bestCount === 0) {
      // No more numbers can block new plates
      break
    }

    excluded.push(bestNum)
    const platesWithBest = numberToPlates.get(bestNum)
    if (platesWithBest) {
      for (const plateId of platesWithBest) {
        blockedPlates.add(plateId)
      }
    }
  }

  return excluded
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
  const { excludedNumbers, summary, plates } = result
  const analysis: string[] = []
  const recommendations: string[] = []

  // Count how many non-winning plates are actually blocked
  const nonWinningPlates = plates.filter(p => !p.isWinning)
  const excludedSet = new Set(excludedNumbers)
  let blockedCount = 0
  
  for (const plate of nonWinningPlates) {
    const hasExcludedNumber = plate.numbers.some(n => excludedSet.has(n))
    if (hasExcludedNumber) blockedCount++
  }

  // Calculate effectiveness as percentage of non-winning plates blocked
  const effectiveness = nonWinningPlates.length > 0 
    ? (blockedCount / nonWinningPlates.length) * 100 
    : 0

  analysis.push(`${excludedNumbers.length} numre skal fjernes fra trækposen`)
  analysis.push(`${summary.winningPlates} ud af ${summary.totalPlates} plader kan vinde`)
  analysis.push(`${blockedCount} af ${nonWinningPlates.length} ikke-vindende plader er blokeret`)

  // Provide recommendations based on effectiveness
  if (blockedCount < nonWinningPlates.length) {
    const unblocked = nonWinningPlates.length - blockedCount
    recommendations.push(`⚠️ ${unblocked} ikke-vindende plader kan stadig vinde!`)
    recommendations.push('Prøv at reducere antallet af vindende plader for bedre effekt')
  } else if (excludedNumbers.length === 0) {
    recommendations.push('⚠️ Ingen numre at ekskludere - alle plader kan vinde')
    recommendations.push('Prøv at reducere antallet af vindende plader')
  } else if (excludedNumbers.length <= 10) {
    recommendations.push('✅ Pranken virker! Få numre at fjerne - let at skjule')
  } else if (excludedNumbers.length <= 20) {
    recommendations.push('✅ Pranken virker! Moderat antal numre at fjerne')
  } else {
    recommendations.push('✅ Pranken virker! Men mange numre at fjerne')
    recommendations.push('⚠️ Kan virke mistænkeligt med så mange manglende numre')
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
