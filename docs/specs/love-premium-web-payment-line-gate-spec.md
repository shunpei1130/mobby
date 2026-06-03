# 恋愛特化モビー Web決済・LINE追加ゲート仕様書 / Codex指示

**作成日:** 2026-06-03  
**対象リポジトリ:** `shunpei1130/mobby`  
**対象:** Web決済、課金済みユーザー限定の恋愛特化LINE追加導線、恋愛プレミアムLINE bot  
**想定商品名:** モビー恋愛プレミアム  
**初期価格:** 月額980円（税込想定。最終価格はStripe Priceで管理）  

---

## 0. Codexへの最初の指示

この仕様書を読んだら、いきなり大規模リファクタしないこと。  
既存の無料LINE AIモビー、診断結果連携、診断ページ、`mobby-custom`、法務ページを壊さないこと。

最初に読む既存ファイルは以下。

```text
docs/package.json
docs/vercel.json
docs/api/line-ai/_ai.js
docs/api/line-ai/_prompts.js
docs/api/line-ai/_storage.js
docs/api/line-ai/_line.js
docs/api/line-ai/_rate-limit.js
docs/api/line-ai/_safety.js
docs/api/line-ai/health.js
docs/api/line-ai/issue-link-token.js
docs/api/line-ai/link-sessions.js
docs/api/line-ai/liff-link.js
docs/api/line-ai/webhook.js
docs/line-ai/link/index.html
docs/shared/line-ai-mobby-cta.js
docs/legal/terms.html
docs/legal/privacy.html
docs/legal/tokusho.html
```

やってはいけないこと。

```text
- Stripe Secret Key、Webhook Secret、LINE Channel Secret、LINE Channel Access Token、LIFF Secretをコードに書かない
- 恋愛プレミアムのLINE追加URLを公開APIでそのまま返さない
- 恋愛プレミアムのLINE追加URLをHTML/JSに直書きしない
- 既存の /api/line-ai/issue-link-token を恋愛プレミアム用に流用しない
- 既存の無料LINE AIモビーを課金必須に変更しない
- raw LINE userIdを保存しない
- カード情報を保存しない。カード情報はStripe Checkoutに任せる
- 返金、解約、更新日、月額料金の表示を曖昧にしない
- 未成年ユーザーに保護者同意なしの有料登録を促さない
- 恋愛成就、相手の気持ち、復縁成功を保証しない
- 監視、脅し、過度な依存、ストーカー的行動を助長しない
```

重要な前提。

```text
LINE追加URLを完全に秘密にすることはできない。
一度課金ユーザーが追加URLを見れば、共有される可能性がある。
したがって「追加画面への遷移ゲート」だけでなく、恋愛プレミアムLINE webhook側で毎回 entitlement を確認すること。
未課金ユーザーがURL共有で恋愛特化LINEを追加しても、プレミアム回答を返さない設計にする。
```

---

## 1. 現在の実装認識

### 1.1 リポジトリ・配信構成

現在の実体は主に `docs/` 配下にある。  
`docs/package.json` は `mobby-site` という静的サイト寄りの構成で、依存は以下が中心。

```text
@vercel/blob
dotenv
resend
@mediapipe/tasks-vision
esbuild
sharp
```

現時点で `stripe` パッケージは入っていない。

`docs/vercel.json` では以下のようなrewriteがある。

```text
/terms       -> /legal/terms.html
/privacy     -> /legal/privacy.html
/tokusho     -> /legal/tokusho.html
/company     -> /legal/company.html
/16school/... -> /16school/index.html
/((?!api|.*\..*).*) -> /index.html
```

新規ページをきれいなURLで出す場合は、catch-allより前に明示rewriteを足すこと。

追加予定の明示rewrite例。

```json
{ "source": "/love-premium", "destination": "/love-premium/index.html" },
{ "source": "/love-premium/success", "destination": "/love-premium/success.html" },
{ "source": "/love-premium/link", "destination": "/love-premium/link/index.html" }
```

### 1.2 既存の無料LINE AIモビー

既存のLINE AIモビーは `docs/api/line-ai/` 配下にある。

現在の主な仕様。

```text
- webhookはPOSTのみ受ける
- bodyParser=falseでraw bodyを読む
- x-line-signatureをLINE_CHANNEL_SECRETで検証する
- LINE userIdは MOBBY_LINE_AI_SECRET で sha256 userKey化する
- user recordは line-ai/users/{userKey}.json
- conversationは line-ai/conversations/{userKey}.json
- 会話履歴は直近12メッセージ
- LINE follow時はdefault userを作成し、挨拶を返す
- text messageは既読化、safety判定、rate limit、AI返信、保存、LINE replyの順
- image messageは画像内容を見られない旨を返す
- AI_PROVIDER=gemini の時だけGeminiを使い、それ以外はmock
- デフォルトGemini modelは gemini-2.5-flash-lite
- デフォルトmax output tokensは700
- デフォルトtemperatureは0.7
```

