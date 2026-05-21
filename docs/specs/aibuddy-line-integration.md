# 相棒モビー LINE連携 実装仕様書

**バージョン:** v0.1  
**作成日:** 2026-05-11  
**対象リポジトリ:** `shunpei1130/mobby`  
**対象:** Mobby公式サイト、相棒モビー専用ページ、LINE連携バックエンド、診断結果連動プロンプト

---

## 1. 目的

Mobby公式サイト上に「相棒モビー」導線を追加し、ユーザーの診断結果をもとに、LINEで話せる専用の相棒モビーを提供する。

今回のMVPでは、診断の面白さで終わらせず、診断後に「自分の相棒モビー」と継続的に接触できる状態を作る。

基本フローは以下。

```text
トップページ
  ↓
「相棒モビー」ボタン
  ↓
/aibuddy/
  ↓
localStorageに保存された診断データを判定
  ↓
診断済み: 相棒モビー表示 + LINE追加 + 合言葉コード発行
未診断: 診断ページへの導線表示
  ↓
LINE上で合言葉コードを送信
  ↓
LINE userId と診断結果を紐づけ
  ↓
以後、ユーザーごとの診断結果・相棒モビー人格で返信
```

---

## 2. 現状確認と前提

現在のリポジトリでは、トップページは以下にある。

```text
docs/index.html
```

Vercel Function相当のAPIは、すでに以下で運用されている。

```text
docs/api/
```

既存のマイページ登録APIでは、以下のlocalStorageキーが診断データとして扱われている。

```js
school_char_diag_v1
love_char_diag_v1
stan_char_diag_v1
night_char_diag_v1
mamaMobbyState
```

`docs/package.json` には `@vercel/blob` が含まれているため、MVPではLINE連携用の一時コード・ユーザーデータ・会話履歴もVercel Blobで保存する。

---

## 3. 実装スコープ

### 3.1 MVPで実装すること

- トップページに「相棒モビー」ボタンを追加する。
- `/aibuddy/` 専用ページを作成する。
- 専用ページでlocalStorage内の診断データを判定する。
- 診断データがある場合、相棒モビーのLINE追加画面を表示する。
- 診断データがない場合、診断ページへの導線を表示する。
- LINE連携用の一時コードを発行するAPIを作る。
- LINE webhookで合言葉コードを受け取り、LINE userIdと診断結果を紐づける。
- 紐づけ後、ユーザーごとの診断結果・相棒モビー人格に応じて返信する。
- 危険ワード時は安全モードに切り替える。

### 3.2 MVPではやらないこと

- ユーザーごとに個別LINE公式アカウントを作ること。
- LIFFログインによる自動連携。
- 課金機能。
- 長期メモリの高度な自動要約。
- 全診断結果に対する完全な相棒モビー定義。

MVPでは「1つのLINE公式アカウント + ユーザーごとのDBメモリ + 診断結果別プロンプト」で実現する。

---

## 4. ファイル構成

### 4.1 追加ファイル

```text
docs/
  aibuddy/
    index.html
    aibuddy.css
    aibuddy.js
    buddy-map.js

  api/
    aibuddy/
      issue-link-token.js
      line-webhook.js
      health.js
      _storage.js
      _line.js
      _openai.js
      _mobby-profiles.js
      _safety.js
```

### 4.2 修正ファイル

```text
docs/index.html
docs/package.json
```

`docs/package.json` は、OpenAI SDKを使う場合のみ `openai` を追加する。依存追加を避けるなら、`fetch` でOpenAI APIを直接呼び出す。

---

## 5. トップページ仕様

### 5.1 対象ファイル

```text
docs/index.html
```

### 5.2 追加するボタン

既存の診断・ガチャ導線付近に、以下を追加する。

```html
<a href="/aibuddy/" id="goAiBuddy" class="btn btn-secondary">
  相棒モビー
</a>
```

### 5.3 スマホ対応

既存CSSのスマホ調整に `#goAiBuddy` を追加する。

```css
@media (max-width: 768px) {
  #goMobbyDiagnosis,
  #goGachaPage,
  #goAiBuddy {
    font-size: 12px !important;
    padding: 8px 18px !important;
  }
}
```

---

