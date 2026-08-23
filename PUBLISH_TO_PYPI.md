# Publish InferForge to PyPI

## Quick Steps

```bash
cd c:\Users\asdww\OneDrive\Desktop\InferForge

pip install build twine

python -m build

twine upload dist/*
```

Enter your PyPI username and password when prompted.

## Detailed Steps

### 1. Create PyPI Account

Go to https://pypi.org and create account

### 2. Generate API Token

1. Login to PyPI
2. Go to Account Settings
3. Scroll to "API tokens"
4. Click "Add API token"
5. Name: "inferforge"
6. Scope: "Entire account"
7. Copy the token (starts with `pypi-`)

### 3. Configure Authentication

Create `~/.pypirc`:

```ini
[distutils]
index-servers =
    pypi
    testpypi

[pypi]
username = __token__
password = pypi-YOUR_TOKEN_HERE

[testpypi]
username = __token__
password = pypi-YOUR_TESTPYPI_TOKEN_HERE
```

### 4. Build Package

```bash
pip install --upgrade build twine

python -m build
```

Creates:
- `dist/inferforge-0.2.0.tar.gz`
- `dist/inferforge-0.2.0-py3-none-any.whl`

### 5. Verify Build

```bash
twine check dist/*
```

Should say: `Checking dist/... PASSED`

### 6. Test Upload (Optional)

Test on TestPyPI first:

```bash
twine upload --repository testpypi dist/*

pip install --index-url https://test.pypi.org/simple/ inferforge

forge --version
```

### 7. Upload to Real PyPI

```bash
twine upload dist/*
```

Enter password (or API token) when prompted.

### 8. Verify

```bash
pip install inferforge

forge --version
```

Should print: `InferForge 0.2.0`

## After Publishing

Install commands now work:

**Windows:**
```powershell
powershell -ExecutionPolicy Bypass -c "irm https://hyperneural.cfd/install.ps1 | iex"
```

**Mac/Linux:**
```bash
curl -fsSL https://hyperneural.cfd/install.sh | bash
```

**Direct pip:**
```bash
pip install inferforge
```

## Update Version

To publish updates:

1. Update version in `pyproject.toml`
2. Rebuild: `python -m build`
3. Upload: `twine upload dist/*`

## Common Issues

**Error: File already exists**
- Can't upload same version twice
- Increment version number in `pyproject.toml`

**Error: Invalid authentication**
- Check API token is correct
- Regenerate token on PyPI

**Error: Package name taken**
- Someone else registered "inferforge"
- Try "inferforge-ai" or "inferforge-llm"
- Update name in `pyproject.toml`

## Check if Name is Available

```bash
pip search inferforge
```

Or visit: https://pypi.org/project/inferforge/

## Current Package Info

- Name: `inferforge`
- Version: `0.2.0`
- License: MIT
- Python: >=3.10

Ready to publish!
