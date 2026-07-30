(() => {
  if (window.__mobbyGuideLoaded) return;
  if (window.self !== window.top) return;
  window.__mobbyGuideLoaded = true;

  const guideScript = document.currentScript;
  const isHome = guideScript?.dataset.mobbyGuideHome === 'true';
  const assetRoot = new URL('../', guideScript?.src || window.location.href);
  const assetUrl = (path) => new URL(path, assetRoot).href;
  const STORAGE_CHARACTER = 'mobby-guide-character-v1';
  const STORAGE_POSITION = 'mobby-guide-position-v1';

  const characters = {
    mobirin: {
      name: 'もびりん',
      image: assetUrl('carousel/after/mobby_fact_man_toka.webp'),
      runningImage: assetUrl('assets/mobby-guide/mobirin-running.webp'),
      accent: '#d5a733',
      greeting: 'もびりんですぞ。ご案内しましょう。'
    },
    mobichi: {
      name: 'もびち',
      image: assetUrl('carousel/after/mobby_gal_toka.webp'),
      runningImage: assetUrl('assets/mobby-guide/mobichi-running.webp'),
      accent: '#c972a3',
      greeting: 'もびちだよ〜♡ いっしょに見よっ！'
    },
    yami: {
      name: '病みモビー',
      image: assetUrl('carousel/after/mobby_yami_toka.webp'),
      runningImage: assetUrl('assets/mobby-guide/yami-running.webp'),
      accent: '#8b73c8',
      greeting: '…病みモビー。そばにいるね。'
    },
    mobiyan: {
      name: 'もびやん',
      image: assetUrl('carousel/after/mobby_yanki_toak.webp'),
      runningImage: assetUrl('assets/mobby-guide/mobiyan-running.webp'),
      accent: '#d47b3d',
      greeting: 'もびやんや！ ついてきいや！'
    }
  };

  const createInterface = () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <section class="mobby-guide-picker" id="mobbyGuidePicker" aria-labelledby="mobbyGuidePickerTitle" hidden>
        <div class="mobby-guide-picker__card" role="dialog" aria-modal="true">
          <p class="mobby-guide-picker__eyebrow">Choose your Mobby</p>
          <h2 class="mobby-guide-picker__title" id="mobbyGuidePickerTitle">一緒に歩くモビーを選んでね</h2>
          <p class="mobby-guide-picker__lead">画面の中を自由に動かせる案内役です。</p>
          <div class="mobby-guide-picker__grid">
            <button class="mobby-guide-choice" type="button" data-guide-character="mobirin" style="--guide-choice-bg:#fff2c9;--guide-choice-accent:#d5a733">
              <img src="${characters.mobirin.image}" alt=""><strong>もびりん</strong><small>知的なおじ</small>
            </button>
            <button class="mobby-guide-choice" type="button" data-guide-character="mobichi" style="--guide-choice-bg:#fbe5f2;--guide-choice-accent:#c972a3">
              <img src="${characters.mobichi.image}" alt=""><strong>もびち</strong><small>気ままギャル♡</small>
            </button>
            <button class="mobby-guide-choice" type="button" data-guide-character="yami" style="--guide-choice-bg:#eee7ff;--guide-choice-accent:#8b73c8">
              <img src="${characters.yami.image}" alt=""><strong>病みモビー</strong><small>メンヘラちゃん</small>
            </button>
            <button class="mobby-guide-choice" type="button" data-guide-character="mobiyan" style="--guide-choice-bg:#ffe5cf;--guide-choice-accent:#d47b3d">
              <img src="${characters.mobiyan.image}" alt=""><strong>もびやん</strong><small>まっすぐなヤンキー</small>
            </button>
          </div>
        </div>
      </section>
      <aside class="mobby-guide-pet" id="mobbyGuidePet" aria-label="モビー案内役" hidden>
        <div class="mobby-guide-pet__bubble" id="mobbyGuideBubble" role="status">
          <span id="mobbyGuideMessage"></span>
          <button class="mobby-guide-pet__close" id="mobbyGuideBubbleClose" type="button" aria-label="吹き出しを閉じる">×</button>
        </div>
        <button class="mobby-guide-pet__character" id="mobbyGuideCharacter" type="button" aria-label="現在地を聞く">
          <img id="mobbyGuideImage" src="" alt="">
        </button>
      </aside>`;
    document.body.append(...wrapper.children);
  };

  createInterface();

  const picker = document.getElementById('mobbyGuidePicker');
  const pet = document.getElementById('mobbyGuidePet');
  const petButton = document.getElementById('mobbyGuideCharacter');
  const petImage = document.getElementById('mobbyGuideImage');
  const bubble = document.getElementById('mobbyGuideBubble');
  const message = document.getElementById('mobbyGuideMessage');
  const bubbleClose = document.getElementById('mobbyGuideBubbleClose');
  const choices = Array.from(document.querySelectorAll('[data-guide-character]'));
  if (!picker || !pet || !petButton || !petImage || !bubble || !message) return;

  let selectedId = '';
  let dragging = false;
  let movedDuringDrag = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let lastPointerX = 0;
  let lastContextKey = '';
  let contextTimer = 0;

  const safeStorageGet = (key) => {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  };

  const safeStorageSet = (key, value) => {
    try { localStorage.setItem(key, value); } catch (_) {}
  };

  const clampPet = (x, y) => {
    const margin = 6;
    const width = pet.offsetWidth || 100;
    const height = pet.offsetHeight || 140;
    return {
      x: Math.max(margin, Math.min(window.innerWidth - width - margin, x)),
      y: Math.max(margin, Math.min(window.innerHeight - height - margin, y))
    };
  };

  const setPetPosition = (x, y, save = false) => {
    const next = clampPet(x, y);
    pet.style.left = `${next.x}px`;
    pet.style.top = `${next.y}px`;
    pet.classList.toggle('is-right-side', next.x > window.innerWidth / 2);
    if (save) safeStorageSet(STORAGE_POSITION, JSON.stringify(next));
  };

  const restorePetPosition = () => {
    const raw = safeStorageGet(STORAGE_POSITION);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
          setPetPosition(saved.x, saved.y);
          return;
        }
      } catch (_) {}
    }
    setPetPosition(18, window.innerHeight - (pet.offsetHeight || 154) - 24);
  };

  const say = (text) => {
    message.textContent = text;
    bubble.hidden = false;
  };

  const characterizeText = (text) => {
    const source = String(text || '').trim();
    if (!source) return '';

    if (selectedId === 'mobirin') {
      const voiced = source
        .replace(/開いているよ/g, '開いていますぞ')
        .replace(/できるよ/g, 'できますぞ')
        .replace(/見られるよ/g, '見られますぞ')
        .replace(/戻れるよ/g, '戻れますぞ')
        .replace(/進めるよ/g, '進めますぞ')
        .replace(/してね/g, 'してくださいな')
        .replace(/しよう/g, 'しましょうぞ')
        .replace(/だよ/g, 'ですぞ');
      return `ふむ。${voiced}`;
    }

    if (selectedId === 'mobichi') {
      const voiced = source
        .replace(/開いているよ/g, '開いてるよ〜')
        .replace(/してね/g, 'してみて〜')
        .replace(/しよう/g, 'しよっ')
        .replace(/だよ/g, 'だよ〜');
      return `${voiced}♡`;
    }

    if (selectedId === 'yami') {
      const voiced = source
        .replace(/開いているよ/g, '開いてるよ…')
        .replace(/してね/g, 'してね…')
        .replace(/しよう/g, 'しよう…')
        .replace(/だよ/g, 'だよ…');
      return `…${voiced}`;
    }

    const voiced = source
      .replace(/開いているよ/g, '開いとるで')
      .replace(/見ているよ/g, '見とるで')
      .replace(/できるよ/g, 'できるで')
      .replace(/見られるよ/g, '見られるで')
      .replace(/戻れるよ/g, '戻れるで')
      .replace(/進めるよ/g, '進めるで')
      .replace(/してね/g, 'してな')
      .replace(/しよう/g, 'しよか')
      .replace(/だよ/g, 'やで');
    return `おう、${voiced.replace(/。$/, '')}やで！`;
  };

  const characterizeContext = (context) => {
    if (context.kind === 'quiz-question') {
      const { remaining } = context.quizProgress;
      const comment = getQuizQuestionComment(context.question.text);
      const remainingText = {
        mobirin: `あと${remaining}問ですぞ。`,
        mobichi: `あと${remaining}問〜♡`,
        yami: `…あと${remaining}問。`,
        mobiyan: `あと${remaining}問や！`
      }[selectedId];
      return `${comment} ${remainingText}`;
    }

    if (context.kind === 'quiz-progress' || context.kind === 'quiz-complete') {
      const { remaining, total } = context.quizProgress;
      const complete = context.kind === 'quiz-complete';

      if (selectedId === 'mobirin') {
        return complete
          ? `全${total}問、完走ですぞ。結果へ参りましょう。`
          : `残り${remaining}問。焦りは禁物ですぞ。`;
      }
      if (selectedId === 'mobichi') {
        return complete
          ? `全${total}問クリア〜！ 結果見よっ♡`
          : `あと${remaining}問！ ノリでいこ〜♡`;
      }
      if (selectedId === 'yami') {
        return complete
          ? `…全${total}問できたね。結果、見にいこう。`
          : `…あと${remaining}問。休みながらでいいよ。`;
      }
      return complete
        ? `全${total}問制覇や！ 結果いくで！`
        : `残り${remaining}問や！ 一気にいくで！`;
    }

    return characterizeText(context.text);
  };

  const pageDescriptions = [
    [/\/16school\//, '学校での裏キャラ、40問でバレます。'],
    [/\/16renai\//, '恋のクセ、40問で丸裸。'],
    [/\/16love\//, '恋の重さ、かわいさに変換。'],
    [/\/16fear\//, '怖さの正体、タイプ名にして捕まえよう。'],
    [/\/16night\//, '夜の才能、40問でスポットライト。'],
    [/\/16stan\//, 'あなたの沼り方、推しに見せられる？'],
    [/\/16ml\//, '今の恋に、モビーと一曲を。'],
    [/\/compositing(?:\.html|\/)/, '画像を作ってTikTokへ。次のバズ、ここから。'],
    [/\/gacha\//, '推しが出たら、今日はもう優勝。'],
    [/\/ehon\//, '1ページだけのつもりが、モビー沼。'],
    [/\/mobby-custom\//, '世界に1体。盛ったもん勝ち。'],
    [/\/mobby-touch\//, 'つつくほど反応。かわいがりすぎ注意。'],
    [/\/mypage/, 'ここは、あなた専用のモビー基地。'],
    [/\/legal\//, '大事なやつ。飛ばし読みは自己責任。'],
    [/\/korea\//, '韓国語モードで、モビーも海外進出。'],
    [/\/(?:hinata-aoi|imagen-luca|karen|meeco|miyake-yuko)\//, 'コラボ限定。結果はちょっと自慢してよし。']
  ];

  const homeDescriptions = [
    ['.hero-carousel-shell', 'ほっぺは伸びる。時間は溶ける。'],
    ['.home-manga-feature', '1話だけのつもりが、4コマ沼。'],
    ['.home-main-actions', '診断か、ポスターか。次の遊び場を選ぼう。'],
    ['.popup-buttons-bar', 'まだ終わりじゃない。隠しメニュー発見。']
  ];

  const quizCommentRules = [
    {
      pattern: /返信|既読|未読|line|dm|連絡|メッセージ|文面/i,
      comments: {
        mobirin: '返信は推敲してから送りますぞ。',
        mobichi: '既読つけたら、気分で即レス〜♡',
        yami: '…返事が来るまで何度も見ちゃう。',
        mobiyan: '用があるなら電話するで！'
      }
    },
    {
      pattern: /sns|投稿|ストーリー|写真|匂わせ|いいね|拡散|発信/i,
      comments: {
        mobirin: '投稿前に誤字を三度確認しますぞ。',
        mobichi: '盛れたら即ストーリー♡',
        yami: '…意味深な曲、載せちゃうかも。',
        mobiyan: '匂わせんと本人に言うで！'
      }
    },
    {
      pattern: /推し|ライブ|配信|現場|イベント|アーカイブ|通知/i,
      comments: {
        mobirin: '情報を整理して計画的に推しますぞ。',
        mobichi: '推しは浴びられる時に浴びる♡',
        yami: '…推しの通知だけは即見る。',
        mobiyan: '現場あるなら最前目指すで！'
      }
    },
    {
      pattern: /メイク|服|靴|衣装|ドレス|ネイル|アクセサリー|見た目|着飾|清楚|華やか|盛りたい/i,
      comments: {
        mobirin: '身だしなみは清潔感が一番ですぞ。',
        mobichi: '盛れてるほうを選ぶ〜♡',
        yami: '…黒なら、少し安心する。',
        mobiyan: '見た目より気合いやで！'
      }
    },
    {
      pattern: /お金|時給|売上|ランキング|稼|目標金額|数字を追|仕事|働|シャンパン|ボトル/i,
      comments: {
        mobirin: '数字を見て堅実に積み上げますぞ。',
        mobichi: '楽しくて盛れる仕事が最強♡',
        yami: '…比べると、すぐ自信なくす。',
        mobiyan: '一番は取りにいくもんや！'
      }
    },
    {
      pattern: /意見|衝突|強い口調|押し切|言い方|提案|決断|注意され|言い返|主張/i,
      comments: {
        mobirin: '意見は理由を添えて伝えますぞ。',
        mobichi: '空気は読むけど、言いたいことは言う♡',
        yami: '…嫌われそうで、引っ込めちゃう。',
        mobiyan: '曲げへん。正面から言うで！'
      }
    },
    {
      pattern: /頼る|助け|相談|友達|仲間|支え|愚痴|悩みを聞|ありがとう/i,
      comments: {
        mobirin: '頼るのも立派な判断ですぞ。',
        mobichi: '困ったら友だちに即ボイス♡',
        yami: '…迷惑かなって、言えないかも。',
        mobiyan: '仲間やろ。遠慮すんなや！'
      }
    },
    {
      pattern: /予定|段取り|準備|確認|情報を集|後回し|優先度|計画|習慣|ペースを乱|変更/i,
      comments: {
        mobirin: '段取りを整えてから動きますぞ。',
        mobichi: '予定はざっくり、あとはノリ〜♡',
        yami: '…何度も確認しないと不安。',
        mobiyan: '考える前に動いてまうな！'
      }
    },
    {
      pattern: /不安|怖|気になる|心配|落ち込|責め|嫌われ|失敗|ミス|ソワソワ|モヤモヤ|ざわつ|眠れ|緊張/i,
      comments: {
        mobirin: '不安は事実と想像に分けますぞ。',
        mobichi: '考えすぎる前に寝よ〜♡',
        yami: '…うん、ずっと気にしちゃう。',
        mobiyan: '怖くても正面突破や！'
      }
    },
    {
      pattern: /好きな人|恋|恋人|彼氏|元カレ|デート|別れ|失恋|異性|告白|大切にされ|大事にされ/i,
      comments: {
        mobirin: '気持ちは言葉で確かめたいですぞ。',
        mobichi: '好きなら、好きって出ちゃう〜♡',
        yami: '…好きになると、その人ばかり見ちゃう。',
        mobiyan: '好きなら正面から行くで！'
      }
    },
    {
      pattern: /一人|ひとり|静か|自分の時間|自然体|落ち着いた|家で|在宅|じっくり|少人数/i,
      comments: {
        mobirin: 'ひとり時間は思考の整理に必要ですぞ。',
        mobichi: 'その日の気分でソロも全然あり♡',
        yami: '…ひとりのほうが、息しやすい。',
        mobiyan: '一人もええけど、仲間がおる方が熱いやろ！'
      }
    },
    {
      pattern: /クラス|教室|グループ|文化祭|体育祭|初対面|大勢|輪に入|会話|話題|お客さん|場の空気/i,
      comments: {
        mobirin: 'まず周りを見て、必要ならまとめますぞ。',
        mobichi: '知ってる子いたら即まざる〜♡',
        yami: '…端っこの席が落ち着く。',
        mobiyan: 'ワシから声かけたるで！'
      }
    }
  ];

  const getQuizQuestionComment = (questionText) => {
    const text = String(questionText || '');
    const matched = quizCommentRules.find((rule) => rule.pattern.test(text));
    if (matched) return matched.comments[selectedId];
    return {
      mobirin: 'わたくしなら、理由を考えて選びますぞ。',
      mobichi: 'もびちは楽しそうなほう〜♡',
      yami: '…私は、悪いほうまで考えちゃう。',
      mobiyan: 'ワシなら迷わず決めるで！'
    }[selectedId];
  };

  const getOpenDialogGuide = () => {
    const dialog = Array.from(document.querySelectorAll('[role="dialog"], .popup-overlay, dialog')).find((element) => {
      if (element === picker || element.closest?.('#mobbyGuidePicker')) return false;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return !element.hidden && element.getAttribute('aria-hidden') !== 'true' &&
        style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    });
    if (!dialog) return null;
    const heading = dialog.querySelector('h1, h2, h3, [aria-label]');
    const label = heading?.textContent?.trim() || heading?.getAttribute?.('aria-label') || '詳しい内容';
    if (/\/compositing(?:\.html|\/)/.test(window.location.pathname.toLowerCase())) {
      return {
        key: `dialog:poster:${label}`,
        text: 'テンプレを選んで画像完成。TikTokの次バズ、ここから。'
      };
    }
    return { key: `dialog:${label}`, text: `「${label}」を攻略中。迷ったら直感で。` };
  };

  const QUIZ_ANSWER_SELECTOR = [
    'button[data-qid]',
    'button[data-q]',
    '[data-love-answer]',
    'input[type="radio"]',
    '[role="radio"]',
    '[role="option"]'
  ].join(',');

  const isVisibleQuizControl = (element) => {
    if (element.closest('#mobbyGuidePicker, #mobbyGuidePet')) return false;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return !element.hidden && style.display !== 'none' && style.visibility !== 'hidden' &&
      rect.width > 0 && rect.height > 0;
  };

  const isSelectedQuizControl = (element) => {
    if (element.matches('input[type="radio"]')) return element.checked;
    return element.classList.contains('selected') ||
      element.closest('label')?.classList.contains('is-selected') ||
      element.getAttribute('aria-checked') === 'true' ||
      element.getAttribute('aria-pressed') === 'true' ||
      element.dataset.selected === 'true';
  };

  const getActiveQuizQuestion = () => {
    const controls = Array.from(document.querySelectorAll(QUIZ_ANSWER_SELECTOR)).filter(isVisibleQuizControl);
    const questionMap = new Map();

    controls.forEach((control) => {
      const container = control.closest([
        '.qCard',
        '.qcard',
        '.love-question',
        '[data-question-id]',
        '[class*="question-card"]',
        '[class*="question-item"]',
        'article',
        'fieldset'
      ].join(','));
      if (!container || questionMap.has(container)) return;

      const textElement = container.querySelector([
        '.qText',
        '.qtext',
        '.love-question h3',
        '[data-question-text]',
        '[class*="question__text"]',
        '[class*="question-text"]',
        '[class*="question-title"]',
        'legend'
      ].join(',')) || Array.from(container.querySelectorAll('h2, h3, p')).find((element) => {
        const text = element.textContent?.replace(/\s+/g, ' ').trim() || '';
        return text.length >= 8 && !/^(?:Q(?:uestion)?\s*\d+|そう思う|そう思わない)$/i.test(text);
      });
      const text = textElement?.textContent?.replace(/^\s*\d+[.．]\s*/, '').replace(/\s+/g, ' ').trim() || '';
      if (text.length < 8) return;

      const questionControls = Array.from(container.querySelectorAll(QUIZ_ANSWER_SELECTOR));
      if (!questionControls.length) return;
      const countElement = container.querySelector('.kicker, .qindex, .love-question__count, [class*="question-number"], [data-question-number]');
      const number = countElement?.textContent?.match(/\d+/)?.[0] || '';
      questionMap.set(container, {
        text,
        number,
        answered: questionControls.some(isSelectedQuizControl)
      });
    });

    const questions = Array.from(questionMap.values());
    return questions.find((question) => !question.answered) || questions[0] || null;
  };

  const getQuizProgress = () => {
    const pathname = window.location.pathname.toLowerCase();
    const diagnosisPath = /\/(?:16school|16renai|16love|16fear|16night|16stan|16ml|hinata-aoi|imagen-luca|karen|meeco|miyake-yuko)\//.test(pathname);
    if (!diagnosisPath) return null;

    const visibleAnswerControls = Array.from(document.querySelectorAll(QUIZ_ANSWER_SELECTOR)).filter(isVisibleQuizControl);
    if (!visibleAnswerControls.length) return null;

    const progressText = Array.from(document.querySelectorAll('.progress-meta, [data-love-status], [class*="progress"]'))
      .slice(0, 16)
      .map((element) => element.textContent?.replace(/\s+/g, ' ').trim() || '')
      .filter(Boolean)
      .join(' ');

    const questionRange = progressText.match(/(?:question|q)\s*(\d+)\s*(?:[-–〜~]\s*(\d+))?\s*[\/／]\s*(\d+)/i);
    const description = document.querySelector('meta[name="description"]')?.content || '';
    const describedTotal = description.match(/(\d{1,3})\s*問/)?.[1];
    const fallbackTotals = [
      [/\/16ml\//, 12],
      [/\/(?:16school|16renai|16love|16fear|16night|16stan)\//, 40]
    ];

    let total = questionRange ? Number(questionRange[3]) : Number(describedTotal || 0);
    if (!total) total = fallbackTotals.find(([pattern]) => pattern.test(pathname))?.[1] || 0;
    if (!total || total > 200) return null;

    const questionNumbers = Array.from(document.querySelectorAll('.kicker, [class*="question-number"], [data-question-number], [data-love-status]'))
      .slice(0, 80)
      .map((element) => {
        const text = element.textContent?.replace(/\s+/g, ' ').trim() || '';
        const match = text.match(/(?:^|\s)Q(?:uestion)?\s*(\d+)/i);
        return match ? Number(match[1]) : 0;
      })
      .filter((number) => number > 0 && number <= total);

    const selectedControls = visibleAnswerControls.filter(isSelectedQuizControl);
    const selectedKeys = new Set(selectedControls.map((element, index) => {
      return element.dataset.qid || element.dataset.q || element.getAttribute('name') || element.closest('[data-question-id]')?.dataset.questionId || `selected-${index}`;
    }));

    let answered = 0;
    if (questionRange) {
      const start = Number(questionRange[1]);
      const end = Number(questionRange[2] || questionRange[1]);
      answered = Math.min(end, Math.max(0, start - 1) + selectedKeys.size);
    } else if (questionNumbers.length) {
      const firstVisible = Math.min(...questionNumbers);
      const lastVisible = Math.max(...questionNumbers);
      answered = Math.min(lastVisible, Math.max(0, firstVisible - 1) + selectedKeys.size);
    } else {
      const percentMatch = progressText.match(/(\d{1,3})\s*%/);
      const progressBar = document.querySelector('[role="progressbar"][aria-valuenow], .progress-fill');
      const percent = percentMatch
        ? Number(percentMatch[1])
        : Number(progressBar?.getAttribute('aria-valuenow') || String(progressBar?.style?.width || '').replace('%', '') || 0);
      answered = Math.round(total * Math.max(0, Math.min(100, percent)) / 100);
    }

    answered = Math.max(0, Math.min(total, answered));
    const remaining = Math.max(0, total - answered);
    return { answered, remaining, total };
  };

  const getContext = () => {
    const dialog = getOpenDialogGuide();
    if (dialog) return dialog;

    if (isHome) {
      const targetY = window.innerHeight * 0.46;
      let best = null;
      homeDescriptions.forEach(([selector, text]) => {
        const element = document.querySelector(selector);
        if (!element) return;
        const rect = element.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const distance = Math.abs((rect.top + Math.min(rect.height, window.innerHeight) / 2) - targetY);
        if (!best || distance < best.distance) best = { key: selector, text, distance };
      });
      if (best) return best;
    }

    const pathname = window.location.pathname.toLowerCase();
    const baseText = pageDescriptions.find(([pattern]) => pattern.test(pathname))?.[1] ||
      `「${document.title || 'Mobby'}」。ここ、あとで効いてくるかも。`;
    const quizProgress = getQuizProgress();
    if (quizProgress) {
      const { answered, remaining, total } = quizProgress;
      if (remaining === 0) {
        return {
          key: `${pathname}:quiz-complete`,
          kind: 'quiz-complete',
          quizProgress,
          text: `${baseText} 全${total}問に回答できたよ！ 「結果を見る」へ進んでね。`
        };
      }
      const question = getActiveQuizQuestion();
      if (question) {
        return {
          key: `${pathname}:quiz-question:${question.number || question.text}:${answered}`,
          kind: 'quiz-question',
          quizProgress,
          question,
          text: question.text
        };
      }
      return {
        key: `${pathname}:quiz:${answered}`,
        kind: 'quiz-progress',
        quizProgress,
        text: `${baseText} 全${total}問のうち${answered}問回答済み。あと${remaining}問だよ。`
      };
    }
    return { key: pathname, text: baseText };
  };

  const updateContext = (force = false) => {
    if (pet.hidden || !picker.hidden) return;
    const context = getContext();
    if (!force && context.key === lastContextKey) return;
    lastContextKey = context.key;
    say(characterizeContext(context));
  };

  const scheduleContextUpdate = () => {
    window.clearTimeout(contextTimer);
    contextTimer = window.setTimeout(() => updateContext(false), 140);
  };

  const selectCharacter = (id, announce = true) => {
    const character = characters[id] || characters.mobirin;
    selectedId = characters[id] ? id : 'mobirin';
    pet.style.setProperty('--guide-accent', character.accent);
    petImage.src = character.image;
    petImage.alt = character.name;
    const runningPreload = new Image();
    runningPreload.src = character.runningImage;
    petButton.setAttribute('aria-label', `${character.name}に現在地を聞く`);
    safeStorageSet(STORAGE_CHARACTER, selectedId);
    picker.hidden = true;
    pet.hidden = false;
    requestAnimationFrame(() => {
      restorePetPosition();
      if (announce) say(character.greeting);
      else updateContext(true);
    });
  };

  const openPicker = () => {
    picker.hidden = false;
    pet.hidden = true;
    const savedChoice = choices.find((choice) => choice.dataset.guideCharacter === selectedId) || choices[0];
    window.setTimeout(() => savedChoice?.focus(), 0);
  };

  const startGuide = ({ alwaysChoose = false } = {}) => {
    selectedId = safeStorageGet(STORAGE_CHARACTER) || '';
    if (alwaysChoose || !characters[selectedId]) openPicker();
    else selectCharacter(selectedId, false);
  };

  choices.forEach((choice) => {
    choice.addEventListener('click', () => selectCharacter(choice.dataset.guideCharacter));
  });

  bubbleClose?.addEventListener('click', (event) => {
    event.stopPropagation();
    bubble.hidden = true;
  });

  petButton.addEventListener('click', () => {
    if (movedDuringDrag) {
      movedDuringDrag = false;
      return;
    }
    updateContext(true);
  });

  petButton.addEventListener('dblclick', () => {
    openPicker();
  });

  pet.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.mobby-guide-pet__bubble')) return;
    dragging = true;
    movedDuringDrag = false;
    dragOffsetX = event.clientX - pet.getBoundingClientRect().left;
    dragOffsetY = event.clientY - pet.getBoundingClientRect().top;
    lastPointerX = event.clientX;
    petImage.src = characters[selectedId]?.runningImage || petImage.src;
    pet.classList.add('is-dragging');
    pet.setPointerCapture?.(event.pointerId);
  });

  pet.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    movedDuringDrag = true;
    if (event.clientX < lastPointerX - 1) pet.classList.add('is-running-left');
    if (event.clientX > lastPointerX + 1) pet.classList.remove('is-running-left');
    lastPointerX = event.clientX;
    setPetPosition(event.clientX - dragOffsetX, event.clientY - dragOffsetY);
  });

  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    pet.classList.remove('is-dragging', 'is-running-left');
    petImage.src = characters[selectedId]?.image || petImage.src;
    if (Number.isInteger(event?.pointerId)) {
      pet.releasePointerCapture?.(event.pointerId);
    }
    const rect = pet.getBoundingClientRect();
    setPetPosition(rect.left, rect.top, true);
  };

  pet.addEventListener('pointerup', endDrag);
  pet.addEventListener('pointercancel', endDrag);
  pet.addEventListener('lostpointercapture', endDrag);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  window.addEventListener('blur', endDrag);
  window.addEventListener('resize', () => {
    if (pet.hidden) return;
    const rect = pet.getBoundingClientRect();
    setPetPosition(rect.left, rect.top);
  }, { passive: true });
  window.addEventListener('scroll', scheduleContextUpdate, { passive: true });
  document.addEventListener('click', (event) => {
    if (event.target.closest?.('#mobbyGuidePicker, #mobbyGuidePet')) return;
    if (event.target.closest?.('button, label, input, [role="button"], [role="radio"], [data-love-answer]')) {
      scheduleContextUpdate();
    }
  }, true);
  document.addEventListener('change', scheduleContextUpdate, true);

  const dialogObserver = new MutationObserver(scheduleContextUpdate);
  document.querySelectorAll('[role="dialog"], .popup-overlay, dialog').forEach((element) => {
    dialogObserver.observe(element, { attributes: true, attributeFilter: ['class', 'open', 'hidden', 'aria-hidden'] });
  });
  const quizRoot = document.querySelector('main, #app, #loveRoot, [role="main"]');
  if (quizRoot) {
    dialogObserver.observe(quizRoot, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-checked', 'aria-pressed', 'data-selected']
    });
  }

  if (isHome) {
    if (document.getElementById('splash-screen')) {
      window.addEventListener('mobby-splash-complete', () => startGuide({ alwaysChoose: true }), { once: true });
    } else {
      startGuide({ alwaysChoose: true });
    }
  } else {
    startGuide({ alwaysChoose: false });
  }
})();