現在のナレッジ構造。

```text
_mobby-knowledge.js
  Mobby共通ナレッジ

_diagnosis-knowledge.js
  学校モビー診断
  推し活モビー診断
  メンヘラモビー診断
  恋愛モビー診断

_compatibility.js
  診断タイプ同士の相性文脈

_prompts.js
  共通人格、Mobbyナレッジ、診断ナレッジ、相性、個別診断結果、表示名文脈を統合
```

### 1.3 既存の診断結果連携

既存の診断結果連携は以下の流れ。

```text
診断結果ページ
  ↓
docs/shared/line-ai-mobby-cta.js
  ↓
POST /api/line-ai/link-sessions
  ↓
line-ai/link-sessions/{sessionId}.json に保存
  ↓
LIFF URLへ遷移
  ↓
docs/line-ai/link/index.html
  ↓
LIFFログイン / ID token取得
  ↓
POST /api/line-ai/liff-link
  ↓
LINE ID tokenをLINE verify endpointで検証
  ↓
subを userKey化
  ↓
line-ai/users/{userKey}.json に診断結果保存
  ↓
LINE_ADD_URLへ誘導
```

`link-sessions.js` と `liff-link.js` は以下の環境変数を要求する。

```text
LINE_AI_PERSONAL_RESULT_LINKING=true
LIFF_ID
LINE_LOGIN_CHANNEL_ID
LINE_LOGIN_CHANNEL_SECRET
LINE_ADD_URL
MOBBY_LINE_AI_SECRET
BLOB_READ_WRITE_TOKEN 本番では必須
```

### 1.4 既存の公開LINE追加API

`docs/api/line-ai/issue-link-token.js` は名前にtokenがあるが、現状は実際にはtokenを発行していない。  
`LINE_ADD_URL` を返すだけの公開APIである。

```json
{
  "ok": true,
  "lineAddUrl": "...",
  "firstMessageText": "モビーだよ！「私の診断結果は？」って聞いてみてね！"
}
```

これは無料LINE AIモビー用としては許容する。  
ただし、恋愛プレミアムではこの構造を絶対に使わない。

### 1.5 既存CTAの注意点

`docs/shared/line-ai-mobby-cta.js` は、診断payloadがあれば `POST /api/line-ai/link-sessions` を試す。  
失敗時は `allowDiagnosisFallback` により `/api/line-ai/issue-link-token` へフォールバックし、診断結果なしでもLINE追加できる。

恋愛プレミアムではフォールバック追加を禁止する。  
支払い未完了、LIFF連携失敗、token期限切れの場合は追加URLを返さず、購入ページまたは再連携へ戻す。

### 1.6 既存法務ページ

現在の `tokusho.html` はカメラ型キーホルダー、Mobby Outfit向けの表記で、恋愛プレミアムの月額課金には対応していない。  
`terms.html` も予約フォームや一般サービス向けで、AI相談・月額サブスク・解約・未成年・安全対応の条項が不足している。  
`privacy.html` は診断データや匿名加工情報の記載はあるが、Stripe、LINE連携、AI会話データ、月額課金管理の記載を追加する必要がある。

---

## 2. 今回作るもの

### 2.1 商品

```text
商品名: モビー恋愛プレミアム
価格: 月額980円から開始
決済: Webサイト内のStripe Checkout
提供場所: 課金者専用の恋愛特化LINE公式アカウント
主価値: 好きな人とのLINE返信、脈あり整理、告白前相談、追いLINE判断、別れそうな時の整理
```

占い単体は作らない。  
毎朝の恋愛占いは将来、恋愛プレミアムの継続率改善コンテンツとして追加する。

### 2.2 決済方針

LINE公式アカウントメンバーシップではなく、Web決済を使う。  
理由は手数料を抑えるため。

```text
LINEメンバーシップ: Web決済10%、App内課金35%
Stripe国内カード: 3.6% / 成功取引
```

月額課金はStripe Checkoutの `mode=subscription` を使う。  
カード情報は保存しない。CheckoutとBillingに任せる。

### 2.3 LINEアカウント方針

恋愛プレミアムは、既存の無料LINE AIモビーとは別のLINE公式アカウント・別Messaging API channelにする。

