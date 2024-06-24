# h1

![s1](imgs/w1.png)

## h2

変換後の特徴は以下の通り:

| 特徴                 | 元のモデル | 量子化モデル     |
| -------------------- | ---------- | ---------------- |
| メモリとストレージ   | 大きい     | ✅**小さい**     |
| 計算速度             | 低速       | ✅**高速**       |
| 精度とパフォーマンス | ✅**高い** | やや低下         |
| ハードウェア要件     | GPU 必須   | ✅**CPU で十分** |
| ファインチューニング | ✅**可能** | 不可(or 制限多)  |

### h3

テストですよ

参考: [Using Phi-3 in Hugging Face - Phi-3 CookBook](https://github.com/microsoft/Phi-3CookBook/blob/main/md/02.QuickStart/Huggingface_QuickStart.md)

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

model_id = "microsoft/Phi-3-mini-4k-instruct"
device = "cuda"  # or "cpu"

tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True, use_cache=True)

model = AutoModelForCausalLM.from_pretrained(
    model_id,
    device_map=device,
    trust_remote_code=True,
    use_cache=True,
    # flash attention がある場合は以下の2行をアンコメント
    # torch_dtype=torch.float16,
    # attn_implementation="flash_attention_2",
)

pipe = pipeline("text-generation", model=model, tokenizer=tokenizer)

generation_args = {
    "max_new_tokens": 512,
    "return_full_text": False,
    "do_sample": False,
    # サンプリング戦略を有効にする場合は以下をアンコメント
    # "do_sample": True,
    # "temperature": 0.3,
}

# --- シンプルな生成
messages = [{"role": "user", "content": "日本の首都は?"}]
output = pipe(messages, **generation_args)
print(output[0]["generated_text"])

# --- チャットをシミュレートする場合
# messages = [
#     {"role": "system", "content": "あなたは愉快なAIアシスタントです。親切に答えて下さい"},
#     {"role": "user", "content": "こんにちはこんにちは!"},
#     {"role": "assistant", "content": "こんにちは！お元気ですか？今日はどんな一日をしていますか？"},
#     {"role": "user", "content": "今日も厄介な仕事ばかりさ"},
# ]
# output = pipe(messages, **generation_args)
# print(output[0]["generated_text"])
```