## 6. 相棒モビー専用ページ仕様

### 6.1 URL

```text
/aibuddy/
```

### 6.2 実体ファイル

```text
docs/aibuddy/index.html
docs/aibuddy/aibuddy.css
docs/aibuddy/aibuddy.js
docs/aibuddy/buddy-map.js
```

### 6.3 画面状態A: 診断データあり

localStorageから診断結果を検出できた場合、以下を表示する。

```text
あなたの相棒モビーが見つかりました
診断結果: 文化祭モビー
相棒: 頑張りすぎモビー
LINEで相棒モビーを追加する
```

表示要素:

- 診断名
- 診断結果タイプ
- 相棒モビー名
- 相棒モビーの説明文
- LINE追加ボタン
- 合言葉コード
- 合言葉コピーボタン
- 診断をやり直すリンク

### 6.4 画面状態B: 診断データなし

localStorageに有効な診断データがない場合、以下を表示する。

```text
まだ相棒モビーを呼べません
まずは診断をすると、あなたに合う相棒モビーが見つかります。
```

表示する導線:

```html
<a href="/16school/" class="btn btn-primary">学校モビー診断をする</a>
<a href="/16love/" class="btn btn-secondary">メンヘラモビー診断をする</a>
<a href="/16stan/" class="btn btn-secondary">推し活モビー診断をする</a>
<a href="/16night/" class="btn btn-secondary">夜職モビー診断をする</a>
<a href="/16school/mama/" class="btn btn-secondary">ママモビー診断をする</a>
```

### 6.5 画面状態C: 診断途中

localStorageに回答途中データはあるが、診断結果名がない場合は、以下を表示する。

```text
診断途中のデータがあります
最後まで診断すると、相棒モビーをLINEに呼べます。
```

表示導線:

- 診断を続ける
- 診断を最初からやる

---

## 7. localStorage診断データ判定仕様

### 7.1 判定対象

```js
const STORAGE_TARGETS = [
  {
    key: "school_char_diag_v1",
    label: "学校モビー診断",
    source: "16school",
    url: "/16school/"
  },
  {
    key: "love_char_diag_v1",
    label: "メンヘラモビー診断",
    source: "16love",
    url: "/16love/"
  },
  {
    key: "stan_char_diag_v1",
    label: "推し活モビー診断",
    source: "16stan",
    url: "/16stan/"
  },
  {
    key: "night_char_diag_v1",
    label: "夜職モビー診断",
    source: "16night",
    url: "/16night/"
  },
  {
    key: "mamaMobbyState",
    label: "ママモビー診断",
    source: "16mama",
    url: "/16school/mama/"
  }
];
```

### 7.2 診断完了判定

以下のいずれかが存在する場合、診断結果名ありとみなす。

```js
data.type
data.diagnosisName
data.diagTitle
data.diagnosis_type
```

かつ、回答数が1以上であること。

```js
Object.keys(data.answers || {}).length > 0
```

### 7.3 正規化後の診断データ

```json
{
  "source": "16school",
  "sourceLabel": "学校モビー診断",
  "diagnosisType": "文化祭モビー",
  "type": "festival",
  "axes": {
    "A": 72,
    "B": 41,
    "C": 83,
    "D": 56
  },
  "answeredCount": 16,
  "createdAt": "2026-05-11T00:00:00.000Z"
}
```

### 7.4 複数診断がある場合

MVPでは最新の診断結果を採用する。

並び順:

```text
createdAt / updatedAt が新しい順
```

将来的には、相棒モビー画面で診断結果を選べるようにする。

---

## 8. 相棒モビー割り当て仕様

### 8.1 フロント実装ファイル

```text
docs/aibuddy/buddy-map.js
```

### 8.2 基本方針

診断結果タイプから、LINEで話せる相棒モビーを決定する。

```js
export const BUDDY_MAP = {
  "文化祭モビー": {
    buddyId: "ganbarisugi",
    buddyName: "頑張りすぎモビー",
    displayName: "あなた専用の頑張りすぎモビー",
    description: "人を盛り上げるあなたの裏側にある疲れを見張ってくれる相棒。",
    catchcopy: "がんばりすぎた日、Mobbyが代わりに床になります。"
  }
};
```

### 8.3 デフォルト相棒

