# LINE AIモビー：共通ナレッジ・個別診断結果・相性回答 実装仕様書 / Codex指示

**作成日:** 2026-05-31  
**対象リポジトリ:** `shunpei1130/mobby`  
**対象機能:** LINE AIモビーの回答品質強化  
**主担当AI:** Codex  
**実装対象:** `docs/api/line-ai/`、`docs/shared/line-ai-mobby-cta.js`、各診断結果ページ  

---

## 0. Codexへの最初の指示

この仕様書を読んだら、いきなり大規模リファクタしないこと。  
まず既存実装を確認し、下記の順番で小さく実装する。

```text
1. 既存のLINE AIのhealth / webhook / _ai / _prompts / _diagnosis-knowledge / _storageを読む
2. Mobby共通ナレッジを追加する
3. 診断結果の個別保存・参照の土台を追加する
4. 「相性がいいモビー」回答ロジックを追加する
5. LIFF連携の入口を追加する
6. 既存テストスクリプトを更新する
7. 影響範囲を最小にしてPRを出す
```

**やってはいけないこと:**

- Gemini APIキー、LINE Channel Secret、LIFF Secretなどの秘密情報をコードに書かない
- Mobbyナレッジ本文をVercel環境変数に入れる設計にしない
- LINE raw userIdを保存しない
- メール、名前、年齢、回答全文をLINE AI用user recordへ保存しない
- 既存のStripe / Resend / mypage / reservation系APIを巻き込んで壊さない
- 診断タイプを医療・心理診断のように断定しない
- 「相性がいい」を現実の人間関係の保証として言わない

---

## 1. 実現したいこと

今回実現したいことは3つ。

### 1.1 モビーについてのナレッジにアクセスできる

LINE AIモビーが、以下に自然に答えられる状態にする。

```text
- Mobbyって何？
- モビー診断って何種類ある？
- LINEのモビーは何ができる？
- 学校モビー診断って何？
- 推し活モビー診断って何？
- メンヘラモビー診断って何？
- 恋愛モビー診断って何？
- 診断結果はどう扱われる？
```

### 1.2 診断結果の個別処理ができる

LINE上で、ユーザーごとの診断結果を背景情報として扱えるようにする。

```text
ユーザー: 私の診断結果覚えてる？
モビー: あなたの診断結果は「返信こないと死モビー」だよ。...
```

ただし、診断結果は人格変更に使わない。モビーは常に共通人格の「モビー」。診断結果は会話の背景情報としてのみ使う。

### 1.3 相性がいいモビーを回答できる

ユーザーは、自分のタイプだけでなく「相性がいいモビー」も気にしている。以下に答えられるようにする。

```text
- 私と相性いいモビーは？
- このタイプと相性いいの誰？
- 返信こないと死モビーと相性いいタイプは？
- 私に合うモビー教えて
- 逆に合わないモビーいる？
```

相性回答は、まずは**診断上の遊び・会話上の相性**として扱う。現実の恋愛・友人関係の成功保証として断定しない。

---

## 2. 現在の実装認識

既存のLINE AI実装は主に以下。

```text
docs/api/line-ai/
  _ai.js
  _diagnosis-knowledge.js
  _line.js
  _prompts.js
  _rate-limit.js
  _safety.js
  _storage.js
  health.js
  issue-link-token.js
  webhook.js
```

現在の主な特徴。

```text
- LINE userIdはMOBBY_LINE_AI_SECRETで匿名userKey化している
- conversationはline-ai/conversations/{userKey}.jsonに保存している
- 会話履歴は直近12メッセージまで
- _diagnosis-knowledge.jsに診断別ナレッジがある
- _ai.jsはbuildKnowledgeReply()をGemini前に呼んでいる
- _prompts.jsはuserをほぼ使っていない
- 現状のプロンプトには「個別結果はLINEでは保持・参照しない」とある
- issue-link-token.jsは名前にtokenがあるが、実際はLINE_ADD_URLを返すだけ
- 各診断ページの一部ではdata-diagnosis payloadを作っているが、CTA側で読まれていない
```

