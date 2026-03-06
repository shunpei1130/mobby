(() => {
  const data = window.MOBBY_GACHA_DATA;
  if (!data) return;

  const STORAGE_KEY = 'mobby-gacha-state-v2';
  const LEGACY_STORAGE_KEY = 'mobby-gacha-state-v1';
  const ACTIVE_BANNER_ID = 'love_truth_mvp';
  const MAX_HISTORY = 5;
  const MAX_SHOWCASE_CHARACTERS = 4;
  const RARITY_WEIGHT = { N: 1, R: 2, SSR: 3 };
  const RARITY_DISPLAY_ORDER = ['N', 'R', 'SSR'];
  const COLLECTION_TABS = [
    { key: 'all', label: 'ぜんぶ', cats: ['school_m', 'school_f', 'mama', 'night', 'stan', 'love'] },
    { key: 'school', label: '学校', cats: ['school_m', 'school_f'] },
    { key: 'mama', label: 'ママ', cats: ['mama'] },
    { key: 'night', label: '夜職', cats: ['night'] },
    { key: 'stan', label: '推し活', cats: ['stan'] },
    { key: 'love', label: 'メンヘラ', cats: ['love'] },
  ];
  const collectionTabMap = new Map(COLLECTION_TABS.map((tab) => [tab.key, { ...tab, catSet: new Set(tab.cats) }]));

  const cardsById = new Map(data.cards.map((card) => [card.id, card]));
  const charactersById = new Map(data.characters.map((character) => [character.id, character]));
  const activeBanner = data.banners.find((banner) => banner.id === ACTIVE_BANNER_ID) ?? data.banners[0];
  if (!activeBanner) return;

  const bannerPool = activeBanner.poolCardIds.map((id) => getCardViewModel(cardsById.get(id))).filter(Boolean);
  const bannerCardsByCharacterId = new Map();
  bannerPool.forEach((card) => {
    const list = bannerCardsByCharacterId.get(card.characterId) ?? [];
    list.push(card);
    list.sort(compareCardByRarityDesc);
    bannerCardsByCharacterId.set(card.characterId, list);
  });

  const bannerCharacterIds = activeBanner.characterIds?.length ? activeBanner.characterIds : Array.from(bannerCardsByCharacterId.keys());
  const bannerCharacters = bannerCharacterIds.map((id) => charactersById.get(id)).filter(Boolean);
  const bannerCharacterIdSet = new Set(bannerCharacters.map((character) => character.id));

  const state = normalizeState(loadState());
  let isSpinning = false;
  let timers = [];
  let shareFeedbackMessage = '';
  let currentMultiResultEntries = [];

  ensureStarterExperienceDom();

  const els = {
    bannerName: document.getElementById('bannerName'),
    bannerDescription: document.getElementById('bannerDescription'),
    freeRatesText: document.getElementById('freeRatesText'),
    paidRatesText: document.getElementById('paidRatesText'),
    machineBannerLabel: document.getElementById('machineBannerLabel'),
    freeModeButton: document.getElementById('freeModeButton'),
    paidModeButton: document.getElementById('paidModeButton'),
    modeStatus: document.getElementById('modeStatus'),
    startGachaButton: document.getElementById('startGachaButton'),
    spinAgainButton: document.getElementById('spinAgainButton'),
    jumpCollectionButton: document.getElementById('jumpCollectionButton'),
    gachaMachine: document.getElementById('gachaMachine'),
    gachaCapsuleDrop: document.getElementById('gachaCapsuleDrop'),
    gachaStatus: document.getElementById('gachaStatus'),
    gachaTrayCopy: document.getElementById('gachaTrayCopy'),
    resultCard: document.getElementById('resultCard'),
    resultEmpty: document.getElementById('resultEmpty'),
    resultFilled: document.getElementById('resultFilled'),
    resultImage: document.getElementById('resultImage'),
    resultRarity: document.getElementById('resultRarity'),
    resultOwnership: document.getElementById('resultOwnership'),
    resultTitle: document.getElementById('resultTitle'),
    resultLine: document.getElementById('resultLine'),
    resultDetail: document.getElementById('resultDetail'),
    collectionProgressPill: document.getElementById('collectionProgressPill'),
    historyList: document.getElementById('historyList'),
    collectionSection: document.getElementById('collectionSection'),
    collectionSummary: document.getElementById('collectionSummary'),
    collectionLead: document.getElementById('collectionLead'),
    collectionTabs: document.getElementById('collectionTabs'),
    collectionProgressBar: document.getElementById('collectionProgressBar'),
    collectionGrid: document.getElementById('collectionGrid'),
    shareSection: document.getElementById('shareSection'),
    shareSummaryNote: document.getElementById('shareSummaryNote'),
    shareStage: document.getElementById('shareStage'),
    shareStageGrid: document.getElementById('shareStageGrid'),
    shareStageTags: document.getElementById('shareStageTags'),
    shareHeadline: document.getElementById('shareHeadline'),
    shareSubline: document.getElementById('shareSubline'),
    shareOwnedCount: document.getElementById('shareOwnedCount'),
    shareHelpText: document.getElementById('shareHelpText'),
    downloadShareButton: document.getElementById('downloadShareButton'),
    nativeShareButton: document.getElementById('nativeShareButton'),
    starterBonus: document.getElementById('starterBonus'),
    starterBonusCopy: document.getElementById('starterBonusCopy'),
    starterTenPullButton: document.getElementById('starterTenPullButton'),
    multiResult: document.getElementById('multiResult'),
    multiResultSummary: document.getElementById('multiResultSummary'),
    multiResultGrid: document.getElementById('multiResultGrid'),
    shareCanvas: document.getElementById('shareCanvas'),
    miniCapsules: Array.from(document.querySelectorAll('.gacha-mini-capsule')),
  };

  bindEvents();
  renderStaticSections();
  populateMiniCapsules();
  renderModeState({ resetMachineText: true });
  renderHistory();
  renderCollection();
  renderShareStage();
  restoreLastResult();

  function loadState() {
    const fallback = { selectedMode: 'free', ownedCardIds: [], history: [], lastCardId: null, dailyClaimDateJst: null, selectedCollectionTab: 'all', showcaseCharacterIds: [], starterTenPullClaimed: false, lastStarterPullCardIds: [], lastPullType: 'single' };
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
      return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
    } catch {
      return fallback;
    }
  }

  function normalizeState(rawState) {
    const ownedCardIds = unique((rawState.ownedCardIds ?? []).filter((id) => cardsById.has(id)));
    const history = Array.isArray(rawState.history) ? rawState.history.filter((entry) => entry && typeof entry.cardId === 'string' && cardsById.has(entry.cardId)).slice(0, MAX_HISTORY) : [];
    const hasExistingProgress = ownedCardIds.length > 0 || history.length > 0 || Boolean(rawState.dailyClaimDateJst) || Boolean(rawState.lastCardId);
    return {
      selectedMode: rawState.selectedMode === 'paid' ? 'paid' : 'free',
      ownedCardIds,
      history,
      lastCardId: typeof rawState.lastCardId === 'string' && cardsById.has(rawState.lastCardId) ? rawState.lastCardId : null,
      dailyClaimDateJst: typeof rawState.dailyClaimDateJst === 'string' ? rawState.dailyClaimDateJst : null,
      selectedCollectionTab: normalizeCollectionTabKey(rawState.selectedCollectionTab),
      showcaseCharacterIds: unique((rawState.showcaseCharacterIds ?? []).filter((id) => bannerCharacterIdSet.has(id))).slice(0, MAX_SHOWCASE_CHARACTERS),
      starterTenPullClaimed: typeof rawState.starterTenPullClaimed === 'boolean' ? rawState.starterTenPullClaimed : hasExistingProgress,
      lastStarterPullCardIds: (rawState.lastStarterPullCardIds ?? []).filter((id) => cardsById.has(id)).slice(0, 10),
      lastPullType: rawState.lastPullType === 'starter' ? 'starter' : 'single',
    };
  }

  function saveState() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

    function bindEvents() {
    els.freeModeButton?.addEventListener('click', () => {
      state.selectedMode = 'free';
      shareFeedbackMessage = '';
      saveState();
      renderModeState({ resetMachineText: true });
    });

    els.paidModeButton?.addEventListener('click', () => {
      state.selectedMode = 'paid';
      shareFeedbackMessage = '';
      saveState();
      renderModeState({ resetMachineText: true });
    });

    els.startGachaButton?.addEventListener('click', startSpin);
    els.spinAgainButton?.addEventListener('click', startSpin);
    els.starterTenPullButton?.addEventListener('click', startStarterTenPull);

    els.jumpCollectionButton?.addEventListener('click', () => {
      if (!state.lastCardId) return;
      const currentCard = getCardViewModel(cardsById.get(state.lastCardId));
      if (!currentCard) return;
      openCollectionSection();
      window.requestAnimationFrame(() => highlightCollectionCharacter(currentCard.characterId, true));
    });

    els.historyList?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-history-card-id]');
      if (!button) return;
      const card = getCardViewModel(cardsById.get(button.dataset.historyCardId));
      if (!card) return;
      shareFeedbackMessage = '';
      state.lastCardId = card.id;
      saveState();
      showCard(card, { ownership: state.ownedCardIds.includes(card.id) ? 'owned' : 'preview' });
      renderCollection();
      renderShareStage();
      highlightMultiResultCard(card.id);
    });

    els.collectionTabs?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-collection-tab]');
      if (!button) return;
      const nextTab = normalizeCollectionTabKey(button.dataset.collectionTab);
      if (state.selectedCollectionTab === nextTab) return;
      state.selectedCollectionTab = nextTab;
      saveState();
      renderCollection();
    });

    els.collectionGrid?.addEventListener('click', (event) => {
      const showcaseButton = event.target.closest('[data-showcase-character-id]');
      if (showcaseButton) {
        event.preventDefault();
        event.stopPropagation();
        toggleShowcaseCharacter(showcaseButton.dataset.showcaseCharacterId);
        return;
      }

      const cardEl = event.target.closest('[data-character-id]');
      if (!cardEl) return;
      const strongestOwnedCard = getStrongestOwnedCard(cardEl.dataset.characterId);
      if (!strongestOwnedCard) return;

      shareFeedbackMessage = '';
      state.lastCardId = strongestOwnedCard.id;
      saveState();
      showCard(strongestOwnedCard, { ownership: 'owned' });
      renderCollection();
      renderShareStage();
      highlightMultiResultCard(strongestOwnedCard.id);
    });

    els.multiResultGrid?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-multi-card-id]');
      if (!button) return;
      const entry = currentMultiResultEntries.find((item) => item.card.id === button.dataset.multiCardId);
      if (!entry) return;
      state.lastCardId = entry.card.id;
      saveState();
      showCard(entry.card, { ownership: entry.isNew ? 'new' : 'owned' });
      highlightMultiResultCard(entry.card.id);
      renderCollection();
    });

    els.downloadShareButton?.addEventListener('click', async () => {
      const blob = await createShareImageBlob();
      if (!blob) {
        setShareFeedback('まだ保存できるボードがありません。まずは1回引いてみて。');
        return;
      }
      downloadBlob(blob, buildShareFileName());
      setShareFeedback('画像を保存したよ。ストーリーや投稿にそのまま使えます。');
    });

    els.nativeShareButton?.addEventListener('click', async () => {
      const blob = await createShareImageBlob();
      if (!blob) {
        setShareFeedback('まだシェアできるボードがありません。まずは1回引いてみて。');
        return;
      }

      const fileName = buildShareFileName();
      const shareText = buildShareText(getShareSelection().previewStates);

      if (!supportsNativeShare()) {
        downloadBlob(blob, fileName);
        setShareFeedback('この端末では画像共有に未対応だったので、保存できるようにしたよ。');
        return;
      }

      const file = new File([blob], fileName, { type: 'image/png' });
      const canShareFiles = typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] });
      if (!canShareFiles) {
        downloadBlob(blob, fileName);
        setShareFeedback('この端末では画像共有に未対応だったので、保存できるようにしたよ。');
        return;
      }

      try {
        await navigator.share({ title: 'MOBBY CAPSULE', text: shareText, files: [file] });
        setShareFeedback('シェアシートを開いたよ。');
      } catch (error) {
        if (error?.name !== 'AbortError') {
          downloadBlob(blob, fileName);
          setShareFeedback('共有が開けなかったので、保存できるようにしたよ。');
        }
      }
    });
  }

  function renderStaticSections() {
    if (els.bannerName) els.bannerName.textContent = activeBanner.name;
    if (els.bannerDescription) els.bannerDescription.textContent = activeBanner.description;
    if (els.freeRatesText) els.freeRatesText.textContent = formatRates(activeBanner.freeRates);
    if (els.paidRatesText) els.paidRatesText.textContent = formatRates(activeBanner.paidRates);
    if (els.machineBannerLabel) els.machineBannerLabel.textContent = 'MOBBY CAPSULE';
  }

  function populateMiniCapsules() {
    if (!els.miniCapsules.length || !bannerCharacters.length) return;
    const previews = shuffleArray(bannerCharacters.map((character) => {
      const previewCard = getStrongestDefinedCard(character.id);
      return previewCard ? { imageUrl: previewCard.imageUrl, name: character.name } : null;
    }).filter(Boolean));
    els.miniCapsules.forEach((capsule, index) => {
      const preview = previews[index % previews.length];
      if (!preview) return;
      capsule.style.setProperty('--capsule-image', `url("${resolveAssetPath(preview.imageUrl)}")`);
      capsule.title = preview.name;
    });
  }

      function ensureStarterExperienceDom() {
    if (!document.getElementById('starterBonus')) {
      const modeStatus = document.getElementById('modeStatus');
      modeStatus?.insertAdjacentHTML('afterend', `
        <div class="starter-bonus" id="starterBonus" hidden>
          <div class="starter-bonus-copy">
            <p class="starter-bonus-kicker">FIRST 10</p>
            <h3>初回だけの無料10連</h3>
            <p class="starter-bonus-note" id="starterBonusCopy">初回だけ無料。10枚目はR以上。</p>
          </div>
          <button class="action-button primary starter-bonus-button" id="starterTenPullButton" type="button">初回10連をひく</button>
        </div>
      `);
    }

    if (!document.getElementById('multiResult')) {
      const resultActions = document.querySelector('.result-actions');
      resultActions?.insertAdjacentHTML('beforebegin', `
        <div class="multi-result" id="multiResult" hidden>
          <div class="multi-result-head">
            <p class="multi-result-kicker">FIRST 10</p>
            <p class="multi-result-summary" id="multiResultSummary"></p>
          </div>
          <div class="multi-result-grid" id="multiResultGrid"></div>
        </div>
      `);
    }
  }

  function renderModeState(options = {}) {
    const freeAvailable = canUseFreeDaily();
    const isFreeMode = state.selectedMode === 'free';
    const starterAvailable = canUseStarterTenPull();
    const startDisabled = isSpinning || (isFreeMode && !freeAvailable);

    els.freeModeButton?.classList.toggle('is-active', isFreeMode);
    els.paidModeButton?.classList.toggle('is-active', !isFreeMode);
    if (els.startGachaButton) els.startGachaButton.disabled = startDisabled;
    if (els.spinAgainButton) els.spinAgainButton.disabled = startDisabled;
    if (els.starterTenPullButton) els.starterTenPullButton.disabled = isSpinning || !starterAvailable;

    if (isFreeMode) {
      if (els.modeStatus) els.modeStatus.textContent = freeAvailable ? '今日の無料1回が使えます。' : '無料1回は受け取り済み。スタンダードなら続けて回せます。';
    } else {
      if (els.modeStatus) els.modeStatus.textContent = 'もっと引きたい時のモード。';
    }

    syncStarterBonus(starterAvailable);

    if (options.resetMachineText && !isSpinning) {
      if (els.gachaStatus) els.gachaStatus.textContent = '回して今日の1枚を開けよう。';
      if (els.gachaTrayCopy) els.gachaTrayCopy.textContent = 'まだカプセルは出ていません';
    }
  }

  function canUseFreeDaily() {
    return state.dailyClaimDateJst !== getJstDateKey();
  }

  function syncStarterBonus(starterAvailable) {
    if (!starterAvailable) {
      removeStarterBonus();
      return;
    }
    if (els.starterBonus) els.starterBonus.hidden = false;
    if (els.starterBonusCopy) els.starterBonusCopy.textContent = '初回だけ無料。10枚目はR以上。';
  }

  function removeStarterBonus() {
    if (els.starterBonus) {
      els.starterBonus.remove();
      els.starterBonus = null;
    }
    els.starterBonusCopy = null;
    els.starterTenPullButton = null;
  }

  function getJstDateKey() {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    return `${parts.find((item) => item.type === 'year')?.value}-${parts.find((item) => item.type === 'month')?.value}-${parts.find((item) => item.type === 'day')?.value}`;
  }

    function canUseStarterTenPull() {
    return !state.starterTenPullClaimed;
  }

  function startSpin() {
    if (isSpinning) return;
    if (state.selectedMode === 'free' && !canUseFreeDaily()) {
      renderModeState({ resetMachineText: true });
      return;
    }

    const pulledCard = drawCard(state.selectedMode);
    if (!pulledCard) return;

    shareFeedbackMessage = '';
    isSpinning = true;
    clearTimers();
    resetMachineVisual();
    hideMultiResult();
    applyCapsulePalette(pulledCard.rarity);
    if (els.gachaMachine) els.gachaMachine.dataset.rarity = pulledCard.rarity;
    setIdleState();
    if (els.gachaStatus) els.gachaStatus.textContent = 'カプセル準備中。';
    if (els.gachaTrayCopy) els.gachaTrayCopy.textContent = 'ころんと出てくる瞬間を待ってね';
    if (els.startGachaButton) els.startGachaButton.disabled = true;
    if (els.spinAgainButton) els.spinAgainButton.disabled = true;
    if (els.starterTenPullButton) els.starterTenPullButton.disabled = true;

    void els.gachaMachine?.offsetWidth;
    els.gachaMachine?.classList.add('is-spinning');

    schedule(() => {
      els.gachaMachine?.classList.add('has-capsule');
      if (els.gachaStatus) els.gachaStatus.textContent = pulledCard.rarity === 'SSR' ? 'きらっと光った。レアな気配。' : 'カプセルが出てきた。';
      if (els.gachaTrayCopy) els.gachaTrayCopy.textContent = 'あと少しでオープン';
    }, 1450);

    schedule(() => revealCard(pulledCard), pulledCard.rarity === 'SSR' ? 2550 : 2300);
  }

  function startStarterTenPull() {
    if (isSpinning || !canUseStarterTenPull()) return;

    const results = drawStarterTenPull();
    if (!results.length) return;

    const featured = pickFeaturedStarterResult(results);
    shareFeedbackMessage = '';
    isSpinning = true;
    clearTimers();
    resetMachineVisual();
    hideMultiResult();
    applyCapsulePalette(featured.card.rarity);
    if (els.gachaMachine) els.gachaMachine.dataset.rarity = featured.card.rarity;
    setIdleState();
    if (els.gachaStatus) els.gachaStatus.textContent = '初回10連を準備中。';
    if (els.gachaTrayCopy) els.gachaTrayCopy.textContent = '10枚まとめてオープン';
    if (els.startGachaButton) els.startGachaButton.disabled = true;
    if (els.spinAgainButton) els.spinAgainButton.disabled = true;
    if (els.starterTenPullButton) els.starterTenPullButton.disabled = true;

    void els.gachaMachine?.offsetWidth;
    els.gachaMachine?.classList.add('is-spinning');

    schedule(() => {
      els.gachaMachine?.classList.add('has-capsule');
      if (els.gachaStatus) els.gachaStatus.textContent = featured.card.rarity === 'SSR' ? '初回10連でかなり光ってる。' : '初回10連のカプセルが出てきた。';
      if (els.gachaTrayCopy) els.gachaTrayCopy.textContent = 'まとめ結果をチェック';
    }, 1450);

    schedule(() => revealStarterTenPull(results), featured.card.rarity === 'SSR' ? 2800 : 2550);
  }

  function drawCard(mode, options = {}) {
    const rates = mode === 'free' ? activeBanner.freeRates : activeBanner.paidRates;
    const rarity = options.guaranteedRPlus ? weightedPickRPlus(rates) : weightedPick(rates);
    const candidates = bannerPool.filter((card) => card.rarity === rarity);
    return pickRandom(candidates) ?? pickRandom(bannerPool) ?? null;
  }

  function drawStarterTenPull() {
    const nextOwned = new Set(state.ownedCardIds);
    return Array.from({ length: 10 }, (_, index) => {
      const card = drawCard('paid', { guaranteedRPlus: index === 9 });
      if (!card) return null;
      const isNew = !nextOwned.has(card.id);
      nextOwned.add(card.id);
      return { card, isNew, mode: 'starter' };
    }).filter(Boolean);
  }

  function weightedPick(rates) {
    const total = Object.values(rates).reduce((sum, value) => sum + value, 0);
    const seed = Math.random() * total;
    let cursor = 0;
    for (const rarity of ['N', 'R', 'SSR']) {
      cursor += rates[rarity] ?? 0;
      if (seed <= cursor) return rarity;
    }
    return 'N';
  }

  function weightedPickRPlus(rates) {
    const total = (rates.R ?? 0) + (rates.SSR ?? 0);
    const seed = Math.random() * total;
    return seed <= (rates.R ?? 0) ? 'R' : 'SSR';
  }

  function revealCard(card) {
    const isNew = !state.ownedCardIds.includes(card.id);
    isSpinning = false;
    if (isNew) state.ownedCardIds = [...state.ownedCardIds, card.id];
    if (state.selectedMode === 'free') state.dailyClaimDateJst = getJstDateKey();
    state.lastCardId = card.id;
    state.lastStarterPullCardIds = [];
    state.lastPullType = 'single';
    state.history = [{ cardId: card.id, mode: state.selectedMode, isNew, timestamp: Date.now() }, ...state.history].slice(0, MAX_HISTORY);
    saveState();
    els.gachaMachine?.classList.remove('is-spinning');
    els.gachaMachine?.classList.add('is-revealed');
    hideMultiResult();
    showCard(card, { ownership: isNew ? 'new' : 'duplicate' });
    if (els.gachaStatus) els.gachaStatus.textContent = `${card.rarity} を引きました。`;
    if (els.gachaTrayCopy) els.gachaTrayCopy.textContent = isNew ? '新しいキャラをお迎えしたよ' : 'すでに持っているキャラでした';
    renderModeState();
    renderHistory();
    renderCollection();
    renderShareStage();
    scrollResultCardIntoView();
  }

  function revealStarterTenPull(results) {
    const featured = pickFeaturedStarterResult(results);
    isSpinning = false;
    state.ownedCardIds = unique([...state.ownedCardIds, ...results.filter((entry) => entry.isNew).map((entry) => entry.card.id)]);
    state.starterTenPullClaimed = true;
    removeStarterBonus();
    state.lastStarterPullCardIds = results.map((entry) => entry.card.id);
    state.lastPullType = 'starter';
    state.lastCardId = featured.card.id;
    state.history = [
      ...results.slice().reverse().map((entry) => ({ cardId: entry.card.id, mode: 'starter', isNew: entry.isNew, timestamp: Date.now() })),
      ...state.history,
    ].slice(0, MAX_HISTORY);
    saveState();
    els.gachaMachine?.classList.remove('is-spinning');
    els.gachaMachine?.classList.add('is-revealed');
    showCard(featured.card, { ownership: featured.isNew ? 'new' : 'duplicate' });
    renderMultiResult(results, featured.card.id);
    if (els.gachaStatus) els.gachaStatus.textContent = '初回10連を開封したよ。';
    if (els.gachaTrayCopy) els.gachaTrayCopy.textContent = '気になる1枚をタップして見られるよ';
    renderModeState();
    renderHistory();
    renderCollection();
    renderShareStage();
    scrollResultCardIntoView();
  }

  function showCard(card, options = {}) {
    const ownership = options.ownership ?? 'owned';
    const ownershipLabel = ownership === 'new' ? 'NEW' : ownership === 'duplicate' ? 'DUPLICATE' : 'OWNED';
    const ownershipClass = ownership === 'new' ? 'status-new' : ownership === 'duplicate' ? 'status-duplicate' : 'status-owned';
    if (els.resultEmpty) els.resultEmpty.hidden = true;
    if (els.resultFilled) els.resultFilled.hidden = false;
    els.resultCard?.classList.remove('is-idle', 'is-celebrating');
    void els.resultCard?.offsetWidth;
    els.resultCard?.classList.add('is-celebrating');
    if (els.resultCard) els.resultCard.dataset.rarity = card.rarity;
    if (els.resultImage) { els.resultImage.src = resolveAssetPath(card.imageUrl); els.resultImage.alt = `${card.characterName} のカード`; }
    if (els.resultRarity) { els.resultRarity.textContent = card.rarity; els.resultRarity.className = `rarity-pill rarity-${card.rarity}`; }
    if (els.resultOwnership) { els.resultOwnership.textContent = ownershipLabel; els.resultOwnership.className = `status-pill ${ownershipClass}`; }
    if (els.resultTitle) els.resultTitle.textContent = card.characterName;
    if (els.resultLine) els.resultLine.textContent = card.lineText;
    if (els.resultDetail) els.resultDetail.textContent = card.detailText;
    highlightCollectionCharacter(card.characterId, false);
  }

  function setIdleState() {
    els.resultCard?.classList.add('is-idle');
    els.resultCard?.classList.remove('is-celebrating');
    if (els.resultCard) delete els.resultCard.dataset.rarity;
    if (els.resultEmpty) els.resultEmpty.hidden = false;
    if (els.resultFilled) els.resultFilled.hidden = true;
  }

    function renderHistory() {
    if (!els.historyList) return;
    if (!state.history.length) {
      els.historyList.innerHTML = '<div class="history-empty">結果が出るとここに並びます。</div>';
      return;
    }

    els.historyList.innerHTML = state.history.map((entry) => {
      const card = getCardViewModel(cardsById.get(entry.cardId));
      if (!card) return '';
      const modeLabel = entry.mode === 'free' ? '無料デイリー' : entry.mode === 'starter' ? '初回10連' : 'スタンダード';
      const freshness = entry.isNew ? ' / NEW' : '';
      return `
        <button class="history-item" type="button" data-history-card-id="${escapeHtml(card.id)}">
          <div class="history-thumb"><img src="${escapeHtml(resolveAssetPath(card.imageUrl))}" alt="${escapeHtml(card.characterName)}"></div>
          <div class="history-copy">
            <div class="history-name">${escapeHtml(card.characterName)}</div>
            <div class="history-meta">${escapeHtml(`${modeLabel} / ${card.rarity}${freshness}`)}</div>
          </div>
        </button>
      `;
    }).join('');
  }

  function renderCollection() {
    if (!els.collectionGrid) return;
    const characterStates = getBannerCharacterStates();
    const { selectedStates } = getShareSelection(characterStates);
    const ownedCount = characterStates.filter((item) => item.isOwned).length;
    const totalCount = characterStates.length;
    const progressRatio = totalCount ? (ownedCount / totalCount) * 100 : 0;
    const activeTab = getCollectionTabDefinition();
    const visibleStates = getCharacterStatesForCollectionTab(characterStates, activeTab.key);
    if (els.collectionProgressPill) els.collectionProgressPill.textContent = `キャラ ${ownedCount} / ${totalCount}`;
    if (els.collectionSummary) els.collectionSummary.textContent = `${ownedCount} / ${totalCount}`;
    if (els.collectionProgressBar) els.collectionProgressBar.style.width = `${progressRatio}%`;
    renderCollectionTabs(characterStates);
    if (els.collectionLead) {
      if (!ownedCount) {
        els.collectionLead.textContent = 'まずは1回引いてみて。集まったらシェアする4人を選べるよ。';
      } else if (selectedStates.length) {
        els.collectionLead.textContent = `選択中 ${selectedStates.length} / ${MAX_SHOWCASE_CHARACTERS}。番号がついた子だけシェアに入るよ。`;
      } else {
        els.collectionLead.textContent = 'シェアに入れたい子だけ右上の + を押してね。最大4人まで。';
      }
    }
    els.collectionGrid.innerHTML = visibleStates.map(renderCollectionCard).join('');
  }

  function renderCollectionTabs(characterStates) {
    if (!els.collectionTabs) return;
    els.collectionTabs.innerHTML = COLLECTION_TABS.map((tab) => {
      const tabStates = getCharacterStatesForCollectionTab(characterStates, tab.key);
      const ownedCount = tabStates.filter((item) => item.isOwned).length;
      const totalCount = tabStates.length;
      const isActive = state.selectedCollectionTab === tab.key;
      return `
        <button class="collection-tab ${isActive ? 'is-active' : ''}" type="button" data-collection-tab="${escapeHtml(tab.key)}" role="tab" aria-selected="${isActive}">
          <span class="collection-tab-label">${escapeHtml(tab.label)}</span>
          <span class="collection-tab-count">${escapeHtml(`${ownedCount}/${totalCount}`)}</span>
        </button>
      `;
    }).join('');
  }

  function getCollectionTabDefinition(tabKey = state.selectedCollectionTab) {
    return collectionTabMap.get(normalizeCollectionTabKey(tabKey)) ?? collectionTabMap.get('all');
  }

  function getCharacterStatesForCollectionTab(characterStates, tabKey) {
    const tab = getCollectionTabDefinition(tabKey);
    if (tab.key === 'all') return characterStates;
    return characterStates.filter((item) => tab.catSet.has(item.character.cat));
  }

  function normalizeCollectionTabKey(tabKey) {
    return collectionTabMap.has(tabKey) ? tabKey : 'all';
  }

  function getCollectionTabKeyForCategory(categoryKey) {
    if (categoryKey === 'school_m' || categoryKey === 'school_f') return 'school';
    return collectionTabMap.has(categoryKey) ? categoryKey : 'all';
  }

  function renderCollectionCard(item) {
    const displayRarity = item.strongestOwned?.rarity ?? 'N';
    const rarityClass = item.isOwned ? `rarity-${displayRarity}` : 'is-lock';
    const rarityLabel = item.isOwned ? displayRarity : 'LOCK';
    const title = item.isOwned ? item.character.name : '？？？';
    const caption = item.isOwned ? truncateText(item.strongestOwned.lineText, 34) : 'まだ会えていないキャラ';
    const ownedChips = RARITY_DISPLAY_ORDER.map((rarity) => {
      const isOn = item.ownedRarities.includes(rarity);
      return `<span class="collection-owned-pill ${isOn ? `is-on rarity-${rarity}` : ''}">${rarity}</span>`;
    }).join('');
    const showcaseAriaLabel = item.selectedIndex !== -1 ? `シェア選択 ${item.selectedIndex + 1}人目。もう一度押すと外れます。` : 'シェアに追加';
    const showcaseInner = item.selectedIndex !== -1
      ? `<span class="collection-showcase-order">${escapeHtml(String(item.selectedIndex + 1))}</span><span>選択中</span>`
      : '<span class="collection-showcase-plus" aria-hidden="true">+</span>';
    const showcaseButton = item.isOwned
      ? `<button class="collection-showcase-button ${item.selectedIndex !== -1 ? 'is-active' : 'is-idle'}" type="button" data-showcase-character-id="${escapeHtml(item.character.id)}" aria-pressed="${item.selectedIndex !== -1}" aria-label="${escapeHtml(showcaseAriaLabel)}">${showcaseInner}</button>`
      : '';
    return `
      <article class="collection-card ${item.isOwned ? 'is-owned' : 'is-locked'} ${item.selectedIndex !== -1 ? 'is-showcased' : ''} ${item.isCurrent ? 'is-current' : ''}" data-character-id="${escapeHtml(item.character.id)}" data-rarity="${item.isOwned ? displayRarity : 'LOCK'}">
        <div class="collection-card-top">
          <span class="collection-rarity ${rarityClass}">${escapeHtml(rarityLabel)}</span>
          ${showcaseButton}
        </div>
        <div class="collection-thumb">
          <img src="${escapeHtml(resolveAssetPath(item.previewCard?.imageUrl ?? item.character.imageUrl))}" alt="${escapeHtml(item.isOwned ? item.character.name : '未獲得キャラ')}">
        </div>
        <div class="collection-body">
          <h3 class="collection-title">${escapeHtml(title)}</h3>
          <p class="collection-caption">${escapeHtml(caption)}</p>
          <div class="collection-owned-row">${ownedChips}</div>
        </div>
      </article>
    `;
  }

  function renderShareStage() {
    if (!els.shareStageGrid) return;
    const { characterStates, ownedStates, selectedStates, previewStates, slots } = getShareSelection();
    const chosenCount = selectedStates.length;
    if (els.shareSummaryNote) els.shareSummaryNote.textContent = `選択 ${chosenCount} / ${MAX_SHOWCASE_CHARACTERS}`;
    if (els.shareHeadline) {
      els.shareHeadline.textContent = !ownedStates.length ? 'まだ0人。最初のモビー引こ' : !chosenCount ? 'シェアする4人を選ぼ' : chosenCount < MAX_SHOWCASE_CHARACTERS ? `あと${MAX_SHOWCASE_CHARACTERS - chosenCount}人で完成` : 'この4人でシェア完成';
    }
    if (els.shareOwnedCount) els.shareOwnedCount.textContent = `シェア ${chosenCount} / ${MAX_SHOWCASE_CHARACTERS}`;
    if (els.shareSubline) {
      els.shareSubline.textContent = !ownedStates.length ? 'ガチャで引いたキャラがここに並ぶよ。' : !chosenCount ? 'コレクションの右上の + で、見せたい子だけ選んでね。' : '番号がついた子だけここに出るよ。もう一度押すと外せる。';
    }
    els.shareStageGrid.innerHTML = slots.map((item, index) => item ? renderShareCard(item, index) : renderSharePlaceholder(index)).join('');
    if (els.shareStageTags) {
      els.shareStageTags.innerHTML = buildShareTags(ownedStates, selectedStates, previewStates).map((tag) => `<span class="share-tag">${escapeHtml(tag)}</span>`).join('');
    }
    if (els.downloadShareButton) els.downloadShareButton.disabled = !previewStates.length;
    if (els.nativeShareButton) {
      els.nativeShareButton.disabled = !previewStates.length;
      els.nativeShareButton.textContent = supportsNativeShare() ? 'SNSでシェア' : '保存してシェア';
    }
    const defaultHelp = !ownedStates.length ? 'まだシェアできるキャラがいません。まずは1回引いてみて。' : chosenCount ? '選んだ子だけで画像を作れます。4人そろうとかなり見せやすい。' : 'シェアに使いたい子だけ選んでね。選んだ順に1〜4の番号がつくよ。';
    if (els.shareHelpText) els.shareHelpText.textContent = shareFeedbackMessage || defaultHelp;
  }

  function renderShareCard(item, index) {
    const tilts = [-2.2, 1.9, -1.5, 1.4];
    return `
      <article class="share-showcase-card" data-rarity="${escapeHtml(item.strongestOwned.rarity)}" style="--card-tilt:${tilts[index] ?? 0}deg">
        <div class="share-showcase-media">
          <img src="${escapeHtml(resolveAssetPath(item.strongestOwned.imageUrl))}" alt="${escapeHtml(item.character.name)}">
          <span class="collection-rarity share-showcase-rarity rarity-${escapeHtml(item.strongestOwned.rarity)}">${escapeHtml(item.strongestOwned.rarity)}</span>
        </div>
        <div class="share-showcase-copy">
          <h4 class="share-showcase-name">${escapeHtml(item.character.name)}</h4>
          <p class="share-showcase-line">${escapeHtml(truncateText(item.strongestOwned.lineText, 38))}</p>
          <p class="share-showcase-note">そろったレア ${escapeHtml(item.ownedRarities.join(' / '))}</p>
        </div>
      </article>
    `;
  }

  function renderSharePlaceholder(index) {
    return `
      <article class="share-showcase-card is-empty" style="--card-tilt:${index % 2 === 0 ? '-1.2deg' : '1.2deg'}">
        <div class="share-empty-copy">
          <strong>ここに入るよ</strong>
          <span>コレクションの右上にある + で追加してね。</span>
        </div>
      </article>
    `;
  }

  function getShareSelection(characterStates = getBannerCharacterStates()) {
    const ownedStates = characterStates.filter((item) => item.isOwned);
    const ownedByCharacterId = new Map(ownedStates.map((item) => [item.character.id, item]));
    const selectedStates = state.showcaseCharacterIds
      .map((characterId) => ownedByCharacterId.get(characterId))
      .filter(Boolean)
      .slice(0, MAX_SHOWCASE_CHARACTERS);
    const previewStates = [...selectedStates];
    return {
      characterStates,
      ownedStates,
      selectedStates,
      previewStates,
      slots: Array.from({ length: MAX_SHOWCASE_CHARACTERS }, (_, index) => selectedStates[index] ?? null),
    };
  }

  function buildShareTags(ownedStates, selectedStates, previewStates) {
    const tags = ['#MOBBYCAPSULE', `#${ownedStates.length}人コレクション`];
    if (selectedStates.length) tags.push(`#${selectedStates.length}人選抜`);
    const ssrCount = previewStates.filter((item) => item.strongestOwned.rarity === 'SSR').length;
    if (ssrCount) tags.push(`#SSR${ssrCount}`);
    return tags.slice(0, 4);
  }

  function toggleShowcaseCharacter(characterId) {
    const item = getBannerCharacterStates().find((entry) => entry.character.id === characterId);
    if (!item?.isOwned) return;
    const currentIndex = state.showcaseCharacterIds.indexOf(characterId);
    if (currentIndex !== -1) {
      state.showcaseCharacterIds.splice(currentIndex, 1);
      shareFeedbackMessage = 'シェア選択から外したよ。';
    } else if (state.showcaseCharacterIds.length >= MAX_SHOWCASE_CHARACTERS) {
      shareFeedbackMessage = '4人まで。外したい子を先に押してね。';
    } else {
      state.showcaseCharacterIds = [...state.showcaseCharacterIds, characterId];
      shareFeedbackMessage = `${state.showcaseCharacterIds.length}人目に選んだよ。`;
    }
    saveState();
    renderCollection();
    renderShareStage();
    openShareSection();
    if (isMobileViewport() && els.shareStage) {
      window.setTimeout(() => {
        els.shareStage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
  async function createShareImageBlob() {
    if (!els.shareCanvas) return null;
    const { ownedStates, selectedStates, previewStates, slots } = getShareSelection();
    if (!previewStates.length) return null;
    const canvas = els.shareCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const images = await Promise.all(slots.map((item) => item ? loadImage(resolveAssetPath(item.strongestOwned.imageUrl)).catch(() => null) : Promise.resolve(null)));
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#fff5de');
    bgGradient.addColorStop(0.5, '#ffe9cf');
    bgGradient.addColorStop(1, '#ffd5df');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    drawCircle(ctx, 130, 140, 120, 'rgba(255, 255, 255, 0.62)');
    drawCircle(ctx, 965, 180, 136, 'rgba(255, 200, 164, 0.34)');
    drawCircle(ctx, 930, 1130, 190, 'rgba(255, 169, 198, 0.18)');
    drawCircle(ctx, 132, 1188, 160, 'rgba(255, 225, 159, 0.24)');
    fillRoundedRect(ctx, 64, 56, width - 128, 206, 40, 'rgba(255, 255, 255, 0.56)');
    ctx.fillStyle = '#b66f31';
    ctx.font = '900 28px "Zen Maru Gothic", sans-serif';
    ctx.fillText('MY MOBBY DROP', 104, 108);
    ctx.fillStyle = '#4d3423';
    ctx.font = '900 76px "Zen Maru Gothic", sans-serif';
    ctx.fillText('うちのモビー見て', 104, 184);
    ctx.fillStyle = '#7b5b43';
    ctx.font = '700 30px "Zen Maru Gothic", sans-serif';
    ctx.fillText(`集めたキャラ ${ownedStates.length} / ${bannerCharacters.length}`, 104, 232);
    const positions = [
      { x: 82, y: 300, tilt: -0.045 },
      { x: 546, y: 322, tilt: 0.038 },
      { x: 92, y: 792, tilt: -0.03 },
      { x: 536, y: 814, tilt: 0.028 },
    ];
    positions.forEach((position, index) => drawShareCanvasCard(ctx, position, slots[index], images[index]));
    drawCanvasTags(ctx, buildShareTags(ownedStates, selectedStates, previewStates).slice(0, 3), 104, 1246);
    ctx.fillStyle = '#8e6547';
    ctx.font = '700 22px "Zen Maru Gothic", sans-serif';
    ctx.fillText('MOBBY CAPSULE CLUB', 104, 1310);
    return canvasToBlob(canvas);
  }

  function drawShareCanvasCard(ctx, position, item, image) {
    const width = 440;
    const height = 396;
    const palette = getSharePalette(item?.strongestOwned?.rarity);
    ctx.save();
    ctx.translate(position.x + width / 2, position.y + height / 2);
    ctx.rotate(position.tilt);
    if (!item) {
      fillRoundedRect(ctx, -width / 2, -height / 2, width, height, 34, 'rgba(255, 255, 255, 0.42)');
      strokeRoundedRect(ctx, -width / 2, -height / 2, width, height, 34, 'rgba(161, 114, 73, 0.28)', 4, [18, 12]);
      ctx.fillStyle = '#9a7351';
      ctx.textAlign = 'center';
      ctx.font = '900 28px "Zen Maru Gothic", sans-serif';
      ctx.fillText('NEXT DROP', 0, -8);
      ctx.font = '700 22px "Zen Maru Gothic", sans-serif';
      ctx.fillText('あと1人でシェア完成', 0, 34);
      ctx.textAlign = 'left';
      ctx.restore();
      return;
    }
    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 14;
    fillRoundedRect(ctx, -width / 2, -height / 2, width, height, 34, palette.cardBackground);
    ctx.shadowColor = 'transparent';
    fillRoundedRect(ctx, -width / 2 + 20, -height / 2 + 18, 120, 34, 18, 'rgba(255, 255, 255, 0.58)');
    const mediaX = -width / 2 + 18;
    const mediaY = -height / 2 + 18;
    const mediaWidth = width - 36;
    const mediaHeight = 236;
    fillRoundedRect(ctx, mediaX, mediaY, mediaWidth, mediaHeight, 26, palette.mediaBackground);
    if (image) drawImageCover(ctx, image, mediaX, mediaY, mediaWidth, mediaHeight, 26);
    fillRoundedRect(ctx, mediaX + 14, mediaY + 14, 76, 34, 18, palette.badgeBackground);
    ctx.fillStyle = palette.badgeText;
    ctx.font = '900 20px "Zen Maru Gothic", sans-serif';
    ctx.fillText(item.strongestOwned.rarity, mediaX + 38, mediaY + 38);
    ctx.fillStyle = '#4d3423';
    ctx.font = '900 30px "Zen Maru Gothic", sans-serif';
    drawWrappedText(ctx, item.character.name, -width / 2 + 24, 304 - height / 2, width - 48, 2, 38);
    ctx.fillStyle = '#704d38';
    ctx.font = '700 19px "Zen Maru Gothic", sans-serif';
    drawWrappedText(ctx, truncateText(item.strongestOwned.lineText, 40), -width / 2 + 24, 350 - height / 2, width - 48, 2, 28);
    ctx.fillStyle = '#9a6a47';
    ctx.font = '700 16px "Zen Maru Gothic", sans-serif';
    drawWrappedText(ctx, `そろったレア ${item.ownedRarities.join(' / ')}`, -width / 2 + 24, 410 - height / 2, width - 48, 1, 24);
    ctx.restore();
  }

  function getSharePalette(rarity) {
    if (rarity === 'SSR') return { cardBackground: 'rgba(255, 250, 252, 0.98)', mediaBackground: 'rgba(255, 233, 245, 0.96)', badgeBackground: 'rgba(255, 225, 239, 0.98)', badgeText: '#d85186', shadow: 'rgba(255, 120, 164, 0.22)' };
    if (rarity === 'R') return { cardBackground: 'rgba(255, 251, 246, 0.98)', mediaBackground: 'rgba(255, 236, 213, 0.96)', badgeBackground: 'rgba(255, 240, 220, 0.98)', badgeText: '#cf7520', shadow: 'rgba(255, 173, 96, 0.18)' };
    return { cardBackground: 'rgba(255, 253, 249, 0.98)', mediaBackground: 'rgba(244, 233, 221, 0.96)', badgeBackground: 'rgba(241, 234, 226, 0.98)', badgeText: '#7b6656', shadow: 'rgba(161, 125, 94, 0.12)' };
  }

  function drawCanvasTags(ctx, tags, startX, y) {
    let currentX = startX;
    tags.forEach((tag) => {
      ctx.font = '900 18px "Zen Maru Gothic", sans-serif';
      const width = ctx.measureText(tag).width + 34;
      fillRoundedRect(ctx, currentX, y, width, 42, 21, 'rgba(255, 255, 255, 0.82)');
      ctx.fillStyle = '#8b5c35';
      ctx.fillText(tag, currentX + 17, y + 27);
      currentX += width + 12;
    });
  }

    function restoreLastResult() {
    hideMultiResult();
    if (!state.lastCardId) {
      setIdleState();
      return;
    }

    const card = getCardViewModel(cardsById.get(state.lastCardId));
    if (!card) {
      setIdleState();
      return;
    }

    showCard(card, { ownership: state.ownedCardIds.includes(card.id) ? 'owned' : 'preview' });
  }

    function pickFeaturedStarterResult(results) {
    return [...results].sort((left, right) => {
      const rarityDiff = getRarityWeight(right.card.rarity) - getRarityWeight(left.card.rarity);
      if (rarityDiff) return rarityDiff;
      if (left.isNew !== right.isNew) return left.isNew ? -1 : 1;
      return 0;
    })[0] ?? results[0];
  }

  function renderMultiResult(results, activeCardId) {
    currentMultiResultEntries = results;
    if (!els.multiResult || !els.multiResultGrid || !els.multiResultSummary) return;

    if (!results.length) {
      hideMultiResult();
      return;
    }

    const ssrCount = results.filter((entry) => entry.card.rarity === 'SSR').length;
    const rCount = results.filter((entry) => entry.card.rarity === 'R').length;
    const newCount = results.filter((entry) => entry.isNew).length;
    els.multiResult.hidden = false;
    els.multiResultSummary.textContent = `NEW ${newCount} / R ${rCount} / SSR ${ssrCount}`;
    els.multiResultGrid.innerHTML = results.map((entry, index) => renderMultiResultCard(entry, index, activeCardId)).join('');
  }

  function renderMultiResultCard(entry, index, activeCardId) {
    return `
      <button class="multi-result-item ${entry.card.id === activeCardId ? 'is-active' : ''}" type="button" data-multi-card-id="${escapeHtml(entry.card.id)}" data-rarity="${escapeHtml(entry.card.rarity)}">
        <div class="multi-result-thumb">
          <img src="${escapeHtml(resolveAssetPath(entry.card.imageUrl))}" alt="${escapeHtml(entry.card.characterName)}">
          <span class="multi-result-order">${escapeHtml(String(index + 1).padStart(2, '0'))}</span>
          <span class="collection-rarity multi-result-rarity rarity-${escapeHtml(entry.card.rarity)}">${escapeHtml(entry.card.rarity)}</span>
          ${entry.isNew ? '<span class="multi-result-new">NEW</span>' : ''}
        </div>
        <p class="multi-result-name">${escapeHtml(entry.card.characterName)}</p>
      </button>
    `;
  }

  function hideMultiResult() {
    currentMultiResultEntries = [];
    if (els.multiResult) els.multiResult.hidden = true;
    if (els.multiResultGrid) els.multiResultGrid.innerHTML = '';
    if (els.multiResultSummary) els.multiResultSummary.textContent = '';
  }

  function highlightMultiResultCard(cardId) {
    if (!els.multiResultGrid) return;
    els.multiResultGrid.querySelectorAll('.multi-result-item.is-active').forEach((item) => item.classList.remove('is-active'));
    const escapedId = window.CSS?.escape ? window.CSS.escape(cardId) : cardId;
    els.multiResultGrid.querySelector(`[data-multi-card-id="${escapedId}"]`)?.classList.add('is-active');
  }

  function getBannerCharacterStates() {
    const ownedSet = new Set(state.ownedCardIds);
    return bannerCharacters.map((character) => {
      const cards = bannerCardsByCharacterId.get(character.id) ?? [];
      const ownedCards = cards.filter((card) => ownedSet.has(card.id)).sort(compareCardByRarityDesc);
      const strongestOwned = ownedCards[0] ?? null;
      const previewCard = strongestOwned ?? cards[0] ?? null;
      const selectedIndex = state.showcaseCharacterIds.indexOf(character.id);
      return {
        character,
        cards,
        ownedCards,
        strongestOwned,
        previewCard,
        ownedRarities: RARITY_DISPLAY_ORDER.filter((rarity) => ownedCards.some((card) => card.rarity === rarity)),
        isOwned: ownedCards.length > 0,
        isCurrent: Boolean(state.lastCardId && cards.some((card) => card.id === state.lastCardId)),
        selectedIndex,
      };
    }).sort((left, right) => {
      const leftSelected = left.selectedIndex !== -1;
      const rightSelected = right.selectedIndex !== -1;
      if (leftSelected !== rightSelected) return leftSelected ? -1 : 1;
      if (leftSelected && rightSelected && left.selectedIndex !== right.selectedIndex) return left.selectedIndex - right.selectedIndex;
      if (left.isCurrent !== right.isCurrent) return left.isCurrent ? -1 : 1;
      if (left.isOwned !== right.isOwned) return left.isOwned ? -1 : 1;
      const rarityDiff = getRarityWeight(right.strongestOwned?.rarity) - getRarityWeight(left.strongestOwned?.rarity);
      if (rarityDiff) return rarityDiff;
      return left.character.name.localeCompare(right.character.name, 'ja');
    });
  }

  function getStrongestOwnedCard(characterId) {
    const cards = bannerCardsByCharacterId.get(characterId) ?? [];
    return cards.find((card) => state.ownedCardIds.includes(card.id)) ?? null;
  }

  function getStrongestDefinedCard(characterId) {
    return (bannerCardsByCharacterId.get(characterId) ?? [])[0] ?? null;
  }

  function openCollectionSection() {
    if (els.collectionSection?.tagName === 'DETAILS') els.collectionSection.open = true;
  }

  function openShareSection() {
    if (els.shareSection?.tagName === 'DETAILS') els.shareSection.open = true;
  }

  function highlightCollectionCharacter(characterId, scrollIntoView) {
    if (!els.collectionGrid) return;
    const characterState = getBannerCharacterStates().find((entry) => entry.character.id === characterId);
    if (characterState) {
      const nextTab = getCollectionTabKeyForCategory(characterState.character.cat);
      if (state.selectedCollectionTab !== nextTab) {
        state.selectedCollectionTab = nextTab;
        saveState();
        renderCollection();
      }
    }
    const escapedId = window.CSS?.escape ? window.CSS.escape(characterId) : characterId;
    const target = els.collectionGrid.querySelector(`[data-character-id="${escapedId}"]`);
    els.collectionGrid.querySelectorAll('.collection-card.is-current').forEach((card) => {
      if (card.dataset.characterId !== characterId) card.classList.remove('is-current');
    });
    if (!target) return;
    target.classList.add('is-current');
    if (scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function isMobileViewport() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function scrollResultCardIntoView() {
    if (!isMobileViewport() || !els.resultCard) return;
    window.setTimeout(() => {
      els.resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }
  function getCardViewModel(card) {
    if (!card) return null;
    const character = charactersById.get(card.characterId);
    if (!character) return null;
    return { ...card, characterName: character.name, categoryLabel: character.categoryLabel, categoryColor: character.categoryColor, themeAccent: character.themeAccent, characterSummary: character.summary, characterCatch: character.catch };
  }

  function resolveAssetPath(path) {
    if (!path) return '';
    if (/^https?:/i.test(path)) return path;
    return `../${path.replace(/^\.\//, '')}`;
  }

  function formatRates(rates) {
    return `N ${(rates.N * 100).toFixed(1)}% / R ${(rates.R * 100).toFixed(1)}% / SSR ${(rates.SSR * 100).toFixed(1)}%`;
  }

  function applyCapsulePalette(rarity) {
    const paletteByRarity = { N: { top: '#ffd34a', bottom: '#76c7ff' }, R: { top: '#ff8a70', bottom: '#ffd37a' }, SSR: { top: '#ff85a9', bottom: '#9f8cff' } };
    const palette = paletteByRarity[rarity] ?? paletteByRarity.N;
    els.gachaCapsuleDrop?.style.setProperty('--capsule-top', palette.top);
    els.gachaCapsuleDrop?.style.setProperty('--capsule-bottom', palette.bottom);
  }

  function resetMachineVisual() {
    els.gachaMachine?.classList.remove('is-spinning', 'has-capsule', 'is-revealed');
    if (els.gachaMachine) delete els.gachaMachine.dataset.rarity;
  }

  function buildShareFileName() {
    return `mobby-drop-${getJstDateKey()}-${Date.now()}.png`;
  }

  function buildShareText(previewStates) {
    const names = previewStates.slice(0, 2).map((item) => item.character.name).join(' / ');
    return `${names ? `${names} がいる` : 'うちのモビー見て'} #MOBBYCAPSULE`;
  }

  function setShareFeedback(message) {
    shareFeedbackMessage = message;
    renderShareStage();
  }

  function supportsNativeShare() {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof File === 'function';
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function drawCircle(ctx, x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, maxLines, lineHeight) {
    wrapText(ctx, text, maxWidth, maxLines).forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  }

  function wrapText(ctx, text, maxWidth, maxLines) {
    const chars = Array.from(text);
    const lines = [];
    let current = '';
    let index = 0;
    while (index < chars.length) {
      const next = current + chars[index];
      if (ctx.measureText(next).width > maxWidth && current) {
        lines.push(current);
        current = '';
        if (lines.length === maxLines - 1) break;
      } else {
        current = next;
        index += 1;
      }
    }
    if (lines.length < maxLines && current) lines.push(current);
    if (index < chars.length && lines.length) lines[lines.length - 1] = fitTextWithEllipsis(ctx, lines[lines.length - 1], maxWidth);
    return lines;
  }

  function fitTextWithEllipsis(ctx, text, maxWidth) {
    let output = `${text}…`;
    while (output.length > 1 && ctx.measureText(output).width > maxWidth) output = `${output.slice(0, -2)}…`;
    return output;
  }

  function drawImageCover(ctx, image, x, y, width, height, radius) {
    ctx.save();
    roundedRectPath(ctx, x, y, width, height, radius);
    ctx.clip();
    const scale = Math.max(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight) / 2;
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
  }

  function roundedRectPath(ctx, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + safeRadius, y);
    ctx.lineTo(x + width - safeRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    ctx.lineTo(x + width, y + height - safeRadius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    ctx.lineTo(x + safeRadius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    ctx.lineTo(x, y + safeRadius);
    ctx.quadraticCurveTo(x, y, x + safeRadius, y);
    ctx.closePath();
  }

  function fillRoundedRect(ctx, x, y, width, height, radius, color) {
    ctx.fillStyle = color;
    roundedRectPath(ctx, x, y, width, height, radius);
    ctx.fill();
  }

  function strokeRoundedRect(ctx, x, y, width, height, radius, color, lineWidth, dash = []) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dash);
    roundedRectPath(ctx, x, y, width, height, radius);
    ctx.stroke();
    ctx.restore();
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load ${src}`));
      image.src = src;
    });
  }

  function compareCardByRarityDesc(left, right) {
    return getRarityWeight(right.rarity) - getRarityWeight(left.rarity);
  }

  function getRarityWeight(rarity) {
    return RARITY_WEIGHT[rarity] ?? 0;
  }

  function pickRandom(items) {
    return items.length ? items[Math.floor(Math.random() * items.length)] ?? null : null;
  }

  function shuffleArray(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }
    return copy;
  }

  function truncateText(text, maxLength) {
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
  }

  function unique(items) {
    return Array.from(new Set(items));
  }

  function escapeHtml(value) {
    return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  }

  function schedule(task, delay) {
    const timer = window.setTimeout(() => {
      timers = timers.filter((id) => id !== timer);
      task();
    }, delay);
    timers.push(timer);
  }

  function clearTimers() {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers = [];
  }
})();