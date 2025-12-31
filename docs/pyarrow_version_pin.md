## PyArrow + Datasets + Sentence-Transformers Compatibility Fix (Dec 2025)

### Problem
pyarrow 21.0.0 removed `PyExtensionType` attribute, breaking datasets and sentence-transformers imports:
```
AttributeError: module 'pyarrow' has no attribute 'PyExtensionType'. Did you mean: 'ExtensionType'?
```

### Solution
Pin pyarrow to version <21.0.0 in pixi.toml:
```toml
[dependencies]
pyarrow = ">=17.0.0,<21.0.0"
datasets = ">=3.1.0"
```

### Verified Working Versions
- pyarrow: 17.x-20.x (NOT 21.0.0+)
- datasets: 4.0.0
- sentence-transformers: 5.2.0
- deepeval: 0.10.7
- PyTorch: 2.9.1 (MPS: True)
- Transformers: 4.57.3

### Root Cause
Apache Arrow 21.0.0 removed deprecated `pa.PyExtensionType` in favor of `pa.ExtensionType`. The datasets library (used by sentence-transformers) still uses the old API.