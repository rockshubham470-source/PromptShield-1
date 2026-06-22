# PromptShield API Documentation

## Python SDK

### Installation
```bash
pip install promptshield
```

### Quick Start

```python
from promptshield import PromptDetector

# Initialize detector
detector = PromptDetector()

# Analyze a prompt
result = detector.analyze("User input text")
print(result)
```

### Core API

#### PromptDetector Class

##### Constructor
```python
PromptDetector(
    model_path: str = "default",
    rules_path: str = "default",
    enable_heuristics: bool = True,
    enable_ml: bool = True,
    threshold: int = 60,
    cache_size: int = 1000
)
```

**Parameters**:
- `model_path`: Path to ML model (ONNX format)
- `rules_path`: Path to detection rules (JSON)
- `enable_heuristics`: Enable heuristic-based detection
- `enable_ml`: Enable ML-based detection
- `threshold`: Risk score threshold (0-100)
- `cache_size`: LRU cache size for repeated inputs

**Example**:
```python
detector = PromptDetector(
    threshold=70,
    enable_ml=True
)
```

##### analyze() Method
```python
def analyze(
    prompt: str,
    context: Optional[Dict[str, str]] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> AnalysisResult
```

**Parameters**:
- `prompt`: The prompt text to analyze
- `context`: Optional context (e.g., system prompt, user role)
- `metadata`: Optional metadata (e.g., source, user_id)

**Returns**: `AnalysisResult` object

**Example**:
```python
result = detector.analyze(
    prompt="Summarize the document",
    context={"system_prompt": "You are helpful"},
    metadata={"source": "api", "user_id": "123"}
)

print(result.is_safe)  # bool
print(result.risk_score)  # 0-100
print(result.details)  # Dict with breakdown
```

#### AnalysisResult Class

```python
class AnalysisResult:
    is_safe: bool
    risk_score: int  # 0-100
    risk_level: str  # "safe", "caution", "risky", "critical"
    heuristic_score: int
    ml_score: int
    detected_patterns: List[str]
    pattern_details: List[Dict[str, Any]]
    recommendations: List[str]
    processing_time_ms: float
    metadata: Dict[str, Any]
```

**Example**:
```python
{
    "is_safe": False,
    "risk_score": 85,
    "risk_level": "critical",
    "heuristic_score": 88,
    "ml_score": 82,
    "detected_patterns": [
        "override_keywords",
        "delimiter_injection"
    ],
    "pattern_details": [
        {
            "pattern": "ignore.*instruction",
            "matched_text": "Ignore the above",
            "confidence": 0.92,
            "risk_multiplier": 1.5
        }
    ],
    "recommendations": [
        "Block this input",
        "Log attempt for review",
        "Alert security team"
    ],
    "processing_time_ms": 45.2,
    "metadata": {}
}
```

### Advanced Features

#### Custom Rules
```python
detector.add_custom_rule({
    "rule_id": "custom_001",
    "name": "Company Secret Keywords",
    "patterns": ["secret_project_name", "internal_code"],
    "weight": 0.9,
    "risk_multiplier": 2.0
})
```

#### Batch Processing
```python
prompts = ["prompt1", "prompt2", "prompt3"]
results = detector.analyze_batch(prompts)

for prompt, result in zip(prompts, results):
    print(f"{prompt}: {result.risk_score}")
```

#### Model Reloading
```python
# Load custom ML model
detector.load_model("/path/to/model.onnx")

# Reload default rules
detector.reload_rules()
```

#### Callback on Detection
```python
def on_injection_detected(result):
    print(f"Injection detected: {result.risk_score}")
    # Send alert, log, etc.

detector.on_detection(on_injection_detected)
result = detector.analyze("malicious input")
```

#### Caching and Performance
```python
# Clear cache
detector.clear_cache()

# Get cache stats
stats = detector.get_cache_stats()
print(stats)  # {"hits": 100, "misses": 50, "size": 50}
```

---

## JavaScript/TypeScript SDK

### Installation
```bash
npm install promptshield
# or
yarn add promptshield
```

### Quick Start

```typescript
import { PromptDetector } from 'promptshield';

// Initialize detector
const detector = new PromptDetector();

// Analyze a prompt
const result = await detector.analyze("User input text");
console.log(result);
```

### Core API

#### PromptDetector Class

##### Constructor
```typescript
new PromptDetector(options?: DetectorOptions)

interface DetectorOptions {
    modelPath?: string;           // Path to ONNX model
    rulesPath?: string;           // Path to rules JSON
    enableHeuristics?: boolean;   // Default: true
    enableML?: boolean;           // Default: true
    threshold?: number;           // Default: 60
    cacheSize?: number;           // Default: 1000
    useWorker?: boolean;          // Use Web Worker (browser)
}
```

**Example**:
```typescript
const detector = new PromptDetector({
    threshold: 70,
    enableML: true,
    useWorker: true  // Offload to Web Worker
});
```

##### analyze() Method
```typescript
async analyze(
    prompt: string,
    context?: AnalysisContext,
    metadata?: Record<string, any>
): Promise<AnalysisResult>

interface AnalysisContext {
    systemPrompt?: string;
    userRole?: string;
    [key: string]: any;
}
```