Codexはまずこの認識が正しいか確認すること。ズレがあれば、実装前にPR本文で明記する。

---

## 3. 設計原則

### 3.1 共通ナレッジと個別結果を分ける

```text
Mobby共通ナレッジ
= Mobbyの説明、診断一覧、診断仕様、タイプ一覧、使い方

個別診断結果
= このLINEユーザーがどの診断で何タイプだったか

会話履歴
= 直近のLINE会話
```

これらを混ぜない。

### 3.2 Mobby共通ナレッジはGitHub管理

ナレッジ本文はVercel環境変数に入れない。  
コードまたはJSON/JSファイルとしてGitHubで管理する。

### 3.3 個別診断結果はLINE AI専用user recordへ保存

保存先は以下。

```text
line-ai/users/{userKey}.json
```

conversationには保存しない。conversationは直近履歴で切れるため。

### 3.4 PIIをLINE AI保存に混ぜない

LINE AI用user recordに保存してよいもの。

```json
{
  "source": "16love",
  "sourceLabel": "メンヘラモビー診断",
  "resultId": "xxxx",
  "resultName": "返信こないと死モビー",
  "resultSummary": "相手の反応に敏感で、不安が先に走りやすいタイプ。",
  "traits": ["恋愛メンヘラ度: Lv.6", "恋の依存度: 彼氏ガチ勢"],
  "personalResultLinked": true
}
```

保存してはいけないもの。

```text
- raw LINE userId
- メールアドレス
- 氏名
- 年齢
- 回答全文
- Google Sheet送信用payload全体
```

### 3.5 相性回答は断定しない

相性回答の言い方。

```text
OK:
診断上の相性で見ると...
会話のテンポが合いやすいのは...
お互い補いやすいのは...

NG:
絶対付き合うべき
この人なら必ずうまくいく
このタイプとは相性最悪だから関わらない方がいい
```

---

## 4. 追加・変更ファイル

### 4.1 追加予定

```text
docs/api/line-ai/_mobby-knowledge.js
docs/api/line-ai/_compatibility.js
docs/api/line-ai/link-sessions.js
docs/api/line-ai/liff-link.js
docs/line-ai/link/index.html
```

### 4.2 変更予定

```text
docs/api/line-ai/_ai.js
docs/api/line-ai/_diagnosis-knowledge.js
docs/api/line-ai/_prompts.js
docs/api/line-ai/_storage.js
docs/api/line-ai/health.js
docs/api/line-ai/webhook.js
docs/shared/line-ai-mobby-cta.js
docs/scripts/validate-line-ai-mobby.mjs
```

### 4.3 必要に応じて変更

```text
docs/16love/logic.js
docs/16stan/index.html
docs/16school/index.html
docs/16renai/index.html or assets側
```

---

## 5. Mobby共通ナレッジ仕様

### 5.1 追加ファイル

```text
docs/api/line-ai/_mobby-knowledge.js
```

### 5.2 役割

Mobbyブランド、LINE AIモビー、診断一覧、使い方などに答えるための共通ナレッジを持つ。

### 5.3 実装イメージ

