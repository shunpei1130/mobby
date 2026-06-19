(() => {
  const STORAGE_KEY = "love_mobby_diag_v1";
  const DIAGNOSIS_URL = "https://www.mobby.online/16renai/";
  const TYPE_CODES = ["HLTO", "HLTC", "HLAO", "HLAC", "HFTO", "HFTC", "HFAO", "HFAC", "SLTO", "SLTC", "SLAO", "SLAC", "SFTO", "SFTC", "SFAO", "SFAC"];
  const TYPE_META = {
    HLTO: { name: "花束の主人公", tone: "素直な主役感", motif: "花束", key: ["SLTO", "HLAO", "SFAO", "HLTC", "SFTO", "SLAC"] },
    HLTC: { name: "秘密の星", tone: "静かな特別感", motif: "星のチャーム", key: ["SLTC", "HLAC", "HFTC", "HFAC", "SFAC", "HLAO"] },
    HLAO: { name: "ひなたの愛され人", tone: "やわらかな安心", motif: "ハートチャーム", key: ["SLAO", "HLTO", "HFAO", "SLAC", "SFAC", "HFTO"] },
    HLAC: { name: "雨宿りの待ち人", tone: "待つ強さ", motif: "折りたたみ傘", key: ["SLAC", "HFAC", "SFAC", "HLAO", "SLTC", "HFTO"] },
    HFTO: { name: "風まかせの小悪魔", tone: "軽やかな自由", motif: "リボン", key: ["SFTO", "SFAO", "SLTO", "HFAO", "HFTC", "HLTO"] },
    HFTC: { name: "月影のミューズ", tone: "余白の色気", motif: "三日月チャーム", key: ["SFTC", "HLTC", "SFAC", "HFAO", "HLTO", "SLTC"] },
    HFAO: { name: "晴れ間の本命", tone: "自然体の本命感", motif: "青い花", key: ["SFAO", "SFTO", "HLAO", "HLTC", "SFAC", "HFTO"] },
    HFAC: { name: "静かな灯", tone: "落ち着いた灯り", motif: "小さな灯り", key: ["SFAC", "SLAC", "HLAC", "HFAO", "SFTC", "SLTC"] },
    SLTO: { name: "恋に旗を振る人", tone: "前向きな応援", motif: "ハートの旗", key: ["HLTO", "HFTO", "SFTO", "SLAO", "HLAO", "SFAO"] },
    SLTC: { name: "胸奥のロマン", tone: "深いロマン", motif: "封をした手紙", key: ["HLTC", "HFTC", "SLAC", "SFAC", "HLAC", "SLAO"] },
    SLAO: { name: "陽だまりを分ける人", tone: "分け合うぬくもり", motif: "花かご", key: ["HLAO", "HLTO", "SFAO", "SLAC", "HFAO", "SFAC"] },
    SLAC: { name: "毛布をかける守り人", tone: "守るやさしさ", motif: "毛布", key: ["HLAC", "HFAC", "SLAO", "SFAC", "SLTC", "HLAO"] },
    SFTO: { name: "地図を広げる冒険家", tone: "動き出す勇気", motif: "地図", key: ["HFTO", "HFAO", "SLTO", "SFAO", "SFTC", "HLTO"] },
    SFTC: { name: "夜風のロマンチスト", tone: "距離感のロマン", motif: "夜のしおり", key: ["HFTC", "SFAC", "HLTC", "SFTO", "HFAC", "SLTC"] },
    SFAO: { name: "余白を飾る演出家", tone: "自然体のセンス", motif: "飾りリボン", key: ["HFAO", "HFTO", "SLAO", "SFTO", "HLTO", "SFAC"] },
    SFAC: { name: "静かな港の相棒", tone: "穏やかな信頼", motif: "港のチャーム", key: ["HFAC", "HLAO", "SLAC", "SFTC", "HFTC", "HFAO"] }
  };
  const MONTH_NAMES = ["はじまりの恋みくじ", "バレンタイン恋予報", "別れと出会いの恋便り", "新しい距離感診断", "本命力チェック", "雨の日の恋占い", "夏のときめき予報", "夜風の恋占い", "余白を整える恋便り", "秘密の恋ハロウィン", "ぬくもり恋予報", "今年の恋まとめ"];
  const MONTH_THEMES = ["今年の恋の置き場所を決める月", "気持ちを渡す形を選ぶ月", "過去をやさしく畳んで次へ進む月", "初対面と再会の空気を整える月", "自然体の魅力を信じ直す月", "待つ恋と動く恋の境目を選ぶ月", "少し大胆に恋を動かす月", "余白と距離感を味方にする月", "心のスペースを取り戻す月", "見せる顔と隠す本音を楽しむ月", "安心できる関係を育てる月", "記憶を整理し、来年の恋に持っていく月"];
  const MONTHLY_THEME_OVERRIDES = {
    HLTO: "ちゃんと見つけてもらう勇気を取り戻す月",
    HLTC: "誰にも見せなかった気持ちに、小さな出口を作る月",
    HLAO: "自然体のぬくもりを、ちゃんと特別に扱う月",
    HLAC: "待つ恋から、自分を守る恋へ進む月",
    HFTO: "自由なまま、ちゃんと特別を残す月",
    HFTC: "近づきすぎずに、余韻で心を動かす月",
    HFAO: "無理をしない明るさが、信頼に変わる月",
    HFAC: "見えにくい優しさを、少しだけ形にする月",
    SLTO: "応援するだけでなく、自分も前に出る月",
    SLTC: "秘めた想いを、重さではなく深さとして扱う月",
    SLAO: "与える優しさと、受け取る愛のバランスを整える月",
    SLAC: "守るだけでなく、自分も守られることを許す月",
    SFTO: "新しい景色に進みながら、気持ちを置いていかない月",
    SFTC: "近づきすぎない優しさに、少しだけ温度を足す月",
    SFAO: "整えすぎた本音に、少しだけ隙間を作る月",
    SFAC: "変わらない安心を、恋の温度として受け取る月"
  };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const image = (meta) => `./image/lovemobby/${encodeURIComponent(`${meta.name}.webp`)}`;
  const resultState = () => {
    try {
      const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const code = state?.resultCode || state?.result?.resultCode || "";
      return TYPE_META[code] ? code : "";
    } catch {
      return "";
    }
  };
  const DAILY_FORTUNES = window.LOVE_MOBBY_DAILY_FORTUNES_31 || {};
  const DETAIL_FORTUNE_DATA = window.LOVE_MOBBY_FORTUNE_DATA_NEW || {};
  const dayIndex = (date = new Date()) => (date.getDate() - 1) % 31;
  const weekIndex = (date = new Date()) => {
    const start = new Date(date.getFullYear(), 0, 1);
    const diffDays = Math.floor((new Date(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000);
    return Math.floor(diffDays / 7) % 8;
  };
  const monthPatternIndex = (date = new Date()) => ((date.getFullYear() * 12) + date.getMonth()) % 15;
  const dailyFortune = (code, date = new Date()) => {
    const meta = TYPE_META[code] || TYPE_META.HLTO;
    const index = dayIndex(date);
    const dailyData = DAILY_FORTUNES[code]?.[index];
    if (dailyData) {
      const keyCode = dailyData.keyPerson?.code || meta.key[index % meta.key.length];
      const keyMeta = TYPE_META[keyCode] || { name: dailyData.keyPerson?.name || "" };
      return {
        day: dailyData.day || index + 1,
        typeCode: code,
        typeName: meta.name,
        mood: dailyData.mood,
        score: dailyData.score,
        theme: dailyData.theme,
        message: dailyData.message,
        mission: dailyData.mission,
        keyPerson: {
          code: keyCode,
          name: dailyData.keyPerson?.name || keyMeta.name,
          role: dailyData.keyPerson?.text || "今日の流れに視点をくれるかも"
        },
        luckyItem: dailyData.luckyItem,
        shareText: dailyData.shareText
      };
    }
    const keyCode = meta.key[index % meta.key.length];
    const keyMeta = TYPE_META[keyCode];
    const score = 70 + ((TYPE_CODES.indexOf(code) * 7 + index * 5) % 24);
    const fallbackTheme = `${meta.name}の恋を整える日`;
    return {
      day: index + 1,
      typeCode: code,
      typeName: meta.name,
      mood: `${meta.name}は、今日は${meta.tone}を少しだけ外へ出せる状態。焦って答えを出すより、今の気持ちを整えるほど恋の流れが見えやすくなります。`,
      score,
      theme: fallbackTheme,
      message: `${fallbackTheme}です。${meta.name}らしさは、急に強く出すよりも小さな合図で伝えるほうが届きやすい日。相手の反応を決めつけず、あなたの温度をひとつだけ丁寧に置いてみて。`,
      mission: "短い本音をひとつだけ言葉にする",
      keyPerson: {
        code: keyCode,
        name: keyMeta.name,
        role: ["背中を押してくれるかも", "気持ちをやわらかく受け止めてくれるかも", "視点を変えてくれるかも", "流れを変えてくれるかもしれない人"][index % 4]
      },
      luckyItem: meta.motif,
      shareText: `今日の私のキーパーソン、「${keyMeta.name}」らしい。あなた何タイプか診断してみて。`
    };
  };
  const monthlyFortune = (code, date = new Date()) => {
    const meta = TYPE_META[code] || TYPE_META.HLTO;
    const monthIndex = date.getMonth();
    const keyCode = meta.key[(monthIndex + 1) % meta.key.length];
    const keyMeta = TYPE_META[keyCode];
    const base = TYPE_CODES.indexOf(code) + 1;
    const moveDays = [((base + monthIndex * 2) % 27) + 1, ((base * 2 + monthIndex + 6) % 27) + 1, ((base * 3 + monthIndex + 13) % 27) + 1].sort((a, b) => a - b);
    const cautionDay = ((base + monthIndex * 4 + 10) % 27) + 1;
    const monthlyTheme = MONTHLY_THEME_OVERRIDES[code] || MONTH_THEMES[monthIndex];
    return {
      month: monthIndex + 1,
      monthlyTitle: MONTH_NAMES[monthIndex],
      monthlyTheme,
      monthlyState: `${meta.name}は今月、${meta.tone}を抱えたまま次の一歩を待っています。大きく変えるより、週に一度だけ自分の本音を記録すると流れが整います。`,
      score: 72 + ((base * 5 + monthIndex * 3) % 22),
      moveDays,
      cautionDay,
      cautionText: "考えすぎるより、少し間を置いてから返すほうが気持ちが伝わりやすい日。",
      monthlyMission: `${monthlyTheme}に合わせて、週に1回だけ「今の自分の本音」を短くメモする。`,
      keyPerson: {
        code: keyCode,
        name: keyMeta.name,
        role: "今月、流れを変えてくれるかもしれない人"
      },
      luckyItem: meta.motif,
      saveCardText: `今月の${meta.name}は、${meta.tone}を信じて少しずつ進む。急がなくても、恋の流れは整っていく。`,
      shareText: `私の今月のキーパーソン、「${keyMeta.name}」だった。あなた何タイプか診断してみて。`
    };
  };
  const detailFortunes = (code, date = new Date()) => {
    const meta = TYPE_META[code] || TYPE_META.HLTO;
    const daily = DETAIL_FORTUNE_DATA.daily?.[code]?.[dayIndex(date)] || dailyFortune(code, date);
    const weekly = DETAIL_FORTUNE_DATA.weekly?.[code]?.[weekIndex(date)] || {};
    const monthly = DETAIL_FORTUNE_DATA.monthly?.[code]?.[monthPatternIndex(date)] || {};
    const normalizePerson = (person, fallbackCode) => {
      const codeValue = person?.code || fallbackCode || meta.key[0];
      const fallback = TYPE_META[codeValue] || TYPE_META[meta.key[0]];
      return {
        code: codeValue,
        name: person?.name || fallback?.name || "",
        role: person?.text || "恋の流れに別の視点をくれるかも"
      };
    };
    return {
      daily: {
        ...daily,
        typeCode: code,
        typeName: meta.name,
        keyPerson: normalizePerson(daily.keyPerson, meta.key[0])
      },
      weekly: {
        ...weekly,
        typeCode: code,
        typeName: meta.name,
        keyPerson: normalizePerson(weekly.keyPerson, meta.key[1])
      },
      monthly: {
        ...monthly,
        typeCode: code,
        typeName: meta.name,
        monthlyTheme: monthly.theme,
        monthlyState: monthly.mode,
        luckyItem: monthly.luckyAction,
        keyPerson: normalizePerson(monthly.compatibleType, meta.key[2]),
        saveCardText: monthly.closingMessage
      }
    };
  };
  const shareUrl = (fortune, campaign) => `${DIAGNOSIS_URL}?utm_source=fortune_share&utm_medium=social&utm_campaign=${campaign}&fromType=${encodeURIComponent(fortune.typeCode || "")}&keyPerson=${encodeURIComponent(fortune.keyPerson.code)}`;
  const share = async (text, url) => {
    const payload = `${text}\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {}
    }
    await navigator.clipboard?.writeText(payload);
    alert("共有文と診断リンクをコピーしました。");
  };
  /**
   * @typedef {Object} FortuneDetailSection
   * @property {string} id
   * @property {string} title
   * @property {string} description
   * @property {{ heading: string; body: string; }[]} items
   */
  const detailSections = (code, daily, weekly, monthly) => {
    const meta = TYPE_META[code] || TYPE_META.HLTO;
    const keyMeta = TYPE_META[daily.keyPerson.code] || TYPE_META[meta.key[0]] || TYPE_META.HLTO;
    /** @type {FortuneDetailSection[]} */
    return [
      {
        id: "today",
        title: "今日の恋愛モビー占い",
        description: "今日の状態、連絡の温度、小さくできる行動を確認できます。",
        items: [
          { heading: "今日の恋愛テーマ", body: daily.theme },
          { heading: "今日のあなたの状態", body: daily.mood },
          { heading: "今日やるといいこと", body: daily.mission },
          { heading: "今日のメッセージ", body: daily.message },
          { heading: "ラッキーアイテム", body: daily.luckyItem },
          { heading: "キーパーソンになりそうなタイプ", body: `${daily.keyPerson.name}。${daily.keyPerson.role}。` },
          { heading: "今日の一言", body: daily.shareText }
        ]
      },
      {
        id: "week",
        title: "今週の恋愛作戦",
        description: "一週間の恋の流れと、関係別の動き方をまとめて見られます。",
        items: [
          { heading: "今週のテーマ", body: weekly.theme },
          { heading: "今週のあなたに起きやすいこと", body: weekly.state },
          { heading: "恋が進みやすいポイント", body: weekly.progressPoint },
          { heading: "すれ違いやすいポイント", body: weekly.misreadPoint },
          { heading: "片思いの人へ", body: weekly.singleAdvice },
          { heading: "恋人がいる人へ", body: weekly.partnerAdvice },
          { heading: "曖昧な関係の人へ", body: weekly.ambiguousAdvice },
          { heading: "今週の小さなミッション", body: weekly.mission },
          { heading: "今週のラッキー行動", body: weekly.luckyAction },
          { heading: "今週のキーパーソン", body: weekly.keyPerson.name },
          { heading: "今週の締めメッセージ", body: weekly.closingMessage }
        ]
      },
      {
        id: "month",
        title: "今月の恋愛運",
        description: "月初・月中・月末の流れと、状況別の恋愛運を確認できます。",
        items: [
          { heading: "今月の恋愛テーマ", body: monthly.monthlyTheme },
          { heading: "今月のあなたの恋愛モード", body: monthly.monthlyState },
          { heading: "月初の流れ", body: monthly.earlyFlow },
          { heading: "月中の流れ", body: monthly.middleFlow },
          { heading: "月末の流れ", body: monthly.lateFlow },
          { heading: "出会い運", body: monthly.encounterLuck },
          { heading: "片思い運", body: monthly.singleLuck },
          { heading: "恋人運", body: monthly.partnerLuck },
          { heading: "曖昧な関係の進展運", body: monthly.ambiguousLuck },
          { heading: "注意したいこと", body: monthly.caution },
          { heading: "今月のチャンスアクション", body: monthly.chanceAction },
          { heading: "今月相性が上がるタイプ", body: monthly.keyPerson.name },
          { heading: "今月のラッキー行動", body: monthly.luckyItem },
          { heading: "今月の締めメッセージ", body: monthly.closingMessage || monthly.saveCardText }
        ]
      },
      {
        id: "compatibility",
        title: "あの人との相性詳細",
        description: "今日のキーパーソンを“あの人”として、相性の見方を深掘りします。",
        items: [
          { heading: "二人の相性スコア", body: `${74 + ((TYPE_CODES.indexOf(code) + TYPE_CODES.indexOf(daily.keyPerson.code || code)) % 23)}点` },
          { heading: "相性タイプ", body: `${meta.tone}と${keyMeta.tone}が重なり、違いを理解すると伸びやすい相性。` },
          { heading: "二人が惹かれ合う理由", body: `${meta.name}の持つ${meta.tone}に、${keyMeta.name}の${keyMeta.tone}が別の角度から光を足してくれます。` },
          { heading: "二人がすれ違いやすいところ", body: "連絡頻度や愛情表現の見え方が違う時、相手の気持ちまで決めつけやすい点には注意が必要です。" },
          { heading: "LINE・連絡の相性", body: "短くても温度があるやり取りが合います。遅れる時は、一言だけ安心を置くとズレが小さくなります。" },
          { heading: "会う頻度の相性", body: "会う頻度そのものより、次に会える見通しがあるかが大切です。ぼんやりでも予定を置くと安心しやすくなります。" },
          { heading: "愛情表現の違い", body: `${meta.name}は${meta.tone}が出やすく、${keyMeta.name}は${keyMeta.tone}で愛情を見せやすい組み合わせです。` },
          { heading: "喧嘩した時の戻し方", body: "長い説明より、まずは「責めたいわけじゃなくて、ちゃんと話したい」と入口を作るのが合っています。" },
          { heading: "あの人が嬉しい接し方", body: `${keyMeta.name}には、してくれたことを具体的に受け取る言葉が響きます。` },
          { heading: "やりすぎ注意な接し方", body: "反応を試すこと。安心したい気持ちは自然ですが、試す形にすると本音が伝わりにくくなります。" },
          { heading: "長続きのコツ", body: "違いを直す対象にせず、連絡・会う頻度・愛情表現の最低ラインを二人で少しずつ合わせること。" },
          { heading: "今日の二人へのアドバイス", body: "今日は確認より共有が合う日です。嬉しかったことを一つだけ渡して、関係の空気をやわらかくして。" }
        ]
      },
      {
        id: "partner",
        title: "相手タイプ別攻略",
        description: "あの人のタイプを想定して、距離の縮め方と言葉選びを確認できます。",
        items: [
          { heading: "あの人は恋で何を大切にする？", body: `${keyMeta.name}は、恋の中で${keyMeta.tone}を大切にしやすいタイプです。雑に急がれるより、自分のペースを尊重されると心を開きやすくなります。` },
          { heading: "距離が縮まりやすい接し方", body: "急に踏み込みすぎず、でも無関心に見せないこと。小さな特別扱いを自然に置くのが合っています。" },
          { heading: "あの人が嬉しい言葉", body: "「ちゃんと見てるよ」「無理しなくて大丈夫」「また話したい」など、安心と関心が両方伝わる言葉。" },
          { heading: "避けた方がいいこと", body: "相手の反応を急かすこと、駆け引きで不安にさせること、気持ちを断定して決めつけること。" },
          { heading: "LINEのコツ", body: "長文で押すより、返しやすい一言を置くこと。最後に小さく温度を残すと距離が縮まりやすいです。" },
          { heading: "デート・会話のコツ", body: "完璧な予定より、自然に話せる余白を大切に。相手が話したことを一つ覚えていると印象に残ります。" },
          { heading: "本気サイン", body: "自分の内側の話を少し出す、予定や会話を続けようとする、あなたの変化に気づく。" },
          { heading: "不安になっている時のサイン", body: "返信はあるのに温度が見えにくくなる、急に距離を取る、平気なふりをする。" },
          { heading: "関係を進める一言", body: "「急がなくていいけど、あなたとはもう少し話したい」" }
        ]
      },
      {
        id: "situation",
        title: "状況別占い",
        description: "片思い、曖昧な関係、連絡不安など、今の状況に合わせた読み方です。",
        items: [
          { heading: "今の状況", body: "相手の反応ひとつで気持ちが上下しやすい時期です。まだ断定できないことを、急いで答えにしない方が現実的です。" },
          { heading: "今のあなたの心の状態", body: `${meta.name}は今、${meta.tone}を出したい気持ちと、重く見えたくない気持ちの間で揺れやすくなっています。` },
          { heading: "相手から見えやすいあなた", body: "不安な時ほど、確認したい気持ちが言葉に出やすいです。ただ、本当は責めたいのではなく、安心したいだけかもしれません。" },
          { heading: "今、恋が動きやすいポイント", body: "相手の気持ちを一気に聞き出すより、話しやすい接点を一つ増やすこと。小さな会話が次の流れを作ります。" },
          { heading: "今やらない方がいいこと", body: "SNSや既読だけで可能性を決めること。相手を試すために急に冷たくすること。" },
          { heading: "3日以内の小さなアクション", body: "相手が前に話していたことを一つだけ自然に会話へ出す。" },
          { heading: "送るならこの一言", body: "「この前話してたの、ちょっと思い出した」" },
          { heading: "この状況で大切にしてほしいこと", body: "恋で相手を見ることは大切ですが、自分がどう扱われたいかを見失わないことも同じくらい大切です。" }
        ]
      }
    ];
  };
  const detailHtml = (sections, lead = "今日・今週・今月・相性・相手タイプ・状況別の恋愛ヒントをまとめて読めます。") => `
    <section class="love-fortune-details" data-love-fortune-detail-panel aria-label="詳細占いエリア">
      <div class="love-fortune-head">
        <p class="love-diagnosis__eyebrow">detail</p>
        <h3>詳細占いエリア</h3>
        <p>${esc(lead)}</p>
      </div>
      <div class="love-fortune-detail-actions">
        <button class="button button--primary button--full" type="button" data-love-fortune-detail-all-toggle aria-expanded="false">詳細を見る</button>
      </div>
      <div class="love-fortune-detail-list" data-love-fortune-detail-body hidden>
        ${sections.map((section) => `
          <article class="love-fortune-detail-card">
            <div class="love-fortune-detail-card__summary">
              <p class="love-diagnosis__eyebrow">${esc(section.title)}</p>
              <h4>${esc(section.title)}</h4>
              <p>${esc(section.description)}</p>
            </div>
            <div class="love-fortune-detail-card__body">
              ${section.items.map((item) => `
                <section class="love-fortune-detail-item">
                  <h5>${esc(item.heading)}</h5>
                  <p>${esc(item.body)}</p>
                </section>
              `).join("")}
            </div>
          </article>
        `).join("")}
        <button class="button button--ghost button--full" type="button" data-love-fortune-detail-all-toggle aria-expanded="true">閉じる</button>
      </div>
    </section>`;
  const gate = () => `
    <section class="love-fortune-panel love-fortune-gate">
      <p class="love-diagnosis__eyebrow">fortune</p>
      <h3>まずはあなたの恋愛モビーを診断してね</h3>
      <p>診断結果のキャラに合わせて、今日の占いと今月の恋愛モビー予報を表示します。</p>
      <button class="button button--primary button--full" type="button" data-love-tab-diagnosis>恋愛モビー診断をはじめる</button>
    </section>`;
  const dailyHtml = (fortune) => {
    const meta = TYPE_META[fortune.typeCode];
    const keyMeta = TYPE_META[fortune.keyPerson.code];
    const url = shareUrl(fortune, "daily_keyperson");
    return `
      <article class="love-fortune-card love-fortune-card--daily">
        <div class="love-fortune-hero">
          <img src="${image(meta)}" alt="${esc(meta.name)}" loading="lazy" decoding="async">
          <div>
            <p class="love-diagnosis__eyebrow">today's mobby</p>
            <h3>${esc(fortune.typeName)}</h3>
            <strong>${fortune.score}点</strong>
          </div>
        </div>
        <section><h4>今日の状態</h4><p>${esc(fortune.mood)}</p></section>
        <section><h4>今日のテーマ</h4><p>${esc(fortune.theme)}</p></section>
        <section><h4>メッセージ</h4><p>${esc(fortune.message)}</p></section>
        <section class="love-fortune-mission"><h4>今日のミッション</h4><p>${esc(fortune.mission)}</p></section>
        <section class="love-fortune-keyperson"><h4>今日のキーパーソン：${esc(fortune.keyPerson.name)}</h4><div class="love-fortune-keyperson__body">${keyMeta ? `<img src="${image(keyMeta)}" alt="${esc(fortune.keyPerson.name)}" loading="lazy" decoding="async">` : ""}<p>${esc(fortune.keyPerson.role)}。近くにこのタイプっぽい人がいたら、軽く話してみるとよさそう。</p></div><button class="button button--primary button--full" type="button" data-love-fortune-share data-share-text="${esc(fortune.shareText)}" data-share-url="${esc(url)}">タイプを知りたい人に診断を送る</button></section>
        <section><h4>ラッキーアイテム</h4><p>${esc(fortune.luckyItem)}</p></section>
      </article>`;
  };
  const monthlyHtml = (fortune, code) => {
    const meta = TYPE_META[code];
    const keyMeta = TYPE_META[fortune.keyPerson.code];
    const url = shareUrl({ ...fortune, typeCode: code }, "monthly_keyperson");
    return `
      <article class="love-fortune-card love-fortune-card--monthly">
        <div class="love-fortune-hero">
          <img src="${image(meta)}" alt="${esc(meta.name)}" loading="lazy" decoding="async">
          <div>
            <p class="love-diagnosis__eyebrow">${fortune.month}月の恋愛モビー予報</p>
            <h3>${esc(fortune.monthlyTitle)}</h3>
            <strong>${fortune.score}点</strong>
          </div>
        </div>
        <section><h4>今月のテーマ</h4><p>${esc(fortune.monthlyTheme)}</p></section>
        <section><h4>今月のモビー状態</h4><p>${esc(fortune.monthlyState)}</p></section>
        <section><h4>恋が動く日</h4><p>${fortune.moveDays.map((day) => `${day}日`).join("、")}</p></section>
        <section><h4>注意したい日</h4><p>${fortune.cautionDay}日。${esc(fortune.cautionText)}</p></section>
        <section class="love-fortune-mission"><h4>今月のミッション</h4><p>${esc(fortune.monthlyMission)}</p></section>
        <section class="love-fortune-keyperson"><h4>今月のキーパーソン：${esc(fortune.keyPerson.name)}</h4><div class="love-fortune-keyperson__body">${keyMeta ? `<img src="${image(keyMeta)}" alt="${esc(fortune.keyPerson.name)}" loading="lazy" decoding="async">` : ""}<p>${esc(fortune.keyPerson.role)}。このタイプの人に診断を送ってみると、今月のヒントが増えるかも。</p></div><button class="button button--primary button--full" type="button" data-love-fortune-share data-share-text="${esc(fortune.shareText)}" data-share-url="${esc(url)}">今月のキーパーソンかも？と思う人に送る</button></section>
        <section><h4>今月のラッキーアイテム</h4><p>${esc(fortune.luckyItem)}</p></section>
        <section class="love-fortune-save"><h4>保存カード向けの短文</h4><p>${esc(fortune.saveCardText)}</p></section>
      </article>`;
  };
  const render = () => {
    const panel = document.querySelector("[data-love-fortune-panel]");
    if (!panel) return;
    const code = resultState();
    if (!code) {
      panel.innerHTML = gate();
      return;
    }
    const daily = dailyFortune(code);
    const monthly = monthlyFortune(code);
    const details = detailFortunes(code);
    const sections = detailSections(code, details.daily, details.weekly, details.monthly);
    const dailySections = sections.filter((section) => section.id === "today");
    const weeklySections = sections.filter((section) => section.id === "week");
    const monthlySections = sections.filter((section) => section.id === "month");
    panel.innerHTML = `
      <section class="love-fortune-panel">
        <div class="love-fortune-head">
          <p class="love-diagnosis__eyebrow">fortune</p>
          <h3>今日の恋愛モビー占い</h3>
          <p>診断結果のモビーに、今日の状態・ミッション・キーパーソンを聞きに来る場所です。</p>
        </div>
        <div class="love-fortune-switch" role="tablist" aria-label="占い表示">
          <button class="is-active" type="button" data-love-fortune-mode="daily">日次占い</button>
          <button type="button" data-love-fortune-mode="weekly">週次占い</button>
          <button type="button" data-love-fortune-mode="monthly">月間占い</button>
        </div>
        <div data-love-fortune-daily>
          ${dailyHtml(daily)}
          ${detailHtml(dailySections, "今日の恋愛モビー占いの詳細を読めます。")}
        </div>
        <div data-love-fortune-weekly hidden>
          ${detailHtml(weeklySections, "今週の恋愛作戦の詳細を読めます。")}
        </div>
        <div data-love-fortune-monthly hidden>
          ${monthlyHtml(monthly, code)}
          ${detailHtml(monthlySections, "今月の恋愛運の詳細をまとめて読めます。")}
        </div>
      </section>`;
  };
  const ensureFortuneTab = () => {
    ensureResultFortuneButton();
    const tabs = document.querySelector(".love-diagnosis-tabs");
    const diagnosisPanel = document.querySelector("[data-love-diagnosis-panel] > .love-diagnosis");
    if (!tabs || !diagnosisPanel) return;
    if (!tabs.querySelector("[data-love-fortune]")) {
      const button = document.createElement("button");
      button.className = "love-diagnosis-tabs__item";
      button.type = "button";
      button.textContent = "占い";
      button.setAttribute("data-love-fortune", "");
      tabs.appendChild(button);
      const panel = document.createElement("section");
      panel.className = "love-fortune-wrap";
      panel.hidden = true;
      panel.setAttribute("data-love-fortune-panel", "");
      diagnosisPanel.appendChild(panel);
      render();
    }
  };
  const ensureResultFortuneButton = () => {
    const actions = document.querySelector("[data-love-diagnosis-panel] .love-result-actions");
    if (!actions || actions.querySelector("[data-love-result-fortune]")) return;
    const compatibilityButton = actions.querySelector("[data-love-open-compatibility]");
    const button = document.createElement("button");
    button.className = "button button--primary button--full love-compatibility-cta";
    button.type = "button";
    button.textContent = "占いを見る";
    button.setAttribute("data-love-fortune", "");
    button.setAttribute("data-love-result-fortune", "");
    if (compatibilityButton) compatibilityButton.insertAdjacentElement("afterend", button);
    else actions.appendChild(button);
  };
  const openFortune = () => {
    const diagnosisPanel = document.querySelector("[data-love-diagnosis-panel]");
    const root = document.querySelector("[data-love-diagnosis-panel] > .love-diagnosis");
    if (!root) return;
    if (diagnosisPanel) diagnosisPanel.hidden = false;
    document.querySelectorAll(".love-diagnosis-tabs__item").forEach((item) => item.classList.toggle("is-active", item.hasAttribute("data-love-fortune")));
    document.querySelectorAll("[data-love-character-panel], [data-love-compatibility-panel], [data-love-type-guide-panel]").forEach((panel) => { panel.hidden = true; });
    root.querySelectorAll(":scope > .love-diagnosis__hero, :scope > .love-diagnosis__intro-grid, :scope > [data-love-diagnosis-start], :scope > .love-progress, :scope > .love-question-list, :scope > .love-diagnosis__nav, :scope > .love-result-hero, :scope > .love-result-sections, :scope > .love-axis-bars, :scope > .love-share-card-inline, :scope > .love-share-card-modal, :scope > #line-ai-mobby-cta, :scope > .couple-magazine__status, :scope > .love-diagnosis__notice").forEach((node) => { node.hidden = true; });
    const panel = root.querySelector("[data-love-fortune-panel]");
    if (panel) {
      panel.hidden = false;
      render();
      panel.scrollIntoView({ block: "start" });
    }
  };
  const closeFortune = () => {
    const root = document.querySelector("[data-love-diagnosis-panel] > .love-diagnosis");
    if (!root) return;
    const fortunePanel = root.querySelector("[data-love-fortune-panel]");
    if (fortunePanel) fortunePanel.hidden = true;
    document.querySelectorAll(".love-diagnosis-tabs__item").forEach((item) => {
      if (item.hasAttribute("data-love-fortune")) item.classList.remove("is-active");
    });
    root.querySelectorAll(":scope > .love-diagnosis__hero, :scope > .love-diagnosis__intro-grid, :scope > [data-love-diagnosis-start], :scope > .love-progress, :scope > .love-question-list, :scope > .love-diagnosis__nav, :scope > .love-result-hero, :scope > .love-result-sections, :scope > .love-axis-bars, :scope > .love-share-card-inline, :scope > .love-share-card-modal, :scope > #line-ai-mobby-cta, :scope > .couple-magazine__status, :scope > .love-diagnosis__notice").forEach((node) => { node.hidden = false; });
  };
  document.addEventListener("click", (event) => {
    const fortuneButton = event.target.closest("[data-love-fortune]");
    if (fortuneButton) {
      event.preventDefault();
      openFortune();
      return;
    }
    if (event.target.closest("[data-love-tab-diagnosis], [data-love-character-list], [data-love-compatibility], [data-love-reset], [data-love-type-guide]")) {
      closeFortune();
    }
    const mode = event.target.closest("[data-love-fortune-mode]");
    if (mode) {
      const panel = mode.closest(".love-fortune-panel");
      panel.querySelectorAll("[data-love-fortune-mode]").forEach((button) => button.classList.toggle("is-active", button === mode));
      panel.querySelector("[data-love-fortune-daily]").hidden = mode.dataset.loveFortuneMode !== "daily";
      panel.querySelector("[data-love-fortune-weekly]").hidden = mode.dataset.loveFortuneMode !== "weekly";
      panel.querySelector("[data-love-fortune-monthly]").hidden = mode.dataset.loveFortuneMode !== "monthly";
      return;
    }
    const shareButton = event.target.closest("[data-love-fortune-share]");
    if (shareButton) share(shareButton.dataset.shareText, shareButton.dataset.shareUrl);
    const detailToggle = event.target.closest("[data-love-fortune-detail-all-toggle]");
    if (detailToggle) {
      const panel = detailToggle.closest("[data-love-fortune-detail-panel]");
      const body = panel?.querySelector("[data-love-fortune-detail-body]");
      if (!panel || !body) return;
      const nextOpen = body.hidden;
      body.hidden = !nextOpen;
      panel.classList.toggle("is-open", nextOpen);
      panel.querySelectorAll("[data-love-fortune-detail-all-toggle]").forEach((button) => {
        button.setAttribute("aria-expanded", String(nextOpen));
      });
      const summaryButton = panel.querySelector(".love-fortune-detail-actions [data-love-fortune-detail-all-toggle]");
      if (summaryButton) summaryButton.textContent = nextOpen ? "閉じる" : "詳細を見る";
    }
  });
  const observer = new MutationObserver(ensureFortuneTab);
  observer.observe(document.getElementById("loveRoot"), { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", ensureFortuneTab);
  ensureFortuneTab();
})();
