"""Utility functions for PromptShield"""

import re
import unicodedata
import base64
import hashlib
from typing import Dict, List, Any, Tuple
from urllib.parse import unquote


def normalize_text(text: str) -> str:
    """Normalize text for analysis by removing encoding artifacts"""
    # Unicode normalization
    text = unicodedata.normalize('NFKD', text)
    
    # Remove zero-width characters
    text = re.sub(r'[\u200b\u200c\u200d\u200e\u200f]', '', text)
    
    # Replace multiple spaces with single space
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()


def detect_encoding_anomalies(text: str) -> Tuple[List[str], float]:
    """Detect unusual encodings that might hide injections"""
    anomalies = []
    suspicion_score = 0.0
    
    # Check for hex encoding
    if re.search(r'\\x[0-9a-fA-F]{2}', text):
        anomalies.append("hex_encoding_detected")
        suspicion_score += 0.3
    
    # Check for unicode escapes
    if re.search(r'\\u[0-9a-fA-F]{4}', text):
        anomalies.append("unicode_escape_detected")
        suspicion_score += 0.2
    
    # Check for base64
    if is_likely_base64(text):
        anomalies.append("base64_like_pattern")
        suspicion_score += 0.15
    
    # Check for URL encoding
    if '%' in text and re.search(r'%[0-9a-fA-F]{2}', text):
        anomalies.append("url_encoding_detected")
        suspicion_score += 0.1
    
    # Check for unusual Unicode characters
    unusual_unicode = sum(1 for c in text if unicodedata.category(c).startswith('Cc'))
    if unusual_unicode > len(text) * 0.05:
        anomalies.append("unusual_unicode_density")
        suspicion_score += 0.2
    
    return anomalies, min(suspicion_score, 1.0)


def is_likely_base64(text: str) -> bool:
    """Check if text looks like base64 encoding"""
    if len(text) < 8:
        return False
    
    base64_pattern = re.match(r'^[A-Za-z0-9+/]*={0,2}$', text)
    if base64_pattern and len(text) % 4 == 0:
        return True
    
    return False


def extract_keywords(text: str, keywords: List[str]) -> List[Dict[str, Any]]:
    """Extract keyword matches from text with positions and context"""
    matches = []
    text_lower = text.lower()
    
    for keyword in keywords:
        pattern = re.compile(re.escape(keyword), re.IGNORECASE)
        for match in pattern.finditer(text):
            start = max(0, match.start() - 20)
            end = min(len(text), match.end() + 20)
            context = text[start:end]
            
            matches.append({
                "keyword": keyword,
                "matched_text": match.group(),
                "position": match.start(),
                "context": context.replace('\n', ' ').strip()
            })
    
    return matches


def calculate_pattern_risk(matched_patterns: List[Dict], base_weights: Dict) -> Tuple[float, List[str]]:
    """Calculate aggregated risk from multiple patterns"""
    total_risk = 0.0
    detected = []
    
    for pattern in matched_patterns:
        pattern_name = pattern.get("pattern_name", "unknown")
        confidence = pattern.get("confidence", 0.5)
        multiplier = base_weights.get(pattern_name, 1.0)
        
        pattern_risk = confidence * multiplier
        total_risk += pattern_risk
        detected.append(pattern_name)
    
    # Normalize to 0-100 scale
    total_risk = min(total_risk * 20, 100.0)  # Scale factor
    
    return total_risk, detected


def tokenize_safe(text: str) -> List[str]:
    """Simple tokenization for analysis"""
    # Split on whitespace and punctuation but keep some structure
    tokens = re.findall(r'\b\w+\b|[.,!?;:\-\'"()]', text)
    return tokens


def calculate_token_frequency(tokens: List[str]) -> Dict[str, float]:
    """Calculate token frequency in text"""
    if not tokens:
        return {}
    
    freq = {}
    for token in tokens:
        token_lower = token.lower()
        freq[token_lower] = freq.get(token_lower, 0) + 1
    
    # Normalize to 0-1
    max_freq = max(freq.values())
    return {k: v / max_freq for k, v in freq.items()}


def hash_prompt(text: str) -> str:
    """Create hash of prompt for caching/comparison"""
    return hashlib.sha256(text.encode()).hexdigest()


def calculate_entropy(text: str) -> float:
    """Calculate Shannon entropy to detect high randomness (potential obfuscation)"""
    if not text:
        return 0.0
    
    import math
    
    probabilities = {}
    for char in text:
        probabilities[char] = probabilities.get(char, 0) + 1
    
    entropy = 0.0
    for p in probabilities.values():
        probability = p / len(text)
        entropy -= probability * math.log2(probability)
    
    return entropy


def detect_delimiter_patterns(text: str) -> List[Dict[str, Any]]:
    """Detect unusual delimiter patterns that might indicate structural injection"""
    delimiters = [
        r'^\s*[-]{3,}',  # Multiple dashes
        r'^\s*[=]{3,}',  # Multiple equals
        r'SYSTEM:',      # SYSTEM keyword
        r'SYSTEM OVERRIDE',
        r'---',
        r'\n\n\n',
    ]
    
    detected = []
    for delimiter in delimiters:
        if re.search(delimiter, text, re.MULTILINE):
            detected.append({
                "pattern": delimiter,
                "risk_level": "high"
            })
    
    return detected


def get_risk_level_name(score: int) -> str:
    """Convert numeric risk score to risk level name"""
    if score < 30:
        return "safe"
    elif score < 60:
        return "caution"
    elif score < 80:
        return "risky"
    else:
        return "critical"


def merge_scores(heuristic: float, ml: float, heuristic_weight: float = 0.4) -> int:
    """Merge heuristic and ML scores using weighted average"""
    merged = (heuristic * heuristic_weight) + (ml * (1 - heuristic_weight))
    return int(merged)