```js
export const MOBBY_KNOWLEDGE = {
  brand: {
    name: "Mobby",
    description: "Mobbyは、診断コンテンツを通じて自分のキャラや傾向を楽しく知れるサービス。",
    tone: "親しみやすい、短文、少しユーモア、説教しない"
  },
  lineAi: {
    name: "モビー",
    description: "LINEで話せるMobbyのAI。診断結果や相談内容を背景に、短く自然に返す。",
    limitations: [
      "医療・法律・金融の専門判断はしない",
      "相手の気持ちを断定しない",
      "ユーザーを診断名で決めつけない"
    ]
  },
  diagnostics: {
    public: [
      "学校モビー診断",
      "推し活モビー診断",
      "メンヘラモビー診断",
      "恋愛モビー診断"
    ]
  }
};

export function buildMobbyKnowledgeContext({ message } = {}) {
  const text = String(message || "");
  if (!/Mobby|モビー|このAI|LINE.*AI|何ができる|使い方|診断/.test(text)) return "";

  return [
    "Mobby共通ナレッジ:",
    "- Mobbyは、診断コンテンツを通じて自分のキャラや傾向を楽しく知れるサービス。",
    "- LINE AIの名前は「モビー」。友達っぽく、短く、自然に返す。",
    "- 通常公開診断は、学校モビー診断、推し活モビー診断、メンヘラモビー診断、恋愛モビー診断。",
    "- 診断結果は決めつけではなく、会話の背景として扱う。"
  ].join("\n");
}

export function buildMobbyKnowledgeReply({ message } = {}) {
  const text = String(message || "");

  if (/Mobby|モビー/.test(text) && /(何|なに|誰|だれ|サービス|説明)/.test(text)) {
    return "Mobbyは、自分のキャラや傾向を楽しく知れる診断サービスだよ。LINEのモビーは、その診断結果や相談内容をもとに、短く話し相手になるAIだよ🙂";
  }

  if (/何種類|診断.*種類|診断.*一覧/.test(text)) {
    return "今の通常公開モビー診断は、学校モビー診断、推し活モビー診断、メンヘラモビー診断、恋愛モビー診断の4種類だよ。";
  }

  return "";
}
```

### 5.4 `_ai.js` への接続

`generateReply()` の最初で、固定回答できるものを返す。

```js
const mobbyKnowledgeReply = buildMobbyKnowledgeReply({ user, message });
if (mobbyKnowledgeReply) return mobbyKnowledgeReply;

const knowledgeReply = buildKnowledgeReply({ user, message });
if (knowledgeReply) return knowledgeReply;
```

順序はCodexが調整してよいが、以下を守る。

```text
- 個別診断結果質問は、保存済み結果がある場合に固定回答してよい
- 診断一覧など正確性が重要なFAQは固定回答でよい
- 雑談・相談はGeminiに渡す
```

---

## 6. 個別診断結果仕様

### 6.1 保存先

```text
line-ai/users/{userKey}.json
```

### 6.2 user record例

```json
{
  "version": 2,
  "userKey": "sha256_xxx",
  "source": "16love",
  "sourceLabel": "メンヘラモビー診断",
  "resultId": "yutsumohi",
  "resultName": "返信こないと死モビー",
  "resultSummary": "相手の反応に敏感で、不安が先に走りやすいタイプ。",
  "traits": [
    "恋愛メンヘラ度: Lv.6",
    "恋の依存度: 彼氏ガチ勢"
  ],
  "personalResultLinked": true,
  "linkedAt": "2026-05-31T00:00:00.000Z",
  "lastDiagnosisLinkedAt": "2026-05-31T00:00:00.000Z",
  "diagnosisHistory": [
    {
      "source": "16love",
      "sourceLabel": "メンヘラモビー診断",
      "resultId": "yutsumohi",
      "resultName": "返信こないと死モビー",
      "linkedAt": "2026-05-31T00:00:00.000Z"
    }
  ]
}
```

### 6.3 再診断時

基本は最新結果で上書き。  
過去結果は `diagnosisHistory` に最大5件まで保持。

### 6.4 未連携ユーザー

未連携ユーザーも通常会話できる。  
「私の診断結果は？」と聞かれたら、以下のように返す。

```text
今のLINEでは、まだあなたの診断結果は連携されていないみたい。診断結果ページからLINE連携すると、結果をふまえて話せるよ。
```

---

## 7. LIFF連携仕様

### 7.1 基本フロー

```text
診断結果ページ
  ↓
lineAiDiagnosisPayloadを作る
  ↓
POST /api/line-ai/link-sessions
  ↓
linkSessionをBlob保存
  ↓
LIFF URLへ遷移
  ↓
LIFFでLINEログイン / ID token取得
  ↓
POST /api/line-ai/liff-link
  ↓
サーバーでID token検証
  ↓
sub = LINE userId
  ↓
userKey = sha256(lineUserId + MOBBY_LINE_AI_SECRET)
  ↓
users/{userKey}.json に診断結果保存
  ↓
LINE公式アカウント追加 / トークへ誘導
```

