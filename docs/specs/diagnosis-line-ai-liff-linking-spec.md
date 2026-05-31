# 診断結果連動 LINE AIモビー 本命仕様書（LINE Login / LIFF方式）

**対象ブランチ:** `main`  
**作成日:** `2026-05-31`  
**対象サイト:** Mobby診断群  
**対象機能:** 診断結果をLINE上のAIモビー会話へ個別連携する  
**推奨方式:** LINE Login / LIFFによるLINE userId照合  

---

## 1. 結論

診断結果との個別連携は、**LINE Login / LIFFで取得したLINE userIdと、Messaging API webhookで届くLINE userIdを同一Provider内で照合する方式**を本命とする。

合言葉コード方式はMVPフォールバックとしては使えるが、本命ではない。ユーザーにコード入力を求めるとLINE追加後の初回体験が重くなるため、最終的には以下の体験を目指す。

```text
診断完了
  ↓
「LINEでモビーを追加する」
  ↓
LIFFまたはLINE LoginでLINEユーザーを識別
  ↓
診断結果を匿名userKeyに保存
  ↓
LINE公式アカウントを追加
  ↓
ユーザーが話しかける
  ↓
AIモビーがその人の診断結果を背景情報として返答
```

重要な前提は、**LINE LoginチャンネルとMessaging APIチャンネルを同じLINE Developers Provider配下に置くこと**。同じProviderであれば、同じユーザーのuserIdはチャンネル種別が違っても同じ値になる。

参考:
- https://developers.line.biz/en/docs/messaging-api/getting-user-ids/
- https://developers.line.biz/en/docs/line-login/integrate-line-login/
- https://developers.line.biz/en/docs/liff/developing-liff-apps/

---

## 2. 目的

### 2.1 ユーザー体験上の目的

診断結果を出して終わりにせず、LINE上の会話で以下を実現する。

- 自分の診断結果をモビーが覚えているように感じる
- 「私のタイプってどんな感じ？」に自然に答えられる
- 恋愛、学校、推し活などの相談に、診断結果を背景として反映できる
- 診断結果の説明だけでなく、日常会話へ接続できる
- ユーザーに合言葉やコード入力を求めない

### 2.2 技術上の目的

- rawのLINE userIdを保存しない
- 既存の匿名userKey設計を維持する
- Vercel Blobにユーザー単位の診断結果と会話履歴を保存する
- 既存の `/api/line-ai/webhook` と `_storage.js` を拡張して実装する
- Geminiに渡す診断情報は最小限にする
- 診断結果を人格固定ではなく背景情報として扱う

---

## 3. 現状との差分

### 3.1 現状できていること

既存実装では、LINE userIdを `MOBBY_LINE_AI_SECRET` と組み合わせて匿名userKey化している。

```text
LINE userId
  ↓ sha256(lineUserId + MOBBY_LINE_AI_SECRET)
userKey
```

既存の会話履歴は `line-ai/conversations/{userKey}.json` に保存できる。Vercel Blobが未設定の場合は一時メモリ保存になる。

また、直近12メッセージをGeminiに渡す構造はすでにある。

### 3.2 現状できていないこと

現状の `/api/line-ai/issue-link-token` はLINE追加URLを返すだけで、診断結果payloadを保存していない。

また、`health.js` では `personalResultLinking: false` となっており、個別診断結果連携は未実装である。

### 3.3 本仕様で追加すること

- 診断結果payloadを一時保存するAPI
- LIFF画面
- LIFF/LINE LoginのID token検証
- LINE userIdからuserKeyを作り、診断結果を保存するAPI
- AIプロンプトに診断結果を背景情報として入れる処理
- 連携成功/失敗のUI
- リセット/上書き方針

---

## 4. 採用方式

### 4.1 推奨方式

**LIFFリンク画面方式**を採用する。

```text
診断ページ
  ↓
POST /api/line-ai/link-sessions
  ↓
一時linkSessionを発行
  ↓
https://liff.line.me/{LIFF_ID}?s={sessionId} を開く
  ↓
LIFF SDKでログイン状態確認
  ↓
liff.getIDToken()
  ↓
POST /api/line-ai/liff/link
  ↓
サーバー側でID tokenを検証
  ↓
sub = LINE userId を取得
  ↓
userKeyを作成
  ↓
診断結果を users/{userKey}.json に保存
  ↓
liff.requestFriendship() またはLINE追加導線
  ↓
LINEトークへ誘導
```

