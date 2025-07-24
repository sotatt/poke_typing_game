# ポケモンタイピングゲーム

## セットアップ方法（Mac/Linux）

```bash
# 仮想環境作成・起動
python3 -m venv ENV
source ENV/bin/activate

# 必要なライブラリをインストール
pip install -r requirements.txt

# サーバー起動
uvicorn backend.main:app --reload

# フロントは、frontend/index.html をブラウザで開いてください