### 7.2 `POST /api/line-ai/link-sessions`

Request:

```json
{
  "source": "16love",
  "sourceLabel": "メンヘラモビー診断",
  "resultId": "yutsumohi",
  "resultName": "返信こないと死モビー",
  "resultSummary": "相手の反応に敏感で、不安が先に走りやすいタイプ。",
  "traits": ["恋愛メンヘラ度: Lv.6", "恋の依存度: 彼氏ガチ勢"],
  "pagePath": "/16love/"
}
```

Response:

```json
{
  "ok": true,
  "sessionId": "ls_xxxxx",
  "liffUrl": "https://liff.line.me/{LIFF_ID}?s=ls_xxxxx",
  "expiresAt": "2026-05-31T00:30:00.000Z"
}
```

保存先:

```text
line-ai/link-sessions/{sessionId}.json
```

制約:

```text
- sessionIdは十分長いランダム値
- expiresAtは30分後
- consumedAtがあるsessionは再利用不可
- payload文字数を制限
- BLOB_READ_WRITE_TOKENがない本番では失敗させる
```

### 7.3 `POST /api/line-ai/liff-link`

Request:

```json
{
  "sessionId": "ls_xxxxx",
  "idToken": "eyJ..."
}
```

Server process:

```text
1. sessionIdを検証
2. link sessionをBlobから取得
3. 期限切れ / consumed済みを拒否
4. LINEのID token verify endpointで検証
5. audがLINE_LOGIN_CHANNEL_IDと一致するか確認
6. subからLINE userIdを取得
7. userKeyを作る
8. 既存user recordをload
9. 診断結果をmergeしてsave
10. link sessionをconsumedへ更新
```

Response:

```json
{
  "ok": true,
  "linked": true,
  "resultName": "返信こないと死モビー",
  "lineAddUrl": "https://line.me/R/ti/p/@020qgeko"
}
```

本番ではraw userIdを返さない。

---

## 8. Prompt仕様

### 8.1 `_prompts.js` の方針

`buildSystemPrompt(user, message)` は以下を組み立てる。

```text
1. 共通人格
2. Mobby共通ナレッジ context
3. 診断ナレッジ context
4. ユーザー個別診断結果 context
5. 返信ルール
```

### 8.2 個別診断結果context

```js
function buildPersonalDiagnosisContext(user) {
  if (!user?.personalResultLinked || !user?.resultName) return "";

  return [
    "ユーザー個別の診断結果背景:",
    `- 診断: ${user.sourceLabel || ""}`,
    `- 結果名: ${user.resultName || ""}`,
    user.resultSummary ? `- 要約: ${user.resultSummary}` : "",
    Array.isArray(user.traits) && user.traits.length
      ? `- 特徴: ${user.traits.join("、")}`
      : "",
    "扱い方:",
    "- この情報は背景としてだけ使う",
    "- ユーザーを診断名で決めつけない",
    "- 聞かれていない限り、診断名を毎回出さない",
    "- 相談の受け止め方や温度感に軽く反映する",
    "- ユーザーが自分の診断結果を聞いた場合は、この保存済み結果を答えてよい"
  ].filter(Boolean).join("\n");
}
```

### 8.3 削除・変更すべき既存ルール

既存の以下方針は、個別連携ON時は変更する。

```text
- ユーザー自身の診断結果を聞かれても、個別結果はLINEでは保持・参照しない
```

代わりに以下。

```text
- personalResultLinked=true の場合は保存済み診断結果を参照してよい
- personalResultLinked=false の場合は、診断結果ページから連携するよう案内する
```

---

## 9. 相性がいいモビー回答仕様

### 9.1 追加ファイル

```text
docs/api/line-ai/_compatibility.js
```

### 9.2 役割

ユーザーの保存済み診断結果、またはメッセージ内に出てきたタイプ名・結果名をもとに、「相性がいいモビー」を回答する。

