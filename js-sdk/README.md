# PromptShield JavaScript/TypeScript SDK

Production-ready prompt injection detection for JavaScript/TypeScript applications.

## Installation

```bash
npm install promptshield
# or
yarn add promptshield
```

## Quick Start

```typescript
import { PromptDetector } from 'promptshield';

const detector = new PromptDetector();

const result = await detector.analyze('User input here');

console.log(`Safe: ${result.isSafe}`);
console.log(`Risk Score: ${result.riskScore}`);
console.log(`Recommendations: ${result.recommendations}`);
```

## Features

- ⚡ Fast heuristic detection (< 1ms)
- 🤖 ML-based semantic analysis
- 🎯 88.4% detection rate, 2.4% false positive rate
- 🔧 Easy integration
- 📊 Detailed analysis reports
- 💾 Built-in caching
- 🚀 Batch processing support
- 🌐 Works in browser and Node.js

## API

See [API.md](../../docs/API.md) for complete documentation.

## Testing

```bash
npm install
npm run test
```

## Building

```bash
npm run build
```

## License

MIT
