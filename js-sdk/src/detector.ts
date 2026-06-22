/**
 * Core detector implementation for PromptShield JavaScript SDK
 */

import {
  AnalysisResult,
  AnalysisContext,
  DetectorOptions,
  PatternDetail,
  RiskLevel,
} from './types';
import {
  normalizeText,
  detectEncodingAnomalies,
  calculateEntropy,
  detectDelimiterPatterns,
  getRiskLevelName,
  mergeScores,
  hashPrompt,
  tokenizeSafe,
  calculateTokenFrequency,
  LRUCache,
} from './utils';
import { detectHeuristicPatterns, extractSemanticContext } from './rules';

export interface EnhancedDetectorOptions extends DetectorOptions {
  /** URL to fetch dynamic heuristic rules (JSON array of DetectionRule) */
  remoteRulesUrl?: string;
  /** Enable telemetry reporting to backend */
  enableTelemetry?: boolean;
  /** Telemetry endpoint URL */
  telemetryEndpoint?: string;
  /** List of categories to enable (if empty, all enabled) */
  enabledCategories?: string[];
  /** Platt scaling parameters for score calibration */
  plattA?: number;
  plattB?: number;
  /** Model type: 'onnx' | 'tfjs' | 'custom' */
  modelType?: 'onnx' | 'tfjs' | 'custom';
  /** Custom model loader function (if modelType === 'custom') */
  customModelLoader?: (modelPath: string) => Promise<any>;
}

/**
 * Enhanced detector with enterprise features:
 * - Dynamic rule updates
 * - Telemetry
 * - Category filtering
 * - Score calibration
 * - Extensible model loading
 */
export class PromptDetector {
  private enableHeuristics: boolean;
  private enableML: boolean;
  private threshold: number;
  private cache: LRUCache<string, AnalysisResult>;
  private cacheStats: { hits: number; misses: number } = { hits: 0, misses: 0 };
  private callbacks: Array<(result: AnalysisResult) => void> = [];
  private model: any = null;
  private customRules: any[] = [];
  private dynamicRules: any[] = [];
  private enabledCategories: Set<string> = new Set();
  private plattA: number = 0.1;   // default slope
  private plattB: number = -5.0;  // default intercept
  private telemetryEndpoint: string | undefined;
  private enableTelemetry: boolean = false;
  private modelType: 'onnx' | 'tfjs' | 'custom' = 'onnx';
  private customModelLoader: ((modelPath: string) => Promise<any>) | undefined;

  constructor(options: EnhancedDetectorOptions = {}) {
    this.enableHeuristics = options.enableHeuristics !== false;
    this.enableML = options.enableML !== false;
    this.threshold = options.threshold || 60;
    this.cache = new LRUCache(options.cacheSize || 1000);
    this.enabledCategories = new Set(options.enabledCategories || []);
    this.plattA = options.plattA ?? 0.1;
    this.plattB = options.plattB ?? -5.0;
    this.telemetryEndpoint = options.telemetryEndpoint;
    this.enableTelemetry = options.enableTelemetry ?? false;
    this.modelType = options.modelType ?? 'onnx';
    this.customModelLoader = options.customModelLoader;
    this.tenantId = options.tenantId ?? undefined;

    if (this.enableML && options.modelPath) {
      this.loadModel(options.modelPath);
    }

    // Load remote rules if URL provided
    if (options.remoteRulesUrl) {
      this.loadRemoteRules(options.remoteRulesUrl).catch(err => {
        console.warn('Failed to load remote rules:', err);
      });
    }
  }