### 4.2 なぜLIFF方式か

- ユーザーに合言葉入力を求めない
- LINEアプリ内で完結しやすい
- ID tokenをサーバー検証できる
- 友だち追加導線を自然に出せる
- 既存のLINE webhook userIdと照合しやすい

### 4.3 LINE Login単体方式との違い

LINE Login単体でも実装可能だが、診断結果ページから外部ブラウザ・LINEアプリ・友だち追加・トーク画面への導線がやや複雑になる。

LIFF方式では、LINEアプリ内の体験として次の動作を組み込みやすい。

- `liff.init()`
- `liff.login()`
- `liff.getIDToken()`
- `liff.getFriendship()`
- `liff.requestFriendship()`
- `liff.openWindow()`

---

## 5. 前提条件

### 5.1 LINE Developers側

同じProvider配下に以下を置く。

```text
Provider: Mobby
  ├─ Messaging API channel: Mobby LINE Official Account
  └─ LINE Login channel: Mobby LIFF / Login
```

必須設定:

- Messaging APIのWebhook URLを設定する
- LINE Loginチャンネルを作成する
- LINE LoginチャンネルにLIFFアプリを追加する
- LIFF endpoint URLをMobbyのLIFFページに向ける
- LINE LoginチャンネルとLINE公式アカウントをリンクする
- LIFFのscopeに `openid` と `profile` を含める

推奨:

- メールアドレスは不要。`email` scopeは使わない
- 友だち追加促進には `requestFriendship()` を使う
- 外部ブラウザから開かれた場合は `liff.login()` を使う

### 5.2 Vercel側環境変数

既存:

```text
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_ADD_URL=
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash-lite
GEMINI_API_KEY=
MOBBY_LINE_AI_SECRET=
BLOB_READ_WRITE_TOKEN=
```

追加:

```text
LINE_LOGIN_CHANNEL_ID=
LINE_LOGIN_CHANNEL_SECRET=
LIFF_ID=
LIFF_ENDPOINT_URL=
LINE_OFFICIAL_ACCOUNT_URL=
LINE_AI_PERSONAL_RESULT_LINKING=true
```

補足:

- `LINE_LOGIN_CHANNEL_SECRET` はサーバー側だけで扱う
- `LIFF_ID` はフロントで使ってよい
- `BLOB_READ_WRITE_TOKEN` は本番必須
- `LINE_AI_PERSONAL_RESULT_LINKING` が `true` の時だけ個別連携を有効化する

---

## 6. ユーザーフロー

### 6.1 初回診断後フロー

```text
1. ユーザーが診断を完了する
2. 結果画面に「LINEでモビーを追加する」が表示される
3. ボタン押下時、診断結果payloadを /api/line-ai/link-sessions にPOSTする
4. サーバーが linkSessionId を発行してVercel Blobへ保存する
5. フロントは LIFF URL を開く
6. LIFF画面でLINEログイン状態を確認する
7. 未ログインなら liff.login() を実行する
8. liff.getIDToken() でID tokenを取得する
9. ID tokenとlinkSessionIdを /api/line-ai/liff/link にPOSTする
10. サーバーがID tokenを検証し、LINE userIdを取得する
11. userKeyを作成し、診断結果を user record に保存する
12. LIFF画面で友だち追加を促す
13. ユーザーがLINE公式アカウントを追加する
14. follow webhookが届く
15. 以後、ユーザーがLINEで話しかけると診断結果が背景情報としてAIに渡る
```

### 6.2 すでに友だち追加済みのユーザー

```text
1. 診断結果画面からLIFFを開く
2. ID token検証後、userKeyに診断結果を保存する
3. liff.getFriendship() でfriendFlag=trueを確認する
4. 「トークを開く」ボタンを表示する
5. ユーザーがトークへ戻って会話する
```

### 6.3 すでに別の診断結果が保存されているユーザー

基本方針は**最新診断結果で上書き**とする。

ただし、簡易履歴として直近3件まで `diagnosisHistory` に残してよい。