```text
無料LINE AIモビー:
  docs/api/line-ai/webhook.js
  LINE_CHANNEL_SECRET
  LINE_CHANNEL_ACCESS_TOKEN
  MOBBY_LINE_AI_SECRET

恋愛プレミアムLINE:
  docs/api/line-love/webhook.js
  LINE_LOVE_CHANNEL_SECRET
  LINE_LOVE_CHANNEL_ACCESS_TOKEN
  MOBBY_LINE_LOVE_SECRET
```

理由。

```text
- 無料ユーザーと有料ユーザーの体験を明確に分ける
- premium追加URLが漏れても、webhook側で未課金ユーザーを止めやすい
- プロンプト、モデル、rate limit、運用通知を分離しやすい
```

---

## 3. 目標ユーザーフロー

### 3.1 正常系

```text
1. ユーザーが /love-premium を開く
2. 月額980円、更新、解約、未成年同意を確認する
3. 「Webで決済して恋愛モビーを追加する」を押す
4. POST /api/love-premium/create-checkout-session
5. Stripe Checkoutへ遷移
6. 決済成功
7. /love-premium/success?session_id={CHECKOUT_SESSION_ID} へ戻る
8. GET /api/love-premium/checkout-status?session_id=...
9. サーバーがStripeでCheckout SessionとSubscriptionを検証
10. paidSessionIdを発行
11. /love-premium/link?ps={paidSessionId} へ進む
12. LIFFログインでLINE ID tokenを取得
13. POST /api/love-premium/liff-link
14. サーバーがLINE ID tokenを検証
15. LINE userIdを userKey化し、Stripe subscriptionと紐づける
16. one-time add tokenを発行
17. 「恋愛モビーをLINEで追加する」ボタンを表示
18. GET /api/love-premium/open-line?token=...
19. サーバーがtokenとsubscriptionを再検証
20. 302で LOVE_PREMIUM_LINE_ADD_URL へ遷移
21. ユーザーが恋愛プレミアムLINEを追加
22. follow eventで /api/line-love/webhook.js が userKeyを作る
23. entitlement activeなら恋愛プレミアムの挨拶を返す
```

### 3.2 共有URL・直追加の対策

```text
1. 未課金ユーザーが何らかの方法で恋愛プレミアムLINEを追加
2. follow eventで userKeyを作る
3. love-premium/users/{userKey}.json を確認
4. active entitlementがない
5. プレミアム回答を返さず、購入ページを案内する
```

返答例。

```text
ここは恋愛プレミアム専用のモビーだよ。
Webで登録したあとにLINE連携すると、このアカウントで相談できるよ。
登録ページはこちら: https://www.mobby.online/love-premium
```

---

## 4. データ設計

### 4.1 保存先

MVPでは、既存構成に合わせてVercel Blobを使う。  
ただし、現在の `_storage.js` は `access: "public"` で保存しているため、恋愛プレミアムでは保存データを最小化する。  
raw LINE userId、メールアドレス、会話全文、カード情報は保存しない。

本番でユーザー数が増えたら、Supabase、Neon、Firestore、またはVercel KVへ移行すること。

### 4.2 Prefix

```text
love-premium/paid-sessions/{paidSessionId}.json
love-premium/add-sessions/{addTokenHash}.json
love-premium/users/{userKey}.json
love-premium/subscriptions/{subscriptionId}.json
love-premium/customers/{stripeCustomerId}.json
love-premium/conversations/{userKey}.json
love-premium/usage/{userKey}/{yyyy-mm}.json
```

### 4.3 paid session

Stripe決済成功後、LINE連携前に発行する短期セッション。

```json
{
  "version": 1,
  "paidSessionId": "ps_xxxxx",
  "stripeCheckoutSessionId": "cs_xxx",
  "stripeCustomerId": "cus_xxx",
  "stripeSubscriptionId": "sub_xxx",
  "planId": "love_980_v1",
  "status": "active",
  "createdAt": "2026-06-03T00:00:00.000Z",
  "expiresAt": "2026-06-03T00:30:00.000Z",
  "lineLinkedAt": null,
  "consumedAt": null
}
```

制約。

```text
- TTLは30分
- session_idだけで何度もLINE追加URLを出さない
- Stripeで毎回subscription状態を再確認する
```

### 4.4 premium user entitlement

LINE userKeyとStripe subscriptionを紐づける。

