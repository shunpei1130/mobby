export const GACHA_CHECKOUT_PACKAGES = {
  single: {
    pulls: 1,
    amount: 100,
    label: "Mobbyシールガチャ 6連",
    description: "Mobby シールガチャ 6連"
  },
  ten: {
    pulls: 10,
    amount: 500,
    label: "Mobbyシールガチャ 60連",
    description: "Mobby シールガチャ 60連"
  }
};

export const GACHA_STRIPE_PRICE_ENV = {
  single: "STRIPE_PRICE_ID_SEAL_GACHA_SINGLE",
  ten: "STRIPE_PRICE_ID_SEAL_GACHA_TEN"
};
