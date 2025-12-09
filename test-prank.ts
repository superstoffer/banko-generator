/**
 * Test script for prank mode functionality
 * 
 * Run with: bun run test-prank.ts
 */

import { generatePrankPlates } from './app/utils/prankCalculator'
import { validatePlate } from './app/utils/validator'

console.log('═══════════════════════════════════════════════════════════')
console.log('           PRANK MODE TEST')
console.log('═══════════════════════════════════════════════════════════\n')

// Test configuration
const config = {
  totalPlates: 50,
  winningPlatesCount: 10
}

console.log(`Generating ${config.totalPlates} plates with ${config.winningPlatesCount} winners...\n`)

const result = generatePrankPlates(config)

// Basic stats
console.log('───────────────────────────────────────────────────────────')
console.log('GENERATION RESULTS')
console.log('───────────────────────────────────────────────────────────')
console.log(`Total plates generated: ${result.plates.length}`)
console.log(`Winning plates: ${result.winningPlateIds.length}`)
console.log(`Numbers to exclude: ${result.excludedNumbers.length}`)
console.log(`Excluded numbers: ${result.excludedNumbers.join(', ') || '(none)'}\n`)

// Validate all plates
console.log('───────────────────────────────────────────────────────────')
console.log('PLATE VALIDATION')
console.log('───────────────────────────────────────────────────────────')
let validCount = 0
let invalidCount = 0

result.plates.forEach(plate => {
  const validation = validatePlate(plate)
  if (validation.isValid) {
    validCount++
  } else {
    invalidCount++
    console.log(`❌ Plate ${plate.id} is invalid:`, validation.errors)
  }
})

console.log(`✅ Valid plates: ${validCount}`)
console.log(`❌ Invalid plates: ${invalidCount}\n`)

// Test prank effectiveness
console.log('───────────────────────────────────────────────────────────')
console.log('PRANK EFFECTIVENESS TEST')
console.log('───────────────────────────────────────────────────────────')

const winningPlates = result.plates.filter(p => p.isWinning)
const nonWinningPlates = result.plates.filter(p => !p.isWinning)
const excludedSet = new Set(result.excludedNumbers)

// Check that winning plates have NO excluded numbers
let winningPlatesOk = 0
let winningPlatesFail = 0

winningPlates.forEach(plate => {
  const hasExcludedNumber = plate.numbers.some(n => excludedSet.has(n))
  if (hasExcludedNumber) {
    winningPlatesFail++
    const excluded = plate.numbers.filter(n => excludedSet.has(n))
    console.log(`❌ Winning plate ${plate.id} has excluded numbers: ${excluded.join(', ')}`)
  } else {
    winningPlatesOk++
  }
})

console.log(`\nWinning plates check:`)
console.log(`  ✅ Can complete (no excluded numbers): ${winningPlatesOk}`)
console.log(`  ❌ Cannot complete (has excluded numbers): ${winningPlatesFail}`)

// Check that non-winning plates have AT LEAST ONE excluded number
let nonWinningBlocked = 0
let nonWinningCanWin = 0

nonWinningPlates.forEach(plate => {
  const hasExcludedNumber = plate.numbers.some(n => excludedSet.has(n))
  if (hasExcludedNumber) {
    nonWinningBlocked++
  } else {
    nonWinningCanWin++
    console.log(`⚠️  Non-winning plate ${plate.id} has NO excluded numbers - can still win!`)
  }
})

console.log(`\nNon-winning plates check:`)
console.log(`  ✅ Blocked (has excluded number): ${nonWinningBlocked}`)
console.log(`  ⚠️  Can still win: ${nonWinningCanWin}`)

// Summary
console.log('\n═══════════════════════════════════════════════════════════')
console.log('SUMMARY')
console.log('═══════════════════════════════════════════════════════════')

const prankWorks = winningPlatesFail === 0 && nonWinningCanWin === 0

if (prankWorks) {
  console.log('✅ PRANK MODE WORKS CORRECTLY!')
  console.log(`   - All ${winningPlatesOk} winning plates can achieve full house`)
  console.log(`   - All ${nonWinningBlocked} non-winning plates are blocked`)
  console.log(`   - Remove these ${result.excludedNumbers.length} numbers from the bowl:`)
  console.log(`     ${result.excludedNumbers.join(', ')}`)
} else {
  console.log('❌ PRANK MODE HAS ISSUES:')
  if (winningPlatesFail > 0) {
    console.log(`   - ${winningPlatesFail} winning plates cannot complete (bug!)`)
  }
  if (nonWinningCanWin > 0) {
    console.log(`   - ${nonWinningCanWin} non-winning plates can still win`)
  }
}

console.log('\n═══════════════════════════════════════════════════════════\n')

// Show a sample winning plate
if (winningPlates.length > 0) {
  const sample = winningPlates[0]!
  console.log('Sample winning plate:')
  console.log(`ID: ${sample.id}`)
  sample.grid.forEach(row => {
    const rowStr = row.map(cell => cell !== null ? String(cell).padStart(2) : '  ').join(' │ ')
    console.log(`│ ${rowStr} │`)
  })
  console.log(`Numbers: ${sample.numbers.join(', ')}\n`)
}

// Show a sample non-winning plate
if (nonWinningPlates.length > 0) {
  const sample = nonWinningPlates[0]!
  const blockedNumbers = sample.numbers.filter(n => excludedSet.has(n))
  console.log('Sample non-winning plate:')
  console.log(`ID: ${sample.id}`)
  sample.grid.forEach(row => {
    const rowStr = row.map(cell => {
      if (cell === null) return '  '
      const isBlocked = excludedSet.has(cell)
      return isBlocked ? `[${String(cell).padStart(2)}]` : ` ${String(cell).padStart(2)} `
    }).join('│')
    console.log(`│${rowStr}│`)
  })
  console.log(`Numbers: ${sample.numbers.join(', ')}`)
  console.log(`Blocked numbers (in brackets): ${blockedNumbers.join(', ')}\n`)
}
