// Status and fulfillment endpoints remain available for existing purchases.
export function retiredCheckout(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({
    code: 'STICKER_GACHA_RETIRED',
    error: 'シールガチャは提供を終了しました。購入済みの結果についてはお問い合わせください。'
  });
}
