/**
 * Banko Generator Composable
 * 
 * Provides reactive state management for plate generation
 * with support for both normal and prank modes.
 */

import type { 
  BankoPlate, 
  GenerationConfig, 
  GenerationResult,
  PrankAnalysis,
  HostInstructions
} from '~/utils/types'
import { generatePlates } from '~/utils/plateGenerator'
import { 
  generatePrankPlates, 
  analyzePrankEffectiveness,
  generateHostInstructions 
} from '~/utils/prankCalculator'

/**
 * Composable for banko plate generation
 * 
 * @returns Reactive state and methods for plate generation
 */
export const useBankoGenerator = () => {
  // ============================================================================
  // State
  // ============================================================================

  const isGenerating = ref(false)
  const generationResult = ref<GenerationResult | null>(null)
  const error = ref<string | null>(null)

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Statistics about the current generation result
   */
  const statistics = computed(() => {
    if (!generationResult.value) return null

    return {
      totalPlates: generationResult.value.plates.length,
      winningPlates: generationResult.value.winningPlateIds.length,
      excludedNumbers: generationResult.value.excludedNumbers.length,
      numbersPerPlate: 15
    }
  })

  /**
   * Prank analysis for the current result (if prank mode)
   */
  const prankAnalysis = computed((): PrankAnalysis | null => {
    if (!generationResult.value) return null
    if (generationResult.value.winningPlateIds.length === 0) return null

    return analyzePrankEffectiveness(generationResult.value)
  })

  /**
   * Host instructions for prank mode
   */
  const hostInstructions = computed((): HostInstructions | null => {
    if (!generationResult.value) return null
    if (generationResult.value.winningPlateIds.length === 0) return null

    return generateHostInstructions(generationResult.value)
  })

  // ============================================================================
  // Methods
  // ============================================================================

  /**
   * Generates plates in normal mode (no prank)
   * 
   * @param count - Number of plates to generate
   * @returns Generated plates or null on error
   */
  const generateNormalPlates = async (count: number): Promise<BankoPlate[] | null> => {
    isGenerating.value = true
    error.value = null

    try {
      // Use setTimeout to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10))

      const plates = generatePlates(count)

      // Set generation result for normal mode
      generationResult.value = {
        plates,
        winningPlateIds: [],
        excludedNumbers: [],
        summary: {
          totalPlates: count,
          winningPlates: 0,
          numbersToExclude: []
        }
      }

      return plates
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to generate plates'
      generationResult.value = null
      return null
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Generates plates in prank mode with analysis
   * 
   * @param config - Generation configuration
   */
  const generatePrankPlatesWithAnalysis = async (config: GenerationConfig): Promise<void> => {
    isGenerating.value = true
    error.value = null

    try {
      // Use setTimeout to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10))

      const result = generatePrankPlates(config)
      generationResult.value = result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to generate prank plates'
      generationResult.value = null
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Clears the current generation result
   */
  const clearResult = () => {
    generationResult.value = null
    error.value = null
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State (readonly)
    isGenerating: readonly(isGenerating),
    generationResult: readonly(generationResult),
    error: readonly(error),

    // Computed
    statistics,
    prankAnalysis,
    hostInstructions,

    // Methods
    generateNormalPlates,
    generatePrankPlatesWithAnalysis,
    clearResult
  }
}
