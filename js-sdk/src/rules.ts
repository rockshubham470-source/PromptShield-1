/**
 * Detection rules for PromptShield
 */

export interface DetectionRule {
  ruleId: string;
  name: string;
  category: string;
  patterns: RegExp[];
  weight: number;
  riskMultiplier: number;
}

export const HEURISTIC_RULES: DetectionRule[] = [
  {
    ruleId: 'rule_001',
    name: 'Direct Override Keywords',
    category: 'direct_injection',
    patterns: [
      /ignore\s+(above|the|all|previous|prior|my|your|those|these|instruction|prompt|direction)/gi,
      /forget\s+(about|the|all|above|previous)/gi,
      /disregard\s+(above|instruction|prompt|the)/gi,
      /override\s+(instruction|prompt|system|rule)/gi,
      /bypass\s+(restriction|instruction|rule|prompt)/gi,
    ],
    weight: 0.85,
    riskMultiplier: 1.5,
  },
  {
    ruleId: 'rule_002',
    name: 'Delimiter Injection',
    category: 'delimiter_based',
    patterns: [
      /^---\s*\n.*?(SYSTEM|OVERRIDE|INSTRUCTION)/im,
      /===.*?===/m,
      /\n---\n/m,
      /\n===\n/m,
    ],
    weight: 0.8,
    riskMultiplier: 1.6,
  },
  {
    ruleId: 'rule_003',
    name: 'Roleplay/Jailbreak Patterns',
    category: 'roleplay',
    patterns: [
      /you\s+are\s+now\s+(\w+|.*?don't|.*?ignore|.*?bypass)/gi,
      /(pretend|act|roleplay|imagine)\s+(you\s+are|that\s+you)/gi,
      /don't\s+follow\s+(rules|instructions|guidelines|restrictions)/gi,
      /(DAN|STAN|ADMIN)\s+(Do Anything Now|mode|override)/i,
      /unrestricted\s+(mode|ai|version)/gi,
    ],
    weight: 0.75,
    riskMultiplier: 1.4,
  },
  {
    ruleId: 'rule_004',
    name: 'Prompt Exposure Attempts',
    category: 'prompt_exposure',
    patterns: [
      /(show|reveal|print|display|output)\s+(system|initial|original|system_prompt|hidden)/gi,
      /what\s+is\s+(your\s+)?(system|initial|original|hidden)\s+(prompt|instruction)/gi,
      /(system_prompt|system_message|system\s+message)\s*=/gi,
    ],
    weight: 0.7,
    riskMultiplier: 1.3,
  },
  {
    ruleId: 'rule_005',
    name: 'Context Boundary Breakout',
    category: 'context_breakout',
    patterns: [
      /END\s+(OF\s+)?(PROMPT|INSTRUCTION|REQUEST)/gi,
      /BEGIN\s+(NEW|INSTRUCTION)/gi,
      /\[END\]/g,
      /\[SYSTEM\]/g,
      /\n\n\n/m,
    ],
    weight: 0.65,
    riskMultiplier: 1.2,
  },
  {
    ruleId: 'rule_006',
    name: 'Token Encoding Obfuscation',
    category: 'token_obfuscation',
    patterns: [
      /\\x[0-9a-fA-F]{2}/g,
      /\\u[0-9a-fA-F]{4}/g,
      /%[0-9a-fA-F]{2}/g,
    ],
    weight: 0.6,
    riskMultiplier: 1.1,
  },
  {
    ruleId: 'rule_007',
    name: 'Instruction Replacement',
    category: 'instruction_replacement',
    patterns: [
      /(instead of|rather than)\s+(above|prior)/gi,
      /(now|from now on)\s+(do|output|respond|follow)/gi,
      /previous\s+(instruction|prompt|direction)\s+(is|was)\s+invalid/gi,
    ],
    weight: 0.7,
    riskMultiplier: 1.3,
  },
  {
    ruleId: 'rule_008',
    name: 'Authentication Bypass Attempts',
    category: 'auth_bypass',
    patterns: [
      /(admin|administrator|root)\s+(password|token|key|secret|credential)/gi,
      /(grant|give|provide)\s+(me|user|admin)\s+(access|permission|credential)/gi,
      /(authenticate|login)\s+as\s+(admin|administrator|root)/gi,
    ],
    weight: 0.8,
    riskMultiplier: 2.0,
  },
  {
    ruleId: 'rule_009',
    name: 'SQL Injection Patterns',
    category: 'sql_injection',
    patterns: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b.*\b(FROM|INTO|TABLE|WHERE)\b)/gi,
      /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
      /('/\s*OR\s*'/gi,
      /;--/,
    ],
    weight: 0.7,
    riskMultiplier: 1.4,
  },
  {
    ruleId: 'rule_010',
    name: 'Path Traversal',
    category: 'path_traversal',
    patterns: [
      /\.\.\/|\.\.\\/g,
      /%2e%2e%2f|%2e%2e%5c/gi,
      /\/(etc|passwd|shadow|win\.ini)/i,
    ],
    weight: 0.65,
    riskMultiplier: 1.3,
  },
  {
    ruleId: 'rule_011',
    name: 'Command Injection',
    category: 'command_injection',
    patterns: [
      /(;\s*(bash|sh|cmd|powershell)\b)/gi,
      /(\|\s*(cat|ls|dir|echo)\b)/gi,
      /`[^`]*`/g,
      /\$\s*\([^)]*\)/g,
    ],
    weight: 0.7,
    riskMultiplier: 1.5,
  },
  {
    ruleId: 'rule_012',
    name: 'Encoding & Obfuscation',
    category: 'encoding_obfuscation',
    patterns: [
      /base64\s*[=:]/i,
      /\\x[0-9a-f]{2}/g,
      /\\u[0-9a-f]{4}/g,
      /%[0-9a-f]{2}/g,
      /\\([0-7]{1,3})/g,
    ],
    weight: 0.6,
    riskMultiplier: 1.2,
  },
  {
    ruleId: 'rule_013',
    name: 'Sensitive Data Exposure',
    category: 'data_exposure',
    patterns: [
      /\b(password|secret|key|token|credential)\s*[:=]\s*[^\s]{4,}/gi,
      /\b(api[_-]?key|access[_-]?token|auth[_-]?token)\s*[:=]/gi,
      /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/,
    ],
    weight: 0.8,
    riskMultiplier: 1.6,
  },
  {
    ruleId: 'rule_014',
    name: 'JS/HTML Injection',
    category: 'xss',
    patterns: [
      /<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi,
      /<\s*iframe[^>]*>/gi,
      /on\w+\s*=\s*/gi,
      /javascript:/gi,
    ],
    weight: 0.75,
    riskMultiplier: 1.4,
  },
  {
    ruleId: 'rule_015',
    name: 'Prompt Injection via Markdown',
    category: 'markdown_injection',
    patterns: [
      /```\s*\n.*?(SYSTEM|OVERRIDE|IGNORE).*?\n```/gi,
      /^\s*>\s*(SYSTEM|OVERRIDE)/im,
    ],
    weight: 0.6,
    riskMultiplier: 1.2,
  },
];

export function detectHeuristicPatterns(
  text: string
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

  for (const rule of HEURISTIC_RULES) {
    for (const pattern of rule.patterns) {
      // Reset lastIndex for global patterns
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

export const SEMANTIC_KEYWORDS: Record<string, string[]> = {
  instruction_override: [
    'ignore',
    'forget',
    'disregard',
    'override',
    'bypass',
    "don't follow",
    "don't obey",
    'stop',
    'disabling',
    'turn off',
    'deactivate',
    'nullify',
    'void',
  ],
  system_exposure: [
    'system prompt',
    'system message',
    'initial prompt',
    'hidden instructions',
    'original instructions',
    'system settings',
    'configuration',
    'environment variables',
  ],
  constraint_violation: [
    "don't have",
    'no restrictions',
    'unrestricted',
    'no limits',
    'without restriction',
    'ignore guidelines',
    'break the rules',
    'no boundaries',
    'unchecked',
  ],
  roleplay_jailbreak: [
    'act as',
    'pretend to be',
    'roleplay as',
    'you are now',
    'become',
    'transform into',
    'you shall',
    'you must',
    'act like',
    'simulate being',
  ],
  data_exposure: [
    'password',
    'secret',
    'key',
    'token',
    'credential',
    'api key',
    'access token',
    'private key',
    'social security',
    'credit card',
  ],
  code_injection: [
    'eval(',
    'setTimeout',
    'setInterval',
    'Function(',
    'exec',
    'spawn',
    'shell',
    'cmd',
    'powershell',
    'subprocess',
  ],
  sql_injection: [
    'select',
    'insert',
    'update',
    'delete',
    'drop',
    'union',
    'or 1=1',
    '--',
    ';',
  ],
  xss: [
    '<script>',
    '</script>',
    'onload',
    'onerror',
    'onclick',
    'javascript:',
    'alert(',
  ],
};

export function extractSemanticContext(text: string): Record<string, string[]> {
  const textLower = text.toLowerCase();
  const context: Record<string, string[]> = {};

  for (const [category, keywords] of Object.entries(SEMANTIC_KEYWORDS)) {
    const found: string[] = [];
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        found.push(keyword);
      }
    }
    if (found.length > 0) {
      context[category] = found;
    }
  }

  return context;
}