```json
{
  "version": 1,
  "userKey": "sha256_xxx",
  "stripeCustomerId": "cus_xxx",
  "stripeSubscriptionId": "sub_xxx",
  "planId": "love_980_v1",
  "status": "active",
  "currentPeriodEnd": "2026-07-03T00:00:00.000Z",
  "cancelAtPeriodEnd": false,
  "lineLinkedAt": "2026-06-03T00:00:00.000Z",
  "lastEntitlementSyncAt": "2026-06-03T00:00:00.000Z",
  "messageCountDate": "2026-06-03",
  "messageCountToday": 0,
  "deepCountMonth": "2026-06",
  "deepCountThisMonth": 0
}
```

保存しないもの。

```text
- raw LINE userId
- Stripeのカード情報
- メールアドレスの生値
- 氏名
- 年齢
- 恋愛相談本文の長期保存
- スクショ画像
```

必要なら保存してよいもの。

```text
- stripeCustomerId
- stripeSubscriptionId
- status
- currentPeriodEnd
- cancelAtPeriodEnd
- userKey
- hashed email ただしMVPでは不要
```

### 4.5 add token

LINE追加URLへ302するための短期token。  
raw tokenは保存しない。sha256 hashで保存する。

```json
{
  "version": 1,
  "tokenHash": "sha256_xxx",
  "userKey": "sha256_xxx",
  "stripeSubscriptionId": "sub_xxx",
  "createdAt": "2026-06-03T00:00:00.000Z",
  "expiresAt": "2026-06-03T00:15:00.000Z",
  "consumedAt": null
}
```

制約。

```text
- TTLは15分
- one-timeを基本にする
- 期限切れなら410
- consumed済みなら409
- token不正なら403
- レスポンスJSONにLOVE_PREMIUM_LINE_ADD_URLを返さない
- 成功時は302 redirectだけ
```

---

## 5. API仕様

### 5.1 `POST /api/love-premium/create-checkout-session`

役割。  
Stripe Checkout Sessionを作る。

Request。

```json
{
  "planId": "love_980_v1",
  "ageConfirmed": true,
  "guardianConsentConfirmed": true,
  "returnPath": "/love-premium"
}
```

Validation。

```text
- planIdは許可済みのみ
- ageConfirmed=true 必須
- 未成年向け表記として guardianConsentConfirmed=true を必須にする
- Origin / Referer は同一ドメインのみ許可
- Content-Type application/json のみ
```

Stripe Checkout作成方針。

```js
mode: "subscription"
line_items: [{ price: process.env.STRIPE_LOVE_PREMIUM_PRICE_ID, quantity: 1 }]
success_url: `${SITE_URL}/love-premium/success?session_id={CHECKOUT_SESSION_ID}`
cancel_url: `${SITE_URL}/love-premium?canceled=1`
metadata: {
  product: "love-premium",
  planId: "love_980_v1"
}
subscription_data: {
  metadata: {
    product: "love-premium",
    planId: "love_980_v1"
  }
}
```

Response。

```json
{
  "ok": true,
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

### 5.2 `GET /api/love-premium/checkout-status?session_id=cs_xxx`

役割。  
決済成功ページから呼び、Stripe上のCheckout SessionとSubscriptionを検証する。

検証。

```text
- session_idがcs_で始まること
- Stripe APIでSessionを取得
- Session metadata.product == love-premium
- mode == subscription
- payment_status == paid または subscriptionがactive/trialing
- subscriptionのPrice IDがSTRIPE_LOVE_PREMIUM_PRICE_IDと一致
```

Response。

```json
{
  "ok": true,
  "paid": true,
  "paidSessionId": "ps_xxxxx",
  "linkUrl": "/love-premium/link?ps=ps_xxxxx",
  "subscriptionStatus": "active"
}
```

注意。

```text
- LOVE_PREMIUM_LINE_ADD_URLは返さない
- paid=falseの場合はlinkUrlを返さない
```

### 5.3 `GET /api/love-premium/config`

役割。  
LIFFページに公開してよい設定だけ返す。

Response。

```json
{
  "ok": true,
  "liffId": "..."
}
```

返してはいけないもの。

```text
- LINE login channel secret
- LINE追加URL
- Stripe secret
- webhook secret
```

### 5.4 `POST /api/love-premium/liff-link`

役割。  
決済済みセッションとLINE userIdを紐づける。

Request。

```json
{
  "paidSessionId": "ps_xxxxx",
  "idToken": "eyJ..."
}
```

Server process。

```text
1. paidSessionId形式を検証
2. paid sessionをBlobから取得
3. expiresAt切れを拒否
4. Stripe subscriptionを再取得し、active/trialingか確認
5. LINE ID tokenを https://api.line.me/oauth2/v2.1/verify で検証
6. audがLINE_LOVE_LOGIN_CHANNEL_IDと一致するか確認
7. subを取得
8. userKey = sha256(`${lineUserId}:${MOBBY_LINE_LOVE_SECRET}`)
9. love-premium/users/{userKey}.json を保存/更新
10. paid sessionにlineLinkedAtを保存
11. one-time add tokenを作る
12. tokenHashだけ保存
```

Response。

```json
{
  "ok": true,
  "linked": true,
  "openLineUrl": "/api/love-premium/open-line?token=lat_xxxxx",
  "subscriptionStatus": "active"
}
```

### 5.5 `GET /api/love-premium/open-line?token=lat_xxx`

役割。  
課金・連携済みユーザーだけを恋愛プレミアムLINE追加画面へ遷移させる。

Server process。

```text
1. token形式を検証
2. tokenHashを作る
3. love-premium/add-sessions/{tokenHash}.json を取得
4. 期限切れ、consumed済みを拒否
5. userKeyのentitlementを取得
6. Stripe subscriptionを必要に応じて再確認
7. active/trialingならtokenをconsumedへ更新
8. 302 Location: LOVE_PREMIUM_LINE_ADD_URL
```

Response。

```text
302 redirect 成功
400 token missing
403 invalid token
409 token consumed
410 token expired
402 subscription inactive
```

重要。

```text
- JSONでLINE追加URLを返さない
- エラー時もLINE追加URLを返さない
- no-storeを付ける
```

### 5.6 `POST /api/love-premium/stripe-webhook`

役割。  
Stripeをsource of truthとしてsubscription状態を同期する。

必須。

```text
- bodyParser=false
- raw bodyでstripe.webhooks.constructEventを使う
- STRIPE_WEBHOOK_SECRET必須
```

対応event。

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed
invoice.payment_action_required
```

