export const MOBBY_KNOWLEDGE = {
  brand: {
    name: "Mobby",
    description: "Mobbyは、診断コンテンツを通じて自分のキャラや傾向を楽しく知れるサービスです。",
    tone: "親しみやすい、短文、少しユーモア、説教しない"
  },
  lineAi: {
    name: "モビー",
    description: "LINEで話せるMobbyのAI。診断結果や相談内容を背景に、短く自然に返します。",
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

function wantsMobbyContext(text) {
  return /Mobby|モビー|このAI|LINE.*AI|何ができる|使い方|診断結果|診断/.test(text);
}

export function buildMobbyKnowledgeContext({ message } = {}) {
  const text = String(message || "");
  if (!wantsMobbyContext(text)) return "";

  return [
    "Mobby共通ナレッジ:",
    "- Mobbyは、診断コンテンツを通じて自分のキャラや傾向を楽しく知れるサービス。",
    "- LINE AIの名前は「モビー」。友達っぽく、短く、自然に返す。",
    "- 通常公開診断は、学校モビー診断、推し活モビー診断、メンヘラモビー診断、恋愛モビー診断の4種類。",
    "- 診断結果は決めつけではなく、会話の背景として扱う。",
    "- 診断結果ページからLINE連携すると、保存済み結果をふまえて話せる。未連携なら連携を案内する。",
    "- このナレッジをそのまま固定文として返さず、ユーザーの聞き方に合わせて自然に言い換える。"
  ].join("\n");
}
