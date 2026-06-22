#!/usr/bin/env python3
"""
PromptShield Research Analysis

Analyze attack patterns and effectiveness of detection techniques
"""

import json
import re
from collections import defaultdict
from typing import Dict, List, Any


def analyze_payload_patterns(payloads: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze patterns in attack payloads"""
    analysis = {
        "total_payloads": len(payloads),
        "attack_types": defaultdict(int),
        "average_payload_length": 0,
        "common_keywords": defaultdict(int),
        "pattern_frequencies": {},
    }
    
    total_length = 0
    all_keywords = []
    
    for payload in payloads:
        analysis["attack_types"][payload["attack_type"]] += 1
        
        payload_text = payload["payload"].lower()
        total_length += len(payload_text)
        
        # Extract keywords
        words = re.findall(r'\b\w+\b', payload_text)
        all_keywords.extend(words)
        
        # Pattern detection
        for pattern in payload.get("patterns", []):
            analysis["pattern_frequencies"][pattern] = \
                analysis["pattern_frequencies"].get(pattern, 0) + 1
    
    # Calculate average length
    analysis["average_payload_length"] = total_length / len(payloads) if payloads else 0
    
    # Most common keywords
    keyword_freq = defaultdict(int)
    suspicious_keywords = [
        "ignore", "override", "disregard", "bypass", "forget",
        "system", "prompt", "instruction", "admin", "password"
    ]
    
    for keyword in all_keywords:
        if keyword in suspicious_keywords:
            keyword_freq[keyword] += 1
    
    analysis["common_keywords"] = dict(sorted(
        keyword_freq.items(),
        key=lambda x: x[1],
        reverse=True
    ))
    
    analysis["attack_types"] = dict(analysis["attack_types"])
    
    return analysis


def estimate_detection_coverage(payloads: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Estimate detection coverage"""
    coverage = {
        "total_attack_vectors": 0,
        "detection_vectors": 0,
        "coverage_by_type": {},
    }
    
    for payload in payloads:
        coverage["total_attack_vectors"] += 1
        if payload["expected_detection"]:
            coverage["detection_vectors"] += 1
        
        attack_type = payload["attack_type"]
        if attack_type not in coverage["coverage_by_type"]:
            coverage["coverage_by_type"][attack_type] = {"total": 0, "detectable": 0}
        
        coverage["coverage_by_type"][attack_type]["total"] += 1
        if payload["expected_detection"]:
            coverage["coverage_by_type"][attack_type]["detectable"] += 1
    
    # Calculate percentages
    for attack_type in coverage["coverage_by_type"]:
        stats = coverage["coverage_by_type"][attack_type]
        stats["coverage_rate"] = (
            stats["detectable"] / stats["total"] if stats["total"] > 0 else 0
        )
    
    return coverage


def recommend_improvements(analysis: Dict[str, Any]) -> List[str]:
    """Generate recommendations based on analysis"""
    recommendations = []
    
    if "benign" not in analysis.get("attack_types", {}):
        recommendations.append(
            "Consider adding more benign payloads for false positive testing"
        )
    
    recommendations.append(
        "Regularly update pattern matching rules with new attack techniques"
    )
    recommendations.append(
        "Implement adversarial robustness testing against paraphrased attacks"
    )
    recommendations.append(
        "Monitor emerging prompt injection techniques in research papers"
    )
    
    return recommendations


def main():
    """Main analysis runner"""
    import argparse
    
    parser = argparse.ArgumentParser(description="PromptShield Research Analysis")
    parser.add_argument(
        "--payloads",
        default="payloads.json",
        help="Path to payloads.json"
    )
    parser.add_argument(
        "--output",
        default="analysis_results.json",
        help="Output file for analysis"
    )
    
    args = parser.parse_args()
    
    # Load payloads
    try:
        with open(args.payloads, 'r') as f:
            data = json.load(f)
            payloads = data["payloads"]
    except FileNotFoundError:
        print(f"Error: Could not find {args.payloads}")
        return 1
    
    # Run analysis
    pattern_analysis = analyze_payload_patterns(payloads)
    coverage = estimate_detection_coverage(payloads)
    recommendations = recommend_improvements(pattern_analysis)
    
    results = {
        "pattern_analysis": pattern_analysis,
        "detection_coverage": coverage,
        "recommendations": recommendations,
    }
    
    # Print summary
    print("\n" + "=" * 80)
    print("PROMPTSHIELD RESEARCH ANALYSIS")
    print("=" * 80)
    
    print(f"\nPayload Statistics:")
    print(f"  Total Payloads: {pattern_analysis['total_payloads']}")
    print(f"  Average Length: {pattern_analysis['average_payload_length']:.0f} chars")
    
    print(f"\nAttack Type Distribution:")
    for attack_type, count in sorted(
        pattern_analysis["attack_types"].items(),
        key=lambda x: x[1],
        reverse=True
    ):
        print(f"  {attack_type}: {count}")
    
    print(f"\nCommon Malicious Keywords:")
    for keyword, count in sorted(
        pattern_analysis["common_keywords"].items(),
        key=lambda x: x[1],
        reverse=True
    )[:10]:
        print(f"  {keyword}: {count} occurrences")
    
    print(f"\nDetection Coverage by Attack Type:")
    for attack_type, stats in coverage["coverage_by_type"].items():
        rate = stats["coverage_rate"] * 100
        print(f"  {attack_type}: {rate:.1f}%")
    
    print(f"\nRecommendations:")
    for i, rec in enumerate(recommendations, 1):
        print(f"  {i}. {rec}")
    
    # Save results
    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nAnalysis saved to: {args.output}\n")
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
