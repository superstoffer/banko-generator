<script setup lang="ts">
/**
 * BankoExportControls Component
 * 
 * Export controls for PDF, JSON, and prank instructions.
 */

import type { BankoPlate, GenerationResult } from '~/utils/types'

interface Props {
  plates: BankoPlate[]
  generationResult: GenerationResult
  eventName?: string
}

const props = defineProps<Props>()

const { exportToPdf, exportToJson, exportInstructions, isExporting, exportError } = useExporter()

// PDF Options
const pdfOptions = reactive({
  platesPerPage: 6,
  filename: 'bankoplader.pdf',
  includeWinningMarkers: false
})

// JSON Options  
const jsonOptions = reactive({
  filename: 'bankoplader.json',
  includeMetadata: true
})

// Plates per page options
const platesPerPageOptions = [
  { label: '2 plader', value: 2 },
  { label: '4 plader', value: 4 },
  { label: '6 plader', value: 6 }
]

// Computed
const hasWinningPlates = computed(() => {
  return props.generationResult.winningPlateIds.length > 0
})

// Methods
const handlePdfExport = async () => {
  await exportToPdf(props.plates, {
    ...pdfOptions,
    eventName: props.eventName
  })
}

const handleJsonExport = () => {
  exportToJson(props.generationResult, jsonOptions)
}

const handleInstructionsExport = () => {
  exportInstructions(props.generationResult, props.eventName)
}

const handleExportAll = async () => {
  await handlePdfExport()
  handleJsonExport()
  if (hasWinningPlates.value) {
    handleInstructionsExport()
  }
}

// Generate default filenames based on event name
const generateDefaultFilenames = () => {
  const base = props.eventName 
    ? props.eventName.replace(/\s+/g, '_').toLowerCase()
    : 'bankoplader'
  
  pdfOptions.filename = `${base}.pdf`
  jsonOptions.filename = `${base}.json`
}

// Watch for event name changes
watch(() => props.eventName, () => {
  generateDefaultFilenames()
}, { immediate: true })
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold text-neutral-900">Eksport</h3>
      <p class="text-sm text-neutral-600 mt-1">Download dine bankoplader</p>
    </template>

    <div class="space-y-4">
      <!-- Export Options Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- PDF Export -->
        <div class="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-file-text" class="text-red-500 w-5 h-5" />
            <div>
              <h4 class="font-medium text-sm">PDF Plader</h4>
              <p class="text-xs text-neutral-500">Til udskrivning</p>
            </div>
          </div>
          
          <div class="space-y-2 mb-3">
            <UFormField label="Plader per side" size="sm">
              <USelect
                v-model="pdfOptions.platesPerPage"
                :items="platesPerPageOptions"
                value-key="value"
                size="sm"
              />
            </UFormField>
            
            <UFormField label="Filnavn" size="sm">
              <UInput 
                v-model="pdfOptions.filename" 
                placeholder="bankoplader.pdf"
                size="sm"
              />
            </UFormField>

            <UCheckbox 
              v-if="hasWinningPlates"
              v-model="pdfOptions.includeWinningMarkers" 
              label="Markér vindende plader"
              size="sm"
            />
          </div>
          
          <UButton 
            @click="handlePdfExport"
            :loading="isExporting"
            variant="solid"
            color="error"
            size="sm"
            block
          >
            Download PDF
          </UButton>
        </div>

        <!-- JSON Export -->
        <div class="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-braces" class="text-blue-500 w-5 h-5" />
            <div>
              <h4 class="font-medium text-sm">JSON Data</h4>
              <p class="text-xs text-neutral-500">Til systemintegration</p>
            </div>
          </div>
          
          <div class="space-y-2 mb-3">
            <UFormField label="Filnavn" size="sm">
              <UInput 
                v-model="jsonOptions.filename" 
                placeholder="bankoplader.json"
                size="sm"
              />
            </UFormField>

            <UCheckbox 
              v-model="jsonOptions.includeMetadata" 
              label="Inkluder metadata"
              size="sm"
            />
          </div>
          
          <UButton 
            @click="handleJsonExport"
            :loading="isExporting"
            variant="solid" 
            color="info"
            size="sm"
            block
          >
            Download JSON
          </UButton>
        </div>
      </div>

      <!-- Prank Instructions -->
      <div v-if="hasWinningPlates" class="border border-yellow-300 rounded-lg p-4 bg-yellow-50">
        <div class="flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-file-warning" class="text-yellow-600 w-5 h-5" />
          <div>
            <h4 class="font-medium text-sm text-yellow-900">Prank Instruktioner</h4>
            <p class="text-xs text-yellow-700">Hemmelige instruktioner til arrangøren</p>
          </div>
        </div>
        
        <div class="bg-yellow-100 border border-yellow-200 rounded p-2 mb-3">
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-alert-triangle" class="text-yellow-600 w-4 h-4 mt-0.5 shrink-0" />
            <p class="text-xs text-yellow-800">
              Instruktionsfilen indeholder hvilke numre der skal fjernes fra trækposen.
              Hold den hemmelig!
            </p>
          </div>
        </div>
        
        <UButton 
          @click="handleInstructionsExport"
          :loading="isExporting"
          variant="solid"
          color="warning" 
          size="sm"
          block
        >
          Download Instruktioner
        </UButton>
      </div>

      <!-- Export All -->
      <div class="pt-3 border-t border-neutral-200">
        <UButton 
          @click="handleExportAll"
          :loading="isExporting"
          variant="solid"
          color="primary"
          size="lg"
          block
        >
          <UIcon name="i-lucide-download" class="w-4 h-4 mr-2" />
          Download Alt
        </UButton>
      </div>

      <!-- Error Display -->
      <UAlert 
        v-if="exportError" 
        color="error"
        variant="subtle"
        icon="i-lucide-alert-circle"
        title="Eksport fejl"
        :description="exportError"
      />
    </div>
  </UCard>
</template>