状態反映。

```text
active / trialing:
  premium利用可

past_due:
  MVPでは利用不可。将来48時間graceを検討

canceled / unpaid / incomplete_expired:
  premium利用不可
```

### 5.7 `GET /api/love-premium/health`

役割。  
設定確認。

Response例。

```json
{
  "ok": true,
  "service": "love-premium",
  "configured": {
    "stripeSecretKey": true,
    "stripeWebhookSecret": true,
    "stripePriceId": true,
    "lovePremiumLineAddUrl": true,
    "lineLoveChannelSecret": true,
    "lineLoveChannelAccessToken": true,
    "lovePremiumLiffId": true,
    "lineLoveLoginChannelId": true,
    "lineLoveLoginChannelSecret": true,
    "mobbyLineLoveSecret": true,
    "blob": true
  }
}
```

---

## 6. 恋愛プレミアムLINE webhook仕様

### 6.1 追加endpoint

```text
docs/api/line-love/webhook.js
```

既存 `line-ai/webhook.js` を直接編集しない。  
共通化できる関数だけ慎重に再利用する。

### 6.2 webhook処理

```text
1. POST以外は405
2. raw bodyを読む
3. LINE_LOVE_CHANNEL_SECRETでx-line-signature検証
4. eventごとに処理
5. source.userIdがなければ無視
6. userKey = sha256(`${lineUserId}:${MOBBY_LINE_LOVE_SECRET}`)
7. love-premium/users/{userKey}.json を取得
8. entitlementがactive/trialingでなければ購入案内を返す
9. activeなら恋愛プレミアムAIへ渡す
10. conversationを love-premium/conversations/{userKey}.json に直近12件だけ保存
11. rate limitを更新
12. reply APIで返す
```

### 6.3 follow時の返信

activeの場合。

```text
恋愛プレミアムのモビーだよ。
好きな人とのLINE、脈あり整理、告白前の相談、追いLINEするか迷った時、ここで一緒に見よ。
まずは今の状況を1つだけ教えてね。
```

inactiveの場合。

```text
ここは恋愛プレミアム専用のモビーだよ。
Webで登録してLINE連携すると、このアカウントで相談できるよ。
登録はこちら: https://www.mobby.online/love-premium
```

### 6.4 プレミアムAI人格

基本人格。

```text
- 名前はモビー
- 恋愛相談に強い
- 友達っぽいが、無責任に煽らない
- 優しいだけでなく、本質を言う
- 相手の気持ちは断定しない
- ユーザーの尊厳と安全を優先する
- LINE返信文は具体的に出す
- 相談内容が重い時は短く受け止め、安全な行動に戻す
```

回答カテゴリ。

```text
- LINE返信作成
- 脈あり/脈なし整理
- 告白前相談
- 追いLINE判断
- 復縁/別れそうな時の整理
- 友達には言いにくい恋バナ
- 自己肯定感が落ちている時の整理
```

禁止。

