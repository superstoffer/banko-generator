# Danish Banko Card Generator 🎲

Generate valid Danish banko (90-ball bingo) cards with optional **prank mode** for fun events.

## Features

- **Valid Banko Cards**: Generates cards following all Danish 90-ball banko rules
- **Prank Mode**: Designate winning cards - only they can achieve full house
- **PDF Export**: Print-ready cards (3 or 6 per A4 page)
- **JSON Export**: For integration with other systems
- **Host Instructions**: Secret instructions for prank mode

## Danish Banko Rules

Each card follows these rules:
- 3 rows × 9 columns grid
- 15 numbers per card (5 per row)
- Column 1: numbers 1-9
- Column 2: numbers 10-19
- ...
- Column 9: numbers 80-90
- Maximum 3 numbers per column
- Numbers sorted ascending within each column

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd banko

# Install dependencies
bun install
```

### Development

```bash
# Start development server
bun run dev

# Open http://localhost:3000
```

### Build for Production

```bash
bun run build
bun run preview
```

## Usage

### Normal Mode

1. Enter the number of cards to generate (1-1000)
2. Click "Generér Plader"
3. Download PDF for printing

### Prank Mode 🎭

Perfect for fun events where you want to control who wins:

1. Switch to "Prank Mode" tab
2. Enter total cards (e.g., 50)
3. Enter winning cards count (e.g., 10)
4. Click "Opret Prank Spil"
5. Download:
   - **PDF**: Cards for all participants
   - **Instructions**: Secret list of numbers to remove from the bowl

**How it works**: The system calculates which numbers to exclude from the drawing bowl so that only the designated winning cards can achieve a full house. All other cards will be missing at least one number.

## Testing

```bash
# Test prank mode functionality
bun run test-prank.ts
```

## Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) with Vue 3
- **UI**: [Nuxt UI](https://ui.nuxt.com/)
- **PDF**: [jsPDF](https://github.com/parallax/jsPDF)
- **Language**: TypeScript (strict mode)
- **Package Manager**: Bun

## Project Structure

```
app/
├── components/Banko/    # UI components
│   ├── PlateGrid.vue    # Card display
│   ├── ConfigForm.vue   # Generation form
│   └── ExportControls.vue
├── composables/         # State management
│   ├── useBankoGenerator.ts
│   └── useExporter.ts
├── utils/               # Core logic
│   ├── types.ts         # TypeScript interfaces
│   ├── validator.ts     # Card validation
│   ├── plateGenerator.ts # Card generation
│   └── prankCalculator.ts # Prank mode logic
└── pages/
    └── index.vue        # Main page
```

## License

MIT