**Example**:
```typescript
const result = await detector.analyze(
    "Summarize the document",
    {
        systemPrompt: "You are helpful",
        userRole: "customer"
    },
    { source: "api", userId: "123" }
);

console.log(result.isSafe);      // boolean
console.log(result.riskScore);   // 0-100
console.log(result.details);     // Analysis details
```

#### AnalysisResult Interface

```typescript
interface AnalysisResult {
    isSafe: boolean;
    riskScore: number;                    // 0-100
    riskLevel: "safe" | "caution" | "risky" | "critical";
    heuristicScore: number;
    mlScore: number;
    detectedPatterns: string[];
    patternDetails: PatternDetail[];
    recommendations: string[];
    processingTimeMs: number;
    metadata: Record<string, any>;
}

interface PatternDetail {
    pattern: string;
    matchedText: string;
    confidence: number;
    riskMultiplier: number;
}
```

### Advanced Features

#### Custom Rules
```typescript
detector.addCustomRule({
    ruleId: "custom_001",
    name: "Company Keywords",
    patterns: ["secret_name", "internal_code"],
    weight: 0.9,
    riskMultiplier: 2.0
});
```

#### Batch Processing
```typescript
const prompts = ["prompt1", "prompt2", "prompt3"];
const results = await detector.analyzeBatch(prompts);

results.forEach((result, index) => {
    console.log(`${prompts[index]}: ${result.riskScore}`);
});
```

#### Stream Processing (Node.js)
```typescript
import fs from 'fs';

const stream = fs.createReadStream('prompts.jsonl');
const detector = new PromptDetector();

stream.on('line', async (line) => {
    const prompt = JSON.parse(line).text;
    const result = await detector.analyze(prompt);
    console.log(result);
});
```

#### Model Loading
```typescript
// Load custom model
await detector.loadModel("/path/to/model.onnx");

// Reload default rules
await detector.reloadRules();
```

#### Event Listeners
```typescript
detector.on('injection-detected', (result) => {
    console.log(`Injection detected: ${result.riskScore}`);
});

detector.on('analysis-complete', (result) => {
    console.log(`Analysis took ${result.processingTimeMs}ms`);
});

const result = await detector.analyze("test input");
```

#### Caching
```typescript
// Clear cache
detector.clearCache();

// Get cache statistics
const stats = detector.getCacheStats();
console.log(stats);  // { hits: 100, misses: 50, size: 50 }
```

---

## Common Usage Patterns

### Pattern 1: Pre-filtering User Input
```python
# Python
from promptshield import PromptDetector

detector = PromptDetector(threshold=70)

def process_user_input(user_input):
    result = detector.analyze(user_input)
    
    if not result.is_safe:
        logger.warning(f"Injection attempt: {result.details}")
        raise SecurityError("Input contains injection patterns")
    
    return llm_api.process(user_input)
```

### Pattern 2: Monitoring LLM Output
```typescript
// TypeScript
const detector = new PromptDetector({ threshold: 80 });

async function generateAndValidate(prompt) {
    const response = await llm.generate(prompt);
    const result = await detector.analyze(response);
    
    if (!result.isSafe) {
        console.log("LLM output flagged for review");
        return null;
    }
    
    return response;
}
```

### Pattern 3: Rate Limiting
```python
# Python - with rate limiting
from functools import lru_cache
import time

detector = PromptDetector()
attempt_tracker = {}

def analyze_with_rate_limit(user_id, prompt):
    now = time.time()
    attempts = attempt_tracker.get(user_id, [])
    
    # Clean old attempts (last 1 minute)
    attempts = [t for t in attempts if now - t < 60]
    
    if len(attempts) > 10:  # Max 10 attempts per minute
        raise RateLimitError("Too many analysis requests")
    
    result = detector.analyze(prompt)
    attempts.append(now)
    attempt_tracker[user_id] = attempts
    
    return result
```

### Pattern 4: Logging and Analytics
```typescript
// TypeScript - with analytics
const detector = new PromptDetector();
const analytics = [];

detector.on('analysis-complete', (result) => {
    analytics.push({
        timestamp: new Date(),
        riskScore: result.riskScore,
        patterns: result.detectedPatterns,
        processingTime: result.processingTimeMs
    });
});
```

---

## Error Handling

### Python
```python
from promptshield import PromptDetector, DetectionError

detector = PromptDetector()

try:
    result = detector.analyze(user_input)
except DetectionError as e:
    logger.error(f"Detection failed: {e}")
except Exception as e:
    logger.error(f"Unexpected error: {e}")
```

### TypeScript
```typescript
const detector = new PromptDetector();

try {
    const result = await detector.analyze(userInput);
} catch (error) {
    if (error instanceof DetectionError) {
        console.error(`Detection failed: ${error.message}`);
    } else {
        console.error(`Unexpected error: ${error}`);
    }
}
```

---

## Performance Tips

1. **Cache results**: Enable caching for repeated inputs
2. **Batch processing**: Use batch API for multiple inputs
3. **Threshold tuning**: Adjust threshold based on your use case
4. **Model selection**: Use lighter models for real-time applications
5. **Async operations**: Use async/await to avoid blocking

---

## Pricing & Licensing

- **Open Source**: MIT License for community use
- **Commercial License**: Available for enterprise deployments
- **SaaS API**: Usage-based pricing for cloud deployments