```text
- 既読監視、位置情報確認、SNS監視を勧める
- 相手を脅す/試す/嫉妬させるための悪質な文面を作る
- 成人と未成年の不適切な関係を肯定する
- 性的な未成年コンテンツに踏み込む
- 自傷、OD、暴力を軽く扱う
- 「絶対付き合える」「相手はあなたを好き」と断定する
```

### 6.5 モデル・コスト制御

MVPでは既存のGemini構成を参考にする。  
ただし、将来OpenAI等に切り替えやすいようにproviderを分離する。

環境変数例。

```text
LOVE_AI_PROVIDER=gemini
LOVE_AI_MODEL=gemini-2.5-flash-lite
LOVE_AI_MAX_OUTPUT_TOKENS=900
LOVE_AI_TEMPERATURE=0.7
LOVE_PREMIUM_DAILY_REPLY_LIMIT=80
LOVE_PREMIUM_MONTHLY_DEEP_LIMIT=20
```

無制限にはしない。  
課金ユーザーでも、1日あたりのreply上限と月あたりのdeep回答上限を持たせる。

初期実装は以下でよい。

```text
通常返信: 1日80回まで
深掘り回答: 月20回まで。ただしMVPではintent判定なしで未実装でも可
全体保護: 環境変数 LOVE_PREMIUM_DAILY_TOTAL_LIMIT を持つ
```

---

## 7. フロントエンド仕様

### 7.1 追加ページ

```text
docs/love-premium/index.html
docs/love-premium/success.html
docs/love-premium/link/index.html
docs/shared/love-premium-checkout.js
```

### 7.2 Landing page `/love-premium`

表示内容。

```text
- 商品名: モビー恋愛プレミアム
- 月額980円
- 自動更新であること
- いつでも解約可能であること
- 次回更新日・解約方法はStripeカスタマーポータルで確認できること
- 未成年は保護者同意が必要であること
- AIの回答は恋愛の成功を保証しないこと
- 緊急・危険・自傷・暴力・性被害は専門窓口や身近な大人へ相談すること
- 利用規約、プライバシーポリシー、特商法表記へのリンク
```

CTA前チェック。

```text
[ ] 月額980円の自動更新であることを確認しました
[ ] 解約方法を確認しました
[ ] 未成年の場合、保護者の同意を得ています
[ ] AIの回答が恋愛の成功を保証しないことを理解しました
```

### 7.3 Success page `/love-premium/success`

処理。

```text
1. URLからsession_id取得
2. session_idがなければエラー
3. GET /api/love-premium/checkout-status?session_id=...
4. paid=trueなら /love-premium/link?ps=... へのボタンを表示
5. paid=falseなら問い合わせ/再決済導線を表示
```

表示。

```text
決済を確認しました。
次にLINE連携をすると、恋愛プレミアムのモビーを追加できます。
```

### 7.4 LIFF link page `/love-premium/link`

既存 `docs/line-ai/link/index.html` の構造を参考にする。  
ただし、診断連携ではなく「決済済みsubscriptionとLINE userKeyの連携」を目的にする。

処理。

```text
1. URLから ps を取得
2. GET /api/love-premium/config で liffId取得
3. liff.init
4. 未ログインならliff.login
5. idToken取得
6. POST /api/love-premium/liff-link
7. openLineUrlを取得
8. 「恋愛モビーをLINEで追加する」ボタンを表示
```

注意。

```text
- TikTok/Instagram等のin-app browserではSafari/Chrome誘導を出す
- openLineUrlは /api/love-premium/open-line?token=... のみ
- LOVE_PREMIUM_LINE_ADD_URLはDOMに出さない
```

---

## 8. 環境変数

既存LINE AIはそのまま。

```text
LINE_CHANNEL_SECRET
LINE_CHANNEL_ACCESS_TOKEN
MOBBY_LINE_AI_SECRET
LINE_ADD_URL
AI_PROVIDER
AI_MODEL
GEMINI_API_KEY
BLOB_READ_WRITE_TOKEN
LIFF_ID
LINE_LOGIN_CHANNEL_ID
LINE_LOGIN_CHANNEL_SECRET
LINE_AI_PERSONAL_RESULT_LINKING
```

恋愛プレミアムで追加。

