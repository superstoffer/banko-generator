<script setup lang="ts">
/**
 * Banko Generator - Main Page
 * 
 * Main application page for generating banko plates.
 */

import type { GenerationConfig, BankoPlate } from '~/utils/types'

// Page meta
useHead({
  title: 'Banko Generator - Professionelle Bankoplader',
  meta: [
    { name: 'description', content: 'Generér valide bankoplader med valgfri prank-funktionalitet' }
  ]
})

// Composables
const { 
  isGenerating, 
  generationResult, 
  error,
  generatePrankPlatesWithAnalysis,
  generateNormalPlates,
  clearResult,
  prankAnalysis,
  hostInstructions,
  statistics
} = useBankoGenerator()

// Local state
const eventName = ref<string>('')

// Computed
const samplePlates = computed(() => {
  if (!generationResult.value) return []
  return generationResult.value.plates.slice(0, 4) as BankoPlate[]
})

// Methods
const handleGenerate = async (config: GenerationConfig) => {
  eventName.value = config.eventName || ''
  
  if (config.winningPlatesCount > 0) {
    await generatePrankPlatesWithAnalysis(config)
  } else {
    await generateNormalPlates(config.totalPlates)
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 py-8">
    <UContainer>
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-neutral-900 mb-4">Banko Generator</h1>
        <p class="text-lg text-neutral-600">
          Lav dine egne bankoplader. Vælg "Prank mode" for at lave et spil, hvor kun bestemte plader vinder.
        </p>
      </div>

      <!-- Error Display -->
      <UAlert 
        v-if="error" 
        color="error"
        variant="subtle"
        icon="i-lucide-alert-circle"
        title="Generation fejlede"
        :description="error"
        class="mb-6"
      >
        <template #actions>
          <UButton variant="ghost" size="xs" @click="clearResult">
            Luk
          </UButton>
        </template>
      </UAlert>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Configuration Panel -->
        <div class="lg:col-span-1">
          <BankoConfigForm 
            :is-loading="isGenerating"
            @generate="handleGenerate"
          />
        </div>

        <!-- Results Panel -->
        <div class="lg:col-span-2">
          <!-- Loading State -->
          <div v-if="isGenerating" class="bg-white rounded-lg shadow p-8 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h3 class="text-lg font-medium text-neutral-900 mb-2">Genererer bankoplader...</h3>
            <p class="text-sm text-neutral-600">Dette kan tage et øjeblik</p>
          </div>

          <!-- Results -->
          <div v-else-if="generationResult" class="space-y-6">
            <!-- Statistics -->
            <UCard>
              <template #header>
                <div class="flex justify-between items-center">
                  <h3 class="text-lg font-semibold text-neutral-900">Resultat</h3>
                  <UButton variant="ghost" size="sm" @click="clearResult">
                    Ryd
                  </UButton>
                </div>
              </template>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="text-center p-3 bg-blue-50 rounded-lg">
                  <div class="text-2xl font-bold text-blue-600">{{ statistics?.totalPlates }}</div>
                  <div class="text-sm text-neutral-600">Totale plader</div>
                </div>
                <div v-if="statistics?.winningPlates" class="text-center p-3 bg-yellow-50 rounded-lg">
                  <div class="text-2xl font-bold text-yellow-600">{{ statistics.winningPlates }}</div>
                  <div class="text-sm text-neutral-600">Vindende plader</div>
                </div>
                <div v-if="statistics?.excludedNumbers" class="text-center p-3 bg-red-50 rounded-lg">
                  <div class="text-2xl font-bold text-red-600">{{ statistics.excludedNumbers }}</div>
                  <div class="text-sm text-neutral-600">Ekskluderede numre</div>
                </div>
                <div class="text-center p-3 bg-green-50 rounded-lg">
                  <div class="text-2xl font-bold text-green-600">15</div>
                  <div class="text-sm text-neutral-600">Tal per plade</div>
                </div>
              </div>

              <!-- Prank Analysis -->
              <div v-if="prankAnalysis" class="mb-6 space-y-3">
                <UAlert 
                  color="warning"
                  variant="subtle"
                  icon="i-lucide-lightbulb"
                  title="Prank Analyse"
                >
                  <template #description>
                    <ul class="list-disc list-inside space-y-1 text-sm mt-2">
                      <li v-for="(item, index) in prankAnalysis.analysis" :key="index">
                        {{ item }}
                      </li>
                    </ul>
                  </template>
                </UAlert>

                <UAlert 
                  v-if="prankAnalysis.recommendations.length > 0"
                  color="info"
                  variant="subtle"
                  icon="i-lucide-info"
                  title="Anbefalinger"
                >
                  <template #description>
                    <ul class="list-disc list-inside space-y-1 text-sm mt-2">
                      <li v-for="(item, index) in prankAnalysis.recommendations" :key="index">
                        {{ item }}
                      </li>
                    </ul>
                  </template>
                </UAlert>
              </div>

              <!-- Host Instructions Preview -->
              <div v-if="hostInstructions" class="mb-6">
                <UAlert 
                  color="error"
                  variant="subtle"
                  icon="i-lucide-shield-alert"
                  title="⚠️ Hemmeligt - Kun til arrangøren"
                >
                  <template #description>
                    <div class="space-y-3 mt-2">
                      <div>
                        <h4 class="font-semibold text-sm mb-1">Fjern disse numre fra trækposen:</h4>
                        <div class="text-sm font-mono bg-red-100 rounded p-2">
                          {{ hostInstructions.excludedNumbers.join(', ') }}
                        </div>
                      </div>
                    </div>
                  </template>
                </UAlert>
              </div>

              <!-- Sample Plates Preview -->
              <div>
                <h4 class="text-sm font-semibold text-neutral-900 mb-3">Forhåndsvisning:</h4>
                <div class="grid grid-cols-2 gap-3">
                  <BankoPlateGrid 
                    v-for="plate in samplePlates" 
                    :key="plate.id"
                    :plate="plate"
                    :show-winning-status="(statistics?.winningPlates ?? 0) > 0"
                    :compact="true"
                  />
                </div>
                <p class="text-xs text-neutral-500 mt-2">
                  Viser {{ samplePlates.length }} af {{ statistics?.totalPlates }} plader
                </p>
              </div>
            </UCard>

            <!-- Export Controls -->
            <BankoExportControls 
              :plates="generationResult.plates as BankoPlate[]"
              :generation-result="generationResult"
              :event-name="eventName"
            />
          </div>

          <!-- Empty State -->
          <UCard v-else>
            <div class="text-center py-12">
              <UIcon name="i-lucide-layers" class="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 class="text-lg font-medium text-neutral-900 mb-2">Ingen plader genereret endnu</h3>
              <p class="text-neutral-600">Konfigurer indstillinger til venstre og klik "Generér Plader"</p>
            </div>
          </UCard>
        </div>
      </div>
    </UContainer>
  </div>
</template>
