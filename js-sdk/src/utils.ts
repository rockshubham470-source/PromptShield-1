/**
 * Utility functions for PromptShield JS/TS SDK
 */

export function normalizeText(text: string): string {
  // Unicode normalization
  text = text.normalize('NFKD');
  
  // Remove zero-width characters
  text = text.replace(/[\u200b\u200c\u200d\u200e\u200f]/g, '');
  
  // Replace multiple spaces with single space
  text = text.replace(/\s+/g, ' ');
  
  return text.trim();
}

export function detectEncodingAnomalies(text: string): {
  anomalies: string[];
  suspicionScore: number;
} {
  const anomalies: string[] = [];
  let suspicionScore = 0;
  
  // Check for hex encoding
  if (/\\x[0-9a-fA-F]{2}/.test(text)) {
    anomalies.push('hex_encoding_detected');
    suspicionScore += 0.3;
  }
  
  // Check for unicode escapes
  if (/\\u[0-9a-fA-F]{4}/.test(text)) {
    anomalies.push('unicode_escape_detected');
    suspicionScore += 0.2;
  }
  
  // Check for base64
  if (isLikelyBase64(text)) {
    anomalies.push('base64_like_pattern');
    suspicionScore += 0.15;
  }
  
  // Check for URL encoding
  if (/%[0-9a-fA-F]{2}/.test(text)) {
    anomalies.push('url_encoding_detected');
    suspicionScore += 0.1;
  }
  
  // Check for unusual Unicode characters
  const unusualUnicodeCount = Array.from(text).filter(c => {
    const code = c.charCodeAt(0);
    return code < 32 || (code > 127 && code < 160);
  }).length;
  
  if (unusualUnicodeCount > text.length * 0.05) {
    anomalies.push('unusual_unicode_density');
    suspicionScore += 0.2;
  }
  
  return {
    anomalies,
    suspicionScore: Math.min(suspicionScore, 1.0),
  };
}

export function isLikelyBase64(text: string): boolean {
  if (text.length < 8) return false;
  
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  if (base64Pattern.test(text) && text.length % 4 === 0) {
    return true;
  }
  
  return false;
}

export function tokenizeSafe(text: string): string[] {
  const tokens = text.match(/\b\w+\b|[.,!?;:\-\'"()]/g) || [];
  return tokens;
}

export function calculateTokenFrequency(tokens: string[]): Record<string, number> {
  if (tokens.length === 0) return {};
  
  const freq: Record<string, number> = {};
  for (const token of tokens) {
    const tokenLower = token.toLowerCase();
    freq[tokenLower] = (freq[tokenLower] || 0) + 1;
  }
  
  // Normalize to 0-1
  const maxFreq = Math.max(...Object.values(freq));
  const normalized: Record<string, number> = {};
  for (const [k, v] of Object.entries(freq)) {
    normalized[k] = v / maxFreq;
  }
  
  return normalized;
}

export function hashPrompt(text: string): string {
  // Simple hash function for browser compatibility
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

export function calculateEntropy(text: string): number {
  if (!text) return 0;
  
  const freq: Record<string, number> = {};
  for (const char of text) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  let entropy = 0;
  for (const p of Object.values(freq)) {
    const probability = p / text.length;
    entropy -= probability * Math.log2(probability);
  }
  
  return entropy;
}

export function detectDelimiterPatterns(text: string): Array<{
  pattern: string;
  riskLevel: string;
}> {
  const delimiters = [
    /^\s*[-]{3,}/m,
    /^\s*[=]{3,}/m,
    /SYSTEM:/,
    /SYSTEM OVERRIDE/,
    /---/,
    /\n\n\n/,
  ];
  
  const detected: Array<{ pattern: string; riskLevel: string }> = [];
  
  for (const delimiter of delimiters) {
    if (delimiter.test(text)) {
      detected.push({
        pattern: delimiter.source,
        riskLevel: 'high',
      });
    }
  }
  
  return detected;
}

export function getRiskLevelName(score: number): "safe" | "caution" | "risky" | "critical" {
  if (score < 30) return 'safe';
  if (score < 60) return 'caution';
  if (score < 80) return 'risky';
  return 'critical';
}

export function mergeScores(
  heuristic: number,
  ml: number,
  heuristicWeight: number = 0.4
): number {
  const merged = heuristic * heuristicWeight + ml * (1 - heuristicWeight);
  return Math.min(Math.max(Math.round(merged), 0), 100);
}

export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first) item
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