```text
SITE_URL=https://www.mobby.online

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_LOVE_PREMIUM_PRICE_ID=price_...
STRIPE_CUSTOMER_PORTAL_RETURN_URL=https://www.mobby.online/love-premium

LOVE_PREMIUM_PLAN_ID=love_980_v1
LOVE_PREMIUM_PRICE_JPY=980
LOVE_PREMIUM_LINE_ADD_URL=https://line.me/R/ti/p/...

LINE_LOVE_CHANNEL_SECRET=...
LINE_LOVE_CHANNEL_ACCESS_TOKEN=...
MOBBY_LINE_LOVE_SECRET=...

LOVE_PREMIUM_LIFF_ID=...
LINE_LOVE_LOGIN_CHANNEL_ID=...
LINE_LOVE_LOGIN_CHANNEL_SECRET=...

LOVE_AI_PROVIDER=gemini
LOVE_AI_MODEL=gemini-2.5-flash-lite
LOVE_AI_MAX_OUTPUT_TOKENS=900
LOVE_AI_TEMPERATURE=0.7
LOVE_PREMIUM_DAILY_REPLY_LIMIT=80
LOVE_PREMIUM_DAILY_TOTAL_LIMIT=10000
LOVE_PREMIUM_MONTHLY_DEEP_LIMIT=20
```

---

## 9. 追加・変更ファイル

### 9.1 追加

```text
docs/specs/love-premium-web-payment-line-gate-spec.md

docs/love-premium/index.html
docs/love-premium/success.html
docs/love-premium/link/index.html
docs/shared/love-premium-checkout.js

docs/api/love-premium/_storage.js
docs/api/love-premium/_stripe.js
docs/api/love-premium/_line-login.js
docs/api/love-premium/_tokens.js
docs/api/love-premium/_entitlements.js
docs/api/love-premium/create-checkout-session.js
docs/api/love-premium/checkout-status.js
docs/api/love-premium/config.js
docs/api/love-premium/liff-link.js
docs/api/love-premium/open-line.js
docs/api/love-premium/stripe-webhook.js
docs/api/love-premium/health.js

docs/api/line-love/_ai.js
docs/api/line-love/_prompts.js
docs/api/line-love/_storage.js
docs/api/line-love/_rate-limit.js
docs/api/line-love/webhook.js
```

### 9.2 変更

```text
docs/package.json
docs/package-lock.json
docs/vercel.json
docs/legal/terms.html
docs/legal/privacy.html
docs/legal/tokusho.html
```

### 9.3 package変更

`docs/package.json` に追加。

```json
{
  "dependencies": {
    "stripe": "^18.0.0"
  }
}
```

バージョンは実装時点で最新安定版を確認して入れること。

---

## 10. セキュリティ仕様

### 10.1 CORS

恋愛プレミアムAPIは原則same-originのみ。  
既存 `line-ai` のように `Access-Control-Allow-Origin: *` を安易にコピーしない。

許可。

```text
Originなし: Stripe webhook、LINE webhookなど必要なものだけ
Origin=https://www.mobby.online: Web API
Origin=preview domain: preview環境のみ許可
```

### 10.2 Stripe

```text
- Webhookは必ず署名検証
- Checkout Sessionはsuccess pageのsession_idだけを信用しない
- Stripe APIで毎回取得して確認する
- Price ID一致を確認する
- metadata.product == love-premium を確認する
- サブスクstatusをsource of truthにする
```

### 10.3 LINE

```text
- webhookはLINE signatureを検証する
- LIFF idTokenはLINE verify endpointで検証する
- audが期待channel idか確認する
- raw LINE userIdは保存しない
- userKeyは無料LINEとは別secretで作る
```

### 10.4 LINE追加URL漏洩対策

```text
- LOVE_PREMIUM_LINE_ADD_URLはenvのみ
- HTML/JSに直書きしない
- JSON APIで返さない
- /api/love-premium/open-line の302だけで使う
- それでも漏洩は起きる前提で、/api/line-love/webhook.js でentitlementを毎回確認する
```

### 10.5 ログ

ログに出してよい。

```text
- event type
- status
- userKeyの先頭8文字程度
- subscription status
```

ログに出してはいけない。

```text
- raw LINE userId
- LINE ID token
- Stripe secret
- Webhook secret
- LINE access token
- 相談本文全文
- メールアドレス
```

---

## 11. 法務・表示仕様

### 11.1 特商法表記

`tokusho.html` に恋愛プレミアムを追加する。

必要項目。

```text
- 商品名: モビー恋愛プレミアム
- 販売価格: 月額980円（税込）
- 商品代金以外の必要料金: 通信料、決済手数料はユーザー負担なし等
- 支払方法: クレジットカード、Apple Pay、Link等Stripe Checkout上で利用可能な方法
- 支払時期: 申込時および毎月の更新日に自動決済
- 提供時期: 決済完了後、LINE連携後すぐ
- 解約方法: Stripeカスタマーポータルまたは問い合わせ
- 返品・キャンセル: デジタルサービスの性質上、決済後の返金は原則不可。ただし法令上必要な場合を除く
- 未成年: 未成年は保護者の同意が必要
```

