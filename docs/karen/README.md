# かれんちゃんに見つかる推し活診断

佐藤かれんさん向けコラボ用のMobby診断一式です。既存Mobby診断の静的HTML構成に合わせ、`index.html` 単体で診断が動くようにしています。

## 同梱物

- `index.html`：診断本体。HTML/CSS/JSを内包。
- `assets/logo.png`：ロゴ画像。
- `assets/favicon.png`：favicon用画像。
- `assets/hero.png`：ファーストビュー用ビジュアル。
- `assets/ogp.png`：SNSシェア用OGP画像。
- `assets/cards/*.png`：8タイプ分の結果画像。
- `content/diagnosis-data.json`：設問・結果タイプ・導線設定の元データ。
- `DEPLOY.md`：Mobbyリポジトリへの設置メモ。

## 公開前に差し替える項目

`index.html` 内の `DIAG.links` または `content/diagnosis-data.json` の以下を差し替えてください。

- `links.karen`：佐藤かれんさん本人アカウントURL
- `links.live`：ライブ / 特典会情報URL

現時点では、未確認の公式アカウントを誤掲載しないため `#` にしています。

## 表現ルール

公開文言では「認知される」「必ず覚えてもらえる」と断言しないでください。現在の実装は「見つかりやすいかも」「印象に残りやすいかも」に寄せています。