```json
{
  "resultId": "anxious_waiter",
  "resultName": "返信待ちモビー",
  "resultSummary": "相手の反応に敏感で、不安が先に走りやすいタイプ。",
  "diagnosisHistory": [
    {
      "source": "16love",
      "resultId": "anxious_waiter",
      "resultName": "返信待ちモビー",
      "linkedAt": "2026-05-31T00:00:00.000Z"
    }
  ]
}
```

AI会話では、原則として**最新の診断結果だけ**を使う。過去診断はユーザーが聞いた時だけ軽く触れる。

### 6.4 診断結果連携なしで話しかけたユーザー

既存挙動を維持する。

```text
未連携ユーザー
  ↓
userKey作成
  ↓
デフォルトユーザー作成
  ↓
通常のモビーとして返信
```

この場合、診断結果はAIに渡さない。

---

## 7. データ設計

### 7.1 link session

保存先:

```text
line-ai/link-sessions/{sessionId}.json
```

例:

```json
{
  "version": 1,
  "sessionId": "ls_7b1f4c...",
  "status": "pending",
  "source": "16love",
  "sourceLabel": "メンヘラモビー診断",
  "resultId": "anxious_waiter",
  "resultName": "返信待ちモビー",
  "resultSummary": "相手の反応に敏感で、不安が先に走りやすいタイプ。",
  "traits": ["不安になりやすい", "好きな人に集中しやすい", "安心材料を探す"],
  "pagePath": "/16love/",
  "createdAt": "2026-05-31T00:00:00.000Z",
  "expiresAt": "2026-05-31T00:30:00.000Z",
  "consumedAt": null,
  "linkedUserKey": null
}
```

制約:

- `sessionId` は128bit以上のランダム値
- 有効期限は30分
- 1回連携されたら `status=consumed` にする
- 期限切れセッションは読み込み時に無効扱い
- raw LINE userIdは保存しない

### 7.2 user record

保存先:

```text
line-ai/users/{userKey}.json
```

例:

```json
{
  "version": 2,
  "userKey": "sha256_xxx",
  "source": "16love",
  "sourceLabel": "メンヘラモビー診断",
  "resultId": "anxious_waiter",
  "resultName": "返信待ちモビー",
  "resultSummary": "相手の反応に敏感で、不安が先に走りやすいタイプ。",
  "traits": ["不安になりやすい", "好きな人に集中しやすい", "安心材料を探す"],
  "personalResultLinked": true,
  "linkedAt": "2026-05-31T00:02:00.000Z",
  "lastDiagnosisLinkedAt": "2026-05-31T00:02:00.000Z",
  "diagnosisHistory": [
    {
      "source": "16love",
      "sourceLabel": "メンヘラモビー診断",
      "resultId": "anxious_waiter",
      "resultName": "返信待ちモビー",
      "linkedAt": "2026-05-31T00:02:00.000Z"
    }
  ],
  "sourceLine": "line",
  "registeredAt": "2026-05-31T00:02:00.000Z",
  "lastMessageAt": "",
  "messageCountDate": "",
  "messageCountToday": 0
}
```

### 7.3 conversation record

既存の保存先を維持する。

```text
line-ai/conversations/{userKey}.json
```

方針:

- 直近12メッセージ保存は維持
- 長期記憶はこの仕様の対象外
- 診断結果はconversationではなくuser recordに保存する

---

## 8. API仕様

### 8.1 `POST /api/line-ai/link-sessions`

#### 役割

診断結果payloadを受け取り、一時link sessionを発行する。

#### Request

```json
{
  "source": "16love",
  "sourceLabel": "メンヘラモビー診断",
  "resultId": "anxious_waiter",
  "resultName": "返信待ちモビー",
  "resultSummary": "相手の反応に敏感で、不安が先に走りやすいタイプ。",
  "traits": ["不安になりやすい", "好きな人に集中しやすい", "安心材料を探す"],
  "pagePath": "/16love/"
}
```

#### Validation

```text
source: enum [16school, 16stan, 16love, 16renai]
sourceLabel: 1〜40文字
resultId: 1〜80文字、英数字/underscore/hyphen推奨
resultName: 1〜40文字
resultSummary: 0〜240文字
traits: 0〜6個、各1〜30文字
pagePath: 0〜120文字
```