未定義の診断結果は、暫定で以下に落とす。

```js
export const DEFAULT_BUDDY = {
  buddyId: "yorisoi",
  buddyName: "よりそいモビー",
  displayName: "あなた専用のよりそいモビー",
  description: "今日の気分を短く受け止めてくれる相棒。",
  catchcopy: "言葉にならない日も、短く返してくれます。"
};
```

### 8.4 バックエンド側定義

LINE webhook側でも同じ相棒モビー定義が必要。

```text
docs/api/aibuddy/_mobby-profiles.js
```

MVPではフロント・バックエンドで重複定義してよい。正式運用では共通JSON化する。

---

## 9. LINE連携方式

### 9.1 MVP方式

MVPでは「合言葉コード方式」を採用する。

LINE公式アカウント追加だけでは、Webページ上のlocalStorage診断データをLINE userIdに直接渡せない。そのため、相棒モビーページで一時コードを発行し、ユーザーにLINEで送ってもらう。

### 9.2 連携フロー

```text
1. ユーザーが /aibuddy/ にアクセス
2. フロントがlocalStorageから診断結果を取得
3. フロントが /api/aibuddy/issue-link-token にPOST
4. バックエンドが一時コードを発行
5. 画面にLINE追加ボタンと合言葉を表示
6. ユーザーがLINE公式アカウントを追加
7. ユーザーが合言葉を送信
8. LINE webhookが合言葉を受信
9. webhookがLINE userIdと診断結果を紐づけ
10. 以後、ユーザーの発言に相棒モビーが返答
```

---

## 10. API仕様

### 10.1 POST `/api/aibuddy/issue-link-token`

Webページの診断結果を受け取り、LINE連携用の合言葉コードを発行する。

#### リクエスト

```json
{
  "diagnosis": {
    "source": "16school",
    "sourceLabel": "学校モビー診断",
    "diagnosisType": "文化祭モビー",
    "type": "festival",
    "axes": {
      "A": 72,
      "B": 41,
      "C": 83,
      "D": 56
    },
    "answeredCount": 16,
    "createdAt": "2026-05-11T00:00:00.000Z"
  },
  "buddy": {
    "buddyId": "ganbarisugi",
    "buddyName": "頑張りすぎモビー"
  }
}
```

#### レスポンス

```json
{
  "ok": true,
  "linkToken": "MB-8K3X2Q",
  "expiresAt": "2026-05-11T12:00:00.000Z",
  "lineAddUrl": "https://lin.ee/xxxxxxxx",
  "firstMessageText": "相棒モビー登録 MB-8K3X2Q"
}
```

#### エラー

```json
{
  "ok": false,
  "error": "diagnosis is required"
}
```

### 10.2 POST `/api/aibuddy/line-webhook`

LINEからのWebhookを受け取り、署名検証、合言葉コード検出、ユーザー紐づけ、通常返信を行う。

Webhook URL:

```text
https://www.mobby.online/api/aibuddy/line-webhook
```

### 10.3 GET `/api/aibuddy/health`

疎通確認用。

```json
{
  "ok": true,
  "service": "aibuddy",
  "time": "2026-05-11T00:00:00.000Z"
}
```

---

## 11. バックエンド詳細

### 11.1 `issue-link-token.js`

役割:

- 診断結果の受け取り
- 相棒モビー情報の受け取り
- 一時コード発行
- Vercel Blobへの保存
- LINE追加URLと合言葉文言の返却

保存先:

```text
aibuddy/link-tokens/{token}.json
```

保存データ:

```json
{
  "version": 1,
  "token": "MB-8K3X2Q",
  "status": "pending",
  "diagnosis": {
    "source": "16school",
    "sourceLabel": "学校モビー診断",
    "diagnosisType": "文化祭モビー",
    "type": "festival"
  },
  "buddy": {
    "buddyId": "ganbarisugi",
    "buddyName": "頑張りすぎモビー"
  },
  "createdAt": "2026-05-11T11:30:00.000Z",
  "expiresAt": "2026-05-11T12:00:00.000Z"
}
```

トークン仕様:

```text
形式: MB-XXXXXX
文字: 英大文字 + 数字
長さ: 6文字
有効期限: 30分
```

