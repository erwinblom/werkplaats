# Third-party notices — redact

`redact` is built for commercial use. It derives from the components below, each
used under a license that permits commercial use and derivative works. Their
license terms apply to those components; the attributions here satisfy them.

## Base encoder
### Multilingual-MiniLM-L12-H384 — Microsoft
- [`microsoft/Multilingual-MiniLM-L12-H384`](https://huggingface.co/microsoft/Multilingual-MiniLM-L12-H384) — **MIT**.
- Used as the encoder: truncated to 6 layers, vocab trimmed to the EU scripts, fine-tuned for BIOES PII tagging.

## Teacher models (used to create training data)
### GLiNER-PII — NVIDIA
- [`nvidia/gliner-PII`](https://huggingface.co/nvidia/gliner-PII) — **NVIDIA Open Model License**
  (commercially usable; derivative works permitted; NVIDIA claims no ownership of outputs).
- Used to label real web text for a distillation subset of the training data.
- **NOTICE:** *Licensed by NVIDIA Corporation under the NVIDIA Open Model License.*
### DeepSeek-V3.2-Exp — DeepSeek
- [`deepseek-ai/DeepSeek-V3.2-Exp`](https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Exp) — **MIT**.
- Used to generate synthetic multilingual PII training text.

## Training datasets
- [`gretelai/gretel-pii-masking-en-v1`](https://huggingface.co/datasets/gretelai/gretel-pii-masking-en-v1) — **Apache-2.0**.
- [`gretelai/synthetic_pii_finance_multilingual`](https://huggingface.co/datasets/gretelai/synthetic_pii_finance_multilingual) — **Apache-2.0**.
- [`ai4privacy/pii-masking-openpii-1.5m`](https://huggingface.co/datasets/ai4privacy/pii-masking-openpii-1.5m) — **CC-BY-4.0** (commercial use permitted). Copyright © Ai Suisse SA. Attribution: "Ai4Privacy / Ai Suisse SA".
- [`E3-JSI/synthetic-multi-pii-ner-v1`](https://huggingface.co/datasets/E3-JSI/synthetic-multi-pii-ner-v1) — **MIT**.
- [`allenai/c4`](https://huggingface.co/datasets/allenai/c4) and
  [`HuggingFaceFW/fineweb-2`](https://huggingface.co/datasets/HuggingFaceFW/fineweb-2) — **ODC-BY**
  (used only as raw text for the GLiNER-labeled distillation subset; attribution per ODC-BY).
- Additional synthetic rows were generated with **Faker** (MIT).

No non-commercial or unlicensed datasets are used. None of the above datasets are redistributed in this repository.
