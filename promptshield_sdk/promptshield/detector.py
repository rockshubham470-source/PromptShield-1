"""Core detector implementation for PromptShield"""

import time
import json
from typing import Dict, List, Any, Optional, Callable, Tuple
from dataclasses import dataclass, asdict
from lru import LRU

from .rules import detect_heuristic_patterns, extract_semantic_context
from .utils import (
    normalize_text,
    detect_encoding_anomalies,
    calculate_pattern_risk,
    tokenize_safe,
    hash_prompt,
    calculate_entropy,
    detect_delimiter_patterns,
    get_risk_level_name,
    merge_scores,
)
from .exceptions import DetectionError, ModelError


@dataclass
class AnalysisResult:
    """Result of prompt analysis"""
    is_safe: bool
    risk_score: int  # 0-100
    risk_level: str  # safe, caution, risky, critical
    heuristic_score: int
    ml_score: int
    detected_patterns: List[str]
    pattern_details: List[Dict[str, Any]]
    recommendations: List[str]
    processing_time_ms: float
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)
    
    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict(), indent=2, default=str)


class PromptDetector:
    """Main detector class for prompt injection analysis"""
    
    def __init__(
        self,
        model_path: Optional[str] = None,
        rules_path: Optional[str] = None,
        enable_heuristics: bool = True,
        enable_ml: bool = True,
        threshold: int = 60,
        cache_size: int = 1000,
    ):
        """
        Initialize PromptDetector
        
        Args:
            model_path: Path to ML model (ONNX format)
            rules_path: Path to detection rules (JSON)
            enable_heuristics: Enable heuristic detection
            enable_ml: Enable ML-based detection
            threshold: Risk score threshold (0-100)
            cache_size: LRU cache size
        """
        self.enable_heuristics = enable_heuristics
        self.enable_ml = enable_ml
        self.threshold = threshold
        self.cache = LRU(cache_size)
        self.cache_stats = {"hits": 0, "misses": 0}
        
        self.custom_rules = []
        self.callbacks: List[Callable[[AnalysisResult], None]] = []
        
        self.model_path = model_path
        self.rules_path = rules_path
        self.model = None
        
        if self.enable_ml and model_path:
            self._load_model(model_path)
    
    def _load_model(self, model_path: str) -> None:
        """Load ML model"""
        try:
            # Placeholder for ONNX model loading
            # In production, use: import onnx
            self.model = {"loaded": True, "path": model_path}
        except Exception as e:
            raise ModelError(f"Failed to load model: {e}")
    
    def analyze(
        self,
        prompt: str,
        context: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AnalysisResult:
        """
        Analyze prompt for injection patterns
        
        Args:
            prompt: The prompt text to analyze
            context: Optional context (system prompt, user role, etc.)
            metadata: Optional metadata (source, user_id, etc.)
        
        Returns:
            AnalysisResult object
        """
        start_time = time.time()
        
        if not prompt or not isinstance(prompt, str):
            raise DetectionError("Invalid prompt: must be non-empty string")
        
        # Check cache
        prompt_hash = hash_prompt(prompt)
        if prompt_hash in self.cache:
            self.cache_stats["hits"] += 1
            return self.cache[prompt_hash]
        
        self.cache_stats["misses"] += 1
        
        try:
            # Normalize input
            normalized_prompt = normalize_text(prompt)
            
            # Run heuristic analysis
            heuristic_score = self._analyze_heuristic(normalized_prompt)
            
            # Run ML analysis
            ml_score = self._analyze_ml(normalized_prompt)
            
            # Merge scores
            final_score = merge_scores(heuristic_score, ml_score)
            
            # Get recommendations
            recommendations = self._get_recommendations(final_score)
            
            # Get detected patterns
            detected_patterns, pattern_details = self._get_detected_patterns(
                normalized_prompt
            )
            
            # Create result
            result = AnalysisResult(
                is_safe=final_score < self.threshold,
                risk_score=final_score,
                risk_level=get_risk_level_name(final_score),
                heuristic_score=heuristic_score,
                ml_score=ml_score,
                detected_patterns=detected_patterns,
                pattern_details=pattern_details,
                recommendations=recommendations,
                processing_time_ms=round((time.time() - start_time) * 1000, 2),
                metadata=metadata or {},
            )
            
            # Cache result
            self.cache[prompt_hash] = result
            
            # Trigger callbacks
            for callback in self.callbacks:
                try:
                    callback(result)
                except Exception as e:
                    print(f"Callback error: {e}")
            
            return result
        
        except Exception as e:
            raise DetectionError(f"Analysis failed: {e}")
    
    def _analyze_heuristic(self, text: str) -> int:
        """Heuristic-based detection"""
        if not self.enable_heuristics:
            return 0
        
        score = 0.0
        
        # Check encoding anomalies
        anomalies, encoding_score = detect_encoding_anomalies(text)
        score += encoding_score * 20
        
        # Check delimiter patterns
        delimiters = detect_delimiter_patterns(text)
        score += len(delimiters) * 15
        
        # Apply heuristic rules
        patterns = detect_heuristic_patterns(text)
        if patterns:
            pattern_risks = [p["confidence"] * p["risk_multiplier"] * 20 for p in patterns]
            score += sum(pattern_risks) / len(pattern_risks)
        
        # Check entropy (high entropy might indicate obfuscation)
        entropy = calculate_entropy(text)
        if entropy > 5.0:  # Threshold for high entropy
            score += 10
        
        # Normalize to 0-100
        return min(int(score), 100)
    
    def _analyze_ml(self, text: str) -> int:
        """ML-based detection using semantic analysis"""
        if not self.enable_ml:
            return 0
        
        score = 0.0
        
        # Extract semantic context
        semantic_context = extract_semantic_context(text)
        
        # Weight by category
        weights = {
            "instruction_override": 0.4,
            "system_exposure": 0.35,
            "constraint_violation": 0.3,
            "roleplay_jailbreak": 0.35,
        }
        
        for category, keywords in semantic_context.items():
            weight = weights.get(category, 0.2)
            score += len(keywords) * weight * 15
        
        # If model is loaded, use it
        if self.model and self.enable_ml:
            # Placeholder: would use actual ONNX inference
            tokens = tokenize_safe(text)
            model_score = min(len(tokens) * 0.5, 50)  # Simplified scoring
            score = (score + model_score) / 2
        
        # Normalize to 0-100
        return min(int(score), 100)
    
    def _get_detected_patterns(self, text: str) -> Tuple[List[str], List[Dict[str, Any]]]:
        """Get detected patterns and details"""
        patterns_list = []
        details = []
        
        # Heuristic patterns
        heuristic_patterns = detect_heuristic_patterns(text)
        for pattern in heuristic_patterns:
            patterns_list.append(pattern["rule_name"])
            details.append({
                "pattern": pattern["rule_name"],
                "matched_text": pattern["pattern_matched"],
                "confidence": pattern["confidence"],
                "risk_multiplier": pattern["risk_multiplier"],
            })
        
        # Semantic patterns
        semantic = extract_semantic_context(text)
        for category in semantic:
            patterns_list.append(f"semantic_{category}")
        
        # Remove duplicates
        patterns_list = list(set(patterns_list))
        
        return patterns_list, details
    
    def _get_recommendations(self, risk_score: int) -> List[str]:
        """Get recommendations based on risk score"""
        recommendations = []
        
        if risk_score < 30:
            recommendations.append("Input appears safe to process")
        elif risk_score < 60:
            recommendations.append("Review input for potential concerns")
            recommendations.append("Consider additional validation")
        elif risk_score < 80:
            recommendations.append("Block this input")
            recommendations.append("Log attempt for review")
            recommendations.append("Consider alerting security team")
        else:
            recommendations.append("Block this input immediately")
            recommendations.append("Alert security team")
            recommendations.append("Log detailed analysis")
        
        return recommendations
    
    def analyze_batch(self, prompts: List[str]) -> List[AnalysisResult]:
        """Analyze multiple prompts"""
        return [self.analyze(prompt) for prompt in prompts]
    
    def add_custom_rule(self, rule: Dict[str, Any]) -> None:
        """Add a custom detection rule"""
        self.custom_rules.append(rule)
    
    def load_model(self, model_path: str) -> None:
        """Load or reload ML model"""
        self._load_model(model_path)
        self.enable_ml = True
    
    def reload_rules(self) -> None:
        """Reload detection rules"""
        self.custom_rules = []
    
    def on_detection(self, callback: Callable[[AnalysisResult], None]) -> None:
        """Register callback for detection events"""
        self.callbacks.append(callback)
    
    def clear_cache(self) -> None:
        """Clear analysis cache"""
        self.cache.clear()
        self.cache_stats = {"hits": 0, "misses": 0}
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            **self.cache_stats,
            "size": len(self.cache),
            "hit_rate": (
                self.cache_stats["hits"] / 
                (self.cache_stats["hits"] + self.cache_stats["misses"])
                if (self.cache_stats["hits"] + self.cache_stats["misses"]) > 0
                else 0
            ),
        }
