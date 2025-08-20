#!/bin/bash

# ===== 設定 =====
# /debug-params の canonicalUsedForSigning の値を貼り付け
CANONICAL='logged_in_customer_id=&path_prefix=/apps/bpp-20250814-testz9a7q&shop=ruhra-store.myshopify.com&timestamp=1755155508'

# /debug-params の providedSignature の値を貼り付け
PROVIDED='884b12adc5c073dbdcdc118baf68f3cef6ee448f6ca97523049c896e3238d2e6'

# 試すClient Secret候補をここに全部入れる
CANDIDATES=(
  "secret_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  "secret_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  "secret_cccccccccccccccccccccccccccccccc"
  # 必要なだけ追加
)

# ===== 判定処理 =====
echo "=== Shopify署名一致テスト ==="
echo "Canonical: $CANONICAL"
echo "Provided : $PROVIDED"
echo "=============================="

MATCH_FOUND=0
for SECRET in "${CANDIDATES[@]}"; do
  SIG=$(printf "%s" "$CANONICAL" | openssl dgst -sha256 -hmac "$SECRET" -r | awk '{print $1}')
  if [ "$SIG" = "$PROVIDED" ]; then
    echo "✅ MATCH: $SECRET"
    MATCH_FOUND=1
  else
    echo "❌ NO MATCH: $SECRET (calc=$SIG)"
  fi
done

if [ $MATCH_FOUND -eq 0 ]; then
  echo "⚠ 一致するSecretは見つかりませんでした。候補を追加して再実行してください。"
fi
