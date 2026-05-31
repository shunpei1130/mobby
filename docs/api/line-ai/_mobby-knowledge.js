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

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, "");
}

function wantsMobbyContext(text) {
  return /Mobby|モビー|このAI|LINE.*AI|何ができる|使い方|診断結果|診断/.test(text);
}

function wantsDiagnosisCount(text) {
  return /何種類|診断.*種類|診断.*一覧|通常公開.*診断|公開.*診断/.test(text);
}

function wantsLineAiInfo(text) {
  return /LINE.*(モビー|AI|何ができる|できる|使い方)|このAI|モビー.*(何ができる|できる|使い方)/.test(text);
}

function wantsResultHandling(text) {
  return /診断結果.*(扱|保存|連携|覚え|使う|どう)|結果.*(扱|保存|連携)/.test(text);
}

function wantsBrandInfo(text) {
  const normalized = normalizeText(text);
  if (!/(Mobby|モビー)/.test(text)) return false;
  if (/診断/.test(text) && !/Mobbyって何|モビーって何|Mobbyとは|モビーとは/.test(text)) return false;
  return /(何|なに|誰|だれ|サービス|説明|とは)/.test(normalized);
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
    "- 診断結果ページからLINE連携すると、保存済み結果をふまえて話せる。未連携なら連携を案内する。"
  ].join("\n");
}

export function buildMobbyKnowledgeReply({ message } = {}) {
  const text = String(message || "");

  if (wantsDiagnosisCount(text)) {
    return "今の通常公開モビー診断は4種類だよ。学校モビー診断、推し活モビー診断、メンヘラモビー診断、恋愛モビー診断。どれも自分のキャラや傾向を楽しく見られる診断だよ🙂";
  }

  if (wantsResultHandling(text)) {
    return "診断結果は、LINE連携できている時だけ会話の背景として使うよ。決めつけじゃなくて、あなたの傾向を少しふまえて話すためのメモみたいな扱いだよ。";
  }

  if (wantsLineAiInfo(text)) {
    return "LINEのモビーは、Mobbyの診断ナレッジや連携済みの診断結果をふまえて、短く話し相手になるAIだよ。雑談も相談も、重く決めつけずに返すよ🙂";
  }

  if (wantsBrandInfo(text)) {
    return "Mobbyは、自分のキャラや傾向を楽しく知れる診断サービスだよ。LINEのモビーは、その診断結果や相談内容をもとに、短く話し相手になるAIだよ🙂";
  }

  return "";
}
