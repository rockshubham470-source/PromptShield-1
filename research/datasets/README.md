# Research Datasets

This directory contains datasets used for PromptShield research and development.

## Datasets

### prompt_injection_dataset.csv
- Collection of known prompt injection attacks
- Used for model training and evaluation
- Format: csv (prompt, attack_type, severity)

### benign_prompts.csv
- Collection of legitimate user prompts
- Used for false positive testing
- Format: csv (prompt, domain, intent)

### real_world_attacks.json
- Real-world attack examples from security research
- Anonymized production incidents
- Format: json

## Dataset Statistics

| Dataset | Count | Source | Last Updated |
|---------|-------|--------|--------------|
| prompt_injection_dataset.csv | 5,000 | Academic + Community | 2026-06-04 |
| benign_prompts.csv | 3,000 | Production logs | 2026-06-04 |
| real_world_attacks.json | 200+ | Security research | 2026-06-04 |

## Usage

```python
import pandas as pd
import json

# Load injection dataset
injections = pd.read_csv('prompt_injection_dataset.csv')

# Load benign prompts
benign = pd.read_csv('benign_prompts.csv')

# Load real-world attacks
with open('real_world_attacks.json') as f:
    attacks = json.load(f)
```

## Contributing

To contribute new datasets:
1. Ensure data is anonymized and ethically sourced
2. Include metadata and documentation
3. Submit through proper channels
4. Comply with privacy regulations

## License

Datasets are provided under CC-BY-4.0 license.
See LICENSE file for details.

## References

- OWASP LLM Top 10
- Academic research on adversarial prompts
- Community-reported attack patterns
- Production security incidents (anonymized)
