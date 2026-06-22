"""Setup configuration for PromptShield Python SDK"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="promptshield",
    version="1.0.0",
    author="PromptShield Team",
    author_email="info@promptshield.io",
    description="Production-ready library for detecting and mitigating prompt injection attacks",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/promptshield/promptshield",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=[
        "lru>=1.0.0",
    ],
    extras_require={
        "ml": ["onnx>=1.13.0", "onnxruntime>=1.13.0"],
        "dev": ["pytest>=7.0", "pytest-cov>=4.0", "black>=22.0", "flake8>=4.0"],
    },
    entry_points={
        "console_scripts": [
            "promptshield=promptshield.cli:main",
        ],
    },
)
