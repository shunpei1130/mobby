# Mobby seal gacha production setup

This checklist captures the production settings required by the paid seal gacha LINE delivery flow. Do not commit real secrets here; put secret values in Vercel environment variables only.

## Vercel environment variables

Set these on the `mobby` Vercel project for Production. Use Preview too when testing PR deployments.

```text
LINE_LOGIN_CHANNEL_ID=2010241086
LINE_CHANNEL_ACCESS_TOKEN=<LINE Messaging API channel access token>
GACHA_LINE_LINK_SECRET=<long random secret>

R2_ACCOUNT_ID=<Cloudflare account ID>
R2_ACCESS_KEY_ID=<R2 API token access key ID>
R2_SECRET_ACCESS_KEY=<R2 API token secret access key>
R2_BUCKET_NAME=mobby-gacha-results
R2_PUBLIC_BASE_URL=https://pub-f89832a5567b46d2818d3109cb2a3965.r2.dev

STRIPE_SECRET_KEY=<Stripe secret key>
STRIPE_PUBLISHABLE_KEY=<Stripe publishable key>
STRIPE_GACHA_WEBHOOK_SECRET=<Stripe webhook signing secret>

STRIPE_PRICE_ID_SEAL_GACHA_SINGLE=price_1Tl6KyHycYytLGskW8dxyL2A
STRIPE_PRICE_ID_SEAL_GACHA_TEN=price_1Tl6LYHycYytLGskYEUAfu6r

GACHA_LINE_DELIVERY_DELAY_SECONDS=120
```

Optional:

```text
CRON_SECRET=<long random secret>
```

Leave `CRON_SECRET` unset for the current Vercel Cron setup unless the cron caller is changed to send an `Authorization: Bearer <secret>` header.

## LINE Developers

LINE Login channel LIFF app:

```text
LIFF ID: 2010241086-zi2RBQek
Endpoint URL: https://www.mobby.online/gacha/line-link.html
Size: Full
Scopes: openid profile
Add friend option: On (Aggressive)
Scan QR: Off
Module mode: Off
```

Messaging API channel:

```text
Bot basic ID: @445rjfet
Friend add URL: https://lin.ee/pNFlqJ6
```

Copy the Messaging API channel access token into `LINE_CHANNEL_ACCESS_TOKEN`.

## Cloudflare R2

Bucket:

```text
mobby-gacha-results
```

Public Development URL:

```text
https://pub-f89832a5567b46d2818d3109cb2a3965.r2.dev
```

Create an R2 API token with Object Read & Write access scoped to `mobby-gacha-results`, then set `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in Vercel.

Recommended lifecycle rules:

```text
Prefix: result-images/
Action: Expire objects
Days: 14

Prefix: draw-records/
Action: Expire objects
Days: 30

Prefix: line-queue/
Action: Expire objects
Days: 30
```

For stable production media URLs, switch `R2_PUBLIC_BASE_URL` to `https://cdn.mobby.online` only after the Cloudflare R2 custom domain is configured.

## Stripe

Price IDs:

```text
6連: STRIPE_PRICE_ID_SEAL_GACHA_SINGLE=price_1Tl6KyHycYytLGskW8dxyL2A
60連: STRIPE_PRICE_ID_SEAL_GACHA_TEN=price_1Tl6LYHycYytLGskYEUAfu6r
```

Webhook endpoint:

```text
https://www.mobby.online/api/gacha-stripe-webhook
```

Events:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
```

Copy the webhook signing secret into `STRIPE_GACHA_WEBHOOK_SECRET`.

## Vercel Cron

`docs/vercel.json` must contain:

```text
/api/gacha-line-delivery-cron
* * * * *
```

After deployment, confirm the Cron Job appears in the Vercel project settings. If the current Vercel plan cannot run this schedule, move the queue processor to Cloudflare Workers Cron.

## Production verification

Run the check in this order after production deploy and environment setup:

```text
1. Open https://www.mobby.online/gacha/line-link.html inside LINE.
2. Complete LINE login and friend-add confirmation.
3. Return to the gacha purchase page.
4. Buy 6連 through Stripe.
5. Confirm the post-payment spin page opens.
6. Confirm the gacha animation runs.
7. Confirm the fixed result image is shown.
8. Confirm R2 receives result-images/, draw-records/, and line-queue/ objects.
9. Confirm LINE receives the image about 2 minutes after payment.
10. Buy 60連 and confirm 10 result images are delivered across split LINE push requests.
```