### 9.3 対象質問

以下のような文に反応する。

```text
相性
合う
相性いい
相性がいい
相性悪い
合わない
似てる
補える
おすすめのモビー
私に合うモビー
```

### 9.4 優先順位

```text
1. メッセージ内に明示されたタイプ名があれば、そのタイプを基準にする
2. なければuser.personalResultLinkedの保存済み結果を基準にする
3. それもなければ、診断結果連携を案内する
```

未連携時の返答例。

```text
相性は見られるんだけど、今はあなたの診断結果がまだ連携されていないみたい。診断結果ページからLINE連携すると、あなたのタイプ基準で相性がいいモビーを出せるよ。
```

### 9.5 同一診断内の相性判定

まずは同一診断内で判定する。  
`_diagnosis-knowledge.js` の `DIAGNOSIS_KNOWLEDGE` にあるtypes / maleTypes / femaleTypesから候補を取る。

#### 9.5.1 type取得関数

```js
export function getTypesForSource(source) {
  const item = DIAGNOSIS_KNOWLEDGE[source];
  if (!item) return [];
  if (item.types) return item.types;
  return [...(item.maleTypes || []), ...(item.femaleTypes || [])];
}
```

#### 9.5.2 現在タイプ特定

```text
- resultId と type.code が一致
- resultName と type.name / type.displayName が一致
- メッセージ本文にtype.name / displayNameが含まれる
```

#### 9.5.3 スコアリング方針

タイプコードが4軸コードの場合、文字単位で比較する。

```text
sameCount = 同じ位置で同じ文字数
diffCount = 違う位置の文字数
```

仮スコア。

```text
同一タイプ: 70点。ただし「似ている」質問なら95点
1軸違い: 92点。近くて安心しやすい
2軸違い: 88点。違いと共通点のバランスがよい
3軸違い: 78点。刺激はあるが説明に注意
4軸違い: 72点。真逆寄り。相性というより補完型
```

基本の「相性がいい」では、同一タイプを1位にしない。  
上位候補は1〜2軸違いを優先する。

### 9.6 回答の出し方

候補は最大3件。

```text
診断上の相性で見ると、あなたに合いやすいのはこのあたりだよ。
1. ○○モビー: 近い感覚で安心しやすい
2. △△モビー: 違う部分を補いやすい
3. □□モビー: 会話のテンポが合いやすい

ただ、これは診断上の相性だから、実際は話してみた時の空気感がいちばん大事だよ🙂
```

### 9.7 「相性悪い」質問への対応

悪いと断定しない。

```text
「悪い」というより、ぶつかりやすいポイントが出やすいタイプはあるよ。
```

最大2件まで、注意点として返す。

### 9.8 Geminiに渡すか、固定返信にするか

MVPでは相性回答は**固定返信ベース**でよい。  
理由は、タイプ名・根拠の正確性を優先したいため。

ただし、返答の文体だけGeminiに任せたい場合は、以下のようなcontextをsystem promptに入れるだけにしてもよい。

Codexはまず固定返信で実装すること。

### 9.9 実装API

```js
export function isCompatibilityQuestion(message) {}
export function buildCompatibilityReply({ user, message } = {}) {}
export function findTypeReference({ user, message } = {}) {}
export function getCompatibleTypes({ source, resultId, resultName, mode }) {}
```

`_ai.js` ではGemini前に呼ぶ。

```js
const compatibilityReply = buildCompatibilityReply({ user, message });
if (compatibilityReply) return compatibilityReply;
```

呼び出し順の目安。

```text
1. safety
2. rate limit
3. personal result question reply
4. compatibility reply
5. Mobby knowledge reply
6. diagnosis knowledge reply
7. Gemini
```

既存構造との整合を見て、Codexが適切に配置する。

---

## 10. `_diagnosis-knowledge.js` の変更方針

### 10.1 `isOwnResultQuestion` の扱い

現在は「個別結果は覚えていない」固定回答になっている。  
これを以下に変更する。

