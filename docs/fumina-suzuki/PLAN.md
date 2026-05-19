# 鈴木ふみ奈様向け「モビー診断」ラフ案制作PLAN

## Summary

Gmailのスター付き検索 `is:starred 鈴木ふみ奈` で該当スレッドは1件。返信者はオフィスポケット代表の黄金井淑文様、返信先は `pocket_models@yahoo.co.jp`。返信内容は「企画が理解できないので、ラフ案を頂きたい」で、温度感は前向き検討前の確認段階。

今回のラフ案は、黄金井様が企画の完成形を短時間で把握できるように、実際に触れる静的HTMLの診断ページとして制作する。公開情報はオフィスポケット公式プロフィール/NEWSを主軸にし、グラビア・女優活動、写真集/カレンダー、音楽学科、サックス/ピアノ、筋トレ/サウナ/ポーカー、ミス・ワールド・ジャパン2018審査員特別賞、KUNOICHI出演など、公開された活動文脈だけを診断テーマに使う。

## Implementation Changes

- 専用ブランチ名: `feature/fumina-suzuki-mobby-rough`
- 作成ディレクトリ: `docs/fumina-suzuki/`
- 作成ファイル: `docs/fumina-suzuki/index.html`, `docs/fumina-suzuki/PLAN.md`, `docs/fumina-suzuki/img/hero-mood.png`, `docs/fumina-suzuki/img/result-cards.png`
- 診断名: `鈴木ふみ奈ムードタイプ診断`
- HTMLPreview URL: `https://htmlpreview.github.io/?https://github.com/shunpei1130/mobby/blob/feature/fumina-suzuki-mobby-rough/docs/fumina-suzuki/index.html`
- `origin/main` 起点の専用ブランチで制作し、mainには直接反映しない。確認用URLとして共有する。
- 既存の診断UIを参考に、静的HTML/CSS/JSで `intro -> quiz -> result -> characters` の4ステップを実装する。
- 性別選択、メール登録ゲート、Gmail下書き作成、メール送信導線は入れない。
- 質問は20問、回答は7段階、結果タイプは8タイプ、診断軸は3軸にする。
- 3軸:
  - `Glamour <-> Natural`: 華やかな見せ方/ナチュラルな親近感
  - `Active <-> Chill`: アクティブな挑戦/リラックスした整い
  - `Classic <-> Pop`: 上品で映画的/明るくSNS的
- 8タイプ:
  - `Grace Spotlight`
  - `Stage Muse`
  - `Piano Noir`
  - `Pocket Queen`
  - `Action Bloom`
  - `Fresh Camera`
  - `Sauna Reset`
  - `Pop Calendar`
- スコア計算は `GAMMA=1.35`, `EXTREME_BONUS=0.35`, `COHERENCE_SHRINK=0.20` を使う。
- 画像は `image_gen` で生成した2枚だけを使い、ページ内の複数箇所に交互配置する。
  - `hero-mood.png`: 本人写真の写実再現を避けた、グラビア/女優/ステージ感を抽象化した華やかなヒーロービジュアル。
  - `result-cards.png`: 8タイプを象徴する小物、光、ステージ、サウナ、音楽、カメラ要素の抽象コラージュ。
- 禁止表現:
  - 本人の人格、恋愛観、私生活、内面を断定する表現
  - 露骨な身体部位強調、性的評価、過度な露出を連想させる表現
  - 実在ブランド名、ロゴ、読める文字入り画像
  - `本人公認`, `公式診断` など承諾前に公式性を示す表現
  - ファンを煽る過激なランキング表現や優劣表現

## Test Plan

- `docs/fumina-suzuki/index.html` をブラウザで開き、`intro -> quiz -> result -> characters` が遷移することを確認する。
- 20問すべてが7段階回答で入力でき、未回答時に結果へ進めないことを確認する。
- 代表的な回答パターンで8タイプへ到達でき、結果タイトル、説明、3軸表示、キャラクター一覧が崩れないことを確認する。
- 画像は2ファイルのみを読み込み、ページ内に交互配置されることを確認する。
- 性別選択、メール登録ゲート、送信フォーム、Gmail下書き作成導線が存在しないことを確認する。
- モバイル/デスクトップでテキスト重なり、ボタンはみ出し、画像の不自然な切れを確認する。
- HTMLPreview URLで表示確認し、黄金井様に共有できる状態にする。

## Assumptions

- 公開情報の参照元は、オフィスポケット公式プロフィール/NEWSを優先し、補助的に公開ニュース記事を確認する。
- 診断は承諾前の非公式ラフ案として表現し、公式性や本人監修を示す文言は使わない。
- 返信先は黄金井淑文様 `pocket_models@yahoo.co.jp` とする。
- Gmail下書き作成とメール送信は行わない。
