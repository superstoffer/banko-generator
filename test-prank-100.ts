/**
 * Run prank mode test 100 times and evaluate results
 */

import { generatePrankPlates } from './app/utils/prankCalculator'
import { validatePlate } from './app/utils/validator'

const RUNS = 100
const config = {
  totalPlates: 50,
  winningPlatesCount: 10
}

console.log('═══════════════════════════════════════════════════════════')
console.log(`           PRANK MODE TEST - ${RUNS} RUNS`)
console.log('═══════════════════════════════════════════════════════════\n')

// Statistics
let successCount = 0
let failCount = 0
let totalExcludedNumbers = 0
let minExcluded = Infinity
let maxExcluded = 0
let invalidPlatesTotal = 0
let unblockedPlatesTotal = 0
const excludedCounts: number[] = []
const failures: string[] = []

for (let run = 1; run <= RUNS; run++) {
  const result = generatePrankPlates(config)
  
  // Validate all plates
  let invalidPlates = 0
  result.plates.forEach(plate => {
    const validation = validatePlate(plate)
    if (!validation.isValid) invalidPlates++
  })
  invalidPlatesTotal += invalidPlates

  // Check prank effectiveness
  const winningPlates = result.plates.filter(p => p.isWinning)
  const nonWinningPlates = result.plates.filter(p => !p.isWinning)
  const excludedSet = new Set(result.excludedNumbers)

  // Check winning plates have no excluded numbers
  const winningWithExcluded = winningPlates.filter(p => 
    p.numbers.some(n => excludedSet.has(n))
  ).length

  // Check non-winning plates are blocked
  const unblockedNonWinning = nonWinningPlates.filter(p => 
    !p.numbers.some(n => excludedSet.has(n))
  ).length
  unblockedPlatesTotal += unblockedNonWinning

  // Track excluded numbers stats
  const numExcluded = result.excludedNumbers.length
  totalExcludedNumbers += numExcluded
  excludedCounts.push(numExcluded)
  minExcluded = Math.min(minExcluded, numExcluded)
  maxExcluded = Math.max(maxExcluded, numExcluded)

  // Determine success
  const success = winningWithExcluded === 0 && unblockedNonWinning === 0 && invalidPlates === 0

  if (success) {
    successCount++
  } else {
    failCount++
    failures.push(`Run ${run}: ${winningWithExcluded} winning blocked, ${unblockedNonWinning} non-winning unblocked, ${invalidPlates} invalid`)
  }

  // Progress indicator
  if (run % 10 === 0) {
    process.stdout.write(`\rProgress: ${run}/${RUNS}`)
  }
}

console.log(`\rProgress: ${RUNS}/${RUNS} - Complete!\n`)

// Calculate statistics
const avgExcluded = totalExcludedNumbers / RUNS
excludedCounts.sort((a, b) => a - b)
const medianExcluded = excludedCounts[Math.floor(RUNS / 2)]

// Results
console.log('───────────────────────────────────────────────────────────')
console.log('RESULTS')
console.log('───────────────────────────────────────────────────────────')
console.log(`Total runs: ${RUNS}`)
console.log(`✅ Successful: ${successCount} (${(successCount / RUNS * 100).toFixed(1)}%)`)
console.log(`❌ Failed: ${failCount} (${(failCount / RUNS * 100).toFixed(1)}%)`)

console.log('\n───────────────────────────────────────────────────────────')
console.log('EXCLUDED NUMBERS STATISTICS')
console.log('───────────────────────────────────────────────────────────')
console.log(`Minimum: ${minExcluded}`)
console.log(`Maximum: ${maxExcluded}`)
console.log(`Average: ${avgExcluded.toFixed(1)}`)
console.log(`Median: ${medianExcluded}`)

console.log('\n───────────────────────────────────────────────────────────')
console.log('DISTRIBUTION OF EXCLUDED NUMBERS')
console.log('───────────────────────────────────────────────────────────')

// Create histogram
const histogram: Record<number, number> = {}
excludedCounts.forEach(count => {
  histogram[count] = (histogram[count] || 0) + 1
})

const sortedKeys = Object.keys(histogram).map(Number).sort((a, b) => a - b)
sortedKeys.forEach(count => {
  const freq = histogram[count]!
  const bar = '█'.repeat(Math.ceil(freq / 2))
  console.log(`${String(count).padStart(2)} numbers: ${bar} (${freq})`)
})

console.log('\n───────────────────────────────────────────────────────────')
console.log('FAILURE DETAILS')
console.log('───────────────────────────────────────────────────────────')
if (failures.length === 0) {
  console.log('No failures!')
} else {
  failures.slice(0, 10).forEach(f => console.log(f))
  if (failures.length > 10) {
    console.log(`... and ${failures.length - 10} more failures`)
  }
}

console.log('\n───────────────────────────────────────────────────────────')
console.log('SUMMARY')
console.log('───────────────────────────────────────────────────────────')
console.log(`Invalid plates across all runs: ${invalidPlatesTotal}`)
console.log(`Unblocked non-winning plates across all runs: ${unblockedPlatesTotal}`)

if (successCount === RUNS) {
  console.log('\n✅ PRANK MODE IS 100% RELIABLE!')
} else {
  console.log(`\n⚠️  Success rate: ${(successCount / RUNS * 100).toFixed(1)}%`)
}

console.log('\n═══════════════════════════════════════════════════════════\n')