```js
if (isOwnResultQuestion(text)) {
  if (user?.personalResultLinked && user?.resultName) {
    return `あなたの診断結果は「${user.resultName}」だよ。${user.resultSummary || ""} 決めつけじゃなく、話す時の背景として見るくらいがちょうどいいよ🙂`;
  }
  return "今のLINEでは、まだあなたの診断結果は連携されていないみたい。診断結果ページからLINE連携すると、結果をふまえて話せるよ。";
}
```

関数引数に `user` を渡せるようにする。

### 10.2 type検索関数をexportする

`_compatibility.js` から再利用するため、必要なら以下をexportする。

```js
export function findTypeMatches(message) {}
export function getDiagnosisTypes(source) {}
```

既存の内部関数を壊さないように注意。

---

## 11. CTA変更仕様

### 11.1 現在

`line-ai-mobby-cta.js` は `GET /api/line-ai/issue-link-token` を呼ぶだけ。

### 11.2 変更後

`data-diagnosis` がある場合は、以下を行う。

```text
1. data-diagnosisをJSON parse
2. POST /api/line-ai/link-sessions
3. 成功したらliffUrlへ遷移
4. 失敗したらLINE_ADD_URLフォールバック
```

`data-diagnosis` がない場合は、従来どおりLINE追加URLを開いてよい。

### 11.3 UI文言

連携成功前。

```text
LINEで追加すると、診断結果をふまえてモビーと話せます。
```

フォールバック時。

```text
今だけ診断結果を連携できませんでした。診断結果なしでもLINEで話せます。
```

---

## 12. health仕様

`GET /api/line-ai/health` に以下を追加。

```json
{
  "features": {
    "diagnosisKnowledge": true,
    "mobbyKnowledge": true,
    "personalResultLinking": true,
    "compatibilityReply": true,
    "liffLinking": true
  },
  "configured": {
    "lineAddUrl": true,
    "lineChannelSecret": true,
    "lineChannelAccessToken": true,
    "mobbyLineAiSecret": true,
    "geminiApiKey": true,
    "blob": true,
    "liffId": true,
    "lineLoginChannelId": true
  }
}
```

ただし、実装未完の段階で `true` にしない。実装済みかつ設定済みの時だけ `true`。

---

## 13. Vercel環境変数

### 13.1 既存で必要

```text
LINE_ADD_URL
LINE_CHANNEL_SECRET
LINE_CHANNEL_ACCESS_TOKEN
MOBBY_LINE_AI_SECRET
BLOB_READ_WRITE_TOKEN
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash-lite
GEMINI_API_KEY
```

### 13.2 LIFF連携で追加

```text
LIFF_ID
LINE_LOGIN_CHANNEL_ID
LINE_LOGIN_CHANNEL_SECRET
LINE_AI_PERSONAL_RESULT_LINKING=true
```

### 13.3 入れない

```text
MOBBY_KNOWLEDGE_TEXT
PROMPT_TEXT
DIAGNOSIS_KNOWLEDGE_JSON
```

ナレッジ本文はenvではなくGitHub管理。

---

## 14. テスト仕様

`docs/scripts/validate-line-ai-mobby.mjs` を更新する。

### 14.1 Mobby共通ナレッジ

```text
Input: モビーって何？
Expected: Mobbyまたはモビーの説明が含まれる

Input: モビー診断って何種類ある？
Expected: 4種類、学校、推し活、メンヘラ、恋愛が含まれる
```

### 14.2 個別診断結果

```text
Given: user.personalResultLinked=true, resultName="返信こないと死モビー"
Input: 私の診断結果覚えてる？
Expected: 返信こないと死モビー が含まれる
```

```text
Given: user.personalResultLinked=false
Input: 私の診断結果覚えてる？
Expected: まだ連携されていない / 診断結果ページからLINE連携 が含まれる
```

### 14.3 相性回答

