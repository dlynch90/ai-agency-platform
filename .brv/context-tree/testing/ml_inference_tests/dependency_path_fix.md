Updated parameterization unit tests to align with current ML inference location and optional deps. In `tests/unit/test_parameterization.py`, ML inference tests now target `apps/ml-inference/main.py`, skip if `torch/fastapi/prometheus_fastapi_instrumentator/transformers` are not installed, and HuggingFace GPU inference tests skip when the archived module is absent.

Key changes:
```
import importlib.util
...

def _skip_if_missing_ml_inference_deps() -> None:
    required = ["torch", "fastapi", "prometheus_fastapi_instrumentator", "transformers"]
    missing = [name for name in required if importlib.util.find_spec(name) is None]
    if missing:
        pytest.skip(f"ml-inference dependencies not installed: {', '.join(missing)}")
```

```
script = Path("apps/ml-inference/main.py").resolve()
```

```
script = Path("shared/packages/huggingface-gpu-inference/inference.py")
if not script.exists():
    pytest.skip("huggingface-gpu-inference module not present (archived)")
script = script.resolve()
```

This resolves test failures caused by obsolete file paths and missing optional ML deps.