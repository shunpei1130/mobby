# Mobby公式サイト / もび道を中心にしたリニューアル

ブランチ: `codex/mobidou-official-site`

## 構成

追記: コンパクト版では、下段のアプリ詳細とブランド紹介の2セクションを削除。`#mobidou` はヒーローに移動。「モビーについて」は図鑑を開く。メニューはPCで6列、スマートフォンで3列とし、旧CSS由来のbackdrop blur・文字光彩・ツールチップを無効化。画面高に合わせた短いヒーローに変更し、重複文言と余白を削減。

- Mobby公式サイトのブランドを維持。風景を大きく使ったトップから、もび道と診断の両方へ進める。
- 「歩く・集める・ふれあう」の紹介後に、既存の診断・ポスター・図鑑・お問い合わせ・SNS・絵本の6ボタンを配置。
- 既存の通常診断・コラボ診断メニュー、図鑑、SNS、お問い合わせの機能を再利用。
- 4コマは下段の開閉欄で閲覧。起動スプラッシュは元のロゴ・物理演出・タップ操作を復元。演出中は背面のページを非表示にし、スクロールを止める。
- 共通の診断結果フォロー欄から `/#mobidou` へ誘導。質問中・再診断中は紹介欄を隠す。
- スマートフォンでは2列のメニュー、縮小したスマートフォン画像とモビーを使用。見出しやボタンはHTMLで表示。

## 画像

`assets/mobidou-site/` にサイト専用として配置。

- `journey-landscape.webp`: built-in image_genで生成した、文字・端末・キャラを含まない背景。
- `app-home.webp`: mobidouのmain `bc2f5f0` に保存された `docs/app-store/raw/01-home.png` をWebP化。過去の開発画面なのでサイト上にも「画面は開発中のイメージです」と表示。公開版の画面には差し替えが必要。
- `goshuin-{star,moon}.webp`: 同mainの `assets/goshuin/` からコピーしサイト用に縮小。
- モビーはサイトに既存の `assets/mobby-guide/characters/` を参照。
- `mobibou-walk.webp`: 「歩く」用にbuilt-in image_genで生成した透過画像（320×320）。既存モビ坊を参照し、全身・片足を前に出した歩行ポーズ・帽子/レンズ/十字キー/ボタンの維持・背景/文字なしを指定。元のPNGは生成画像フォルダーに保持。「集める」には上記の月/星の御朱印を使用し、スマートフォンでも画像を表示。

歩行画像の生成プロンプト:

> Create one transparent-background website feature illustration: the EXACT Mobby mascot from reference, a plush dark brown camera creature named モビ坊 with one large cream eyeball, one camera lens, red backwards baseball cap with star, red-tipped fur, D-pad and two round buttons on chest, cream hood orange cords and small backpack. Preserve identity, colors and tactile fur. Show full body in a clear walking pose, three-quarter side view facing right, one foot lifted and stepping forward, arms gently swinging, cheerful exploration. Exactly one character centered, all feet and cap visible with minimal 6% transparent padding. No text, no ground, no scenery, no shadow platform, no checkerboard pattern. A clean genuinely transparent cutout designed to stay readable at 90 pixels tall. Do not render a sprite sheet or multiple views.

生成プロンプト（built-in image_gen、添付の承認済みサイト案を画風の参考に使用）:

> Create a standalone website BACKGROUND ART asset, landscape 1536x1024. Reference image supplies art direction only. Remove ALL website UI, text, logos, characters, phone, cards, buttons, lettering. Paint a beautiful Japanese fictional pilgrimage mountain valley in autumn, intricate watercolor and woodblock on warm ivory washi paper. Left edge has a shrine under red maple leaves, winding stone steps descend from left foreground to a village and lake at middle distance, distant blue sage mountain ridges and light morning haze. Lower right is mossy rocks and low red maple foliage. IMPORTANT COMPOSITION: upper central 55 percent is very light warm cream sky and pale mist with exceptionally low contrast to accommodate live dark headline and buttons. Landscape richly detailed along left edge and lower third only. No people, no creatures, no smartphone, no words, no signage, no watermark. Soft painterly elegant natural texture, match reference's scenic charm. Image must fill whole canvas, no border.

## シールガチャの提供終了

- トップ・共通診断結果からガチャの紹介を削除。
- ガチャの入口とSNS投稿キットを提供終了案内に変更。
- 新規購入APIはPOSTに410を返し、Stripeに接続しない。
- 無料・コード・テスト抽選を入口へ戻す。既存の有料結果の復旧は従来のサーバー検証を利用。
- 既存購入のステータス・Webhook・結果取得・配信処理は維持。
- ローカルの保存済みコレクションは消去せず、終了案内からJSON形式で書き出せる。

## 公開前の差し替え

- 正式なApp Store URLが確定したら、公開準備中表示を正規のストア導線に変更。
- アプリの最終ビルドから撮影した画像に `app-home.webp` を差し替える。
- ブラウザーによる画面・実タップ検証は今回の実行環境のアクセス制限で未実施。デスクトップと390px前後の幅で、トップ・6ボタン・診断結果の導線を確認する。
- 本番デプロイ・外部サービス設定の変更は未実施。

## 検証

```powershell
cd docs
node scripts/validate-mobidou-home.mjs
```

メニューの保存、アンカー、画像パス、ポップアップの参照、JS構文、新規課金停止、既存有料結果の分岐、診断結果の紹介表示・再診断時の非表示を検査する。
