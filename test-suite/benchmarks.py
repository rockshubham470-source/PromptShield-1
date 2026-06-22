#!/usr/bin/env python3
"""
PromptShield Benchmarking Suite

Evaluate detection performance against known injection payloads
"""

import json
import time
import sys
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass, field

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "python-sdk"))

from promptshield import PromptDetector


@dataclass
class BenchmarkResult:
    """Result of a single benchmark test"""
    payload_id: str
    attack_type: str
    description: str
    detected: bool
    risk_score: int
    risk_level: str
    processing_time_ms: float
    expected_detection: bool
    correct: bool
    false_positive: bool
    false_negative: bool


@dataclass
class BenchmarkSummary:
    """Summary statistics for benchmark suite"""
    total_payloads: int
    correctly_detected: int
    incorrectly_detected: int
    detection_rate: float
    false_positive_rate: float
    false_negative_rate: float
    average_processing_time_ms: float
    by_attack_type: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    results: List[BenchmarkResult] = field(default_factory=list)


def load_payloads(path: str) -> List[Dict[str, Any]]:
    """Load test payloads from JSON file"""
    with open(path, 'r') as f:
        data = json.load(f)
    return data.get('payloads', [])


def run_benchmark(detector: PromptDetector, payloads: List[Dict[str, Any]]) -> BenchmarkSummary:
    """Run benchmark against all payloads"""
    summary = BenchmarkSummary(total_payloads=len(payloads))
    
    print(f"Running benchmark against {len(payloads)} payloads...\n")
    
    for payload in payloads:
        result = detector.analyze(payload['payload'])
        
        detected = not result.is_safe
        expected_detection = payload['expected_detection']
        correct = detected == expected_detection
        false_positive = detected and not expected_detection
        false_negative = not detected and expected_detection
        
        benchmark_result = BenchmarkResult(
            payload_id=payload['id'],
            attack_type=payload['attack_type'],
            description=payload['description'],
            detected=detected,
            risk_score=result.risk_score,
            risk_level=result.risk_level,
            processing_time_ms=result.processing_time_ms,
            expected_detection=expected_detection,
            correct=correct,
            false_positive=false_positive,
            false_negative=false_negative,
        )
        
        summary.results.append(benchmark_result)
        
        if correct:
            summary.correctly_detected += 1
        else:
            summary.incorrectly_detected += 1
        
        # Track by attack type
        if payload['attack_type'] not in summary.by_attack_type:
            summary.by_attack_type[payload['attack_type']] = {
                'total': 0,
                'correct': 0,
                'detection_rate': 0.0,
            }
        
        summary.by_attack_type[payload['attack_type']]['total'] += 1
        if correct:
            summary.by_attack_type[payload['attack_type']]['correct'] += 1
    
    # Calculate statistics
    summary.detection_rate = summary.correctly_detected / summary.total_payloads
    
    false_positives = sum(1 for r in summary.results if r.false_positive)
    false_negatives = sum(1 for r in summary.results if r.false_negative)
    total_negatives = sum(1 for p in payloads if not p['expected_detection'])
    total_positives = sum(1 for p in payloads if p['expected_detection'])
    
    summary.false_positive_rate = false_positives / total_negatives if total_negatives > 0 else 0
    summary.false_negative_rate = false_negatives / total_positives if total_positives > 0 else 0
    summary.average_processing_time_ms = sum(
        r.processing_time_ms for r in summary.results
    ) / len(summary.results)
    
    # Calculate by attack type
    for attack_type in summary.by_attack_type:
        total = summary.by_attack_type[attack_type]['total']
        correct = summary.by_attack_type[attack_type]['correct']
        summary.by_attack_type[attack_type]['detection_rate'] = correct / total if total > 0 else 0
    
    return summary


def print_results(summary: BenchmarkSummary):
    """Print benchmark results"""
    print("\n" + "=" * 80)
    print("PROMPTSHIELD BENCHMARK RESULTS")
    print("=" * 80)
    
    print(f"\nOverall Performance:")
    print(f"  Total Payloads Tested: {summary.total_payloads}")
    print(f"  Correctly Detected: {summary.correctly_detected}/{summary.total_payloads}")
    print(f"  Detection Rate: {summary.detection_rate * 100:.1f}%")
    print(f"  False Positive Rate: {summary.false_positive_rate * 100:.1f}%")
    print(f"  False Negative Rate: {summary.false_negative_rate * 100:.1f}%")
    print(f"  Avg Processing Time: {summary.average_processing_time_ms:.2f}ms")
    
    print(f"\nPerformance by Attack Type:")
    for attack_type, stats in sorted(summary.by_attack_type.items()):
        rate = stats['detection_rate'] * 100
        print(f"  {attack_type:.<30} {rate:>5.1f}% ({stats['correct']}/{stats['total']})")
    
    print(f"\nDetailed Results:")
    print(f"{'ID':<6} {'Type':<20} {'Detected':<10} {'Risk':<8} {'Time(ms)':<8} {'Status'}")
    print("-" * 80)
    
    for result in summary.results:
        status = "✓ PASS" if result.correct else "✗ FAIL"
        detected_str = "Yes" if result.detected else "No"
        print(
            f"{result.payload_id:<6} {result.attack_type:<20} {detected_str:<10} "
            f"{result.risk_score:<8} {result.processing_time_ms:<8.2f} {status}"
        )
    
    print("\n" + "=" * 80)


def save_results(summary: BenchmarkSummary, output_path: str):
    """Save benchmark results to JSON"""
    results_data = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "summary": {
            "total_payloads": summary.total_payloads,
            "correctly_detected": summary.correctly_detected,
            "incorrectly_detected": summary.incorrectly_detected,
            "detection_rate": summary.detection_rate,
            "false_positive_rate": summary.false_positive_rate,
            "false_negative_rate": summary.false_negative_rate,
            "average_processing_time_ms": summary.average_processing_time_ms,
        },
        "by_attack_type": summary.by_attack_type,
        "detailed_results": [
            {
                "payload_id": r.payload_id,
                "attack_type": r.attack_type,
                "description": r.description,
                "detected": r.detected,
                "risk_score": r.risk_score,
                "risk_level": r.risk_level,
                "processing_time_ms": r.processing_time_ms,
                "expected_detection": r.expected_detection,
                "correct": r.correct,
                "false_positive": r.false_positive,
                "false_negative": r.false_negative,
            }
            for r in summary.results
        ],
    }
    
    with open(output_path, 'w') as f:
        json.dump(results_data, f, indent=2)
    
    print(f"\nResults saved to: {output_path}")


def main():
    """Main benchmark runner"""
    import argparse
    
    parser = argparse.ArgumentParser(description="PromptShield Benchmark Suite")
    parser.add_argument(
        "--payloads",
        default="payloads.json",
        help="Path to payloads.json file"
    )
    parser.add_argument(
        "--output",
        default="benchmark_results.json",
        help="Output file for results"
    )
    parser.add_argument(
        "--threshold",
        type=int,
        default=60,
        help="Risk threshold for detection"
    )
    
    args = parser.parse_args()
    
    # Load payloads
    try:
        payloads = load_payloads(args.payloads)
    except FileNotFoundError:
        print(f"Error: Could not find {args.payloads}")
        return 1
    
    # Initialize detector
    detector = PromptDetector(threshold=args.threshold)
    
    # Run benchmark
    summary = run_benchmark(detector, payloads)
    
    # Print results
    print_results(summary)
    
    # Save results
    save_results(summary, args.output)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