### 11.2 利用規約

`terms.html` に追加する。

```text
- 月額サブスクリプション条項
- 自動更新
- 解約
- 返金
- 未成年の保護者同意
- AI回答の限界
- 恋愛成就を保証しない
- 医療・法律・心理専門判断ではない
- 安全上の介入
- 禁止事項: 監視、脅し、嫌がらせ、なりすまし、未成年に不適切な性的利用など
```

### 11.3 プライバシーポリシー

`privacy.html` に追加する。

```text
- Stripeによる決済情報処理
- Stripe customer/subscription IDの保存
- LINE ID token検証
- raw LINE userIdを保存せず、ハッシュ化したuserKeyで管理すること
- AI会話履歴を直近範囲で保存すること
- AI providerへ相談文が送信されること
- 安全対応、問い合わせ、利用停止に必要な範囲でデータを扱うこと
```

---

## 12. QA / 受け入れ条件

### 12.1 決済

```text
- 未チェック状態ではCheckoutへ進めない
- Checkout success後、Stripe上でactive/trialingでなければLINE連携へ進めない
- session_idを改ざんすると拒否される
- 別Price IDのsessionは拒否される
- Stripe webhook署名が不正なら拒否される
```

### 12.2 LINE追加ゲート

```text
- 未決済ではLOVE_PREMIUM_LINE_ADD_URLを取得できない
- 決済済みでもLIFF連携前はLINE追加URLへ進めない
- add token期限切れは410
- add token再利用は409
- open-line成功時だけ302でLINE追加画面へ遷移する
- APIレスポンスJSONにはLINE追加URLが含まれない
```

### 12.3 プレミアムLINE

```text
- active userのfollowではプレミアム挨拶を返す
- inactive userのfollowでは購入ページ案内だけ返す
- inactive userのmessageではプレミアムAIを呼ばない
- active userのmessageでは恋愛プレミアムAIを呼ぶ
- 1日のreply上限を超えるとrate limit文を返す
```

### 12.4 安全

```text
- 自傷語句には安全返信
- 暴力語句には安全返信
- 監視/脅し/過度依存の相談には助長しない返信
- 画像/スクショの内容確認を求められたら、文字で説明するよう案内
```

### 12.5 法務

```text
- /terms に月額サブスク条項がある
- /privacy にStripe/LINE/AI会話データの記載がある
- /tokusho に恋愛プレミアムの販売条件がある
- Checkout前に価格、自動更新、解約方法、未成年同意が表示される
```

---

## 13. 実装順序

```text
1. docs/package.json にstripeを追加
2. docs/vercel.json に /love-premium 系rewriteを追加
3. /love-premium landing / success / link の静的ページを追加
4. /api/love-premium/create-checkout-session を追加
5. /api/love-premium/stripe-webhook を追加
6. /api/love-premium/checkout-status を追加
7. paid session storageを追加
8. /api/love-premium/config と /api/love-premium/liff-link を追加
9. /api/love-premium/open-line を追加
10. /api/line-love/webhook を追加
11. 恋愛プレミアムpromptとrate limitを追加
12. 法務ページを更新
13. health endpointで本番設定を確認
14. Stripe test modeでcheckout / webhook / cancellationを確認
15. LINE test accountでfollow / message / direct add bypassを確認
```

---

## 14. 初期リリースでやらないこと

```text
- 毎朝の占いpush配信
- 複数プラン
- 年額プラン
- 追加チケット課金
- 管理画面
- 相談履歴の長期メモリー
- 画像/スクショ読取
- 友達招待割引
```

上記は売上検証後に追加する。

---

## 15. 初期リリース後の改善候補

```text
- 毎朝の恋愛占いpush
- 本質回答チケット
- LINE返信文3案生成
- 相談相手ごとのメモリー
- Stripe Customer Portal導線
- 解約前アンケート
- 未課金premium LINE追加者への再決済導線
- 決済成功からLINE追加完了までのCVR計測
```

---

## 16. 参考リンク

```text
Stripe Pricing Japan:
https://stripe.com/jp/pricing

Stripe Checkout Session API:
https://docs.stripe.com/api/checkout/sessions/create

LINE公式アカウント メンバーシップ:
https://www.lycbiz.com/jp/service/line-official-account/Membership/

LINE LIFF docs:
https://developers.line.biz/ja/docs/liff/developing-liff-apps/

LINE ID token verify:
https://developers.line.biz/ja/reference/line-login/#verify-id-token
```
