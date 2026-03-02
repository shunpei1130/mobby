(() => {
  const JP_RE = /[ぁ-んァ-ヶ一-龠々〆〤]/;
  const HIRA_CODE_MAP = {
    "あ": "아", "い": "이", "う": "우", "え": "에", "お": "오",
    "か": "카", "き": "키", "く": "쿠", "け": "케", "こ": "코",
    "さ": "사", "し": "시", "す": "스", "せ": "세", "そ": "소",
    "た": "타", "ち": "치", "つ": "츠", "て": "테", "と": "토",
    "な": "나", "に": "니", "ぬ": "누", "ね": "네", "の": "노",
    "は": "하", "ひ": "히", "ふ": "후", "へ": "헤", "ほ": "호",
    "ま": "마", "み": "미", "む": "무", "め": "메", "も": "모",
    "や": "야", "ゆ": "유", "よ": "요",
    "ら": "라", "り": "리", "る": "루", "れ": "레", "ろ": "로",
    "わ": "와", "を": "오", "ん": "은",
    "が": "가", "ぎ": "기", "ぐ": "구", "げ": "게", "ご": "고",
    "ざ": "자", "じ": "지", "ず": "즈", "ぜ": "제", "ぞ": "조",
    "だ": "다", "ぢ": "지", "づ": "즈", "で": "데", "ど": "도",
    "ば": "바", "び": "비", "ぶ": "부", "べ": "베", "ぼ": "보",
    "ぱ": "파", "ぴ": "피", "ぷ": "푸", "ぺ": "페", "ぽ": "포"
  };

  const PHRASE_MAP = [
    ["結果の閲覧には登録が必要です", "결과 확인을 위해 등록이 필요합니다"],
    ["あと少しで結果が見れます！", "조금만 더 하면 결과를 볼 수 있어요!"],
    ["入力後すぐにあなたのキャラクタータイプを表示します。", "입력 후 바로 당신의 캐릭터 타입을 표시합니다."],
    ["送信される内容", "전송되는 내용"],
    ["送信中…", "전송 중..."],
    ["結果を見る", "결과 보기"],
    ["詳細を見る", "상세 보기"],
    ["詳しい説明をとじる", "자세한 설명 닫기"],
    ["学校生活のヒントを見る", "학교생활 팁 보기"],
    ["学校生活のヒントをとじる", "학교생활 팁 닫기"],
    ["回答を見直す", "답변 다시 보기"],
    ["画像なし", "이미지 없음"],
    ["全16タイプ", "총 16타입"],
    ["キャラクター一覧", "캐릭터 목록"],
    ["このキャラクターに興味がありますか？", "이 캐릭터에 관심이 있나요?"],
    ["このモビーが欲しい！", "이 모비 갖고 싶어요!"],
    ["興味を送信しました！", "관심을 전송했습니다!"],
    ["友達にも診断してもらおう！", "친구에게도 진단을 공유해요!"],
    ["診断結果を共有する", "진단 결과 공유하기"],
    ["SNS投稿用画像を保存", "SNS 업로드용 이미지 저장"],
    ["画像を読み込み中です...", "이미지를 불러오는 중입니다..."],
    ["このタイプのSNS画像は準備中です。結果画面をスクショしてストーリーに投稿してください。", "이 타입의 SNS 이미지는 준비 중입니다. 결과 화면을 캡처해서 올려주세요."],
    ["LINEで送る", "LINE으로 보내기"],
    ["Xでシェア", "X로 공유"],
    ["リンクをコピー", "링크 복사"],
    ["コピーしました！友達に送ってね", "복사되었습니다! 친구에게 보내보세요"],
    ["ママモビー診断を送ってみよう", "엄마 모비 진단을 보내보세요"],
    ["ママの学生時代の恋愛観がわかるかも！？", "엄마의 학창시절 연애 성향을 알 수 있을지도 몰라요!"],
    ["あなたの結果を送る", "내 결과 보내기"],
    ["ママが診断", "엄마가 진단"],
    ["タイプ比較", "타입 비교"],
    ["LINEでママに送る", "LINE으로 엄마에게 보내기"],
    ["ママモビー診断を開く", "엄마 모비 진단 열기"],
    ["招待文をコピー", "초대 문구 복사"],
    ["コピーしました！ママに貼り付けて送ってね", "복사되었습니다! 엄마에게 붙여넣어 보내세요"],
    ["学校生活と恋愛のヒント", "학교생활과 연애 팁"],
    ["活躍する場面", "활약하는 장면"],
    ["スタイルの特徴", "스타일 특징"],
    ["人との関わり方", "사람과의 관계 방식"],
    ["モチベーション", "동기"],
    ["恋愛の傾向", "연애 성향"],
    ["アプローチスタイル", "접근 스타일"],
    ["恋愛での雰囲気", "연애 분위기"],
    ["恋愛と友達のバランス", "연애와 친구의 균형"],
    ["恋愛で大事にしていること", "연애에서 중요하게 여기는 점"],
    ["アドバイス", "조언"],
    ["ニックネーム", "닉네임"],
    ["メールアドレス（必須）", "이메일 주소(필수)"],
    ["入力した情報を連絡・改善のために保存することに同意します。", "입력한 정보를 연락 및 서비스 개선을 위해 저장하는 데 동의합니다."],
    ["選択肢", "선택지"],
    ["タップ", "탭"],
    ["画面をタップしてスタート", "화면을 탭해서 시작"],
    ["図鑑", "도감"],
    ["推し活", "덕질"],
    ["メンヘラ", "멘헤라"],
    ["夜職", "야직"],
    ["学校", "학교"],
    ["診断", "진단"],
    ["結果", "결과"],
    ["質問", "질문"],
    ["性格", "성격"],
    ["恋愛", "연애"],
    ["友達", "친구"],
    ["共有", "공유"],
    ["保存", "저장"],
    ["画像", "이미지"],
    ["一覧", "목록"],
    ["タイプ", "타입"],
    ["年齢", "나이"],
    ["歳", "세"],
    ["無料", "무료"],
    ["抽選", "추첨"],
    ["予約", "예약"],
    ["限定", "한정"],
    ["購入", "구매"],
    ["送信", "전송"],
    ["戻る", "돌아가기"],
    ["リセット", "초기화"],
    ["お問い合わせ", "문의"],
    ["例）", "예) "],
    ["あなた", "당신"],
    ["さん", "님"]
  ];

  const REGEX_MAP = [
    [/([0-9]+)\s*歳/g, "$1세"],
    [/([0-9,]+)\s*円/g, "$1엔"],
    [/([0-9]+)\s*問/g, "$1문항"],
    [/（/g, "("],
    [/）/g, ")"],
    [/〜/g, "~"]
  ];

  const ATTRS = ["placeholder", "aria-label", "alt", "title", "data-title"];
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA"]);
  let applying = false;
  let scheduled = false;
  const NO_LOCALIZE_SELECTOR = '[data-no-localize="true"]';

  function mapHiraganaCodes(value) {
    return value.replace(/[ぁ-ん]/g, (char) => HIRA_CODE_MAP[char] || char);
  }

  function localizeText(value) {
    if (typeof value !== "string" || value.length === 0) return value;

    let text = mapHiraganaCodes(value);

    for (const [from, to] of PHRASE_MAP) {
      if (text.includes(from)) {
        text = text.split(from).join(to);
      }
    }

    for (const [pattern, replacement] of REGEX_MAP) {
      text = text.replace(pattern, replacement);
    }

    if (JP_RE.test(text)) {
      text = text.replace(/[ぁ-んァ-ヶ一-龠々〆〤]+/g, " ");
      text = text.replace(/\s{2,}/g, " ").trim();
      if (!text) {
        text = "한국어 안내 문구";
      }
    }

    return text;
  }

  function localizeHead() {
    if (document.title) {
      document.title = localizeText(document.title);
    }
    const metaSelectors = [
      'meta[name="description"]',
      'meta[name="keywords"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:site_name"]',
      'meta[name="twitter:title"]',
      'meta[name="twitter:description"]'
    ];
    document.querySelectorAll(metaSelectors.join(",")).forEach((meta) => {
      const content = meta.getAttribute("content");
      if (content && JP_RE.test(content)) {
        meta.setAttribute("content", localizeText(content));
      }
    });
  }

  function localizeAttributes(root) {
    root.querySelectorAll("*").forEach((el) => {
      if (el.closest && el.closest(NO_LOCALIZE_SELECTOR)) return;
      ATTRS.forEach((attr) => {
        const value = el.getAttribute(attr);
        if (!value || !JP_RE.test(value)) return;
        el.setAttribute(attr, localizeText(value));
      });
    });
  }

  function localizeTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node || !node.nodeValue || !JP_RE.test(node.nodeValue)) {
          return NodeFilter.FILTER_REJECT;
        }
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest && parent.closest(NO_LOCALIZE_SELECTOR)) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const targets = [];
    while (walker.nextNode()) {
      targets.push(walker.currentNode);
    }

    targets.forEach((node) => {
      const next = localizeText(node.nodeValue);
      if (next !== node.nodeValue) {
        node.nodeValue = next;
      }
    });
  }

  function localizeDocument() {
    if (applying) return;
    applying = true;
    try {
      localizeHead();
      if (document.body) {
        localizeTextNodes(document.body);
        localizeAttributes(document.body);
      }
    } finally {
      applying = false;
    }
  }

  function scheduleLocalization() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      localizeDocument();
    });
  }

  window.__koLocalizeNow = localizeDocument;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      localizeDocument();
    }, { once: true });
  } else {
    localizeDocument();
  }

  const observer = new MutationObserver(() => {
    if (applying) return;
    scheduleLocalization();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS
  });
})();
