export interface AnalysisContext {
  systemPrompt?: string;
  userRole?: string;
  [key: string]: any;
}

export interface PatternDetail {
  pattern: string;
  matchedText: string;
  confidence: number;
  riskMultiplier: number;
}

export type RiskLevel = "safe" | "caution" | "risky" | "critical";

export interface AnalysisResult {
  isSafe: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  heuristicScore: number;
  mlScore: number;
  detectedPatterns: string[];
  patternDetails: PatternDetail[];
  recommendations: string[];
  processingTimeMs: number;
  metadata: Record<string, any>;
}

export interface DetectorOptions {
  modelPath?: string;
  rulesPath?: string;
  enableHeuristics?: boolean;
  enableML?: boolean;
  threshold?: number;
  cacheSize?: number;
  useWorker?: boolean;
  /** Tenant identifier for multi-tenancy and audit logging */
  tenantId?: string;
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

export interface DetectionError extends Error {
  name: "DetectionError";
}

export interface ModelError extends Error {
  name: "ModelError";
}