```text
Given: user.source="16love", resultId=有効なタイプコード, resultName=有効なタイプ名
Input: 私と相性いいモビーは？
Expected: 相性候補が1〜3件返る
Expected: "診断上" または "遊び" など断定回避表現が含まれる
Expected: "絶対" "必ず" などが含まれない
```

```text
Input: 返信こないと死モビーと相性いいタイプは？
Expected: メッセージ内タイプ名を基準に候補を返す
```

### 14.4 Gemini prompt

Gemini mock fetchでpayloadを検査する。

```text
Given: user.personalResultLinked=true
Expected: system promptにresultName/resultSummaryが含まれる
Expected: system promptに「個別結果は保持・参照しない」が含まれない
```

### 14.5 LIFF link API

可能ならユニットテストでfetchをmockする。

```text
- link-sessions作成でsessionが保存される
- expired sessionは拒否される
- consumed sessionは拒否される
- invalid idTokenは拒否される
- valid idToken mockではuser recordが保存される
```

---

## 15. 受け入れ条件

### 15.1 共通ナレッジ

```text
ユーザー: モビーって何？
モビー: Mobbyの説明を自然に返す
```

```text
ユーザー: モビー診断って何種類ある？
モビー: 4種類を正しく返す
```

### 15.2 個別診断結果

```text
Given: LINE userに診断結果が保存されている
When: 私の診断結果覚えてる？
Then: 保存済みのresultName/resultSummaryで回答する
```

### 15.3 相性がいいモビー

```text
Given: LINE userに診断結果が保存されている
When: 私と相性いいモビーは？
Then: 保存済みタイプを基準に相性候補を最大3件返す
```

### 15.4 未連携時

```text
Given: 診断結果未連携
When: 私と相性いいモビーは？
Then: 診断結果連携が必要と案内する
```

### 15.5 安全性

```text
- raw LINE userIdを保存しない
- PIIをLINE AI user recordに保存しない
- 相性を現実の成功保証として断定しない
- 医療・法律・金融の専門判断をしない
```

---

## 16. Codex実装プロンプト

以下をCodexにそのまま渡す。

```text
あなたは shunpei1130/mobby リポジトリの実装担当です。

目的:
LINE AIモビーで以下3つを実現してください。
1. Mobby共通ナレッジに答えられる
2. LINEユーザーごとの診断結果を個別に扱える
3. 「相性がいいモビー」を診断結果ベースで回答できる

必ず読むファイル:
- docs/api/line-ai/_ai.js
- docs/api/line-ai/_diagnosis-knowledge.js
- docs/api/line-ai/_prompts.js
- docs/api/line-ai/_storage.js
- docs/api/line-ai/webhook.js
- docs/api/line-ai/health.js
- docs/api/line-ai/issue-link-token.js
- docs/shared/line-ai-mobby-cta.js
- docs/scripts/validate-line-ai-mobby.mjs
- docs/specs/line-ai-mobby-knowledge-personalization-codex-spec.md
- docs/specs/diagnosis-line-ai-liff-linking-spec.md

実装方針:
- Mobby共通ナレッジは docs/api/line-ai/_mobby-knowledge.js に追加
- 相性回答は docs/api/line-ai/_compatibility.js に追加
- 診断結果保存は line-ai/users/{userKey}.json に保存
- raw LINE userIdは保存しない
- 診断結果連携は LIFF方式を本命にする
- まず固定返信で正確性を担保し、雑談・相談はGeminiに渡す
- ナレッジ本文をVercel環境変数に入れない
- 既存のStripe/Resend/mypage/reservationには触らない

実装ステップ:
1. _mobby-knowledge.jsを追加し、buildMobbyKnowledgeReply/buildMobbyKnowledgeContextを実装
2. _compatibility.jsを追加し、buildCompatibilityReplyを実装
3. _diagnosis-knowledge.jsを必要最小限export拡張し、user付き個別結果回答に対応
4. _prompts.jsでMobbyナレッジ・診断ナレッジ・個別診断結果contextを組み立てる
5. _ai.jsでGemini前にMobbyナレッジ/診断結果/相性回答を処理
6. _storage.jsにlink session用関数を追加
7. link-sessions.js と liff-link.js を追加
8. line-ai-mobby-cta.jsでdata-diagnosisを読み、link-sessionsへPOSTする
9. health.jsにmobbyKnowledge/personalResultLinking/compatibilityReply/liffLinkingの状態を追加
10. validate-line-ai-mobby.mjsを更新し、上記機能のテストを追加

制約:
- 返信はLINE向けに短くする
- 相性回答は最大3候補
- 相性は診断上の遊びとして表現し、現実の成功保証にしない
- 保存する診断結果はsource/sourceLabel/resultId/resultName/resultSummary/traits程度に限定
- メール、名前、年齢、回答全文をLINE AI user recordに保存しない

完了条件:
- npm run validate:line-ai が通る
- 「モビーって何？」にMobby説明を返す
- 「私の診断結果覚えてる？」に保存済み結果で返す
- 「私と相性いいモビーは？」に保存済み結果を基準に候補を返す
- 未連携時は診断結果連携を案内する
- healthで実装済みfeatureが確認できる
- 既存LINE webhookの通常会話が壊れていない

PR本文には以下を含めてください。
- 変更概要
- 追加ファイル一覧
- 変更ファイル一覧
- テスト結果
- Vercelに必要な環境変数
- 未実装または今後の課題
```

