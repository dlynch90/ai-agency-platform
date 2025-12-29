## GPU Inference & Evaluation Pipeline - Claude Code Optimization

### GPU/MPS Configuration for Apple Silicon
```python
import torch
# Check MPS availability
device = torch.device("mps") if torch.backends.mps.is_available() else torch.device("cpu")
# MPS matrix mult benchmark: ~106ms for 1000x1000 on Apple Silicon
```

### HuggingFace GPU Inference Setup
Location: `~/.claude/gpu-inference/hf_gpu_config.py`
- GPUConfig dataclass for device management (mps/cuda/cpu auto-detection)
- HFInferenceEndpoint class for local and remote inference
- Supports float16/float32/bfloat16 dtype configuration

### Binomial Probability Distribution Framework
Location: `~/.claude/gpu-inference/evaluation_pipeline.py`
```python
from scipy import stats
analyzer = stats.binom(n=100, p=0.75)
# Mean: 75.0, Variance: 18.75, 95% CI: [66, 83]
# Hypothesis test: stats.binomtest(observed, n, p)
```

### Verified Python Packages
- transformers 4.57.3, torch 2.9.1, huggingface_hub, accelerate
- anthropic 0.75.0, openai 2.13.0
- numpy 2.3.5, scipy 1.16.3, pandas 2.3.3
- fastapi, pydantic, structlog

### Key Files Created
1. ~/.claude/gpu-inference/hf_gpu_config.py - GPU inference manager
2. ~/.claude/gpu-inference/evaluation_pipeline.py - ML evaluation + statistics
3. ~/GPU_INFERENCE_OPTIMIZATION_REPORT.md - Full report