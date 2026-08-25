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
      tagline: '知的なおじ',
      intro: '落ち着いて考えるのが得意。迷ったときは、静かに道を示す案内役です。',
      image: assetUrl('carousel/after/mobby_fact_man_toka.webp'),
      runningImage: assetUrl('assets/mobby-guide/mobirin-running.webp'),
      accent: '#d5a733',
      greeting: 'もびりんですぞ。ご案内しましょう。'
    },
    mobichi: {
      name: 'もびち',
      tagline: '気ままギャル♡',
      intro: 'ノリと直感で楽しく進むタイプ。かわいい寄り道も大歓迎だよ。',
      image: assetUrl('carousel/after/mobby_gal_toka.webp'),
      runningImage: assetUrl('assets/mobby-guide/mobichi-running.webp'),
      accent: '#c972a3',
      greeting: 'もびちだよ〜♡ いっしょに見よっ！'
    },
    yami: {
      name: '病みモビー',
      tagline: 'メンヘラちゃん',
      intro: 'ちょっぴり不安だけど、そばにいると安心できる案内役だよ。',
      image: assetUrl('carousel/after/mobby_yami_toka.webp'),
      runningImage: assetUrl('assets/mobby-guide/yami-running.webp'),
      accent: '#8b73c8',
      greeting: '…病みモビーだよ。そばにいるね。'
    },
    mobiyan: {
      name: 'もびやん',
      tagline: 'まっすぐなヤンキー',
      intro: '曲がったことは苦手。迷ったら、正面突破でついてこい！',
      image: assetUrl('carousel/after/mobby_yanki_toak.webp'),
      runningImage: assetUrl('assets/mobby-guide/mobiyan-running.webp'),
      accent: '#d47b3d',
      greeting: 'もびやんや！ ついてきいや！'
    },
    babu: {
      name: 'ばぶもび',
      tagline: '甘えんぼベビー',
      intro: 'だっこと安心が大好きばぶう。ゆっくり一緒に進むばぶう。',
      image: assetUrl('assets/mobby-guide/characters/babu-moby.webp'),
      runningImage: assetUrl('assets/mobby-guide/characters/babu-moby.webp'),
      accent: '#e7a6bb',
      greeting: 'ばぶもびばぶう。だっこしてほしいばぶう。'
    },
    pote: {
      name: 'ぽてもび',
      tagline: 'ぽてっと癒し系',
      intro: 'ぽてっと座ってひと休み。焦らず、マイペースに案内するよ。',
      image: assetUrl('assets/mobby-guide/characters/pote-moby.webp'),
      runningImage: assetUrl('assets/mobby-guide/characters/pote-moby.webp'),
      accent: '#c58b5e',
      greeting: 'ぽてっと参上。ゆるっといこう。'
    },
    yura: {
      name: 'もびゆら',
      tagline: '夜ふかしアーティスト',
      intro: 'この俺様は静かな夜と創作を愛する。気分に合う場所へ、ふわっと誘おう。',
      image: assetUrl('assets/mobby-guide/characters/yura-moby.webp'),
      runningImage: assetUrl('assets/mobby-guide/characters/yura-moby.webp'),
      accent: '#6f64a7',
      greeting: 'この俺様が、もびゆらだ。夜までそばにいよう。'
    },
    reo: {
      name: 'れおもび',
      tagline: '気品ある王さま',
      intro: '私の持ち味は、優雅さと自信。どんな画面でも、堂々とエスコートしよう。',
      image: assetUrl('assets/mobby-guide/characters/reo-moby.webp'),
      runningImage: assetUrl('assets/mobby-guide/characters/reo-moby.webp'),
      accent: '#b08a31',
      greeting: '私が、れおもびだ。優雅に案内しよう。'
    },
    mobibou: {
      name: 'モビ坊',
      tagline: 'やんちゃな相棒',
      intro: 'おれ、元気と勢いなら負けないぞ！ 迷ったら一緒に駆け抜けようぜ！',
      image: assetUrl('assets/mobby-guide/characters/mobibou-moby.webp'),
      runningImage: assetUrl('assets/mobby-guide/characters/mobibou-moby.webp'),
      accent: '#cc4d35',
      greeting: 'おれがモビ坊だ！ 迷ったらついてこい！'
    }
  };

  const createInterface = () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <section class="mobby-guide-picker" id="mobbyGuidePicker" aria-labelledby="mobbyGuidePickerTitle" hidden>
        <div class="mobby-guide-picker__card" role="dialog" aria-modal="true">
          <p class="mobby-guide-picker__eyebrow">Choose your Mobby</p>
          <h2 class="mobby-guide-picker__title" id="mobbyGuidePickerTitle">一緒に歩くモビーを選んでね</h2>
          <p class="mobby-guide-picker__lead">画面の中を自由に動かせる案内役です。<br><strong>キャラはあとから自由に変更できるよ。</strong></p>
          <section class="mobby-guide-picker__preview" id="mobbyGuidePickerPreview" aria-live="polite" hidden>
            <div class="mobby-guide-picker__preview-image-wrap">
              <img id="mobbyGuidePickerPreviewImage" src="" alt="">
            </div>
            <div class="mobby-guide-picker__preview-copy">
              <p>YOUR GUIDE MOBBY</p>
              <h3 id="mobbyGuidePickerPreviewName"></h3>
              <span id="mobbyGuidePickerPreviewTagline"></span>
              <button class="mobby-guide-picker__confirm" id="mobbyGuidePickerConfirm" type="button" disabled>このキャラを選択する</button>
            </div>
          </section>
          <div class="mobby-guide-picker__grid">
            <button class="mobby-guide-choice" type="button" data-guide-character="mobirin" aria-pressed="false" style="--guide-choice-bg:#fff2c9;--guide-choice-accent:#d5a733">
              <img src="${characters.mobirin.image}" alt=""><strong>もびりん</strong><small>知的なおじ</small>
            </button>
            <button class="mobby-guide-choice" type="button" data-guide-character="mobichi" aria-pressed="false" style="--guide-choice-bg:#fbe5f2;--guide-choice-accent:#c972a3">
              <img src="${characters.mobichi.image}" alt=""><strong>もびち</strong><small>気ままギャル♡</small>
            </button>
            <button class="mobby-guide-choice" type="button" data-guide-character="yami" aria-pressed="false" style="--guide-choice-bg:#eee7ff;--guide-choice-accent:#8b73c8">
              <img src="${characters.yami.image}" alt=""><strong>病みモビー</strong><small>メンヘラちゃん</small>
            </button>
            <button class="mobby-guide-choice" type="button" data-guide-character="mobiyan" aria-pressed="false" style="--guide-choice-bg:#ffe5cf;--guide-choice-accent:#d47b3d">
              <img src="${characters.mobiyan.image}" alt=""><strong>もびやん</strong><small>まっすぐなヤンキー</small>
            </button>
            <button class="mobby-guide-choice" type="button" data-guide-character="babu" aria-pressed="false" style="--guide-choice-bg:#ffe8f1;--guide-choice-accent:#e7a6bb">
              <img src="${characters.babu.image}" alt=""><strong>ばぶもび</strong><small>甘えんぼベビー</small>
            </button>
            <button class="mobby-guide-choice" type="button" data-guide-character="pote" aria-pressed="false" style="--guide-choice-bg:#f9e5d2;--guide-choice-accent:#c58b5e">
              <img src="${characters.pote.image}" alt=""><strong>ぽてもび</strong><small>ぽてっと癒し系</small>
            </button>
            <button class="mobby-guide-choice" type="button" data-guide-character="yura" aria-pressed="false" style="--guide-choice-bg:#e8e4ff;--guide-choice-accent:#6f64a7">
              <img src="${characters.yura.image}" alt=""><strong>もびゆら</strong><small>夜ふかしアーティスト</small>
            </button>
            <button class="mobby-guide-choice" type="button" data-guide-character="reo" aria-pressed="false" style="--guide-choice-bg:#fff3c8;--guide-choice-accent:#b08a31">
              <img src="${characters.reo.image}" alt=""><strong>れおもび</strong><small>気品ある王さま</small>
            </button>
            <button class="mobby-guide-choice" type="button" data-guide-character="mobibou" aria-pressed="false" style="--guide-choice-bg:#ffe1d8;--guide-choice-accent:#cc4d35">
              <img src="${characters.mobibou.image}" alt=""><strong>モビ坊</strong><small>やんちゃな相棒</small>
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
      </aside>
      <section class="mobby-guide-profile" id="mobbyGuideProfile" aria-labelledby="mobbyGuideProfileName" hidden>
        <div class="mobby-guide-profile__backdrop" data-profile-close></div>
        <div class="mobby-guide-profile__card" role="dialog" aria-modal="true" aria-labelledby="mobbyGuideProfileName">
          <button class="mobby-guide-profile__close" id="mobbyGuideProfileClose" type="button" aria-label="キャラ紹介を閉じる">×</button>
          <p class="mobby-guide-profile__eyebrow">MY GUIDE MOBBY</p>
          <div class="mobby-guide-profile__hero">
            <div class="mobby-guide-profile__image-wrap">
              <img id="mobbyGuideProfileImage" src="" alt="">
            </div>
            <div class="mobby-guide-profile__copy">
              <h2 id="mobbyGuideProfileName"></h2>
              <p class="mobby-guide-profile__tagline" id="mobbyGuideProfileTagline"></p>
              <p class="mobby-guide-profile__intro" id="mobbyGuideProfileIntro"></p>
            </div>
          </div>
          <div class="mobby-guide-profile__rail-heading">
            <strong>案内キャラを選びなおす</strong>
            <span>横にスワイプしてタップ</span>
          </div>
          <div class="mobby-guide-profile__rail" id="mobbyGuideProfileRail" role="listbox" aria-label="案内キャラの切り替え"></div>
        </div>
      </section>`;
    document.body.append(...wrapper.children);
  };

  createInterface();

  const picker = document.getElementById('mobbyGuidePicker');
  const pickerCard = picker?.querySelector('.mobby-guide-picker__card');
  const pickerPreview = document.getElementById('mobbyGuidePickerPreview');
  const pickerPreviewImage = document.getElementById('mobbyGuidePickerPreviewImage');
  const pickerPreviewName = document.getElementById('mobbyGuidePickerPreviewName');
  const pickerPreviewTagline = document.getElementById('mobbyGuidePickerPreviewTagline');
  const pickerConfirm = document.getElementById('mobbyGuidePickerConfirm');
  const pet = document.getElementById('mobbyGuidePet');
  const petButton = document.getElementById('mobbyGuideCharacter');
  const petImage = document.getElementById('mobbyGuideImage');
  const bubble = document.getElementById('mobbyGuideBubble');
  const message = document.getElementById('mobbyGuideMessage');
  const bubbleClose = document.getElementById('mobbyGuideBubbleClose');
  const profile = document.getElementById('mobbyGuideProfile');
  const profileClose = document.getElementById('mobbyGuideProfileClose');
  const profileImage = document.getElementById('mobbyGuideProfileImage');
  const profileName = document.getElementById('mobbyGuideProfileName');
  const profileTagline = document.getElementById('mobbyGuideProfileTagline');
  const profileIntro = document.getElementById('mobbyGuideProfileIntro');
  const profileRail = document.getElementById('mobbyGuideProfileRail');
  const choices = Array.from(document.querySelectorAll('[data-guide-character]'));
  if (!picker || !pickerCard || !pickerPreview || !pickerPreviewImage || !pickerPreviewName || !pickerPreviewTagline || !pickerConfirm || !pet || !petButton || !petImage || !bubble || !message || !profile || !profileClose || !profileImage || !profileName || !profileTagline || !profileIntro || !profileRail) return;

  let selectedId = '';
  let pendingSelectedId = '';
  let dragging = false;
  let movedDuringDrag = false;
  let dragStartX = 0;
  let dragStartY = 0;
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

  const setInitialPetPosition = (save = false) => {
    const sideMargin = window.innerWidth <= 640 ? 14 : 24;
    const topMargin = Math.max(42, Math.min(64, window.innerHeight * 0.07));
    const width = pet.offsetWidth || (window.innerWidth <= 640 ? 92 : 116);
    setPetPosition(window.innerWidth - width - sideMargin, topMargin, save);
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
    setInitialPetPosition();
  };

  const say = (text) => {
    message.textContent = text;
    bubble.hidden = false;
  };

  const renderProfile = () => {
    const character = characters[selectedId] || characters.mobirin;
    profileImage.src = character.image;
    profileImage.alt = character.name;
    profileName.textContent = character.name;
    profileTagline.textContent = character.tagline || '';
    profileIntro.textContent = character.intro || character.greeting || '';
    profile.style.setProperty('--guide-profile-accent', character.accent);
    profileRail.innerHTML = Object.entries(characters).map(([id, item]) => `
      <button class="mobby-guide-profile__choice${id === selectedId ? ' is-active' : ''}" type="button" role="option" aria-selected="${id === selectedId}" data-profile-id="${id}" style="--guide-profile-choice-accent:${item.accent}">
        <img src="${item.image}" alt="">
        <span>${item.name}</span>
      </button>`).join('');
    profileRail.querySelectorAll('[data-profile-id]').forEach((choice) => {
      choice.addEventListener('click', () => {
        const nextId = choice.dataset.profileId;
        if (!characters[nextId]) return;
        selectCharacter(nextId, false);
        renderProfile();
      });
    });
  };

  const closeProfile = () => {
    profile.hidden = true;
    document.body.classList.remove('mobby-guide-profile-open');
    petButton.focus({ preventScroll: true });
  };

  const openProfile = () => {
    if (!selectedId || pet.hidden) return;
    renderProfile();
    bubble.hidden = true;
    profile.hidden = false;
    document.body.classList.add('mobby-guide-profile-open');
    window.setTimeout(() => profileClose.focus(), 0);
  };

  // Keep the page copy grammatically complete, then add each character's
  // personality as a separate sentence.  Replacing endings inside arbitrary
  // Japanese text made combinations such as 「ですぞやで」 easy to produce.
  const cleanGuideText = (text) => String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[。！？]+$/u, '');

  const makeCasualGuideText = (text) => text
    .replace(/ています/g, 'てる')
    .replace(/しています/g, 'してる')
    .replace(/できています/g, 'できてる')
    .replace(/できます/g, 'できる')
    .replace(/します/g, 'する')
    .replace(/見つけます/g, '見つける')
    .replace(/診断します/g, '診断する')
    .replace(/楽しめます/g, '楽しめる')
    .replace(/読めます/g, '読める')
    .replace(/選べます/g, '選べる')
    .replace(/作れます/g, '作れる')
    .replace(/探します/g, '探す')
    .replace(/照らします/g, '照らす')
    .replace(/積み上げます/g, '積み上げる')
    .replace(/整えます/g, '整える')
    .replace(/伝えます/g, '伝える')
    .replace(/送ります/g, '送る')
    .replace(/考えます/g, '考える')
    .replace(/動きます/g, '動く')
    .replace(/進みます/g, '進む')
    .replace(/選びます/g, '選ぶ')
    .replace(/参りましょう/g, '行こう')
    .replace(/参ります/g, '行く')
    .replace(/いきます/g, 'いく')
    .replace(/います/g, 'いる')
    .replace(/あります/g, 'ある')
    .replace(/ください/g, 'ね')
    .replace(/見ていきましょう/g, '見ていこう')
    .replace(/行きましょう/g, '行こう')
    .replace(/進みましょう/g, '進もう')
    .replace(/楽しみましょう/g, '楽しもう')
    .replace(/選びましょう/g, '選ぼう')
    .replace(/探しましょう/g, '探そう')
    .replace(/作りましょう/g, '作ろう')
    .replace(/確認しましょう/g, '確認しよう')
    .replace(/しましょう/g, 'しよう')
    .replace(/でしょう/g, 'だろう')
    .replace(/です(?=。|$)/gu, 'だ')
    .replace(/ます(?=。|$)/gu, 'る');

  const characterizeText = (text) => {
    const source = cleanGuideText(text);
    if (!source) return '';
    const spokenSource = selectedId === 'mobirin' ? source : makeCasualGuideText(source);

    const speech = {
      // 知的で落ち着いた「おじ」口調
      mobirin: `ふむ。${source}。ゆっくり見ていきますぞ。`,
      // 明るく距離の近いギャル口調
      mobichi: `ねえ、${spokenSource}。いっしょに遊ぼ〜♡`,
      // 不安げだが、相手を急かさない口調
      yami: `…${spokenSource}。無理しなくていいからね。`,
      // まっすぐで面倒見のよい関西ヤンキー口調
      mobiyan: `おう、${spokenSource}。ワシについてきいや！`,
      // 甘えんぼで、語尾に「ばぶう」をつける口調
      babu: `${spokenSource}。ゆっくり遊ぶばぶう。`,
      // ぽてっとした癒し系。休みながら進める口調
      pote: `${spokenSource}。ひと休みしながら遊ぼうね。`,
      // 夜と創作を好む、中二病っぽく詩的な口調
      yura: `この俺様は、${spokenSource}。静かな夜を楽しもう。`,
      // 気品のある王さま。私を一人称にした貴族口調
      reo: `私は、${spokenSource}。優雅に案内しよう。`,
      // 元気でやんちゃな男の子。おれを一人称にした口調
      mobibou: `おれは、${spokenSource}。一緒に遊ぼうぜ！`
    };
    return speech[selectedId] || speech.mobirin;
  };

  const characterizeContext = (context) => {
    if (context.kind === 'home-hero') {
      return homeHeroGuideText[selectedId] || homeHeroGuideText.mobirin;
    }

    if (context.kind === 'quiz-question') {
      const { remaining } = context.quizProgress;
      const comment = getQuizQuestionComment(context.question.text);
      const remainingText = {
        mobirin: `あと${remaining}問ですぞ。`,
        mobichi: `あと${remaining}問だよ〜♡`,
        yami: `あと${remaining}問。無理しないでね。`,
        mobiyan: `あと${remaining}問や！`,
        babu: `あと${remaining}問だばぶう。ゆっくり進むばぶう。`,
        pote: `あと${remaining}問。ひと息ついていこうね。`,
        yura: `この俺様と、あと${remaining}問を夜のペースで進もう。`,
        reo: `あと${remaining}問だ。私とともに、優雅に進もう。`,
        mobibou: `あと${remaining}問だ！ おれと一気にいくぞ！`
      }[selectedId] || `あと${remaining}問です。`;
      return `${comment} ${remainingText}`;
    }

    if (context.kind === 'quiz-progress' || context.kind === 'quiz-complete') {
      const { remaining, total } = context.quizProgress;
      const complete = context.kind === 'quiz-complete';

      if (selectedId === 'mobirin') {
        return complete
          ? `全${total}問、完走ですぞ。結果を見に参りましょう。`
          : `残り${remaining}問。焦りは禁物ですぞ。`;
      }
      if (selectedId === 'mobichi') {
        return complete
          ? `全${total}問クリア〜！ 結果を見よっ♡`
          : `あと${remaining}問！ ノリでいこ〜♡`;
      }
      if (selectedId === 'yami') {
        return complete
          ? `…全${total}問できたね。結果を見にいこう。`
          : `…あと${remaining}問。休みながらでいいよ。`;
      }
      if (selectedId === 'mobiyan') {
        return complete
          ? `全${total}問、制覇や！ 結果を見にいくで！`
          : `残り${remaining}問や！ このまま行くで！`;
      }
      if (selectedId === 'babu') {
        return complete
          ? `全${total}問できたばぶう。結果を見にいくばぶう。`
          : `あと${remaining}問だばぶう。いっしょに、ゆっくり進むばぶう。`;
      }
      if (selectedId === 'pote') {
        return complete
          ? `全${total}問、おつかれさま。結果をゆっくり見ようね。`
          : `あと${remaining}問。ぽてっと、ひと息ずつ進もうね。`;
      }
      if (selectedId === 'yura') {
        return complete
          ? `この俺様、全${total}問を静かにやりきった。結果を見にいこう。`
          : `あと${remaining}問。この俺様の夜のペースで進もう。`;
      }
      if (selectedId === 'reo') {
        return complete
          ? `私は全${total}問を見事に完走した。結果も優雅に見よう。`
          : `残り${remaining}問だ。私とともに、優雅に進もう。`;
      }
      return complete
        ? `おれ、全${total}問クリアだ！ 結果を見にいくぞ！`
        : `あと${remaining}問だ！ おれと一気にいくぞ！`;
    }

    return characterizeText(context.text);
  };

  const pageDescriptions = [
    [/\/16school\//, '学校での裏キャラを、40問で見つけます。'],
    [/\/16renai\//, '恋のクセを、40問で見つけます。'],
    [/\/16love\//, '恋の重さを、かわいいタイプに変えて診断します。'],
    [/\/16fear\//, '怖さの正体を、タイプ名にして診断します。'],
    [/\/16night\//, '夜の才能を、40問で照らします。'],
    [/\/16stan\//, 'あなたの沼り方を、推し活タイプとして診断します。'],
    [/\/16ml\//, '今の恋に合う一曲を、モビーと探します。'],
    [/\/compositing(?:\.html|\/)/, '写真を選んで、TikTokに載せたくなる一枚を作れます。'],
    [/\/gacha\//, 'モビーのシールを引いて、コレクションを増やせます。'],
    [/\/ehon\//, 'モビーたちの物語を、1ページずつ楽しめます。'],
    [/\/mobby-custom\//, '世界に一体だけのモビーを作れます。'],
    [/\/mobby-touch\//, 'モビーをつついて、いろいろな反応を楽しめます。'],
    [/\/mypage/, 'ここは、あなた専用のモビー基地です。'],
    [/\/legal\//, '大切な案内を確認できます。'],
    [/\/korea\//, '韓国語モードで、モビーを楽しめます。'],
    [/\/(?:hinata-aoi|imagen-luca|karen|meeco|miyake-yuko)\//, 'コラボ限定の診断を楽しめます。結果は、友だちにも見せたくなるかも。']
  ];

  const homeDescriptions = [
    ['.hero-carousel-shell', 'ほっぺを引っ張ると、モビーが反応します。'],
    ['.home-manga-feature', 'モビーの4コマ漫画を、1話ずつ読めます。'],
    ['.home-main-actions', '診断やポスター作りなど、次の遊びを選べます。'],
    ['.popup-buttons-bar', '隠しメニューから、まだまだ遊べます。']
  ];

  // Keep cheek-pulling wording with the original four characters. The five
  // newer guide characters accompany the carousel, so their copy describes
  // watching or exploring instead of saying that they are pulled.
  const homeHeroGuideText = {
    mobirin: 'ほっぺを引っ張ると、モビーが反応しますぞ。ゆっくり見ていきますぞ。',
    mobichi: 'ほっぺを引っ張ると、モビーが反応するよ〜♡ いっしょに遊ぼっ！',
    yami: 'ほっぺを引っ張ると、モビーが反応するよ。無理しなくていいからね。',
    mobiyan: 'ほっぺを引っ張ると、モビーが反応するで！ いっしょに試してみいや！',
    babu: 'ばぶもびと一緒に、モビーの動きをゆっくり眺めるばぶう。',
    pote: 'ぽてもびと一緒に、モビーを眺めながらひと休みしようね。',
    yura: 'この俺様と一緒に、モビーの動きを静かに楽しもう。',
    reo: '私とともに、モビーの動きを優雅に楽しもう。',
    mobibou: 'おれと一緒に、いろんなモビーの動きを楽しもうぜ！'
  };

  const quizCommentRules = [
    {
      pattern: /返信|既読|未読|line|dm|連絡|メッセージ|文面/i,
      comments: {
        mobirin: '返信は、送る前に文面を整えますぞ。',
        mobichi: '既読をつけても、気分が乗ったらすぐ返信〜♡',
        yami: '…返事が来るまで、何度も画面を見ちゃう。',
        mobiyan: '用があるなら、電話で話すで！',
        babu: '返信は、ゆっくり考えてから送るばぶう。',
        pote: '返信は、ひと息ついてから送るね。',
        yura: 'この俺様は、夜の静かな時間にゆっくり返事を考える。',
        reo: '私は、相手に失礼のないよう文面を整えて送る。',
        mobibou: '用があるなら、おれがすぐ返すぞ！'
      }
    },
    {
      pattern: /sns|投稿|ストーリー|写真|匂わせ|いいね|拡散|発信/i,
      comments: {
        mobirin: '投稿前に、誤字を三度確認しますぞ。',
        mobichi: '盛れたら、すぐストーリーに上げちゃう〜♡',
        yami: '…意味深な曲を、そっと載せちゃうかも。',
        mobiyan: '匂わせるより、本人に直接言うで！',
        babu: 'かわいく撮れたら、みんなに見せたいばぶう。',
        pote: '気に入った一枚を、ゆっくり選びたいな。',
        yura: 'この俺様は、夜の光と音を静かに残す。',
        reo: '私は、見せるなら世界観まで美しく整える。',
        mobibou: 'いい写真が撮れたら、おれがどんどん発信するぞ！'
      }
    },
    {
      pattern: /推し|ライブ|配信|現場|イベント|アーカイブ|通知/i,
      comments: {
        mobirin: '情報を整理して、計画的に推しますぞ。',
        mobichi: '推しは、浴びられるときにたっぷり浴びる〜♡',
        yami: '…推しの通知だけは、すぐ見る。',
        mobiyan: '現場があるなら、最前を目指すで！',
        babu: '推しの配信、いっしょに見たいばぶう。',
        pote: '無理せず、長く推せるペースがいいね。',
        yura: 'この俺様は、推しの歌を夜に静かに味わう。',
        reo: '私は、推しの魅力を品よく語る。',
        mobibou: 'おれ、現場も配信も全力で追うぞ！'
      }
    },
    {
      pattern: /メイク|服|靴|衣装|ドレス|ネイル|アクセサリー|見た目|着飾|清楚|華やか|盛りたい/i,
      comments: {
        mobirin: '身だしなみは、清潔感を第一に整えますぞ。',
        mobichi: 'いちばん盛れてるほうを選ぶ〜♡',
        yami: '…黒を選ぶと、少し安心する。',
        mobiyan: '見た目より、気合いで勝負や！',
        babu: 'ふわふわで、かわいい服が好きばぶう。',
        pote: '着心地がよくて、落ち着く服がいいな。',
        yura: 'この俺様は、夜の空気に合う個性的な服を選ぶ。',
        reo: '私は、装いにも品と自分らしさを添える。',
        mobibou: 'おれは、動きやすくてかっこいいのが一番だ！'
      }
    },
    {
      pattern: /お金|時給|売上|ランキング|稼|目標金額|数字を追|仕事|働|シャンパン|ボトル/i,
      comments: {
        mobirin: '数字を確認して、堅実に積み上げますぞ。',
        mobichi: '楽しくて、ちゃんと盛れる仕事が最強〜♡',
        yami: '…数字を比べると、すぐ自信がなくなる。',
        mobiyan: '目標があるなら、一番を取りにいくで！',
        babu: 'がんばったら、いっぱいほめてほしいばぶう。',
        pote: '無理しないペースで、少しずつ積み上げたいね。',
        yura: 'この俺様は、数字より自分の表現を大切にする。',
        reo: '私は、結果を品よく着実に積み上げる。',
        mobibou: 'おれ、やるからにはしっかり稼ぐぞ！'
      }
    },
    {
      pattern: /意見|衝突|強い口調|押し切|言い方|提案|決断|注意され|言い返|主張/i,
      comments: {
        mobirin: '意見は、理由を添えて落ち着いて伝えますぞ。',
        mobichi: '空気は読むけど、言いたいことは言う〜♡',
        yami: '…嫌われそうで、言葉を引っ込めちゃう。',
        mobiyan: '曲げへん。思ったことは正面から言うで！',
        babu: 'けんかはこわいから、やさしく話したいばぶう。',
        pote: '急がず、相手の話も聞いてから伝えようね。',
        yura: 'この俺様は、言葉を選んで静かに本音を伝える。',
        reo: '私は、相手への敬意を添えて意見を伝える。',
        mobibou: 'おれ、言いたいことははっきり言うぞ！'
      }
    },
    {
      pattern: /頼る|助け|相談|友達|仲間|支え|愚痴|悩みを聞|ありがとう/i,
      comments: {
        mobirin: '頼ることも、立派な判断ですぞ。',
        mobichi: '困ったら、友だちにすぐボイス送っちゃう〜♡',
        yami: '…迷惑かなって思って、なかなか言えない。',
        mobiyan: '仲間やろ。遠慮せず頼ってええで！',
        babu: '困ったら、ぎゅっとして助けてもらいたいばぶう。',
        pote: '困ったときは、ひと休みしてから相談しようね。',
        yura: 'この俺様は、信頼できる人に静かに話す。',
        reo: '私は、助けを求めることも強さのひとつだと考える。',
        mobibou: 'おれたち仲間だろ。遠慮なく頼ってくれ！'
      }
    },
    {
      pattern: /予定|段取り|準備|確認|情報を集|後回し|優先度|計画|習慣|ペースを乱|変更/i,
      comments: {
        mobirin: '段取りを整えてから、落ち着いて動きますぞ。',
        mobichi: '予定はざっくり、あとはその日のノリ〜♡',
        yami: '…何度も確認しないと、不安になっちゃう。',
        mobiyan: '考えすぎる前に、まず動くで！',
        babu: 'ゆっくり準備して、いっしょに進むばぶう。',
        pote: '予定はひとつずつ、ぽてっと進めたいな。',
        yura: 'この俺様は、余白を残してその日の気分も大切にする。',
        reo: '私は、予定を美しく整え、余裕を持って進む。',
        mobibou: 'おれ、準備できたらすぐ出発だ！'
      }
    },
    {
      pattern: /不安|怖|気になる|心配|落ち込|責め|嫌われ|失敗|ミス|ソワソワ|モヤモヤ|ざわつ|眠れ|緊張/i,
      comments: {
        mobirin: '不安は、事実と想像に分けて考えますぞ。',
        mobichi: '考えすぎる前に、今日は早めに寝よ〜♡',
        yami: '…うん。ずっと気になって、眠れなくなる。',
        mobiyan: '怖くても、正面から向き合うで！',
        babu: 'こわいときは、そばにいてほしいばぶう。',
        pote: '不安な日は、あたたかいものを飲んで休もうね。',
        yura: 'この俺様が、不安も夜の静けさの中で少しずつほどく。',
        reo: '私は、心配ならひとつずつ確かめる。',
        mobibou: '怖くても、おれがついてるぞ！'
      }
    },
    {
      pattern: /好きな人|恋|恋人|彼氏|元カレ|デート|別れ|失恋|異性|告白|大切にされ|大事にされ/i,
      comments: {
        mobirin: '気持ちは、言葉で確かめたいですぞ。',
        mobichi: '好きなら、好きって顔に出ちゃう〜♡',
        yami: '…好きになると、その人ばかり見ちゃう。',
        mobiyan: '好きなら、正面から行くで！',
        babu: '好きな人と、ずっといっしょがいいばぶう。',
        pote: '安心できる恋を、ゆっくり育てたいね。',
        yura: 'この俺様は、好きな気持ちを夜にそっと育てる。',
        reo: '私は、愛をまっすぐに、そして優雅に伝える。',
        mobibou: 'おれ、好きなら全力でいくぞ！'
      }
    },
    {
      pattern: /一人|ひとり|静か|自分の時間|自然体|落ち着いた|家で|在宅|じっくり|少人数/i,
      comments: {
        mobirin: 'ひとり時間は、考えを整理する大切な時間ですぞ。',
        mobichi: 'その日の気分で、ソロも全然あり〜♡',
        yami: '…ひとりのほうが、息をしやすい。',
        mobiyan: '一人もええけど、仲間とおるほうが熱いやろ！',
        babu: 'ひとりはさみしいから、いっしょにいてほしいばぶう。',
        pote: 'ひとりで、ぽてっと休むのもいいね。',
        yura: 'この俺様は、ひとりの静けさで創作を育てる。',
        reo: '私は、ひとりの時間も優雅に楽しむ。',
        mobibou: 'おれ、一人もいいけどみんなで遊ぶぞ！'
      }
    },
    {
      pattern: /クラス|教室|グループ|文化祭|体育祭|初対面|大勢|輪に入|会話|話題|お客さん|場の空気/i,
      comments: {
        mobirin: 'まず周りを見て、必要なら場をまとめますぞ。',
        mobichi: '知ってる子がいたら、すぐ混ざる〜♡',
        yami: '…端っこの席のほうが、落ち着く。',
        mobiyan: 'ワシから声をかけたるで！',
        babu: 'やさしい人のとなりに、ちょこんと座りたいばぶう。',
        pote: '無理せず、話しやすい人から話せば大丈夫だよ。',
        yura: 'この俺様は、場の空気を感じながら静かに輪に入る。',
        reo: '私は、場を見渡し、皆が楽しめるように動く。',
        mobibou: 'おれから声をかけるぞ！'
      }
    }
  ];

  const getQuizQuestionComment = (questionText) => {
    const text = String(questionText || '');
    const matched = quizCommentRules.find((rule) => rule.pattern.test(text));
    if (matched) return matched.comments[selectedId] || matched.comments.mobirin;
    return {
      mobirin: 'わたくしなら、理由を考えて選びますぞ。',
      mobichi: 'もびちは、楽しそうなほうを選ぶ〜♡',
      yami: '…私は、悪いほうまで考えちゃう。',
      mobiyan: 'ワシなら、迷わず決めるで！',
      babu: 'ばぶもびは、ゆっくり選ぶばぶう。',
      pote: 'ぽてもびは、ひと息ついて選ぶね。',
      yura: 'この俺様は、心が動くほうを選ぶ。',
      reo: '私は、優雅に決める。',
      mobibou: 'おれなら、直感で決めるぞ！'
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
    // Prefer a real heading or the dialog's own accessible label.  Looking
    // for any [aria-label] first could pick a close button and produce copy
    // such as 「×」を見ています, which is not useful Japanese.
    const heading = dialog.querySelector('h1, h2, h3, [data-dialog-title]');
    const label = heading?.textContent?.trim() || dialog.getAttribute('aria-label') || '詳しい内容';
    if (/\/compositing(?:\.html|\/)/.test(window.location.pathname.toLowerCase())) {
      return {
        key: `dialog:poster:${label}`,
        text: 'テンプレートを選ぶと、画像を仕上げられます。TikTok向けの次の一枚もここから作れます。'
      };
    }
    return { key: `dialog:${label}`, text: `「${label}」を見ています。迷ったら、直感で選んでみてください。` };
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
      if (best) {
        if (best.key === '.hero-carousel-shell') best.kind = 'home-hero';
        return best;
      }
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

  const previewPickerCharacter = (id) => {
    const character = characters[id];
    if (!character) return;
    pendingSelectedId = id;
    pickerPreviewImage.src = character.image;
    pickerPreviewImage.alt = character.name;
    pickerPreviewName.textContent = character.name;
    pickerPreviewTagline.textContent = character.tagline || '';
    pickerPreview.style.setProperty('--guide-picker-preview-accent', character.accent);
    pickerConfirm.disabled = false;
    pickerConfirm.setAttribute('aria-label', `${character.name}を案内キャラに選択する`);
    pickerPreview.hidden = false;
    choices.forEach((choice) => {
      const selected = choice.dataset.guideCharacter === id;
      choice.classList.toggle('is-selected', selected);
      choice.setAttribute('aria-pressed', String(selected));
    });
    window.requestAnimationFrame(() => {
      if (typeof pickerCard.scrollTo === 'function') {
        pickerCard.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        pickerCard.scrollTop = 0;
      }
    });
  };

  const selectCharacter = (id, announce = true, useInitialPosition = false) => {
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
      if (useInitialPosition) setInitialPetPosition(true);
      else restorePetPosition();
      if (announce) say(character.greeting);
      else updateContext(true);
    });
  };

  const openPicker = () => {
    profile.hidden = true;
    document.body.classList.remove('mobby-guide-profile-open');
    pendingSelectedId = '';
    pickerPreview.hidden = true;
    pickerPreviewImage.removeAttribute('src');
    pickerPreviewImage.alt = '';
    pickerConfirm.disabled = true;
    pickerConfirm.removeAttribute('aria-label');
    pickerCard.scrollTop = 0;
    choices.forEach((choice) => {
      choice.classList.remove('is-selected');
      choice.setAttribute('aria-pressed', 'false');
    });
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
    choice.addEventListener('click', () => previewPickerCharacter(choice.dataset.guideCharacter));
  });

  pickerConfirm.addEventListener('click', () => {
    if (!pendingSelectedId || !characters[pendingSelectedId]) return;
    selectCharacter(pendingSelectedId, true, true);
  });

  bubbleClose?.addEventListener('click', (event) => {
    event.stopPropagation();
    bubble.hidden = true;
  });

  profileClose.addEventListener('click', closeProfile);
  profile.addEventListener('click', (event) => {
    if (event.target.closest('[data-profile-close]')) closeProfile();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !profile.hidden) closeProfile();
  });

  petButton.addEventListener('click', () => {
    if (movedDuringDrag) {
      movedDuringDrag = false;
      return;
    }
    openProfile();
  });

  petButton.addEventListener('dblclick', () => {
    openProfile();
  });

  pet.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.mobby-guide-pet__bubble')) return;
    dragging = true;
    movedDuringDrag = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOffsetX = event.clientX - pet.getBoundingClientRect().left;
    dragOffsetY = event.clientY - pet.getBoundingClientRect().top;
    lastPointerX = event.clientX;
    // Keep capture on the actual character button. Capturing on the parent
    // retargeted pointerup away from the button on some touch browsers, so a
    // normal tap never reached the profile-opening click handler.
    petButton.setPointerCapture?.(event.pointerId);
  });

  pet.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const distance = Math.hypot(event.clientX - dragStartX, event.clientY - dragStartY);
    if (!movedDuringDrag && distance < 6) return;
    if (!movedDuringDrag) {
      movedDuringDrag = true;
      petImage.src = characters[selectedId]?.runningImage || petImage.src;
      pet.classList.add('is-dragging');
    }
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
      petButton.releasePointerCapture?.(event.pointerId);
    }
    if (movedDuringDrag) {
      const rect = pet.getBoundingClientRect();
      setPetPosition(rect.left, rect.top, true);
    }
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
      window.addEventListener('mobby-splash-complete', () => startGuide({ alwaysChoose: false }), { once: true });
    } else {
      startGuide({ alwaysChoose: false });
    }
  } else {
    startGuide({ alwaysChoose: false });
  }
})();