#### Response

```json
{
  "ok": true,
  "sessionId": "ls_7b1f4c...",
  "liffUrl": "https://liff.line.me/1234567890-AbcdEfgh?s=ls_7b1f4c...",
  "expiresAt": "2026-05-31T00:30:00.000Z"
}
```

#### Error

```json
{
  "ok": false,
  "error": "Invalid diagnosis payload"
}
```

---

### 8.2 `GET /line-ai/link`

#### 役割

LIFF画面を表示する。静的HTMLでもAPI配下でもよい。

推奨配置:

```text
docs/line-ai/link/index.html
```

URL:

```text
https://mobby.jp/line-ai/link/?s={sessionId}
```

LIFF endpoint URLはこのページを指す。

#### 画面表示

初期:

```text
モビーとLINE連携中...
```

成功:

```text
診断結果をモビーに渡しました。
LINEで話しかけると、結果をふまえて返事します。
[LINEでモビーを開く]
```

失敗:

```text
連携に失敗しました。
診断ページに戻って、もう一度LINE追加ボタンを押してください。
```

---

### 8.3 `POST /api/line-ai/liff/link`

#### 役割

LIFFから送られたID tokenをサーバー側で検証し、LINE userIdと診断結果を紐づける。

#### Request

```json
{
  "sessionId": "ls_7b1f4c...",
  "idToken": "eyJhbGciOi..."
}
```

#### Server-side process

```text
1. sessionIdを検証
2. link sessionをVercel Blobから取得
3. 期限切れ・消費済みでないことを確認
4. LINEのID token検証を実行
5. audienceがLINE_LOGIN_CHANNEL_IDと一致することを確認
6. subからLINE userIdを取得
7. userKey = sha256(lineUserId + MOBBY_LINE_AI_SECRET)
8. 既存user recordをload
9. 診断結果をmergeしてsave
10. link sessionをconsumedへ更新
11. okを返す
```

#### Response

```json
{
  "ok": true,
  "linked": true,
  "userKey": "sha256_xxx",
  "resultName": "返信待ちモビー",
  "lineAddUrl": "https://lin.ee/xxxxxxxx"
}
```

`userKey` はデバッグ用に開発環境だけ返してもよい。本番では返さなくてもよい。

#### Error

```json
{
  "ok": false,
  "error": "Invalid or expired link session"
}
```

---

### 8.4 `GET /api/line-ai/health`

既存のhealthに以下を追加する。

```json
{
  "features": {
    "diagnosisKnowledge": true,
    "personalResultLinking": true,
    "liffLinking": true
  },
  "configured": {
    "lineLoginChannelId": true,
    "lineLoginChannelSecret": true,
    "liffId": true,
    "blob": true
  }
}
```

`BLOB_READ_WRITE_TOKEN` がない場合、`personalResultLinking` は本番では `false` 扱いにする。

---

## 9. 既存コードの変更方針

### 9.1 `docs/shared/line-ai-mobby-cta.js`

現状は `GET /api/line-ai/issue-link-token` でLINE追加URLを取得するだけ。

変更後は、診断結果payloadを受け取り、`POST /api/line-ai/link-sessions` を呼ぶ。

```js
window.MobbyLineAiCTA.render({
  mount: "#line-ai-mobby-cta",
  diagnosis: {
    source: "16love",
    sourceLabel: "メンヘラモビー診断",
    resultId: "anxious_waiter",
    resultName: "返信待ちモビー",
    resultSummary: "相手の反応に敏感で、不安が先に走りやすいタイプ。",
    traits: ["不安になりやすい", "好きな人に集中しやすい", "安心材料を探す"],
    pagePath: "/16love/"
  }
});
```

変更後の処理:

```text
button click
  ↓
POST /api/line-ai/link-sessions
  ↓
response.liffUrlへ遷移
```

フォールバック:

- API失敗時は既存の `LINE_ADD_URL` を表示して、診断結果連携なしで追加可能にする
- ただしUI上は「診断結果を反映できませんでした」と明示する

---

### 9.2 `docs/api/line-ai/_storage.js`

追加する関数:

```js
export function linkSessionPath(sessionId) {
  return `${PREFIX}/link-sessions/${sessionId}.json`;
}

export async function loadLinkSession(sessionId) {
  return readJson(linkSessionPath(sessionId));
}

export async function saveLinkSession(sessionId, data) {
  return writeJson(linkSessionPath(sessionId), data);
}
```

---

### 9.3 `docs/api/line-ai/webhook.js`

`ensureDefaultUser(userKey)` は既存user recordがあればそれを返すため、大きな変更は不要。

ただし、follow時の挨拶は診断結果連携済みなら少しだけ変えてよい。

```text
未連携:
モビーだよ！なんでも話してね！

連携済み:
モビーだよ！診断結果も受け取ったよ。なんでも話してね！
```

ただし、毎回診断名を強調しない。初回だけでよい。

---

### 9.4 `docs/api/line-ai/_prompts.js`

現状は `_user` をほぼ使っていない。変更後は、個別診断結果がある時だけ背景情報として入れる。

追加イメージ:

```js
function buildPersonalDiagnosisContext(user) {
  if (!user?.personalResultLinked || !user?.resultName) return "";
  return [
    "ユーザーの診断結果背景:",
    `- 診断: ${user.sourceLabel || ""}`,
    `- 結果名: ${user.resultName || ""}`,
    user.resultSummary ? `- 要約: ${user.resultSummary}` : "",
    Array.isArray(user.traits) && user.traits.length
      ? `- 特徴: ${user.traits.join("、")}`
      : "",
    "扱い方:",
    "- これは背景情報としてだけ使う",
    "- ユーザーを診断名で決めつけない",
    "- ユーザーが聞いていない限り、診断名を毎回出さない",
    "- 会話の温度感や悩みの受け止め方に軽く反映する"
  ].filter(Boolean).join("\n");
}
```

`buildSystemPrompt(user, message)` に組み込む。

---

### 9.5 `docs/api/line-ai/_ai.js`

既存の `buildSystemPrompt(user, message)` 呼び出しはそのまま使える。

変更不要の想定。

ただし、診断結果がプロンプトに入ることで入力トークンが少し増える。1ユーザーあたり数百token以内に収める。

---

## 10. AI応答仕様

### 10.1 診断結果の使い方

AIは診断結果を以下の用途で使う。

- 相談の受け止め方
- 返信の温度感
- ユーザーが自分のタイプを聞いた時の説明
- 悩みに対する観点の提示

AIは診断結果を以下の用途で使わない。

- 性格の断定
- 医療的な判断
- 恋愛相手や友人の心理の断定
- ユーザーを診断名で呼び続ける
- 毎回「あなたは◯◯タイプだから」と言う

### 10.2 返信例

ユーザー:

```text
なんか返信こないと不安になる
```

診断結果あり:

```text
それ、待ってる間に頭の中だけ先にストーリー進んじゃうやつだね。今は追いLINEより、まず「不安だから確認したい」って気持ちを少し落ち着かせよ。
```

ユーザー:

```text
私の診断結果ってどんな感じ？
```

診断結果あり:

```text
あなたは「返信待ちモビー」タイプだよ。相手の反応に敏感で、好きな人ほど安心材料を探しやすい感じ。悪いことじゃなくて、気持ちがちゃんと向いてる分、不安も強く出やすいタイプだね。
```

診断結果なし:

```text
今のLINEだけだと、あなたの診断結果までは見られない状態みたい。もう一度診断結果ページからLINE連携すると、結果をふまえて話せるよ。
```

---

## 11. セキュリティ・プライバシー仕様

### 11.1 ID token検証

フロントでdecodeしたID tokenは信用しない。

必ずサーバー側で以下を検証する。

- tokenがLINE Loginチャンネルのものか
- audienceが `LINE_LOGIN_CHANNEL_ID` と一致するか
- tokenの期限が切れていないか
- subが存在するか

実装方法:

- LINEのtoken verify endpointを使う
- またはLINE SDK/JOSEで署名検証する

MVPではLINE公式のverify endpoint利用を推奨する。

### 11.2 userIdの保存方針

raw LINE userIdは保存しない。

保存するのは既存設計と同じ匿名userKeyのみ。

```text
userKey = sha256(`${lineUserId}:${MOBBY_LINE_AI_SECRET}`)
```

### 11.3 link sessionの安全性