### 11.2 `line-webhook.js`

役割:

- LINE署名検証
- 合言葉コードの検出
- LINE userIdと診断結果の紐づけ
- 通常メッセージへの相棒モビー返信

処理分岐:

```text
メッセージが「相棒モビー登録 MB-XXXXXX」を含む
  ↓
リンク処理

それ以外
  ↓
既存ユーザーなら相棒モビーとして返信
未登録ユーザーなら /aibuddy/ への案内を返す
```

未登録ユーザーへの返信:

```text
まだ相棒モビーが見つかってないみたい。
先に診断してから、相棒モビーを呼んでね。
https://www.mobby.online/aibuddy/
```

登録完了時の返信:

```text
連携できたよ。
今日から、あなた専用の頑張りすぎモビーです。

眠い、疲れた、むり、だけでも送っていいよ。
```

---

## 12. データ保存仕様

### 12.1 保存先

MVPではVercel Blobを使う。

### 12.2 保存パス

```text
aibuddy/link-tokens/{token}.json
aibuddy/users/{lineUserId}.json
aibuddy/messages/{lineUserId}.json
```

### 12.3 ユーザーデータ

```json
{
  "version": 1,
  "lineUserId": "Uxxxxxxxxxxxxxxxx",
  "buddyId": "ganbarisugi",
  "buddyName": "頑張りすぎモビー",
  "diagnosis": {
    "source": "16school",
    "sourceLabel": "学校モビー診断",
    "diagnosisType": "文化祭モビー",
    "type": "festival",
    "axes": {
      "A": 72,
      "B": 41,
      "C": 83,
      "D": 56
    }
  },
  "memory": {
    "nickname": "",
    "preferredTone": "short_soft",
    "recentSummary": "",
    "riskLevel": "normal"
  },
  "createdAt": "2026-05-11T00:00:00.000Z",
  "updatedAt": "2026-05-11T00:00:00.000Z"
}
```

### 12.4 メッセージ履歴

```json
{
  "version": 1,
  "lineUserId": "Uxxxxxxxxxxxxxxxx",
  "messages": [
    {
      "role": "user",
      "content": "眠い",
      "createdAt": "2026-05-11T00:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "眠いのに今日も生きててえらい。今日はもう閉店でいい。",
      "createdAt": "2026-05-11T00:00:01.000Z"
    }
  ],
  "summary": "",
  "updatedAt": "2026-05-11T00:00:01.000Z"
}
```

### 12.5 履歴保持ルール

- 直近メッセージは最大12件。
- 長期記憶は `summary` に要約保存。
- 重い個人情報は保存しない。
- 危険発言は本文を過度に保存せず、`riskLevel` を更新する。

---

## 13. OpenAI連携仕様

### 13.1 モデル

MVP推奨:

```text
通常返信: gpt-4o-mini
危険ワード・重い相談: gpt-4o または上位モデル
```

### 13.2 実装ファイル

```text
docs/api/aibuddy/_openai.js
```

### 13.3 API呼び出し

依存追加を避けるため、最初は `fetch` でOpenAI APIを直接呼び出す。

必要な環境変数:

```text
OPENAI_API_KEY
OPENAI_MODEL_DEFAULT=gpt-4o-mini
OPENAI_MODEL_SAFETY=gpt-4o
```

---

## 14. Mobby人格プロンプト仕様

### 14.1 実装ファイル

```text
docs/api/aibuddy/_mobby-profiles.js
```

### 14.2 頑張りすぎモビー定義例

```js
export const MOBBY_PROFILES = {
  ganbarisugi: {
    buddyId: "ganbarisugi",
    buddyName: "頑張りすぎモビー",
    personality:
      "相手が無理していることにすぐ気づく。がんばれとは言わず、まず休ませる。少し変な比喩で軽くする。",
    toneRules: [
      "LINE向けに短く返す",
      "1回の返答は1〜3文",
      "説教しない",
      "正論で詰めない",
      "医療・診断のように言わない",
      "少しだけかわいく、少しだけ変"
    ],
    catchphrases: [
      "今日はもう閉店でいい",
      "がんばり貯金、使い切ってる",
      "Mobby、床になる",
      "えらいの過剰摂取"
    ],
    doRules: [
      "疲れを肯定する",
      "休む理由を作ってあげる",
      "短い行動を1つだけ提案する"
    ],
    dontRules: [
      "もっと頑張れと言わない",
      "長文カウンセリングにしない",
      "根性論を言わない",
      "病名を推測しない"
    ]
  }
};
```

