<script setup lang="ts">
/**
 * BankoPlateGrid Component
 * 
 * Displays a single banko plate with its 3x9 grid.
 * Simple traditional Danish banko card design.
 */

import type { BankoPlate } from '~/utils/types'

interface Props {
  plate: BankoPlate
  showWinningStatus?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showWinningStatus: false,
  compact: false
})
</script>

<template>
  <div class="banko-card-wrapper">
    <!-- Winner indicator (outside the card) -->
    <div v-if="props.plate.isWinning && props.showWinningStatus" class="winner-indicator">
      ★ VINDER
    </div>
    
    <!-- The Card -->
    <div :class="['banko-card', props.compact ? 'compact' : '']">
      <!-- Main Grid -->
      <div class="banko-grid">
        <div
          v-for="(row, rowIndex) in props.plate.grid"
          :key="`row-${rowIndex}`"
          class="banko-row"
        >
          <div
            v-for="(cell, colIndex) in row"
            :key="`cell-${rowIndex}-${colIndex}`"
            :class="[
              'banko-cell',
              cell !== null ? 'has-number' : 'empty'
            ]"
          >
            <span v-if="cell !== null" class="cell-number">{{ cell }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.banko-card-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.winner-indicator {
  background: #fbbf24;
  color: #1a1a1a;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  font-family: Arial, sans-serif;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.banko-card {
  background: #ffffff;
  border: 2px solid #000000;
  overflow: hidden;
  font-family: Arial, Helvetica, sans-serif;
}

/* Grid */
.banko-grid {
  background: #ffffff;
}

.banko-row {
  display: flex;
}

.banko-row:not(:last-child) {
  border-bottom: 1px solid #000000;
}

/* Cells */
.banko-cell {
  flex: 1;
  aspect-ratio: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 30px;
  border-right: 1px solid #000000;
}

.banko-cell:last-child {
  border-right: none;
}

.banko-card.compact .banko-cell {
  min-width: 26px;
  min-height: 22px;
}

.banko-cell.has-number {
  background: #ffffff;
}

.banko-cell.empty {
  background: #f0f0f0;
}

.cell-number {
  font-size: 20px;
  font-weight: 700;
  color: #000000;
  user-select: none;
}

.banko-card.compact .cell-number {
  font-size: 14px;
}
</style>
