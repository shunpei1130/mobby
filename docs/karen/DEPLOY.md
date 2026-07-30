# DEPLOY.md

## 推奨設置先

既存Mobby診断は `docs/16fear/index.html` や `docs/16school/index.html` のように、診断ごとのディレクトリに静的HTMLを置く構造です。今回も以下のように設置できます。

```txt
docs/karen-oshi/
  index.html
  assets/
    logo.webp
    favicon.webp
    hero.webp
    ogp.webp
    cards/
      01_comment-frontline.webp
      ...
  content/
    diagnosis-data.json
```

## canonical / OGP

`index.html` のcanonicalとOGPは暫定で以下にしています。

```txt
https://www.mobby.online/karen-oshi/
```

別パスで公開する場合は、以下を一括置換してください。

- `<link rel="canonical">`
- `og:url`
- `og:image`
- Twitter image
- JSON-LD `url`

## CTA

本人アカウントとライブ情報URLが確定したら、`index.html` 内の `DIAG` JSONにある `links.karen` と `links.live` を差し替えてください。`#` のままだとCTAは非表示になります。

## 安全設計

- 認知確約なし
- 個別返信前提なし
- 本人写真なし
- 権利確認不要な抽象ビジュアルで構成