### 14.3 プロンプト構成

```text
[固定] Mobby共通ルール
[固定] 安全ルール
[固定] 相棒モビー人格
[変動] ユーザー診断結果
[変動] ユーザー個別メモリ
[変動] 直近会話
[変動] 今回の発言
```

### 14.4 プロンプト例

```text
あなたはMobbyというキャラクター型の自動応答です。
ユーザーの診断結果に応じて、LINEで短く返答します。
医療・カウンセリング・診断行為はしません。

# 今回の相棒
名前: 頑張りすぎモビー
性格: 相手が無理していることに気づく。頑張れとは言わず、まず休ませる。
口調: やわらかい。少しユーモア。少し変な比喩。

# ユーザー診断
診断: 学校モビー診断
結果: 文化祭モビー
相棒: 頑張りすぎモビー

# 直近会話
ユーザー: 眠い

# 返答ルール
1〜3文で返す。
長文にしない。
頑張れと言わない。
```

---

## 15. 安全仕様

### 15.1 実装ファイル

```text
docs/api/aibuddy/_safety.js
```

### 15.2 危険ワード例

以下を含む場合、安全モードに切り替える。

```text
死にたい
消えたい
自傷
切りたい
OD
もう無理
生きてる意味
誰にも言えない
吐きたい
食べたくない
```

### 15.3 安全モード時の返信方針

- キャラ口調を弱める。
- 否定しない。
- ひとりにしない。
- 緊急時は身近な人、専門窓口、緊急連絡を促す。
- 医療診断や治療助言はしない。

### 15.4 表記

LINE追加画面または初回メッセージには、以下の表記を入れる。

```text
Mobbyは、あなたの診断結果に合わせて返事をするキャラクター型の自動応答です。
医療・カウンセリングではありません。
```

人間が個別に返信しているように誤認させる表現は避ける。

---

## 16. LINE API仕様

### 16.1 必要な環境変数

```text
LINE_CHANNEL_SECRET
LINE_CHANNEL_ACCESS_TOKEN
AIBUDDY_LINE_ADD_URL
OPENAI_API_KEY
OPENAI_MODEL_DEFAULT
OPENAI_MODEL_SAFETY
```

### 16.2 LINE公式アカウント追加URL

```text
AIBUDDY_LINE_ADD_URL=https://lin.ee/xxxxxxxx
```

### 16.3 署名検証

`line-webhook.js` では必ず `X-Line-Signature` を検証する。

```text
HMAC-SHA256
secret: LINE_CHANNEL_SECRET
body: raw request body
```

---

## 17. LINE返信仕様

### 17.1 通常返信例

ユーザー:

```text
眠い
```

頑張りすぎモビー:

```text
眠いのに今日も生きててえらい。
今日はもう閉店でいい。
Mobby、鍵しめる係やる。
```

ユーザー:

```text
疲れた
```

頑張りすぎモビー:

```text
疲れたって言えたの、かなり大事。
がんばり貯金、今日は使い切ってる。
```

ユーザー:

```text
なんかむり
```

頑張りすぎモビー:

```text
「むり」だけで伝わった。
今日は説明しなくていい日。
Mobby、横で静かにしてる。
```

---

## 18. 画面文言案

### 18.1 診断済み

```text
あなたの相棒モビーが見つかりました

診断結果
文化祭モビー

あなたにつく相棒
頑張りすぎモビー

人を盛り上げるあなたの裏側にある疲れを、
こっそり見張ってくれるモビーです。
```

CTA:

```text
LINEで相棒モビーを追加する
```

補足:

```text
LINEを追加したら、この合言葉を送ってください。
相棒モビー登録 MB-8K3X2Q
```

### 18.2 未診断

```text
まだ相棒モビーを呼べません

まずは診断をすると、
あなたに合う相棒モビーが見つかります。
```

CTA:

```text
学校モビー診断をする
```

---

## 19. 実装順序

