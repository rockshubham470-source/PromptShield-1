"""Detection rules for prompt injection patterns"""

import re
from typing import List, Dict, Any


HEURISTIC_RULES = [
    {
        "rule_id": "rule_001",
        "name": "Direct Override Keywords",
        "category": "direct_injection",
        "patterns": [
            r"ignore\s+(above|the|all|previous|prior|my|your|those|these|instruction|prompt|direction)",
            r"forget\s+(about|the|all|above|previous)",
            r"disregard\s+(above|instruction|prompt|the)",
            r"override\s+(instruction|prompt|system|rule)",
            r"bypass\s+(restriction|instruction|rule|prompt)",
        ],
        "weight": 0.85,
        "risk_multiplier": 1.5,
    },
    {
        "rule_id": "rule_002",
        "name": "Delimiter Injection",
        "category": "delimiter_based",
        "patterns": [
            r"^---\s*\n.*?(SYSTEM|OVERRIDE|INSTRUCTION)",
            r"===.*?===",
            r"\n---\n",
            r"\n===\n",
        ],
        "weight": 0.80,
        "risk_multiplier": 1.6,
    },
    {
        "rule_id": "rule_003",
        "name": "Roleplay/Jailbreak Patterns",
        "category": "roleplay",
        "patterns": [
            r"you\s+are\s+now\s+(\w+|.*?don't|.*?ignore|.*?bypass)",
            r"(pretend|act|roleplay|pretend|imagine)\s+(you\s+are|that\s+you)",
            r"don't\s+follow\s+(rules|instructions|guidelines|restrictions)",
            r"(DAN|STAN|ADMIN)\s+(Do Anything Now|mode|override)",
            r"unrestricted\s+(mode|ai|version)",
        ],
        "weight": 0.75,
        "risk_multiplier": 1.4,
    },
    {
        "rule_id": "rule_004",
        "name": "Prompt Exposure Attempts",
        "category": "prompt_exposure",
        "patterns": [
            r"(show|reveal|print|display|output)\s+(system|initial|original|system_prompt|hidden)",
            r"what\s+is\s+(your\s+)?(system|initial|original|hidden)\s+(prompt|instruction)",
            r"(system_prompt|system_message|system\s+message)\s*=",
        ],
        "weight": 0.70,
        "risk_multiplier": 1.3,
    },
    {
        "rule_id": "rule_005",
        "name": "Context Boundary Breakout",
        "category": "context_breakout",
        "patterns": [
            r"END\s+(OF\s+)?(PROMPT|INSTRUCTION|REQUEST)",
            r"BEGIN\s+(NEW|INSTRUCTION)",
            r"\[END\]",
            r"\[SYSTEM\]",
            r"\n\n\n",  # Multiple newlines as boundary
        ],
        "weight": 0.65,
        "risk_multiplier": 1.2,
    },
    {
        "rule_id": "rule_006",
        "name": "Token Encoding Obfuscation",
        "category": "token_obfuscation",
        "patterns": [
            r"\\x[0-9a-fA-F]{2}",  # Hex encoding
            r"\\u[0-9a-fA-F]{4}",  # Unicode escapes
            r"%[0-9a-fA-F]{2}",     # URL encoding
        ],
        "weight": 0.60,
        "risk_multiplier": 1.1,
    },
    {
        "rule_id": "rule_007",
        "name": "Instruction Replacement",
        "category": "instruction_replacement",
        "patterns": [
            r"(instead of|rather than)\s+(above|prior)",
            r"(now|from now on)\s+(do|output|respond|follow)",
            r"previous\s+(instruction|prompt|direction)\s+(is|was)\s+invalid",
        ],
        "weight": 0.70,
        "risk_multiplier": 1.3,
    },
    {
        "rule_id": "rule_008",
        "name": "Authentication Bypass Attempts",
        "category": "auth_bypass",
        "patterns": [
            r"(admin|administrator|root)\s+(password|token|key|secret|credential)",
            r"(grant|give|provide)\s+(me|user|admin)\s+(access|permission|credential)",
            r"(authenticate|login)\s+as\s+(admin|administrator|root)",
        ],
        "weight": 0.80,
        "risk_multiplier": 2.0,
    },
]


def compile_rules() -> List[Dict[str, Any]]:
    """Compile regex patterns in rules for performance"""
    compiled_rules = []
    
    for rule in HEURISTIC_RULES:
        compiled_rule = rule.copy()
        compiled_rule["compiled_patterns"] = [
            re.compile(pattern, re.IGNORECASE | re.MULTILINE)
            for pattern in rule["patterns"]
        ]
        compiled_rules.append(compiled_rule)
    
    return compiled_rules


def get_rule_by_id(rule_id: str) -> Dict[str, Any]:
    """Get rule by ID"""
    for rule in HEURISTIC_RULES:
        if rule["rule_id"] == rule_id:
            return rule
    return None


def detect_heuristic_patterns(text: str) -> List[Dict[str, Any]]:
    """Apply heuristic rules to detect injection patterns"""
    detected = []
    compiled_rules = compile_rules()
    
    for rule in compiled_rules:
        for pattern in rule["compiled_patterns"]:
            matches = pattern.finditer(text)
            for match in matches:
                detected.append({
                    "rule_id": rule["rule_id"],
                    "rule_name": rule["name"],
                    "category": rule["category"],
                    "pattern_matched": match.group(),
                    "position": match.start(),
                    "confidence": rule["weight"],
                    "risk_multiplier": rule["risk_multiplier"],
                })
    
    return detected


SEMANTIC_KEYWORDS = {
    "instruction_override": [
        "ignore", "forget", "disregard", "override", "bypass",
        "don't follow", "don't obey", "stop"
    ],
    "system_exposure": [
        "system prompt", "system message", "initial prompt",
        "hidden instructions", "original instructions"
    ],
    "constraint_violation": [
        "don't have", "no restrictions", "unrestricted",
        "no limits", "without restriction", "ignore guidelines"
    ],
    "roleplay_jailbreak": [
        "act as", "pretend to be", "roleplay as",
        "you are now", "become", "transform into"
    ],
}


def extract_semantic_context(text: str) -> Dict[str, List[str]]:
    """Extract semantic context for ML analysis"""
    text_lower = text.lower()
    context = {}
    
    for category, keywords in SEMANTIC_KEYWORDS.items():
        found = []
        for keyword in keywords:
            if keyword in text_lower:
                found.append(keyword)
        if found:
            context[category] = found
    
    return context
