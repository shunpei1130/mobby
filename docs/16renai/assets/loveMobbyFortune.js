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
  const THEMES = ["素直さを少し外へ出す日", "受け取り上手になる日", "連絡の温度を整える日", "追いすぎず待てる日", "小さく甘える日", "距離感をやわらかくする日", "本音を一行だけ残す日", "空気を変える日", "安心を確認する日", "感謝を渡す日", "自分の時間を整える日", "相手の変化をひとつ褒める日", "ときめきを保存する日", "言葉を軽くする日", "待ち方を変える日", "小さな勇気を使う日", "整えすぎない日", "休ませる日", "思い出を残す日", "相談してみる日", "境界線を引く日", "褒める日", "自分を主語にする日", "未来を少し見る日", "過去をほどく日", "余白を飾る日", "頼る練習の日", "特別扱いをする日", "流れを変える日", "月末の回収日"];
  const MISSIONS = ["短い本音をひとつだけ言葉にする", "好きな人に送る前提ではなく、自分の気持ちを一行メモする", "返信を急がず、一度だけ深呼吸してから返す", "自分がされて嬉しいことをひとつ思い出す", "無理に追わず、自分の時間を少し整える", "本当は嬉しかったことを一つだけ言葉にする", "気になる人に送るなら、軽い一言だけにする", "寂しさを責めずに、短い言葉へ変える", "相手のよかったところを一つだけ見つける", "今日は返事の速さより、言葉のやわらかさを選ぶ", "自分が安心できる予定を一つ入れる", "写真かメモで今日のかわいい瞬間を残す", "会いたい気持ちを急かさず、別の行動に移す", "ありがとうを短く具体的に伝える", "無理に明るくせず、静かな時間をつくる", "迷ったら送る前に一度だけ読み返す", "好きなものをひとつ選んで自分に戻る", "相手の反応を決めつけず、半歩だけ待つ", "大切にしたい条件を三つ書き出す", "軽い相談をひとつだけ誰かに渡す", "今日は境界線をやさしく守る", "褒め言葉をひとつ具体的にする", "私はどうしたいかを一行で書く", "行きたい場所を三つ保存する", "過去の不安を今日の相手に重ねすぎない", "部屋かスマホ画面を少し整える", "できることを一つだけ人に頼る", "自分にも相手にも小さな特別扱いをする", "いつもと違う返し方を一つ試す", "今月うれしかった恋の気配を三つ拾う"];
  const LUCKY_ITEMS = ["香りのあるもの", "柔らかいハンカチ", "ブックマーク", "髪", "歩きやすい靴", "月のモチーフ", "温かい飲み物", "薄いピンクのもの", "お気に入りの音楽", "小さな花", "透明な小物", "白い紙", "手紙やメモ", "リボン", "静かなカフェ", "青い小物"];
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
  const dayIndex = (date = new Date()) => (date.getDate() - 1) % 31;
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
    return {
      day: index + 1,
      typeCode: code,
      typeName: meta.name,
      mood: `${meta.name}は、今日は${meta.tone}を少しだけ外へ出せる状態。焦って答えを出すより、今の気持ちを整えるほど恋の流れが見えやすくなります。`,
      score,
      theme: THEMES[index],
      message: `${THEMES[index]}です。${meta.name}らしさは、急に強く出すよりも小さな合図で伝えるほうが届きやすい日。相手の反応を決めつけず、あなたの温度をひとつだけ丁寧に置いてみて。`,
      mission: MISSIONS[index],
      keyPerson: {
        code: keyCode,
        name: keyMeta.name,
        role: ["背中を押してくれるかも", "気持ちをやわらかく受け止めてくれるかも", "視点を変えてくれるかも", "流れを変えてくれるかもしれない人"][index % 4]
      },
      luckyItem: LUCKY_ITEMS[(TYPE_CODES.indexOf(code) + index) % LUCKY_ITEMS.length],
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
  const gate = () => `
    <section class="love-fortune-panel love-fortune-gate">
      <p class="love-diagnosis__eyebrow">fortune</p>
      <h3>まずはあなたの恋愛モビーを診断してね</h3>
      <p>診断結果のキャラに合わせて、今日の占いと今月の恋愛モビー予報を表示します。</p>
      <button class="button button--primary button--full" type="button" data-love-tab-diagnosis>恋愛モビー診断をはじめる</button>
    </section>`;
  const dailyHtml = (fortune) => {
    const meta = TYPE_META[fortune.typeCode];
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
        <section class="love-fortune-keyperson"><h4>今日のキーパーソン：${esc(fortune.keyPerson.name)}</h4><p>${esc(fortune.keyPerson.role)}。近くにこのタイプっぽい人がいたら、軽く話してみるとよさそう。</p><button class="button button--primary button--full" type="button" data-love-fortune-share data-share-text="${esc(fortune.shareText)}" data-share-url="${esc(url)}">このタイプかも？と思う人に診断を送る</button></section>
        <section><h4>ラッキーアイテム</h4><p>${esc(fortune.luckyItem)}</p></section>
      </article>`;
  };
  const monthlyHtml = (fortune, code) => {
    const meta = TYPE_META[code];
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
        <section class="love-fortune-keyperson"><h4>今月のキーパーソン：${esc(fortune.keyPerson.name)}</h4><p>${esc(fortune.keyPerson.role)}。このタイプの人に診断を送ってみると、今月のヒントが増えるかも。</p><button class="button button--primary button--full" type="button" data-love-fortune-share data-share-text="${esc(fortune.shareText)}" data-share-url="${esc(url)}">今月のキーパーソンかも？と思う人に送る</button></section>
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
    panel.innerHTML = `
      <section class="love-fortune-panel">
        <div class="love-fortune-head">
          <p class="love-diagnosis__eyebrow">fortune</p>
          <h3>今日の恋愛モビー占い</h3>
          <p>診断結果のモビーに、今日の状態・ミッション・キーパーソンを聞きに来る場所です。</p>
        </div>
        <div class="love-fortune-switch" role="tablist" aria-label="占い表示">
          <button class="is-active" type="button" data-love-fortune-mode="daily">日次占い</button>
          <button type="button" data-love-fortune-mode="monthly">月間占い</button>
        </div>
        <div data-love-fortune-daily>${dailyHtml(daily)}</div>
        <div data-love-fortune-monthly hidden>${monthlyHtml(monthly, code)}</div>
      </section>`;
  };
  const ensureFortuneTab = () => {
    const tabs = document.querySelector(".love-diagnosis-tabs");
    const diagnosisPanel = document.querySelector("[data-love-diagnosis-panel] > .love-diagnosis");
    if (!tabs || !diagnosisPanel || tabs.querySelector("[data-love-fortune]")) return;
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
      panel.querySelector("[data-love-fortune-monthly]").hidden = mode.dataset.loveFortuneMode !== "monthly";
      return;
    }
    const shareButton = event.target.closest("[data-love-fortune-share]");
    if (shareButton) share(shareButton.dataset.shareText, shareButton.dataset.shareUrl);
  });
  const observer = new MutationObserver(ensureFortuneTab);
  observer.observe(document.getElementById("loveRoot"), { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", ensureFortuneTab);
  ensureFortuneTab();
})();