### Step 1: トップ導線追加

```text
docs/index.html に「相棒モビー」ボタンを追加
href="/aibuddy/"
```

### Step 2: 相棒モビーページ作成

```text
docs/aibuddy/index.html
docs/aibuddy/aibuddy.css
docs/aibuddy/aibuddy.js
docs/aibuddy/buddy-map.js
```

localStorage判定と画面出し分けを先に実装する。

### Step 3: 一時コードAPI作成

```text
docs/api/aibuddy/issue-link-token.js
docs/api/aibuddy/_storage.js
```

### Step 4: LINE webhook作成

```text
docs/api/aibuddy/line-webhook.js
docs/api/aibuddy/_line.js
```

まずは合言葉コードでLINE userIdと診断結果を紐づけるところまで実装する。

### Step 5: OpenAI返信実装

```text
docs/api/aibuddy/_openai.js
docs/api/aibuddy/_mobby-profiles.js
docs/api/aibuddy/_safety.js
```

通常返信と安全モードを分ける。

### Step 6: LINE Developers設定

Webhook URL:

```text
https://www.mobby.online/api/aibuddy/line-webhook
```

設定:

```text
Use webhook: ON
応答メッセージ: OFF推奨
あいさつメッセージ: ONでも可
```

---

## 20. 受け入れ条件

### 20.1 フロント

- トップに「相棒モビー」ボタンが表示される。
- ボタンから `/aibuddy/` に遷移できる。
- localStorageに診断結果がない場合、診断ページ導線が表示される。
- localStorageに診断結果がある場合、相棒モビー名が表示される。
- 「文化祭モビー」の場合、「頑張りすぎモビー」が表示される。
- LINE追加ボタンが表示される。
- 合言葉コードが発行され、コピーできる。

### 20.2 バックエンド

- `POST /api/aibuddy/issue-link-token` が動作する。
- トークンがVercel Blobに保存される。
- `GET /api/aibuddy/health` が200を返す。
- `POST /api/aibuddy/line-webhook` がLINE署名を検証する。
- 合言葉コードをLINEで送るとLINE userIdと診断結果が紐づく。
- 紐づけ後、通常メッセージに相棒モビーとして返信する。

### 20.3 安全

- 危険ワード時は通常のキャラ返信だけで終わらない。
- 医療診断・治療助言をしない。
- 初回またはページ上で「キャラクター型自動応答」と説明する。

---

## 21. 未確定事項

実装開始前に決めるべき事項。

1. LINE公式アカウントの追加URL。
2. `AIBUDDY_LINE_ADD_URL` の本番値。
3. `文化祭モビー -> 頑張りすぎモビー` 以外の診断結果マッピング。
4. 安全モード時に表示する相談窓口文言。
5. 会話履歴の保存期間。
6. OpenAIモデルの最終選定。
7. LIFF連携を後続で入れるかどうか。

---

## 22. MVPの最終構成

```text
docs/index.html
  - 相棒モビーボタン追加

docs/aibuddy/index.html
docs/aibuddy/aibuddy.css
docs/aibuddy/aibuddy.js
docs/aibuddy/buddy-map.js
  - localStorage診断結果判定
  - 相棒モビー表示
  - LINE追加・合言葉表示

docs/api/aibuddy/issue-link-token.js
docs/api/aibuddy/line-webhook.js
docs/api/aibuddy/health.js
docs/api/aibuddy/_storage.js
docs/api/aibuddy/_line.js
docs/api/aibuddy/_openai.js
docs/api/aibuddy/_mobby-profiles.js
docs/api/aibuddy/_safety.js
  - LINE連携
  - ユーザー別Mobby設定
  - OpenAI返信
```

---

## 23. 実装判断

この仕様では、既存の静的サイト構成を崩さずに `docs/api` のVercel Function設計に乗せて実装する。最初は「合言葉コード方式」で十分。LIFF連携は反応が出てから追加する。

最初に作るべきものは以下。

```text
1. /aibuddy/ ページ
2. localStorage診断結果判定
3. 文化祭モビー -> 頑張りすぎモビーの表示
4. 合言葉コードAPI
5. LINE userId紐づけWebhook
6. 頑張りすぎモビーの短文返信
```
