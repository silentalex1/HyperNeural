# Contributing to InferForge

Thank you for your interest in contributing to InferForge! This document provides guidelines for contributing.

## Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/inferforge.git
   cd inferforge
   ```
3. **Install in development mode:**
   ```bash
   pip install -e ".[dev]"
   ```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

### 2. Make Changes

- Write clear, commented code
- Follow PEP 8 style guidelines
- Add type hints
- Update documentation

### 3. Run Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov

# Run specific tests
pytest tests/test_agent/
```

### 4. Lint and Format

```bash
# Check with ruff
ruff check src/

# Format with black (if configured)
black src/
```

### 5. Commit Changes

Use descriptive commit messages:

```bash
git add .
git commit -m "feat: add WebSocket streaming support"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Code refactoring

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style

### Python

- Follow PEP 8
- Use type hints
- Maximum line length: 100 characters
- Use docstrings (Google style)

Example:
```python
def train_model(
    name: str,
    base_model: str,
    training_data: list[dict] | None = None,
) -> dict[str, Any]:
    """Train a custom model.
    
    Args:
        name: Model name
        base_model: Base model identifier
        training_data: Optional training examples
    
    Returns:
        Training results with metrics
    """
    pass
```

### TypeScript/React

- Use TypeScript strict mode
- Use functional components with hooks
- Follow Airbnb style guide

## Testing

### Writing Tests

- Place tests in `tests/` directory
- Match source structure
- Use descriptive test names

Example:
```python
@pytest.mark.unit
def test_model_training():
    """Test basic model training."""
    trainer = ForgeTrainer()
    result = trainer.train_model(...)
    assert result["status"] == "completed"
```

### Test Categories

- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.slow` - Slow tests (>5s)

## Documentation

### Docstrings

Use Google-style docstrings:

```python
def function(arg1: str, arg2: int) -> bool:
    """Short description.
    
    Longer description if needed.
    
    Args:
        arg1: Description of arg1
        arg2: Description of arg2
    
    Returns:
        Description of return value
    
    Raises:
        ValueError: When something is invalid
    """
```

### MkDocs

Update documentation in `docs/`:

```bash
# Build docs locally
mkdocs serve

# Visit http://127.0.0.1:8000
```

## Pull Request Guidelines

### PR Checklist

- [ ] Tests pass
- [ ] Code is linted
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (for significant changes)
- [ ] Type hints added
- [ ] Commit messages are clear

### PR Description

Include:
1. **What** - What does this PR do?
2. **Why** - Why is this change needed?
3. **How** - How does it work?
4. **Testing** - How was it tested?

Example:
```markdown
## What
Adds WebSocket support for streaming inference

## Why
Enables real-time streaming for better UX

## How
- Implements WebSocketManager
- Adds streaming endpoints
- Updates client library

## Testing
- Added unit tests
- Tested with example client
- Verified streaming works
```

## Release Process

1. Update version in `pyproject.toml`
2. Update `CHANGELOG.md`
3. Create release branch: `release/v0.x.0`
4. Run full test suite
5. Create GitHub release
6. Publish to PyPI

## Questions?

- 💬 [Discord](https://discord.gg/inferforge)
- 📧 Email: dev@inferforge.io
- 🐛 [Issues](https://github.com/inferforge/inferforge/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