- sessionIdは十分長いランダム値にする
- 30分で失効
- 1回使ったらconsumed
- 別ユーザーが消費済みsessionを使えないようにする
- payloadの文字数を制限する
- HTML表示時はescapeする

### 11.4 ユーザー同意

LINE追加CTA周辺に以下の説明を入れる。

```text
LINE連携すると、あなたの診断結果をモビーとの会話に反映します。
診断結果は会話体験のために保存されます。
```

詳細リンクとしてプライバシーポリシーを置く。

### 11.5 リセット

MVPでは、ユーザーがLINEで以下を送った場合に診断結果を解除できるようにする。

```text
リセット
診断結果リセット
連携解除
```

実装:

- user recordの診断項目を削除
- `personalResultLinked=false`
- 会話履歴は残すか削除するかを選べる。MVPでは会話履歴は残す

返信:

```text
診断結果の連携をリセットしたよ。また診断結果ページから連携できるよ。
```

---

## 12. エラー・フォールバック仕様

### 12.1 link session作成失敗

原因:

- payload不正
- Blob未設定
- サーバーエラー

UI:

```text
今だけ診断結果を連携できませんでした。
診断結果なしでもLINEで話せます。
```

### 12.2 LIFFログイン失敗

UI:

```text
LINEログインに失敗しました。
もう一度開き直してください。
```

代替:

- LINE追加URLを表示
- 診断結果連携なしで使えるようにする

### 12.3 ID token検証失敗

API:

```json
{
  "ok": false,
  "error": "Invalid LINE ID token"
}
```

ログ:

```text
[LINE AI LIFF LINK] invalid id token
```

### 12.4 期限切れsession

UI:

```text
連携URLの有効期限が切れました。
診断結果ページからもう一度LINE追加ボタンを押してください。
```

### 12.5 友だち追加されなかった場合

診断結果は保存済みにしてよい。ユーザーが後から友だち追加して話しかけた時に反映される。

---

## 13. ログ・計測

保存するイベント例:

```text
line_ai_link_session_created
line_ai_liff_opened
line_ai_liff_logged_in
line_ai_personal_result_linked
line_ai_friendship_requested
line_ai_first_message_after_link
line_ai_link_failed
```

MVPではVercel Logsで十分。将来的にはGA4または独自ログに送る。

計測したいKPI:

- 診断完了数
- LINE CTAクリック率
- LIFF連携成功率
- 友だち追加率
- 初回メッセージ送信率
- 3往復以上したユーザー率
- 診断結果質問率

---

## 14. 実装ステップ

### Phase 1: 土台

- `link-sessions` storage関数を追加
- `POST /api/line-ai/link-sessions` を追加
- `POST /api/line-ai/liff/link` を追加
- LIFF用HTMLを追加
- healthに設定状況を追加

### Phase 2: フロント連携

- `line-ai-mobby-cta.js` をPOST方式へ変更
- 各診断ページからdiagnosis payloadを渡す
- 失敗時のフォールバックUIを実装

### Phase 3: AI反映

- `_prompts.js` に診断結果背景を追加
- ユーザーが診断結果を聞いた時の返答を自然にする
- 毎回診断名を出さないように制御

### Phase 4: リセット・運用

- 「診断結果リセット」コマンドを実装
- Vercel Blob必須チェック
- ログ整備
- 本番テスト

---

## 15. 受け入れ条件

### 15.1 基本連携

```text
Given: ユーザーが16love診断を完了している
When: LINE連携ボタンからLIFFを開き、LINE公式アカウントを追加する
Then: users/{userKey}.json に16loveの診断結果が保存される
```

### 15.2 LINE会話への反映

```text
Given: users/{userKey}.json に resultName が保存されている
When: ユーザーがLINEで「私のタイプは？」と送る
Then: AIモビーは保存された resultName / resultSummary を使って答える
```

### 15.3 未連携ユーザー

```text
Given: 診断結果が保存されていないLINEユーザー
When: LINEで話しかける
Then: 通常のモビーとして返信し、診断結果を作り話さない
```

### 15.4 再診断

```text
Given: 既に16loveの診断結果が保存されている
When: 同じLINEユーザーが16school診断結果から再連携する
Then: 最新の診断結果に上書きされ、過去結果はdiagnosisHistoryに残る
```