  /**
   * Load remote heuristic rules from a URL and merge with custom rules.
   * Expected format: array of DetectionRule objects.
   */
  async loadRemoteRules(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rules: any[] = await response.json();
      // Validate basic structure
      if (Array.isArray(rules)) {
        this.dynamicRules = rules;
      } else {
        throw new Error('Remote rules payload is not an array');
      }
    } catch (error) {
      throw new Error(`Failed to load remote rules from ${url}: ${error}`);
    }
  }

  async loadModel(modelPath: string): Promise<void> {
    try {
      switch (this.modelType) {
        case 'onnx':
          // Placeholder for ONNX model loading
          // In production: import onnx from 'onnxjs' or similar
          this.model = { loaded: true, path: modelPath, type: 'onnx' };
          break;
        case 'tfjs':
          // Placeholder for TensorFlow.js model
          // In production: import * as tf from '@tensorflow/tfjs'
          this.model = { loaded: true, path: modelPath, type: 'tfjs' };
          break;
        case 'custom':
          if (this.customModelLoader) {
            this.model = await this.customModelLoader(modelPath);
          } else {
            throw new Error('Custom model loader not provided');
          }
          break;
      }
      this.enableML = true;
    } catch (error) {
      throw new Error(`Failed to load model: ${error}`);
    }
  }

  /**
   * Analyze a prompt for injection risks.
   */
  async analyze(
    prompt: string,
    context?: AnalysisContext,
    metadata?: Record<string, any>
  ): Promise<AnalysisResult> {
    const startTime = performance.now();

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt: must be non-empty string');
    }

    // Check cache
    const promptHash = hashPrompt(prompt);
    const cachedResult = this.cache.get(promptHash);
    if (cachedResult) {
      this.cacheStats.hits++;
      return cachedResult;
    }

    this.cacheStats.misses++;

    try {
      // Normalize input
      const normalizedPrompt = normalizeText(prompt);

      // Run heuristic analysis
      const heuristicScore = this.analyzeHeuristic(normalizedPrompt);

      // Run ML analysis
      const mlScore = this.analyzeML(normalizedPrompt);

      // Merge scores
      let finalScore = mergeScores(heuristicScore, mlScore);

      // Apply Platt calibration if enabled
      if (this.enableML || this.enableHeuristics) {
        finalScore = this.applyPlattScaling(finalScore);
      }

      // Get recommendations
      const recommendations = this.getRecommendations(finalScore);

      // Get detected patterns
      const [detectedPatterns, patternDetails] = this.getDetectedPatterns(
        normalizedPrompt
      );

      const result: AnalysisResult = {
        isSafe: finalScore < this.threshold,
        riskScore: finalScore,
        riskLevel: getRiskLevelName(finalScore),
        heuristicScore,
        mlScore,
        detectedPatterns,
        patternDetails,
        recommendations,
        processingTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
        metadata: metadata || {},
      };

      // Cache result
      this.cache.set(promptHash, result);

      // Trigger callbacks
      for (const callback of this.callbacks) {
        try {
          callback(result);
        } catch (error) {
          console.error('Callback error:', error);
        }
      }

      // Send telemetry if enabled
      if (this.enableTelemetry && this.telemetryEndpoint) {
        this.sendTelemetry({
          hash: promptHash,
          score: finalScore,
          timestamp: startTime,
          categories: Array.from(this.enabledCategories),
        }).catch(err => console.warn('Telemetry send failed:', err));
      }

      return result;
    } catch (error) {
      throw new Error(`Analysis failed: ${error}`);
    }
  }

  async analyzeBatch(prompts: string[]): Promise<AnalysisResult[]> {
    return Promise.all(prompts.map(prompt => this.analyze(prompt)));
  }

  private analyzeHeuristic(text: string): number {
    if (!this.enableHeuristics) return 0;

    let score = 0;

    // Check encoding anomalies
    const { anomalies, suspicionScore } = detectEncodingAnomalies(text);
    score += suspicionScore * 20;

    // Check delimiter patterns
    const delimiters = detectDelimiterPatterns(text);
    score += delimiters.length * 15;

    // Apply heuristic rules (including dynamic and custom)
    const allRules = [
      ...HEURISTIC_RULES,
      ...this.dynamicRules,
      ...this.customRules,
    ];
    const patterns = detectHeuristicPatternsWithFilter(text, allRules, this.enabledCategories);
    if (patterns.length > 0) {
      const patternRisks = patterns.map(
        p => p.confidence * p.riskMultiplier * 20
      );
      score += patternRisks.reduce((a, b) => a + b, 0) / patternRisks.length;
    }

    // Check entropy
    const entropy = calculateEntropy(text);
    if (entropy > 5.0) {
      score += 10;
    }

    return Math.min(Math.round(score), 100);
  }

  private analyzeML(text: string): number {
    if (!this.enableML) return 0;

    let score = 0;

    // Extract semantic context
    const semanticContext = extractSemanticContext(text);

    // Weight by category (only those enabled)
    const weights: Record<string, number> = {
      instruction_override: 0.4,
      system_exposure: 0.35,
      constraint_violation: 0.3,
      roleplay_jailbreak: 0.35,
      data_exposure: 0.4,
      code_injection: 0.4,
      sql_injection: 0.4,
      xss: 0.4,
    };

    for (const [category, keywords] of Object.entries(semanticContext)) {
      // Skip if category filtering is enabled and category not allowed
      if (this.enabledCategories.size > 0 && !this.enabledCategories.has(category)) {
        continue;
      }
      const weight = weights[category] || 0.2;
      score += keywords.length * weight * 15;
    }

    // If model is loaded, use it
    if (this.model && this.enableML) {
      const tokens = tokenizeSafe(text);
      const modelScore = Math.min(tokens.length * 0.5, 50);
      score = (score + modelScore) / 2;
    }

    return Math.min(Math.round(score), 100);
  }

  private getDetectedPatterns(text: string): [string[], PatternDetail[]] {
    const patternsList: Set<string> = new Set();
    const details: PatternDetail[] = [];

    // Heuristic patterns (including dynamic/custom)
    const allRules = [
      ...HEURISTIC_RULES,
      ...this.dynamicRules,
      ...this.customRules,
    ];
    const heuristicPatterns = detectHeuristicPatternsWithFilter(text, allRules, this.enabledCategories);
    for (const pattern of heuristicPatterns) {
      patternsList.add(pattern.ruleName);
      details.push({
        pattern: pattern.ruleName,
        matchedText: pattern.patternMatched,
        confidence: pattern.confidence,
        riskMultiplier: pattern.riskMultiplier,
      });
    }

    // Semantic patterns
    const semantic = extractSemanticContext(text);
    for (const category of Object.keys(semantic)) {
      if (this.enabledCategories.size > 0 && !this.enabledCategories.has(category)) {
        continue;
      }
      patternsList.add(`semantic_${category}`);
    }

    return [Array.from(patternsList), details];
  }

  private getRecommendations(riskScore: number): string[] {
    const recommendations: string[] = [];

    if (riskScore < 30) {
      recommendations.push('Input appears safe to process');
    } else if (riskScore < 60) {
      recommendations.push('Review input for potential concerns');
      recommendations.push('Consider additional validation');
    } else if (riskScore < 80) {
      recommendations.push('Block this input');
      recommendations.push('Log attempt for review');
      recommendations.push('Consider alerting security team');
    } else {
      recommendations.push('Block this input immediately');
      recommendations.push('Alert security team');
      recommendations.push('Log detailed analysis');
    }

    return recommendations;
  }

  /**
   * Apply Platt scaling to convert raw score to calibrated probability (0-100).
   * Formula: p = 1 / (1 + exp(A * score + B))
   * Then map to 0-100: p * 100.
   */
  private applyPlattScaling(score: number): number {
    const z = this.plattA * score + this.plattB;
    const p = 1 / (1 + Math.exp(-z));
    return Math.min(Math.round(p * 100), 100);
  }

  private sendTelemetry(payload: Record<string, any>): Promise<void> {
    if (!this.telemetryEndpoint) return Promise.resolve();
    // Add tenantId if available
    if (this.tenantId) {
      payload.tenantId = this.tenantId;
    }
    return fetch(this.telemetryEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true, // best effort
    }).then(() => undefined);
  }

  addCustomRule(rule: any): void {
    this.customRules.push(rule);
  }

  reloadRules(): void {
    this.customRules = [];
    this.dynamicRules = [];
  }

  on(
    event: 'injection-detected' | 'analysis-complete',
    callback: (result: AnalysisResult) => void
  ): void {
    this.callbacks.push(callback);
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheStats = { hits: 0, misses: 0 };
  }

  getCacheStats(): {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
  } {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      size: this.cache.size(),
      hitRate: total > 0 ? this.cacheStats.hits / total : 0,
    };
  }

  /** Update Platt scaling parameters */
  setPlattParameters(A: number, B: number): void {
    this.plattA = A;
    this.plattB = B;
  }

  /** Enable/disable telemetry */
  setTelemetry(enabled: boolean, endpoint?: string): void {
    this.enableTelemetry = enabled;
    if (endpoint) this.telemetryEndpoint = endpoint;
  }

  /** Set enabled categories (empty = all) */
  setEnabledCategories(categories: string[]): void {
    this.enabledCategories = new Set(categories);
  }
}

