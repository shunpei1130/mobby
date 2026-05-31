# LINE AIモビー 現行仕様

**対象ブランチ:** `main`  
**更新日:** 2026-05-31  
**対象機能:** LINE公式アカウント上で、共通AIモビーが診断ナレッジと通常会話に答える

## 1. 結論

現行版では、診断結果の個人連携は行わない。LINE上のモビーは、4つの通常公開診断に関する一般ナレッジだけを持ち、ユーザー個人の診断結果は保存・参照しない。

診断結果画面のLINE導線は、`/api/line-ai/issue-link-token` から `LINE_ADD_URL` を取得してLINE公式アカウントを開く。`MB-XXXXXX` などの合言葉コード、診断payload保存、LIFF/LINE Loginによる個人結果連携は現行仕様では不採用。

## 2. 対象診断

通常公開診断は以下4種類。

| URL | 診断名 | LINEで答える内容 |
|---|---|---|
| `/16school/` | 学校モビー診断 | 40問、男女別16タイプ、学校での立ち位置や友達関係 |
| `/16stan/` | 推し活モビー診断 | 40問、16タイプ、推し活の追い方や接点 |
| `/16love/` | メンヘラモビー診断 | 40問、16タイプ、恋愛不安や返信待ち傾向 |
| `/16renai/` | 恋愛モビー診断 | 40問、16タイプ、恋愛での立ち位置や距離感 |

診断名、軸、タイプ名、短い特徴は `api/line-ai/_diagnosis-knowledge.js` を正とする。ここにない診断名やタイプ名は推測しない。

## 3. LINE応答仕様

- 安全リスクがある文面は `_safety.js` を最優先する。
- 診断の質問は `buildKnowledgeReply()` が先に deterministic に回答し、Gemini/mock の揺れを避ける。
- 「モビー診断って何種類ある？」には4診断の概要を短く返す。
- 「推し活のタイプ一覧教えて」のような質問には該当診断のタイプ一覧を返す。
- 「返信こないと死モビーってどんなタイプ？」のような既知タイプ名には、該当診断名と短い特徴を返す。
- 「私の診断結果覚えてる？」には、個人結果はLINEでは覚えていない旨を返す。
- ユーザーが結果名を送った場合だけ、そのタイプの一般的な特徴を説明できる。

## 4. API仕様

### `GET /api/line-ai/health`

本番確認用の状態を返す。

```json
{
  "features": {
    "diagnosisKnowledge": true,
    "personalResultLinking": false
  },
  "configured": {
    "lineAddUrl": true,
    "lineChannelSecret": true,
    "lineChannelAccessToken": true,
    "mobbyLineAiSecret": true,
    "geminiApiKey": false,
    "blob": true
  }
}
```

### `GET /api/line-ai/issue-link-token`

LINE追加URLだけを返す。POSTで診断payloadが来ても保存せず、トークンも発行しない。

```json
{
  "ok": true,
  "lineAddUrl": "https://line.me/R/ti/p/...",
  "firstMessageText": "モビーだよ！なんでも話してね！"
}
```

### `POST /api/line-ai/webhook`

LINE Messaging API webhookを受ける。署名検証後、LINE userIdを `MOBBY_LINE_AI_SECRET` で匿名userKey化し、会話履歴と回数制限状態を保存する。

## 5. Vercel環境変数

必須:

- `LINE_CHANNEL_SECRET`: LINE DevelopersのMessaging API Channel secret。Productionにも必ず適用する。
- `LINE_CHANNEL_ACCESS_TOKEN`: LINE返信API用のチャネルアクセストークン。
- `LINE_ADD_URL`: LINE公式アカウント追加URL。
- `MOBBY_LINE_AI_SECRET`: LINE userId匿名化用の内部secret。

推奨:

- `BLOB_READ_WRITE_TOKEN`: 会話履歴・回数制限状態をVercel Blobに永続化する。
- `AI_PROVIDER=mock`: 未設定でもmockがデフォルトだが、本番意図を明示できる。

現行では未使用:

- `LINE_OA_ID`
- `LIFF_ID`
- `LINE_LOGIN_*`
- `AI_MODEL`
- `GEMINI_API_KEY`

ただし、将来Geminiを有効化する場合は `AI_PROVIDER=gemini`、`AI_MODEL`、`GEMINI_API_KEY` を再評価する。

## 6. 運用確認

本番反映後は以下を確認する。

1. `https://www.mobby.online/api/line-ai/health` で `configured.lineChannelSecret === true`。
2. LINE DevelopersのWebhook URLが `https://www.mobby.online/api/line-ai/webhook`。
3. LINE実機で以下が期待通り返る。
   - `モビー診断って何種類ある？`
   - `推し活のタイプ一覧教えて`
   - `返信こないと死モビーってどんなタイプ？`
   - `私の診断結果覚えてる？`

期待結果は、4診断ナレッジには答える、個人結果は覚えていない、`モビー登録 MB-XXXXXX` 導線は出ないこと。
