<script setup lang="ts">
/**
 * BankoPlateGrid Component
 * 
 * Displays a single banko plate with its 3x9 grid.
 * Supports compact mode and winning plate highlighting.
 */

import type { BankoPlate } from '~/utils/types'

interface Props {
  plate: BankoPlate
  showWinningStatus?: boolean
  showNumbers?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showWinningStatus: false,
  showNumbers: false,
  compact: false
})
</script>

<template>
  <div 
    :class="[
      'border-2 rounded-lg bg-white shadow-sm',
      props.plate.isWinning && props.showWinningStatus 
        ? 'border-yellow-400 bg-yellow-50' 
        : 'border-neutral-300',
      props.compact ? 'p-2' : 'p-3'
    ]"
  >
    <!-- Plate Header -->
    <div :class="['flex justify-between items-center', props.compact ? 'mb-1' : 'mb-2']">
      <span :class="['font-mono text-neutral-500', props.compact ? 'text-[10px]' : 'text-xs']">
        {{ props.plate.id }}
      </span>
      <UBadge 
        v-if="props.plate.isWinning && props.showWinningStatus" 
        color="warning" 
        variant="solid"
        size="xs"
      >
        Vinder
      </UBadge>
    </div>

    <!-- Grid -->
    <div class="border border-neutral-400 rounded overflow-hidden">
      <div
        v-for="(row, rowIndex) in props.plate.grid"
        :key="`row-${rowIndex}`"
        class="flex"
      >
        <div
          v-for="(cell, colIndex) in row"
          :key="`cell-${rowIndex}-${colIndex}`"
          :class="[
            'flex items-center justify-center font-bold border border-neutral-200',
            props.compact ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-xs',
            cell !== null 
              ? (props.plate.isWinning && props.showWinningStatus 
                  ? 'bg-yellow-100 text-yellow-900' 
                  : 'bg-neutral-100 text-neutral-900')
              : 'bg-white'
          ]"
        >
          <span v-if="cell !== null" class="select-none">{{ cell }}</span>
        </div>
      </div>
    </div>

    <!-- Numbers Summary -->
    <div v-if="props.showNumbers" class="mt-2 text-xs">
      <div class="font-medium text-neutral-700 mb-1">Tal på pladen:</div>
      <div class="text-neutral-600 font-mono text-[10px]">
        {{ props.plate.numbers.join(', ') }}
      </div>
    </div>
  </div>
</template>
