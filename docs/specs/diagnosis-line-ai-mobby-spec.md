# LINE AIモビー 現行仕様

**対象ブランチ:** `main`  
**更新日:** 2026-05-31  
**対象機能:** LINE公式アカウント上で、共通AIモビーが診断ナレッジと通常会話に答える

## 1. 結論

現行版では、LINE/LIFF連携済みユーザーの保存済み診断結果を参照できる。未連携ユーザーには、4つの通常公開診断に関する一般ナレッジをもとに回答する。

診断結果画面のLINE導線は、`/api/line-ai/issue-link-token` でLINE公式アカウント追加情報を取得し、連携が有効な場合は `link-sessions` と `liff-link` で個人診断結果を匿名userKeyに紐づける。

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
- レート制限に達した場合は固定文で返す。
- 診断、Mobby、個別結果、相性の質問は固定回答にせず、関連ナレッジをsystem promptへ入れてGeminiが毎回自然文を生成する。
- 「モビー診断って何種類ある？」には4診断の概要ナレッジを使って答える。
- 「推し活のタイプ一覧教えて」のような質問には該当診断のタイプ一覧ナレッジを使って答える。
- 「返信こないと死モビーってどんなタイプ？」のような既知タイプ名には、該当診断名と短い特徴ナレッジを使って答える。
- 「私の診断結果覚えてる？」には、連携済みなら保存済み結果、未連携なら診断結果ページからLINE連携できることを自然に案内する。

## 4. API仕様

### `GET /api/line-ai/health`

本番確認用の状態を返す。

```json
{
  "features": {
    "diagnosisKnowledge": true,
    "mobbyKnowledge": true,
    "aiGeneratedKnowledgeReplies": true,
    "personalResultReference": true,
    "personalResultLinking": true,
    "compatibilityReply": true,
    "liffLinking": true
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
- `AI_PROVIDER=gemini`: 診断ナレッジ回答もAI生成にする本番設定。
- `AI_MODEL`: Geminiモデル名。未指定時は `gemini-2.5-flash-lite`。
- `GEMINI_API_KEY`: Gemini APIキー。

連携を有効にする場合:

- `LIFF_ID`
- `LINE_LOGIN_*`

## 6. 運用確認

本番反映後は以下を確認する。

1. `https://www.mobby.online/api/line-ai/health` で `configured.lineChannelSecret === true`。
2. LINE DevelopersのWebhook URLが `https://www.mobby.online/api/line-ai/webhook`。
3. LINE実機で以下が期待通り返る。
   - `モビー診断って何種類ある？`
   - `推し活のタイプ一覧教えて`
   - `返信こないと死モビーってどんなタイプ？`
   - `私の診断結果覚えてる？`

期待結果は、4診断ナレッジ・個人結果・相性回答が固定文ではなくAI生成の自然文で返り、`モビー登録 MB-XXXXXX` 導線は出ないこと。