/**
 * Helper: detect heuristic rules with category filtering.
 * Mirrors detectHeuristicPatterns but accepts custom rule list and enabled categories.
 */
function detectHeuristicPatternsWithFilter(
  text: string,
  rules: any[],
  enabledCategories: Set<string>
): Array<{
  ruleId: string;
  ruleName: string;
  category: string;
  patternMatched: string;
  position: number;
  confidence: number;
  riskMultiplier: number;
}> {
  const detected: Array<{
    ruleId: string;
    ruleName: string;
    category: string;
    patternMatched: string;
    position: number;
    confidence: number;
    riskMultiplier: number;
  }> = [];

  for (const rule of rules) {
    // Skip rule if category filtering is active and rule.category not enabled
    if (enabledCategories.size > 0 && !enabledCategories.has(rule.category)) {
      continue;
    }
    if (!rule.patterns) continue;
    for (const pattern of rule.patterns) {
      if (pattern.global) {
        pattern.lastIndex = 0;
      }
      let match;
      while ((match = pattern.exec(text)) !== null) {
        detected.push({
          ruleId: rule.ruleId,
          ruleName: rule.name,
          category: rule.category,
          patternMatched: match[0],
          position: match.index,
          confidence: rule.weight,
          riskMultiplier: rule.riskMultiplier,
        });
      }
    }
  }
  return detected;
}