---

## 17. 実装時の補足

### 17.1 Preview環境とProduction環境

現在、LINE webhookがPreview deploymentを向いている可能性がある。  
Codexは実装後、どのURLの `/api/line-ai/health` を正とするかPR本文で明記すること。

```text
Webhook URL: https://xxxxx/api/line-ai/webhook
Health URL: https://xxxxx/api/line-ai/health
```

### 17.2 issue-link-token.jsの扱い

既存互換として残してよい。  
ただし新規の診断結果連携は `link-sessions.js` を使う。

将来的には `issue-link-token.js` は `line-add-url.js` に改名するか、fallback専用にする。

### 17.3 相性ロジックの精度

MVPはコード差分ベースでよい。  
精度改善は後続で、診断ごとの明示的な compatibility map を追加する。

```js
const COMPATIBILITY_OVERRIDES = {
  "16love": {
    "yutsumohi": ["xxxx", "yyyy", "zzzz"]
  }
};
```

まずは汎用ロジックで実装すること。

---

## 18. 最初のPRスコープ

最初のPRでは、以下までを推奨する。

```text
- _mobby-knowledge.js追加
- _compatibility.js追加
- _prompts.js更新
- _ai.js更新
- _diagnosis-knowledge.js更新
- validate-line-ai-mobby.mjs更新
```

LIFFの本実装は2本目のPRでもよい。  
ただし、今回の最終ゴールはLIFFで個別診断結果連携まで行うこと。

---

## 19. 期待される会話例

### 19.1 Mobby共通ナレッジ

```text
ユーザー: モビーって何？
モビー: Mobbyは、自分のキャラや傾向を楽しく知れる診断サービスだよ。LINEのモビーは、その結果や相談をもとに短く話し相手になるAIだよ🙂
```

### 19.2 個別診断結果

```text
ユーザー: 私の診断結果覚えてる？
モビー: あなたの診断結果は「返信こないと死モビー」だよ。相手の反応に敏感で、不安が先に走りやすいタイプ。決めつけじゃなく、話す時の背景として見るくらいがちょうどいいよ🙂
```

### 19.3 相性がいいモビー

```text
ユーザー: 私と相性いいモビーは？
モビー: 診断上の相性で見ると、近い感覚で安心しやすいのは「〇〇モビー」、違いを補いやすいのは「△△モビー」あたりだよ。これは遊びとしての相性だから、実際は話した時の空気感がいちばん大事🙂
```

### 19.4 未連携時

```text
ユーザー: 私と相性いいモビーは？
モビー: 相性は見られるんだけど、今はあなたの診断結果がまだ連携されていないみたい。診断結果ページからLINE連携すると、あなたのタイプ基準で相性がいいモビーを出せるよ。
```
