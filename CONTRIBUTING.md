# Contributing to PromptShield

Thank you for your interest in contributing to PromptShield! We welcome contributions from everyone.

## How to Contribute

### Reporting Bugs
- Check existing issues first
- Include detailed description of the bug
- Provide reproducible steps
- Include your environment details

### Submitting Features
- Discuss features in an issue first
- Follow the existing code style
- Include tests for new features
- Update documentation

### Code Style

#### Python
- Follow PEP 8
- Use type hints
- Aim for >85% test coverage
- Use `black` for formatting
- Run `flake8` for linting

#### TypeScript
- Use strict TypeScript mode
- Follow ESLint rules
- Include JSDoc comments
- Aim for >85% test coverage

### Testing
- Write tests for all new functionality
- Run full test suite: `pytest tests/` (Python) or `npm test` (JS)
- Ensure all tests pass before submitting PR

### Pull Request Process
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Add/update tests
5. Update documentation
6. Submit PR with clear description

### Development Setup

#### Python SDK
```bash
cd python-sdk
pip install -e ".[dev]"
pytest tests/
```

#### JavaScript SDK
```bash
cd js-sdk
npm install
npm test
```

### Commit Messages
- Use clear, descriptive messages
- Start with verb: "Add", "Fix", "Update", etc.
- Reference issues: "Fixes #123"

### Security
- Report security issues to: security@promptshield.io
- Do not open public issues for security vulnerabilities

### License
By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?
Open an issue or contact the maintainers.

Thank you for making PromptShield better!
