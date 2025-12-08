<script setup lang="ts">
/**
 * BankoConfigForm Component
 * 
 * Configuration form for plate generation.
 * Supports both normal and prank modes.
 */

import type { GenerationConfig } from '~/utils/types'
import { generatePlate } from '~/utils/plateGenerator'

interface Props {
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<{
  generate: [config: GenerationConfig]
}>()

// Form state
const mode = ref<'normal' | 'prank'>('normal')
const config = reactive<GenerationConfig>({
  totalPlates: 10,
  winningPlatesCount: 0,
  eventName: ''
})

// Validation errors
const errors = reactive({
  totalPlates: '',
  winningPlatesCount: ''
})

// Preview plate
const previewPlate = ref<ReturnType<typeof generatePlate> | null>(null)
const isGeneratingPreview = ref(false)

// Mode options for tabs
const modeItems = [
  { label: 'Normal', value: 'normal' },
  { label: 'Prank Mode', value: 'prank' }
]

// Computed
const maxPlates = computed(() => mode.value === 'prank' ? 500 : 1000)

const isFormValid = computed(() => {
  return (
    config.totalPlates > 0 &&
    config.totalPlates <= maxPlates.value &&
    !errors.totalPlates &&
    (mode.value === 'normal' || 
      (config.winningPlatesCount > 0 && 
       config.winningPlatesCount < config.totalPlates &&
       !errors.winningPlatesCount))
  )
})

// Methods
const validateTotalPlates = () => {
  if (config.totalPlates < 1) {
    errors.totalPlates = 'Minimum 1 plade'
  } else if (config.totalPlates > maxPlates.value) {
    errors.totalPlates = `Maximum ${maxPlates.value} plader`
  } else {
    errors.totalPlates = ''
  }
}

const validateWinningPlates = () => {
  if (mode.value !== 'prank') {
    errors.winningPlatesCount = ''
    return
  }
  
  if (config.winningPlatesCount < 1) {
    errors.winningPlatesCount = 'Minimum 1 vindende plade'
  } else if (config.winningPlatesCount >= config.totalPlates) {
    errors.winningPlatesCount = 'Skal være mindre end totale plader'
  } else {
    errors.winningPlatesCount = ''
  }
}

const generatePreview = async () => {
  isGeneratingPreview.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 50))
    previewPlate.value = generatePlate()
  } finally {
    isGeneratingPreview.value = false
  }
}

const handleSubmit = () => {
  validateTotalPlates()
  validateWinningPlates()

  if (!isFormValid.value) return

  const generationConfig: GenerationConfig = {
    totalPlates: config.totalPlates,
    winningPlatesCount: mode.value === 'prank' ? config.winningPlatesCount : 0,
    eventName: config.eventName || undefined
  }

  emit('generate', generationConfig)
}

// Watch mode changes
watch(mode, (newMode) => {
  if (newMode === 'normal') {
    config.winningPlatesCount = 0
    errors.winningPlatesCount = ''
  } else {
    config.winningPlatesCount = Math.min(3, Math.floor(config.totalPlates / 4))
  }
})

// Generate initial preview
onMounted(() => {
  generatePreview()
})
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-neutral-900">Konfiguration</h2>
      <p class="text-sm text-neutral-600 mt-1">Indstil parametre for pladegenerering</p>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-5">
      <!-- Mode Selection -->
      <div>
        <label class="text-sm font-medium text-neutral-700 block mb-2">Spilletilstand</label>
        <UTabs 
          v-model="mode" 
          :items="modeItems"
        />
      </div>

      <!-- Event Name -->
      <UFormField label="Arrangement navn (valgfrit)">
        <UInput 
          v-model="config.eventName" 
          placeholder="F.eks. 'Julebanko 2025'"
          :ui="{ base: 'w-full' }"
        />
      </UFormField>

      <!-- Total Plates -->
      <UFormField 
        label="Antal plader" 
        :error="errors.totalPlates"
        required
      >
        <UInput 
          v-model.number="config.totalPlates" 
          type="number" 
          :min="1" 
          :max="maxPlates"
          placeholder="Indtast antal plader"
          @blur="validateTotalPlates"
        />
        <template #help>
          <span class="text-xs text-neutral-500">
            {{ mode === 'normal' ? 'Maksimum 1000 plader' : 'Maksimum 500 plader i prank mode' }}
          </span>
        </template>
      </UFormField>

      <!-- Winning Plates (Prank Mode Only) -->
      <UFormField 
        v-if="mode === 'prank'" 
        label="Antal vindende plader" 
        :error="errors.winningPlatesCount"
        required
      >
        <UInput 
          v-model.number="config.winningPlatesCount" 
          type="number" 
          :min="1" 
          :max="config.totalPlates - 1"
          placeholder="Antal vindere"
          @blur="validateWinningPlates"
        />
        <template #help>
          <span class="text-xs text-neutral-500">
            Hvor mange af de {{ config.totalPlates }} plader skal kunne vinde?
          </span>
        </template>
      </UFormField>

      <!-- Prank Mode Warning -->
      <UAlert 
        v-if="mode === 'prank'"
        color="warning"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        title="Prank Mode"
        description="Dette opretter et spil hvor kun specifikke plader kan vinde. Brug kun til sjove arrangementer blandt venner!"
      />

      <!-- Preview -->
      <div v-if="previewPlate" class="border border-neutral-200 rounded-lg p-3 bg-neutral-50">
        <div class="flex justify-between items-center mb-2">
          <h4 class="text-sm font-medium text-neutral-700">Forhåndsvisning</h4>
          <UButton 
            variant="ghost" 
            size="xs" 
            @click="generatePreview"
            :loading="isGeneratingPreview"
          >
            Ny plade
          </UButton>
        </div>
        <div class="flex justify-center">
          <BankoPlateGrid :plate="previewPlate" :compact="true" />
        </div>
      </div>

      <!-- Submit Button -->
      <div class="pt-2">
        <UButton 
          type="submit"
          :loading="props.isLoading"
          :disabled="!isFormValid || props.isLoading"
          color="primary"
          size="lg"
          block
        >
          {{ mode === 'prank' ? 'Opret Prank Spil' : 'Generér Plader' }}
        </UButton>
      </div>
    </form>
  </UCard>
</template>