### 15.5 セッション再利用防止

```text
Given: linkSessionがconsumedになっている
When: 同じsessionIdで再度 /api/line-ai/liff/link を呼ぶ
Then: APIは失敗し、user recordを変更しない
```

### 15.6 Blob必須

```text
Given: 本番環境でBLOB_READ_WRITE_TOKENが未設定
When: /api/line-ai/link-sessions を呼ぶ
Then: APIは個別連携不可としてエラーを返す
```

---

## 16. 仕様上の判断

### 16.1 診断結果は会話履歴ではなくuser recordに保存する

理由:

- 会話履歴は直近12メッセージで切れる
- 診断結果は会話をまたいで保持したい
- AIに渡す背景情報としてuser recordの方が安定する

### 16.2 最新診断結果を優先する

理由:

- ユーザーは最新診断の気分でLINE追加する可能性が高い
- 複数診断を同時に強く反映すると会話がブレる
- 必要なら将来「学校モード」「恋愛モード」の切替に拡張できる

### 16.3 raw userIdは保存しない

理由:

- 既存設計と一致する
- reply messageにはwebhookのreplyTokenを使うためraw userId保存は不要
- 将来push配信する場合だけ別途同意設計を追加する

### 16.4 合言葉コードは本命にしない

理由:

- ユーザーの初回体験が重い
- コード入力ミスが起きる
- TikTok流入時に離脱しやすい

ただし、LIFF連携失敗時のデバッグ用・運用フォールバックとして残す価値はある。

---

## 17. 将来拡張

### 17.1 複数診断モード

ユーザーが複数診断を連携した場合、以下のように切り替え可能にする。

```text
恋愛の相談 → 16love / 16renai の結果を優先
学校の相談 → 16school の結果を優先
推し活の相談 → 16stan の結果を優先
雑談 → 最新診断を薄く反映
```

### 17.2 長期メモリー

会話履歴とは別に、要約memoryを持つ。

```json
{
  "memorySummary": "恋愛相談が多く、返信遅延に不安を感じやすい。強い断定より安心できる整理を好む。"
}
```

MVPでは対象外。

### 17.3 Push通知

将来、能動的なメッセージを送る場合はraw userId保存が必要になる。

その場合は以下が必要。

- 明確な同意
- 配信停止導線
- raw userIdの保存・削除方針
- 利用目的の明記

MVPでは対象外。

---

## 18. 変更対象ファイル一覧

追加:

```text
docs/api/line-ai/link-sessions.js
docs/api/line-ai/liff-link.js
docs/line-ai/link/index.html
```

変更:

```text
docs/shared/line-ai-mobby-cta.js
docs/api/line-ai/_storage.js
docs/api/line-ai/_prompts.js
docs/api/line-ai/webhook.js
docs/api/line-ai/health.js
```

任意:

```text
docs/api/line-ai/issue-link-token.js
```

`issue-link-token.js` は旧導線互換として残す。新規導線は `link-sessions.js` を使う。

---

## 19. 最初に実装すべき最小セット

最短で本命仕様を動かすなら、以下だけでよい。

```text
1. LINE Login channel + LIFF appを同Providerに作る
2. BLOB_READ_WRITE_TOKENを本番に設定する
3. POST /api/line-ai/link-sessions を作る
4. LIFF画面を作る
5. POST /api/line-ai/liff/link を作る
6. user recordに診断結果を保存する
7. _prompts.jsでuser.resultName等を背景情報として入れる
8. 16loveなど1診断だけでE2Eテストする
9. 問題なければ全診断に広げる
```

最初のE2Eテスト対象は `/16love/` がよい。相談文脈が強く、診断結果連携の価値が最も見えやすい。

---

## 20. 完了定義

本仕様の完了条件は以下。

- 診断結果ページからLIFF連携できる
- 同じLINEユーザーのuserKeyに診断結果が保存される
- LINEで「私のタイプは？」と聞くと保存済みの診断結果で答える
- 診断結果を聞かれていない通常会話では、診断名を出しすぎない
- Vercel再デプロイ後も診断結果が消えない
- 未連携ユーザーも通常会話できる
- 連携失敗時にLINE追加だけは継続できる
- healthで `personalResultLinking: true` が確認できる
