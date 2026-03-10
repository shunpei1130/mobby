(() => {
  const data = window.MOBBY_GACHA_DATA;
  if (!data) return;

  const STORAGE_KEY = 'mobby-gacha-state-v2';
  const LEGACY_STORAGE_KEY = 'mobby-gacha-state-v1';
  const ACTIVE_BANNER_ID = 'love_truth_mvp';
  const PAID_MODE_RELEASE_DATE_JST = '2026-03-15';
  const PAID_MODE_RELEASE_LABEL = '3月15日リリース予定';
  const MAX_HISTORY = 5;
  const MAX_SHOWCASE_CHARACTERS = 4;
  const RARITY_WEIGHT = { N: 1, R: 2, SSR: 3 };
  const RARITY_DISPLAY_ORDER = ['N', 'R', 'SSR'];
  const COLLECTION_TABS = [
    { key: 'all', label: 'ぜんぶ', cats: ['school_m', 'school_f', 'mama', 'night', 'stan', 'love'] },
    { key: 'school', label: '学校', cats: ['school_m', 'school_f'] },
    { key: 'mama', label: 'ママ', cats: ['mama'] },
    { key: 'night', label: 'ナイト', cats: ['night'] },
    { key: 'stan', label: '推し活', cats: ['stan'] },
    { key: 'love', label: '恋愛', cats: ['love'] },
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
  let isLineupModalOpen = false;
  let isCollectionModalOpen = false;
  let isShareModalOpen = false;
  let handleTouchFeedbackTimer = null;
  let sharePreviewUrl = '';
  const GACHA_FIFTY_PACK_PRODUCT_TYPE = 'gacha_fifty_pack';
  const GACHA_CHECKOUT_SESSION_ENDPOINT = '/api/gacha-checkout-session';
  const GACHA_CHECKOUT_STATUS_ENDPOINT = '/api/gacha-checkout-status';
  const GACHA_CHECKOUT_GRANT_STORAGE_KEY = 'mobby-gacha-checkout-grants-v1';
  let economyStatusMessage = '';
  let isCheckoutPending = false;
  let isCheckoutModalOpen = false;
  let stripeLoaderPromise = null;
  let embeddedCheckoutInstance = null;

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
    gachaMachine: document.getElementById('gachaMachine'),
    gachaDome: document.getElementById('gachaDome'),
    gachaDomeHint: document.getElementById('gachaDomeHint'),
    gachaCapsuleDrop: document.getElementById('gachaCapsuleDrop'),
    gachaLineupModal: document.getElementById('gachaLineupModal'),
    gachaLineupBackdrop: document.getElementById('gachaLineupBackdrop'),
    closeGachaLineupButton: document.getElementById('closeGachaLineupButton'),
    gachaLineupModeLabel: document.getElementById('gachaLineupModeLabel'),
    gachaLineupNote: document.getElementById('gachaLineupNote'),
    gachaLineupRates: document.getElementById('gachaLineupRates'),
    gachaLineupGrid: document.getElementById('gachaLineupGrid'),
    lineupSpinButton: document.getElementById('lineupSpinButton'),
    collectionModal: document.getElementById('collectionModal'),
    collectionModalBackdrop: document.getElementById('collectionModalBackdrop'),
    closeCollectionModalButton: document.getElementById('closeCollectionModalButton'),
    openShareModalButton: document.getElementById('openShareModalButton'),
    shareModal: document.getElementById('shareModal'),
    shareModalBackdrop: document.getElementById('shareModalBackdrop'),
    closeShareModalButton: document.getElementById('closeShareModalButton'),
    checkoutOverlay: document.getElementById('checkoutOverlay'),
    checkoutOverlayBackdrop: document.getElementById('checkoutOverlayBackdrop'),
    checkoutCloseButton: document.getElementById('checkoutCloseButton'),
    checkoutMount: document.getElementById('checkoutMount'),
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
    sharePreviewPanel: document.getElementById('sharePreviewPanel'),
    sharePreviewHint: document.getElementById('sharePreviewHint'),
    sharePreviewImage: document.getElementById('sharePreviewImage'),
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
      if (isLineupModalOpen) renderGachaLineupModalContents();
    });

    els.paidModeButton?.addEventListener('click', () => {
      if (!isPaidModeReleased()) return;
      state.selectedMode = 'paid';
      shareFeedbackMessage = '';
      saveState();
      renderModeState({ resetMachineText: true });
      if (isLineupModalOpen) renderGachaLineupModalContents();
    });

    els.startGachaButton?.addEventListener('click', startSpin);
    els.spinAgainButton?.addEventListener('click', startSpin);
    els.starterTenPullButton?.addEventListener('click', startStarterTenPull);
    const handleWrap = els.startGachaButton?.closest('.gacha-handle-wrap');
    handleWrap?.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      triggerHandleTouchFeedback();
    });
    handleWrap?.addEventListener('touchstart', () => {
      triggerHandleTouchFeedback();
    }, { passive: true });
    els.startGachaButton?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      triggerHandleTouchFeedback();
    });

    els.gachaDome?.addEventListener('click', openGachaLineupModal);
    els.gachaDome?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openGachaLineupModal();
    });
    els.gachaLineupBackdrop?.addEventListener('click', closeGachaLineupModal);
    els.closeGachaLineupButton?.addEventListener('click', closeGachaLineupModal);
    els.lineupSpinButton?.addEventListener('click', () => {
      closeGachaLineupModal();
      startSpin();
    });

    els.collectionModalBackdrop?.addEventListener('click', closeCollectionSection);
    els.closeCollectionModalButton?.addEventListener('click', closeCollectionSection);
    els.openShareModalButton?.addEventListener('click', openShareSection);
    els.shareModalBackdrop?.addEventListener('click', closeShareModal);
    els.closeShareModalButton?.addEventListener('click', closeShareModal);
    els.checkoutOverlayBackdrop?.addEventListener('click', closeCheckoutOverlay);
    els.checkoutCloseButton?.addEventListener('click', closeCheckoutOverlay);
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (isLineupModalOpen) closeGachaLineupModal();
      if (isCollectionModalOpen) closeCollectionSection();
      if (isShareModalOpen) closeShareModal();
      if (isCheckoutModalOpen) closeCheckoutOverlay();
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
        setShareFeedback('まだ保存できる画像がありません。まずは1回引いてみて。');
        return;
      }
      const fileName = buildShareFileName();
      const result = await handleShareImageSave(blob, fileName);
      if (result === 'shared') {
        setShareFeedback('共有シートを開いたよ。「画像を保存」で端末に保存できます。');
        return;
      }
      if (result === 'preview') {
        setShareFeedback('保存用画像を表示したよ。長押しして保存してね。');
        return;
      }
      if (result === 'cancelled') {
        setShareFeedback('保存をキャンセルしたよ。もう一度押すとやり直せます。');
        return;
      }
      setShareFeedback('画像を保存したよ。SNSやストーリーにそのまま使えます。');
    });

    els.nativeShareButton?.addEventListener('click', async () => {
      const blob = await createShareImageBlob();
      if (!blob) {
        setShareFeedback('まだシェアできる画像がありません。まずは1回引いてみて。');
        return;
      }

      const fileName = buildShareFileName();
      const shareText = buildShareText(getShareSelection().previewStates);
      const result = await shareImageOrFallback(blob, fileName, shareText);
      if (result === 'shared') {
        setShareFeedback('シェアシートを開いたよ。');
        return;
      }
      if (result === 'preview') {
        setShareFeedback('共有に未対応だったので、保存用画像を表示したよ。長押し保存してSNSで使ってね。');
        return;
      }
      if (result === 'cancelled') {
        setShareFeedback('シェアをキャンセルしたよ。');
        return;
      }
      setShareFeedback('この端末では画像共有に未対応だったので、保存できるようにしたよ。');
    });
  }

  function triggerHandleTouchFeedback() {
    const handleWrap = els.startGachaButton?.closest('.gacha-handle-wrap');
    if (!handleWrap) return;
    handleWrap.classList.remove('is-touching');
    void handleWrap.offsetWidth;
    handleWrap.classList.add('is-touching');
    if (handleTouchFeedbackTimer) window.clearTimeout(handleTouchFeedbackTimer);
    handleTouchFeedbackTimer = window.setTimeout(() => {
      handleWrap.classList.remove('is-touching');
      handleTouchFeedbackTimer = null;
    }, 460);
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

  function openGachaLineupModal() {
    renderGachaLineupModalContents();
    if (!els.gachaLineupModal) return;
    isLineupModalOpen = true;
    els.gachaLineupModal.hidden = false;
    document.body.classList.add('is-lineup-open');
  }

  function closeGachaLineupModal() {
    if (!els.gachaLineupModal) return;
    isLineupModalOpen = false;
    els.gachaLineupModal.hidden = true;
    document.body.classList.remove('is-lineup-open');
  }

  function renderDomeHint() {
    if (!els.gachaDome || !els.gachaDomeHint) return;
    const isFreeMode = state.selectedMode === 'free';
    const modeName = isFreeMode ? '無料ガチャ' : '一番くじ';
    els.gachaDome.setAttribute('aria-label', `${modeName}のラインナップを見る`);
    els.gachaDomeHint.innerHTML = `
      <span class="gacha-dome-hint-main">タップで${escapeHtml(modeName)}一覧</span>
      <span class="gacha-dome-hint-sub">何が出るか先にチェック</span>
    `;
  }

  function renderGachaLineupModalContents() {
    const isFreeMode = state.selectedMode === 'free';
    const modeName = isFreeMode ? '無料ガチャ' : '一番くじ';
    const rates = isFreeMode ? activeBanner.freeRates : activeBanner.paidRates;
    const freeAvailable = canUseFreeDaily();
    const lineupStates = bannerCharacters
      .map((character) => {
        const cards = bannerCardsByCharacterId.get(character.id) ?? [];
        const previewCard = cards[0] ?? null;
        return { character, previewCard, rarityList: RARITY_DISPLAY_ORDER.filter((rarity) => cards.some((card) => card.rarity === rarity)) };
      })
      .sort((left, right) => left.character.name.localeCompare(right.character.name, 'ja'));

    if (els.gachaLineupModeLabel) els.gachaLineupModeLabel.textContent = `${modeName}のラインナップ`;
    if (els.gachaLineupNote) {
      const totalCards = lineupStates.reduce((sum, item) => sum + item.rarityList.length, 0);
      els.gachaLineupNote.textContent = `${lineupStates.length}キャラ × 3レア = ${totalCards}カード。モードごとに確率が違います。`;
    }

    if (els.gachaLineupRates) {
      els.gachaLineupRates.innerHTML = RARITY_DISPLAY_ORDER.slice().reverse().map((rarity) => {
        const rateValue = ((rates[rarity] ?? 0) * 100).toFixed(1);
        return `
          <article class="lineup-rate-card rarity-${escapeHtml(rarity)}">
            <p class="lineup-rate-rarity">${escapeHtml(rarity)}</p>
            <p class="lineup-rate-value">${escapeHtml(rateValue)}%</p>
          </article>
        `;
      }).join('');
    }

    if (els.gachaLineupGrid) {
      els.gachaLineupGrid.innerHTML = lineupStates.map((item) => {
        const previewSrc = item.previewCard ? resolveAssetPath(item.previewCard.imageUrl) : '';
        const rarityPills = item.rarityList.map((rarity) => `<span class="lineup-rarity-pill rarity-${escapeHtml(rarity)}">${escapeHtml(rarity)}</span>`).join('');
        return `
          <article class="lineup-item-card">
            <div class="lineup-item-thumb">${previewSrc ? `<img src="${escapeHtml(previewSrc)}" alt="${escapeHtml(item.character.name)}">` : ''}</div>
            <div class="lineup-item-copy">
              <h4>${escapeHtml(item.character.name)}</h4>
              <p>${escapeHtml(item.character.categoryLabel)}</p>
              <div class="lineup-rarity-row">${rarityPills}</div>
            </div>
          </article>
        `;
      }).join('');
    }

    if (els.lineupSpinButton) {
      const canSpinInCurrentMode = !isFreeMode || freeAvailable;
      els.lineupSpinButton.disabled = isSpinning || !canSpinInCurrentMode;
      if (isFreeMode && !freeAvailable) {
        els.lineupSpinButton.textContent = '無料は本日分を使用済み。一番くじに切り替えて回せます。';
      } else {
        els.lineupSpinButton.textContent = isFreeMode ? 'このまま無料で回す' : 'このまま一番くじを引く';
      }
    }
  }

      function ensureStarterExperienceDom() {
    if (!document.getElementById('starterBonus')) {
      const modeStatus = document.getElementById('modeStatus');
      modeStatus?.insertAdjacentHTML('afterend', `
        <div class="starter-bonus" id="starterBonus" hidden>
          <div class="starter-bonus-copy">
            <p class="starter-bonus-kicker">FIRST 10</p>
            <h3>初回だけ無料10連</h3>
            <p class="starter-bonus-note" id="starterBonusCopy">初回だけ無料で10連。10枠目はR以上確定。</p>
          </div>
          <button class="action-button primary starter-bonus-button" id="starterTenPullButton" type="button">初回10連を引く</button>
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
    els.paidModeButton?.classList.toggle('is-active', paidModeReleased && !isFreeMode);
    if (els.paidModeButton) {
      els.paidModeButton.disabled = !paidModeReleased || isSpinning;
      els.paidModeButton.classList.toggle('is-release-locked', !paidModeReleased);
      const paidLabel = paidModeReleased ? '一番くじに切り替える' : PAID_MODE_RELEASE_LABEL;
      els.paidModeButton.setAttribute('aria-label', paidLabel);
      els.paidModeButton.title = paidLabel;
    }
    if (els.startGachaButton) els.startGachaButton.disabled = startDisabled;
    if (els.spinAgainButton) els.spinAgainButton.disabled = startDisabled;
    if (els.starterTenPullButton) els.starterTenPullButton.disabled = isSpinning || !starterAvailable;

    if (isFreeMode) {
      if (els.modeStatus) els.modeStatus.textContent = freeAvailable ? '本日の無料ガチャが使えます。' : '無料ガチャは使用済み。スタンダードな通常モードで回せます。';
    } else {
      if (els.modeStatus) els.modeStatus.textContent = 'もっと続けたい時のモード。';
    }

    renderDomeHint();
    if (isLineupModalOpen) renderGachaLineupModalContents();
    syncStarterBonus(starterAvailable);

    if (options.resetMachineText && !isSpinning) {
      if (els.gachaStatus) els.gachaStatus.textContent = '回して本日の1枚を開けよう。';
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
    if (els.starterBonusCopy) els.starterBonusCopy.textContent = '初回だけ無料で10連。10枠目はR以上確定。';
  }

  
  function getJstDateKey() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    return `${parts.find((item) => item.type === 'year')?.value}-${parts.find((item) => item.type === 'month')?.value}-${parts.find((item) => item.type === 'day')?.value}`;
  }
  function isPaidModeReleased() {
    return getJstDateKey() >= PAID_MODE_RELEASE_DATE_JST;
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
      if (els.gachaStatus) els.gachaStatus.textContent = pulledCard.rarity === 'SSR' ? 'きらっと光った。レアな予感。' : 'カプセルが出てきた。';
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
    if (els.gachaTrayCopy) els.gachaTrayCopy.textContent = isNew ? '新しいキャラをお迎えしました。' : 'すでに持っているキャラでした。';
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
    if (els.gachaTrayCopy) els.gachaTrayCopy.textContent = '横にならぶ10枚をタップして見られるよ。';
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
      const modeLabel = entry.mode === 'free'
        ? '無料ガチャ'
        : entry.mode === 'starter'
          ? '初回10連'
          : entry.mode === 'multi50'
            ? '50連'
            : 'ガチャ';
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
        els.collectionLead.textContent = 'まだコレクションがありません。まずは1回引いてみて。';
      } else if (ownedCount < totalCount) {
        els.collectionLead.textContent = `現在 ${ownedCount} / ${totalCount}。まだ出会えていないキャラもいます。`;
      } else {
        els.collectionLead.textContent = 'コンプリート達成。全キャラ解放済みです。';
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
    const title = item.isOwned ? item.character.name : '???';
    const caption = item.isOwned ? truncateText(item.strongestOwned.lineText, 34) : 'まだ出会えていないキャラ';
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
    const { ownedStates, previewStates } = getShareSelection();
    const ownedCount = ownedStates.length;
    const totalCardCount = activeBanner.poolCardIds.length;
    if (els.shareSummaryNote) els.shareSummaryNote.textContent = `所持 ${ownedCount} / ${totalCardCount}`;
    if (els.shareHeadline) {
      els.shareHeadline.textContent = !ownedCount ? 'まだコレクション0枚' : `コレクション ${ownedCount}枚`;
    }
    if (els.shareOwnedCount) els.shareOwnedCount.textContent = `${ownedCount} / ${totalCardCount}`;
    if (els.shareSubline) {
      els.shareSubline.textContent = !ownedCount
        ? 'ガチャを回すと持っているカードがここに全部並びます。'
        : '持っているカードがここに全部並びます。SNSに画像を載せよう。';
    }
    els.shareStageGrid.innerHTML = ownedCount
      ? ownedStates.map((item, index) => renderShareCard(item, index)).join('')
      : renderSharePlaceholder(0);
    if (els.shareStageTags) {
      els.shareStageTags.innerHTML = buildShareTags(ownedStates, previewStates).map((tag) => `<span class="share-tag">${escapeHtml(tag)}</span>`).join('');
    }
    if (els.downloadShareButton) els.downloadShareButton.disabled = !previewStates.length;
    if (els.nativeShareButton) {
      els.nativeShareButton.disabled = !previewStates.length;
      els.nativeShareButton.textContent = supportsNativeShare() ? 'SNSでシェア' : '保存してシェア';
    }
    const defaultHelp = !ownedCount
      ? 'まだシェアできるカードがありません。まずは1回引いてみて。'
      : `いまの所持カード ${ownedCount}枚 を一覧で見せられます。`;
    if (els.shareHelpText) els.shareHelpText.textContent = shareFeedbackMessage || defaultHelp;
  }

  function renderShareCard(item, index) {
    const tilts = [-2.2, 1.9, -1.5, 1.4];
    const tilt = tilts[index % tilts.length] ?? 0;
    return `
      <article class="share-showcase-card is-owned-list" data-rarity="${escapeHtml(item.strongestOwned.rarity)}" style="--card-tilt:${tilt}deg">
        <div class="share-showcase-media">
          <img src="${escapeHtml(resolveAssetPath(item.strongestOwned.imageUrl))}" alt="${escapeHtml(item.character.name)}">
          <span class="collection-rarity share-showcase-rarity rarity-${escapeHtml(item.strongestOwned.rarity)}">${escapeHtml(item.strongestOwned.rarity)}</span>
          <span class="share-showcase-order-badge">#${escapeHtml(String(index + 1).padStart(2, '0'))}</span>
        </div>
        <div class="share-showcase-copy">
          <h4 class="share-showcase-name">${escapeHtml(item.character.name)}</h4>
        </div>
      </article>
    `;
  }

  function renderSharePlaceholder(index) {
    return `
      <article class="share-showcase-card is-empty" style="--card-tilt:${index % 2 === 0 ? '-1.2deg' : '1.2deg'}">
        <div class="share-empty-copy">
          <strong>まだカードがありません</strong>
          <span>ガチャを回すとここに所持カードが一覧で並びます。</span>
        </div>
      </article>
    `;
  }

  function getShareSelection(characterStates = getBannerCharacterStates()) {
    const ownedCards = state.ownedCardIds
      .map((cardId) => getCardViewModel(cardsById.get(cardId)))
      .filter(Boolean)
      .sort((left, right) => {
        const rarityDiff = getRarityWeight(right.rarity) - getRarityWeight(left.rarity);
        if (rarityDiff) return rarityDiff;
        return left.characterName.localeCompare(right.characterName, 'ja');
      });
    const entries = ownedCards.map((card) => ({
      card,
      character: { name: card.characterName },
      strongestOwned: { rarity: card.rarity, imageUrl: card.imageUrl, lineText: card.lineText },
      ownedRarities: [card.rarity],
    }));
    return {
      characterStates,
      ownedStates: entries,
      selectedStates: entries,
      previewStates: entries,
      slots: entries.slice(0, MAX_SHOWCASE_CHARACTERS),
    };
  }

  function buildShareTags(ownedStates, previewStates) {
    const tags = ['#MOBBYCAPSULE', `#${ownedStates.length}枚コレクション`];
    const ssrCount = previewStates.filter((item) => item.strongestOwned.rarity === 'SSR').length;
    if (ssrCount) tags.push(`#SSR${ssrCount}`);
    if (ownedStates.length >= 24) tags.push('#推し自慢');
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
    const { ownedStates, previewStates, slots } = getShareSelection();
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
    ctx.fillText('モビーコレクション', 104, 184);
    ctx.fillStyle = '#7b5b43';
    ctx.font = '700 30px "Zen Maru Gothic", sans-serif';
    ctx.fillText(`持ってるカード ${ownedStates.length} / ${activeBanner.poolCardIds.length}`, 104, 232);
    const positions = [
      { x: 82, y: 300, tilt: -0.045 },
      { x: 546, y: 322, tilt: 0.038 },
      { x: 92, y: 792, tilt: -0.03 },
      { x: 536, y: 814, tilt: 0.028 },
    ];
    positions.forEach((position, index) => drawShareCanvasCard(ctx, position, slots[index], images[index]));
    drawCanvasTags(ctx, buildShareTags(ownedStates, previewStates).slice(0, 3), 104, 1246);
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
      ctx.fillText('あと1人でシェア解放', 0, 34);
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
    if (!els.collectionModal) return;
    renderCollection();
    isCollectionModalOpen = true;
    els.collectionModal.hidden = false;
    document.body.classList.add('is-collection-open');
  }

  function closeCollectionSection() {
    if (!els.collectionModal) return;
    isCollectionModalOpen = false;
    els.collectionModal.hidden = true;
    document.body.classList.remove('is-collection-open');
  }

  function openShareSection() {
    if (!els.shareModal) return;
    renderShareStage();
    isShareModalOpen = true;
    els.shareModal.hidden = false;
    document.body.classList.add('is-share-open');
  }

  function closeShareModal() {
    if (!els.shareModal) return;
    isShareModalOpen = false;
    els.shareModal.hidden = true;
    document.body.classList.remove('is-share-open');
    hideSharePreview();
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
    const count = previewStates.length;
    if (!count) return 'いまのモビーコレクション #MOBBYCAPSULE';
    return `MOBBYで${count}枚コレクション中。${names ? `${names} がいるよ。` : ''} #MOBBYCAPSULE`;
  }

  function setShareFeedback(message) {
    shareFeedbackMessage = message;
    renderShareStage();
  }

  function supportsNativeShare() {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof File === 'function';
  }

  function prefersMobileSaveFlow() {
    if (typeof window === 'undefined') return false;
    return isMobileViewport() || window.matchMedia('(pointer: coarse)').matches;
  }

  function createShareFile(blob, fileName) {
    if (typeof File !== 'function') return null;
    try {
      return new File([blob], fileName, { type: blob.type || 'image/png' });
    } catch {
      return null;
    }
  }

  function canShareFile(file) {
    if (!file || !supportsNativeShare()) return false;
    return typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] });
  }

  async function handleShareImageSave(blob, fileName) {
    if (prefersMobileSaveFlow()) {
      const shareResult = await shareImageOrFallback(blob, fileName, 'MOBBYのコレクション画像を保存');
      if (shareResult === 'shared' || shareResult === 'preview' || shareResult === 'cancelled') return shareResult;
    }
    hideSharePreview();
    downloadBlob(blob, fileName);
    return 'downloaded';
  }

  async function shareImageOrFallback(blob, fileName, shareText) {
    const file = createShareFile(blob, fileName);
    if (canShareFile(file)) {
      try {
        hideSharePreview();
        await navigator.share({ title: 'MOBBY CAPSULE', text: shareText, files: [file] });
        return 'shared';
      } catch (error) {
        if (error?.name === 'AbortError') return 'cancelled';
      }
    }
    if (prefersMobileSaveFlow() && showSharePreview(blob, '画像を長押しして保存できます。保存後にSNSへ投稿してください。')) {
      return 'preview';
    }
    hideSharePreview();
    downloadBlob(blob, fileName);
    return 'downloaded';
  }

  function showSharePreview(blob, message) {
    if (!els.sharePreviewPanel || !els.sharePreviewImage) return false;
    hideSharePreview();
    sharePreviewUrl = URL.createObjectURL(blob);
    els.sharePreviewImage.src = sharePreviewUrl;
    els.sharePreviewPanel.hidden = false;
    if (els.sharePreviewHint) els.sharePreviewHint.textContent = message;
    window.setTimeout(() => {
      els.sharePreviewPanel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 32);
    return true;
  }

  function hideSharePreview() {
    if (sharePreviewUrl) {
      URL.revokeObjectURL(sharePreviewUrl);
      sharePreviewUrl = '';
    }
    if (els.sharePreviewImage) els.sharePreviewImage.removeAttribute('src');
    if (els.sharePreviewHint) els.sharePreviewHint.textContent = '画像を長押しして保存できます。';
    if (els.sharePreviewPanel) els.sharePreviewPanel.hidden = true;
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
    let output = `${text}...`;
    while (output.length > 1 && ctx.measureText(output).width > maxWidth) output = `${output.slice(0, -4)}...`;
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
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
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

  function loadState() {
    const fallback = {
      selectedMode: 'free',
      ownedCardIds: [],
      history: [],
      lastCardId: null,
      dailyClaimDateJst: null,
      selectedCollectionTab: 'all',
      showcaseCharacterIds: [],
      starterTenPullClaimed: false,
      lastStarterPullCardIds: [],
      lastPullType: 'single',
      ichibanTickets: 0,
      fiftyPackStock: 0,
      kujiBoostRemaining: 0,
      kujiPrizeHistory: [],
    };

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
      return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
    } catch {
      return fallback;
    }
  }

  function normalizeState(rawState) {
    const ownedCardIds = unique((rawState.ownedCardIds ?? []).filter((id) => cardsById.has(id)));
    const history = Array.isArray(rawState.history)
      ? rawState.history
          .filter((entry) => entry && typeof entry.cardId === 'string' && cardsById.has(entry.cardId))
          .slice(0, MAX_HISTORY)
      : [];
    const hasExistingProgress = ownedCardIds.length > 0 || history.length > 0 || Boolean(rawState.dailyClaimDateJst) || Boolean(rawState.lastCardId);
    const kujiPrizeHistory = Array.isArray(rawState.kujiPrizeHistory)
      ? rawState.kujiPrizeHistory.filter((entry) => entry && typeof entry.name === 'string').slice(0, 30)
      : [];

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
      lastPullType: rawState.lastPullType === 'starter' || rawState.lastPullType === 'multi50' ? rawState.lastPullType : 'single',
      ichibanTickets: toSafeInt(rawState.ichibanTickets),
      fiftyPackStock: toSafeInt(rawState.fiftyPackStock),
      kujiBoostRemaining: toSafeInt(rawState.kujiBoostRemaining),
      kujiPrizeHistory,
    };
  }

  function toSafeInt(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.floor(num));
  }

  function bindEconomyExtras() {
    const fiftyButton = document.getElementById('buyFiftyPackButton');
    if (fiftyButton && !fiftyButton.dataset.boundEconomy) {
      fiftyButton.dataset.boundEconomy = '1';
      fiftyButton.addEventListener('click', (event) => {
        void purchaseFiftyPack(event.currentTarget);
      });    }

    const ticketButton = document.getElementById('buyKujiTicketButton');
    if (ticketButton && !ticketButton.dataset.boundEconomy) {
      ticketButton.dataset.boundEconomy = '1';
      ticketButton.addEventListener('click', purchaseKujiTicket);
    }
  }

  function getStandardCardRates() {
    return activeBanner.freeRates ?? activeBanner.paidRates ?? { N: 0.79, R: 0.2, SSR: 0.01 };
  }

  function getIchibanPrizes() {
    return [
      { code: 'A', name: '商品A', description: '限定フィギュア', accent: '#ff8b8b' },
      { code: 'B', name: '商品B', description: 'ロゴ入りタンブラー', accent: '#ffb36b' },
      { code: 'C', name: '商品C', description: 'アクリルライト', accent: '#ffd36b' },
      { code: 'D', name: '商品D', description: '特製トートバッグ', accent: '#84d89a' },
      { code: 'E', name: '商品E', description: 'ステッカーセット', accent: '#74c4ff' },
      { code: 'F', name: '商品F', description: 'クリアポーチ', accent: '#c8a2ff' },
    ];
  }

  function getCurrentKujiWinRate() {
    return state.kujiBoostRemaining > 0 ? 0.1 : 0.03;
  }

  function renderModeState(options = {}) {
    const { resetMachineText = false, statusMessage = '' } = options;
    if (statusMessage) economyStatusMessage = statusMessage;
    const paidModeReleased = isPaidModeReleased();
    if (!paidModeReleased && state.selectedMode === 'paid') {
      state.selectedMode = 'free';
      saveState();
    }
    const isFreeMode = !paidModeReleased || state.selectedMode === 'free';
    const freeAvailable = canUseFreeDaily();
    const fiftyPackStock = toSafeInt(state.fiftyPackStock);
    const freeRemaining = freeAvailable ? 1 : 0;
    const ticketCount = toSafeInt(state.ichibanTickets);
    const freeModeSummary = `ガチャガチャ: 本日の無料 残り${freeRemaining}回 / 購入済み50連 残り${fiftyPackStock}回`;
    const paidModeSummary = `一番くじ: チケット 残り${ticketCount}枚`;
    state.fiftyPackStock = fiftyPackStock;

    els.freeModeButton?.classList.toggle('is-active', isFreeMode);
    els.paidModeButton?.classList.toggle('is-active', paidModeReleased && !isFreeMode);
    if (els.paidModeButton) {
      els.paidModeButton.disabled = !paidModeReleased || isSpinning;
      els.paidModeButton.classList.toggle('is-release-locked', !paidModeReleased);
      const paidLabel = paidModeReleased ? '一番くじに切り替える' : PAID_MODE_RELEASE_LABEL;
      els.paidModeButton.setAttribute('aria-label', paidLabel);
      els.paidModeButton.title = paidLabel;
    }

    if (els.startGachaButton) {
      ensureStartHandleButtonDom();
      if (isFreeMode) {
        const canSpinFreeHandle = freeAvailable || fiftyPackStock > 0;
        const handleActionLabel = fiftyPackStock > 0
          ? `購入済み50連を開封（残り${fiftyPackStock}）`
          : '無料ガチャを回す';
        els.startGachaButton.setAttribute('aria-label', handleActionLabel);
        els.startGachaButton.title = handleActionLabel;
        els.startGachaButton.disabled = isSpinning || !canSpinFreeHandle;
      } else {
        els.startGachaButton.setAttribute('aria-label', 'チケットで一番くじを引く');
        els.startGachaButton.title = 'チケットで一番くじを引く';
        els.startGachaButton.disabled = isSpinning || ticketCount <= 0;
      }
    }

    if (els.modeStatus) {
      els.modeStatus.textContent = isFreeMode ? freeModeSummary : paidModeSummary;
    }

    renderEconomyPanel();
    renderDomeHint();

    if (resetMachineText && !isSpinning) {
      resetMachineVisual();
      els.gachaMachine?.classList.remove('is-ticket-jackpot');
      els.resultCard?.classList.remove('is-ticket-jackpot');
    }
  }
  function ensureStartHandleButtonDom() {
    if (!els.startGachaButton) return;
    if (els.startGachaButton.querySelector('.gacha-handle-core')) return;
    els.startGachaButton.innerHTML = `
      <span class="gacha-handle-core"></span>
      <span class="gacha-handle-arm"></span>
      <span class="gacha-handle-knob"></span>
    `;
  }

  function renderEconomyPanel() {
    const panel = document.getElementById('modeEconomy');
    const ticketStock = document.getElementById('ticketStock');
    const buyFiftyButton = document.getElementById('buyFiftyPackButton');
    const buyKujiTicketButton = document.getElementById('buyKujiTicketButton');
    const note = document.getElementById('modeEconomyNote');
    if (!panel || !ticketStock || !buyFiftyButton || !buyKujiTicketButton || !note) return;

    const isFreeMode = state.selectedMode === 'free';
    const fiftyPackStock = toSafeInt(state.fiftyPackStock);
    state.fiftyPackStock = fiftyPackStock;

    panel.hidden = false;
    ticketStock.hidden = true;
    note.hidden = false;

    buyFiftyButton.hidden = !isFreeMode;
    buyKujiTicketButton.hidden = isFreeMode;
    buyFiftyButton.disabled = isSpinning || isCheckoutPending;
    buyKujiTicketButton.disabled = isSpinning;

    if (isFreeMode) {
      buyFiftyButton.textContent = isCheckoutPending ? '決済ページを準備中...' : '50連（2000円）を購入';
    } else {
      buyKujiTicketButton.textContent = 'チケット1枚（500円）を購入';
    }
    note.textContent = economyStatusMessage || (isFreeMode ? '決済完了後に50連1セットが追加されます。' : '');
    note.hidden = !note.textContent;  }
  function renderDomeHint() {
    if (!els.gachaDome || !els.gachaDomeHint) return;
    const isFreeMode = state.selectedMode === 'free';
    const modeName = isFreeMode ? '無料ガチャ' : '一番くじ';
    els.gachaDome.setAttribute('aria-label', `${modeName}のラインナップを見る`);
    els.gachaDomeHint.innerHTML = `
      <span class="gacha-dome-hint-main">タップで${escapeHtml(modeName)}一覧</span>
      <span class="gacha-dome-hint-sub">何が出るか先にチェック</span>
    `;
  }

  function renderGachaLineupModalContents() {
    const isFreeMode = state.selectedMode === 'free';

    if (isFreeMode) {
      const rates = getStandardCardRates();
      const lineupStates = bannerCharacters
        .map((character) => {
          const cards = bannerCardsByCharacterId.get(character.id) ?? [];
          const previewCard = cards[0] ?? null;
          return {
            character,
            previewCard,
            rarityList: RARITY_DISPLAY_ORDER.filter((rarity) => cards.some((card) => card.rarity === rarity)),
          };
        })
        .sort((left, right) => left.character.name.localeCompare(right.character.name, 'ja'));

      if (els.gachaLineupModeLabel) els.gachaLineupModeLabel.textContent = '無料ガチャ ラインナップ';
      if (els.gachaLineupNote) {
        els.gachaLineupNote.textContent = '無料ガチャは1日1回。0.1%で一番くじチケットが追加で出現。SSRは必ずチケット1枚付き。';
      }

      if (els.gachaLineupRates) {
        els.gachaLineupRates.innerHTML = RARITY_DISPLAY_ORDER.slice().reverse().map((rarity) => {
          const value = Math.round((rates[rarity] ?? 0) * 1000) / 10;
          return `
            <article class="lineup-rate-card rarity-${escapeHtml(rarity)}">
              <p class="lineup-rate-rarity">${escapeHtml(rarity)}</p>
              <p class="lineup-rate-value">${escapeHtml(String(value))}%</p>
            </article>
          `;
        }).join('');
      }

      if (els.gachaLineupGrid) {
        els.gachaLineupGrid.innerHTML = lineupStates.map((item) => {
          const previewSrc = item.previewCard ? resolveAssetPath(item.previewCard.imageUrl) : '';
          return `
            <article class="lineup-item-card">
              <div class="lineup-item-thumb">${previewSrc ? `<img src="${escapeHtml(previewSrc)}" alt="${escapeHtml(item.character.name)}">` : ''}</div>
              <div class="lineup-item-copy">
                <h4>${escapeHtml(item.character.name)}</h4>
                <p>${escapeHtml(item.character.categoryLabel)}</p>
                <div class="lineup-rarity-row">
                  ${item.rarityList.map((rarity) => `<span class="lineup-rarity-pill rarity-${escapeHtml(rarity)}">${escapeHtml(rarity)}</span>`).join('')}
                </div>
              </div>
            </article>
          `;
        }).join('');
      }

      if (els.lineupSpinButton) {
        const freeAvailable = canUseFreeDaily();
        const fiftyPackStock = toSafeInt(state.fiftyPackStock);
        const canSpinFromLineup = freeAvailable || fiftyPackStock > 0;
        els.lineupSpinButton.textContent = fiftyPackStock > 0
          ? `購入済み50連を開封（残り${fiftyPackStock}）`
          : freeAvailable
            ? 'このまま無料で回す'
            : '本日は回し済み';
        els.lineupSpinButton.disabled = isSpinning || !canSpinFromLineup;
      }
      return;
    }

    const prizes = getIchibanPrizes();
    const rate = getCurrentKujiWinRate();
    const rateText = `${Math.round(rate * 1000) / 10}%`;

    if (els.gachaLineupModeLabel) els.gachaLineupModeLabel.textContent = '一番くじ ラインナップ';
    if (els.gachaLineupNote) {
      els.gachaLineupNote.textContent = `チケット1枚で1回挑戦。現在の当選率は${rateText}。`;
    }

    if (els.gachaLineupRates) {
      const loseRate = Math.max(0, 1 - rate);
      els.gachaLineupRates.innerHTML = `
        <article class="lineup-rate-card rarity-SSR">
          <p class="lineup-rate-rarity">当選率</p>
          <p class="lineup-rate-value">${escapeHtml(rateText)}</p>
        </article>
        <article class="lineup-rate-card rarity-N">
          <p class="lineup-rate-rarity">非当選</p>
          <p class="lineup-rate-value">${escapeHtml(String(Math.round(loseRate * 1000) / 10))}%</p>
        </article>
        <article class="lineup-rate-card rarity-R">
          <p class="lineup-rate-rarity">必要チケット</p>
          <p class="lineup-rate-value">1枚 / 回</p>
        </article>
      `;
    }

    if (els.gachaLineupGrid) {
      els.gachaLineupGrid.innerHTML = prizes.map((prize) => `
        <article class="lineup-item-card">
          <div class="lineup-item-thumb" style="background: linear-gradient(135deg, ${escapeHtml(prize.accent)}, #ffffff)"></div>
          <div class="lineup-item-copy">
            <h4>${escapeHtml(prize.name)}</h4>
            <p>${escapeHtml(prize.description)}</p>
            <div class="lineup-rarity-row"><span class="lineup-rarity-pill rarity-SSR">商品</span></div>
          </div>
        </article>
      `).join('');
    }

    if (els.lineupSpinButton) {
      els.lineupSpinButton.textContent = state.ichibanTickets > 0 ? 'チケットで引く' : 'チケット不足';
      els.lineupSpinButton.disabled = isSpinning || state.ichibanTickets <= 0;
    }
  }

  function drawCard() {
    const rates = getStandardCardRates();
    const roll = Math.random();
    const ssrCut = rates.SSR ?? 0;
    const rCut = ssrCut + (rates.R ?? 0);

    let targetRarity = 'N';
    if (roll < ssrCut) targetRarity = 'SSR';
    else if (roll < rCut) targetRarity = 'R';

    const rarityPool = bannerPool.filter((card) => card.rarity === targetRarity);
    if (rarityPool.length) return pickRandom(rarityPool);

    const fallbackPool = bannerPool.filter((card) => card.rarity === 'N');
    return pickRandom(fallbackPool.length ? fallbackPool : bannerPool);
  }

  function startSpin() {
    if (isSpinning) return;
    if (state.selectedMode === 'paid') {
      runIchibanKujiSpin();
      return;
    }
    if (toSafeInt(state.fiftyPackStock) > 0) {
      runPurchasedFiftyPack();
      return;
    }
    runFreeGachaSpin();
  }

  function runFreeGachaSpin() {
    if (!canUseFreeDaily()) {
      renderModeState({ statusMessage: '本日の無料ガチャは使用済みです。翌日0:00（JST）に再挑戦できます。' });
      return;
    }

    const card = drawCard();
    if (!card) {
      renderModeState({ statusMessage: 'カードを引けませんでした。時間をおいて再試行してください。' });
      return;
    }

    clearTimers();
    isSpinning = true;

    state.dailyClaimDateJst = getJstDateKey();
    state.lastPullType = 'single';
    state.lastCardId = card.id;

    const wasOwned = state.ownedCardIds.includes(card.id);
    if (!wasOwned) state.ownedCardIds.push(card.id);

    const rewardMessages = [];
    if (card.rarity === 'SSR') {
      state.ichibanTickets += 1;
      rewardMessages.push('SSR特典でチケット+1');
    }

    let luckyTicket = false;
    if (Math.random() < 0.001) {
      state.ichibanTickets += 1;
      luckyTicket = true;
      rewardMessages.push('0.1%当選でチケット+1');
    }

    pushHistoryCard(card.id, 'free');
    saveState();

    if (els.startGachaButton) els.startGachaButton.disabled = true;
    resetMachineVisual();
    els.gachaMachine?.classList.remove('is-ticket-jackpot');
    els.resultCard?.classList.remove('is-ticket-jackpot');
    if (els.gachaMachine) els.gachaMachine.dataset.rarity = card.rarity;
    els.gachaMachine?.classList.add('is-spinning');
    applyCapsulePalette(card.rarity);

    schedule(() => {
      els.gachaMachine?.classList.add('has-capsule');
    }, 340);

    schedule(() => {
      els.gachaMachine?.classList.remove('is-spinning');
      els.gachaMachine?.classList.add('is-revealed');
      showCard(card, { ownership: wasOwned ? 'owned' : 'new' });
      hideMultiResult();
      renderHistory();
      renderCollection();
      renderShareStage();

      if (luckyTicket) {
        els.gachaMachine?.classList.add('is-ticket-jackpot');
        els.resultCard?.classList.add('is-ticket-jackpot');
        schedule(() => {
          els.gachaMachine?.classList.remove('is-ticket-jackpot');
          els.resultCard?.classList.remove('is-ticket-jackpot');
        }, 1800);
      }

      const baseMessage = wasOwned ? '同じカードでした。' : '新しいカードを獲得。';
      const bonusMessage = rewardMessages.length ? ` ${rewardMessages.join(' / ')}` : '';
      isSpinning = false;
      renderModeState({ statusMessage: `${baseMessage}${bonusMessage}` });
    }, 1020);
  }

  function runIchibanKujiSpin() {
    if (state.ichibanTickets <= 0) {
      renderModeState({ statusMessage: '一番くじチケットが不足しています。チケットを購入してください。' });
      return;
    }

    clearTimers();
    isSpinning = true;

    const winRate = getCurrentKujiWinRate();
    const prizes = getIchibanPrizes();
    const isBoosted = state.kujiBoostRemaining > 0;

    state.ichibanTickets = Math.max(0, state.ichibanTickets - 1);
    if (isBoosted) state.kujiBoostRemaining = Math.max(0, state.kujiBoostRemaining - 1);

    const isHit = Math.random() < winRate;
    const prize = isHit ? pickRandom(prizes) : null;

    if (prize) {
      state.kujiPrizeHistory.unshift({ name: prize.name, at: Date.now() });
      state.kujiPrizeHistory = state.kujiPrizeHistory.slice(0, 30);
    }

    saveState();

    if (els.startGachaButton) els.startGachaButton.disabled = true;
    resetMachineVisual();
    els.gachaMachine?.classList.remove('is-ticket-jackpot');
    els.resultCard?.classList.remove('is-ticket-jackpot');
    els.gachaMachine?.classList.add('is-spinning');
    applyCapsulePalette(isHit ? 'SSR' : 'N');

    schedule(() => {
      els.gachaMachine?.classList.add('has-capsule');
    }, 320);

    schedule(() => {
      els.gachaMachine?.classList.remove('is-spinning');
      els.gachaMachine?.classList.add('is-revealed');
      showIchibanResult(prize, isHit, winRate);
      const status = isHit
        ? `${prize.name} 当選。チケット残り ${state.ichibanTickets}枚。`
        : `今回ははずれ。チケット残り ${state.ichibanTickets}枚。`;
      isSpinning = false;
      renderModeState({ statusMessage: status });
      renderShareStage();
    }, 980);
  }

  async function purchaseFiftyPack(triggerButton = null) {
    if (isSpinning || isCheckoutPending) return;
    if (!els.checkoutMount || !els.checkoutOverlay) {
      economyStatusMessage = '決済パネルの表示先が見つかりませんでした。';
      renderModeState();
      return;
    }

    isCheckoutPending = true;
    economyStatusMessage = '決済パネルを準備しています。数秒お待ちください。';
    renderModeState();
    if (isLineupModalOpen) renderGachaLineupModalContents();

    try {
      const session = await createEmbeddedCheckoutSession();
      const StripeCtor = await loadStripeJs();
      const stripe = StripeCtor(session.publishableKey);
      if (!stripe) {
        throw new Error('Stripeの初期化に失敗しました。');
      }

      teardownEmbeddedCheckout();
      els.checkoutMount.innerHTML = '';
      embeddedCheckoutInstance = await stripe.initEmbeddedCheckout({
        fetchClientSecret: async () => session.clientSecret,
        onComplete: () => {
          void finalizeCheckoutSession(session.sessionId, { closeOverlay: true });
        },
      });
      embeddedCheckoutInstance.mount('#checkoutMount');
      openCheckoutOverlay();
      economyStatusMessage = '決済パネルを表示しました。支払い完了後に50連が反映されます。';
    } catch (error) {
      economyStatusMessage = error?.message || '決済パネルの表示に失敗しました。';
    } finally {
      isCheckoutPending = false;
      if (triggerButton && typeof triggerButton.blur === 'function') triggerButton.blur();
      renderModeState();
      if (isLineupModalOpen) renderGachaLineupModalContents();
    }
  }
  function runPurchasedFiftyPack() {
    if (isSpinning) return;

    const ssrPool = bannerPool.filter((card) => card.rarity === 'SSR');
    if (!bannerPool.length) {
      renderModeState({ statusMessage: 'カードプールが見つかりませんでした。' });
      return;
    }

    state.fiftyPackStock = Math.max(0, toSafeInt(state.fiftyPackStock) - 1);
    isSpinning = true;
    clearTimers();
    if (els.startGachaButton) els.startGachaButton.disabled = true;
    resetMachineVisual();
    els.gachaMachine?.classList.remove('is-ticket-jackpot');
    els.resultCard?.classList.remove('is-ticket-jackpot');

    const pulledCards = Array.from({ length: 50 }, () => drawCard()).filter(Boolean);
    if (!pulledCards.length) {
      isSpinning = false;
      renderModeState({ statusMessage: '50連を実行できませんでした。' });
      return;
    }

    if (ssrPool.length && !pulledCards.some((card) => card.rarity === 'SSR')) {
      pulledCards[pulledCards.length - 1] = pickRandom(ssrPool);
    }

    const ownedSet = new Set(state.ownedCardIds);
    let ticketGain = 0;
    const results = pulledCards.map((card) => {
      const isNew = !ownedSet.has(card.id);
      if (isNew) {
        ownedSet.add(card.id);
        state.ownedCardIds.push(card.id);
      }
      if (card.rarity === 'SSR') ticketGain += 1;
      return { card, isNew };
    });

    state.ichibanTickets += ticketGain;
    state.kujiBoostRemaining += 50;
    state.lastPullType = 'multi50';

    const featured = pickFeaturedStarterResult(results);
    if (featured?.card?.id) {
      state.lastCardId = featured.card.id;
      pushHistoryCard(featured.card.id, 'multi50');
      if (els.gachaMachine) els.gachaMachine.dataset.rarity = featured.card.rarity;
      applyCapsulePalette(featured.card.rarity);
    } else {
      applyCapsulePalette('N');
    }

    saveState();
    els.gachaMachine?.classList.add('is-spinning');

    schedule(() => {
      els.gachaMachine?.classList.add('has-capsule');
    }, 280);

    schedule(() => {
      els.gachaMachine?.classList.remove('is-spinning');
      els.gachaMachine?.classList.add('is-revealed');

      if (featured?.card?.id) {
        showCard(featured.card, { ownership: featured.isNew ? 'new' : 'owned' });
        renderMultiResult(results, featured.card.id);
      } else {
        hideMultiResult();
      }

      renderHistory();
      renderCollection();
      renderShareStage();
      isSpinning = false;
      renderModeState({
        statusMessage: `50連を開封。SSR特典でチケット+${ticketGain}。`,
      });

    }, 940);
  }

  function purchaseKujiTicket() {
    if (isSpinning) return;
    state.ichibanTickets += 1;
    saveState();
    renderModeState({ statusMessage: `チケット1枚（500円）を仮購入しました。所持 ${state.ichibanTickets}枚。` });
    if (isLineupModalOpen) renderGachaLineupModalContents();
  }

  function loadStripeJs() {
    if (window.Stripe) return Promise.resolve(window.Stripe);
    if (stripeLoaderPromise) return stripeLoaderPromise;

    stripeLoaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/clover/stripe.js';
      script.async = true;
      script.onload = () => {
        if (window.Stripe) resolve(window.Stripe);
        else reject(new Error('Stripe.jsの読み込みに失敗しました。'));
      };
      script.onerror = () => reject(new Error('Stripe.jsの読み込みに失敗しました。'));
      document.head.appendChild(script);
    });

    return stripeLoaderPromise;
  }

  function teardownEmbeddedCheckout() {
    if (!embeddedCheckoutInstance) return;
    try {
      if (typeof embeddedCheckoutInstance.unmount === 'function') {
        embeddedCheckoutInstance.unmount();
      }
      if (typeof embeddedCheckoutInstance.destroy === 'function') {
        embeddedCheckoutInstance.destroy();
      }
    } catch {}
    embeddedCheckoutInstance = null;
  }

  function openCheckoutOverlay() {
    if (!els.checkoutOverlay) return;
    isCheckoutModalOpen = true;
    els.checkoutOverlay.hidden = false;
    document.body.classList.add('is-checkout-open');
  }

  function closeCheckoutOverlay() {
    if (!els.checkoutOverlay) return;
    isCheckoutModalOpen = false;
    els.checkoutOverlay.hidden = true;
    document.body.classList.remove('is-checkout-open');
    teardownEmbeddedCheckout();
    if (els.checkoutMount) els.checkoutMount.innerHTML = '';
  }

  async function createEmbeddedCheckoutSession() {
    const response = await fetch(GACHA_CHECKOUT_SESSION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'gacha' }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.clientSecret || !data?.publishableKey || !data?.sessionId) {
      throw new Error(data?.error || '決済セッションの作成に失敗しました。');
    }
    return data;
  }

  function loadGrantedCheckoutSessionIds() {
    try {
      const raw = window.localStorage.getItem(GACHA_CHECKOUT_GRANT_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed)
        ? parsed.filter((value) => typeof value === 'string' && value.startsWith('cs_')).slice(-40)
        : [];
    } catch {
      return [];
    }
  }

  function hasGrantedCheckoutSession(sessionId) {
    return loadGrantedCheckoutSessionIds().includes(sessionId);
  }

  function rememberGrantedCheckoutSession(sessionId) {
    if (!sessionId) return;
    const next = unique([...loadGrantedCheckoutSessionIds(), sessionId]).slice(-40);
    try {
      window.localStorage.setItem(GACHA_CHECKOUT_GRANT_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  function clearCheckoutQueryParams() {
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    url.searchParams.delete('session_id');
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, document.title, nextUrl);
  }

  async function finalizeCheckoutSession(sessionId, options = {}) {
    const { closeOverlay = false, clearUrl = false } = options;
    if (!sessionId) return;

    if (hasGrantedCheckoutSession(sessionId)) {
      economyStatusMessage = 'この50連はすでに反映済みです。';
      if (closeOverlay) closeCheckoutOverlay();
      if (clearUrl) clearCheckoutQueryParams();
      renderModeState();
      return;
    }

    isCheckoutPending = true;
    economyStatusMessage = '決済完了を確認しています。';
    renderModeState();

    try {
      const response = await fetch(GACHA_CHECKOUT_STATUS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || '決済結果を確認できませんでした。');
      }
      if (!data?.ok || data?.productType !== GACHA_FIFTY_PACK_PRODUCT_TYPE) {
        throw new Error('50連の決済として確認できませんでした。');
      }

      if (data?.paid) {
        state.fiftyPackStock = toSafeInt(state.fiftyPackStock) + 1;
        saveState();
        rememberGrantedCheckoutSession(sessionId);
        economyStatusMessage = '50連（2000円）の決済が完了しました。取っ手を回すと1セット開封できます。';
        if (closeOverlay) closeCheckoutOverlay();
      } else {
        economyStatusMessage = data?.message || '決済はまだ完了していません。';
      }

      if (clearUrl) clearCheckoutQueryParams();
    } catch (error) {
      economyStatusMessage = error?.message || '決済結果を確認できませんでした。';
    } finally {
      isCheckoutPending = false;
      renderModeState();
      if (isLineupModalOpen) renderGachaLineupModalContents();
    }
  }

  async function handleReturnedCheckout() {
    const url = new URL(window.location.href);
    const checkoutState = (url.searchParams.get('checkout') || '').trim().toLowerCase();
    const sessionId = (url.searchParams.get('session_id') || '').trim();

    if (checkoutState === 'cancel' && !sessionId) {
      economyStatusMessage = '50連の決済をキャンセルしました。';
      clearCheckoutQueryParams();
      renderModeState();
      return;
    }

    if (!sessionId) return;
    await finalizeCheckoutSession(sessionId, { clearUrl: true, closeOverlay: true });
  }

  function pushHistoryCard(cardId, source) {
    state.history.unshift({ cardId, source, at: Date.now() });
    state.history = state.history.slice(0, MAX_HISTORY);
  }

  function showIchibanResult(prize, isHit, winRate) {
    hideMultiResult();

    if (els.resultCard) {
      els.resultCard.classList.remove('is-idle');
      els.resultCard.dataset.rarity = isHit ? 'SSR' : 'N';
      els.resultCard.classList.toggle('is-ticket-jackpot', isHit);
    }

    if (els.resultEmpty) els.resultEmpty.hidden = true;
    if (els.resultFilled) els.resultFilled.hidden = false;

    if (els.resultImage) {
      const title = isHit && prize ? prize.name : 'TRY AGAIN';
      const accent = isHit && prize ? prize.accent : '#b8b8b8';
      els.resultImage.src = buildKujiPrizeImageDataUrl(title, accent);
      els.resultImage.alt = isHit && prize ? prize.name : '一番くじ結果';
    }

    if (els.resultRarity) {
      els.resultRarity.textContent = isHit ? 'KUJI WIN' : 'KUJI';
      els.resultRarity.className = 'rarity-pill';
    }

    if (els.resultOwnership) {
      els.resultOwnership.textContent = isHit ? 'WIN' : 'LOSE';
      els.resultOwnership.className = 'status-pill';
    }

    if (els.resultTitle) {
      els.resultTitle.textContent = isHit && prize ? `${prize.name} 当選` : '今回ははずれ';
    }

    if (els.resultLine) {
      els.resultLine.textContent = isHit && prize
        ? `${prize.description} を獲得しました。`
        : '次のチケットで商品A〜Fを狙おう。';
    }

    if (els.resultDetail) {
      els.resultDetail.textContent = `現在の当選率 ${Math.round(winRate * 1000) / 10}%`;
    }

    scrollResultCardIntoView();
  }

  function buildKujiPrizeImageDataUrl(title, accent) {
    const safeTitle = escapeHtml(title);
    const safeAccent = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(accent) ? accent : '#ff9b7a';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${safeAccent}"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs><rect width="768" height="768" fill="url(#g)"/><rect x="24" y="24" width="720" height="720" rx="56" fill="rgba(255,255,255,0.72)"/><text x="384" y="320" text-anchor="middle" font-family="'Zen Maru Gothic', sans-serif" font-size="64" font-weight="900" fill="#5e3312">一番くじ</text><text x="384" y="430" text-anchor="middle" font-family="'Zen Maru Gothic', sans-serif" font-size="72" font-weight="900" fill="#3d2210">${safeTitle}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  async function createShareImageBlob() {
    if (!els.shareCanvas) return null;
    const { ownedStates } = getShareSelection();
    if (!ownedStates.length) return null;
    const canvas = els.shareCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const visibleCards = ownedStates;
    const images = await Promise.all(
      visibleCards.map((item) => loadImage(resolveAssetPath(item.strongestOwned.imageUrl)).catch(() => null)),
    );

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#fff5f0');
    bgGradient.addColorStop(0.52, '#ffeccf');
    bgGradient.addColorStop(1, '#ffdbe5');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    for (let y = 26; y < height; y += 72) {
      for (let x = 24; x < width; x += 72) {
        drawCircle(ctx, x, y, 3, 'rgba(255, 255, 255, 0.28)');
      }
    }

    const sheetX = 48;
    const sheetY = 42;
    const sheetWidth = width - 96;
    const sheetHeight = height - 84;
    fillRoundedRect(ctx, sheetX, sheetY, sheetWidth, sheetHeight, 42, 'rgba(255, 253, 248, 0.88)');
    fillRoundedRect(ctx, sheetX + 18, sheetY + 18, sheetWidth - 36, sheetHeight - 36, 34, 'rgba(255, 248, 241, 0.76)');

    for (let index = 0; index < 5; index += 1) {
      const holeY = 180 + index * 216;
      drawCircle(ctx, 90, holeY, 17, 'rgba(224, 196, 173, 0.78)');
      drawCircle(ctx, 90, holeY, 8, 'rgba(255, 255, 255, 0.96)');
    }

    fillRoundedRect(ctx, width - 286, 78, 184, 58, 29, 'rgba(255, 255, 255, 0.94)');
    ctx.fillStyle = '#6a4426';
    ctx.font = '900 28px "Zen Maru Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${ownedStates.length} / ${activeBanner.poolCardIds.length}`, width - 194, 116);
    ctx.textAlign = 'left';

    const gridX = 130;
    const gridY = 164;
    const gridWidth = width - gridX - 68;
    const gridHeight = height - gridY - 92;
    const layout = getShareStickerLayout(visibleCards.length);
    const gapX = layout.gap;
    const gapY = layout.gap;
    const cellWidth = layout.columns === 1 ? Math.min(gridWidth * 0.82, 560) : (gridWidth - gapX * (layout.columns - 1)) / layout.columns;
    const cellHeight = layout.rows === 1 ? Math.min(gridHeight * 0.82, 780) : (gridHeight - gapY * (layout.rows - 1)) / layout.rows;

    for (let row = 0; row < layout.rows; row += 1) {
      const rowStartIndex = row * layout.columns;
      const rowItems = visibleCards.slice(rowStartIndex, rowStartIndex + layout.columns);
      const rowWidth = rowItems.length * cellWidth + Math.max(0, rowItems.length - 1) * gapX;
      const rowStartX = gridX + (gridWidth - rowWidth) / 2;

      rowItems.forEach((item, column) => {
        const index = rowStartIndex + column;
        const frame = {
          x: rowStartX + column * (cellWidth + gapX),
          y: gridY + row * (cellHeight + gapY),
          width: cellWidth,
          height: cellHeight,
          tilt: ((row + column) % 2 === 0 ? -1 : 1) * Math.min(0.012 + (index % 3) * 0.004, 0.02),
        };
        drawShareCanvasCard(ctx, frame, item, images[index] ?? null);
      });
    }

    ctx.fillStyle = 'rgba(120, 82, 55, 0.34)';
    ctx.font = '900 18px "Zen Maru Gothic", sans-serif';
    ctx.fillText('MOBBY CAPSULE', width - 244, height - 42);
    return canvasToBlob(canvas);
  }

  function drawShareCanvasCard(ctx, frame, item, image) {
    const { x, y, width, height, tilt = 0 } = frame;
    const palette = getSharePalette(item?.strongestOwned?.rarity);
    const radius = Math.max(12, Math.min(28, Math.min(width, height) * 0.12));
    const mediaInsetX = Math.max(7, Math.min(14, width * 0.065));
    const mediaInsetY = Math.max(9, Math.min(18, height * 0.09));
    const mediaX = -width / 2 + mediaInsetX;
    const mediaY = -height / 2 + mediaInsetY;
    const mediaWidth = width - mediaInsetX * 2;
    const mediaHeight = height - mediaInsetY - Math.max(14, height * 0.12);
    const badgeWidth = Math.max(34, Math.min(54, width * 0.36));
    const badgeHeight = Math.max(18, Math.min(24, height * 0.17));
    const badgeRadius = badgeHeight / 2;
    const badgeFont = Math.max(9, Math.min(14, Math.min(width, height) * 0.09));
    const tapeWidthPrimary = Math.max(36, width * 0.34);
    const tapeWidthSecondary = Math.max(28, width * 0.24);
    const sparkleSize = Math.max(1.8, Math.min(4, width * 0.025));
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(tilt);

    if (!item) {
      fillRoundedRect(ctx, -width / 2, -height / 2, width, height, radius, 'rgba(255, 255, 255, 0.5)');
      strokeRoundedRect(ctx, -width / 2, -height / 2, width, height, radius, 'rgba(161, 114, 73, 0.22)', 3, [14, 10]);
      drawStickerTape(ctx, -width * 0.18, -height / 2 + 4, tapeWidthPrimary, -0.12, 'rgba(255, 244, 199, 0.76)');
      ctx.restore();
      return;
    }

    ctx.shadowColor = palette.shadow;
    ctx.shadowBlur = Math.max(12, Math.min(18, width * 0.08));
    ctx.shadowOffsetY = Math.max(8, Math.min(11, height * 0.06));
    fillRoundedRect(ctx, -width / 2, -height / 2, width, height, radius, palette.cardBackground);
    ctx.shadowColor = 'transparent';
    strokeRoundedRect(ctx, -width / 2, -height / 2, width, height, radius, palette.edge, Math.max(2, Math.min(4, width * 0.018)));
    drawStickerTape(ctx, -width * 0.2, -height / 2 + Math.max(4, height * 0.03), tapeWidthPrimary, -0.12, palette.tape);
    drawStickerTape(ctx, width * 0.08, -height / 2 + Math.max(8, height * 0.05), tapeWidthSecondary, 0.14, 'rgba(255, 255, 255, 0.48)');
    fillRoundedRect(ctx, mediaX, mediaY, mediaWidth, mediaHeight, Math.max(10, radius - 6), palette.mediaBackground);
    if (image) drawImageCover(ctx, image, mediaX, mediaY, mediaWidth, mediaHeight, Math.max(10, radius - 6));

    fillRoundedRect(ctx, mediaX + 8, mediaY + 8, badgeWidth, badgeHeight, badgeRadius, palette.badgeBackground);
    ctx.fillStyle = palette.badgeText;
    ctx.font = `900 ${badgeFont}px "Zen Maru Gothic", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(item.strongestOwned.rarity, mediaX + 8 + badgeWidth / 2, mediaY + 8 + badgeHeight * 0.72);

    if (item.strongestOwned.rarity === 'SSR') {
      drawCircle(ctx, width / 2 - 22, -height / 2 + 28, sparkleSize, 'rgba(255, 192, 88, 0.95)');
      drawCircle(ctx, width / 2 - 36, -height / 2 + 44, sparkleSize * 0.7, 'rgba(255, 135, 175, 0.9)');
      drawCircle(ctx, width / 2 - 18, -height / 2 + 50, sparkleSize * 0.6, 'rgba(132, 208, 255, 0.92)');
    }

    ctx.textAlign = 'left';
    ctx.restore();
  }

  function getSharePalette(rarity) {
    if (rarity === 'SSR') return { cardBackground: 'rgba(255, 252, 254, 0.99)', mediaBackground: 'rgba(255, 232, 244, 0.98)', badgeBackground: 'rgba(255, 229, 241, 0.98)', badgeText: '#d85186', shadow: 'rgba(255, 120, 164, 0.18)', edge: 'rgba(255, 203, 223, 0.95)', tape: 'rgba(255, 243, 197, 0.82)' };
    if (rarity === 'R') return { cardBackground: 'rgba(255, 252, 247, 0.99)', mediaBackground: 'rgba(255, 238, 219, 0.98)', badgeBackground: 'rgba(255, 244, 226, 0.98)', badgeText: '#cf7520', shadow: 'rgba(255, 173, 96, 0.16)', edge: 'rgba(255, 214, 167, 0.94)', tape: 'rgba(255, 236, 204, 0.8)' };
    return { cardBackground: 'rgba(255, 254, 251, 0.99)', mediaBackground: 'rgba(244, 235, 226, 0.98)', badgeBackground: 'rgba(244, 238, 232, 0.98)', badgeText: '#7b6656', shadow: 'rgba(161, 125, 94, 0.1)', edge: 'rgba(223, 207, 191, 0.94)', tape: 'rgba(250, 239, 211, 0.78)' };
  }

  function getShareStickerLayout(count) {
    if (count <= 1) return { columns: 1, rows: 1, gap: 0 };
    const aspect = 1.22;
    const columns = Math.max(1, Math.ceil(Math.sqrt(count / aspect)));
    const rows = Math.max(1, Math.ceil(count / columns));
    const gap = count <= 4 ? 24 : count <= 12 ? 18 : count <= 30 ? 12 : count <= 60 ? 8 : 6;
    return { columns, rows, gap };
  }

  function drawShareCanvasSummarySticker(ctx, frame, count) {
    const { x, y, width, height, tilt = 0 } = frame;
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(tilt);
    ctx.shadowColor = 'rgba(126, 86, 48, 0.12)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 11;
    fillRoundedRect(ctx, -width / 2, -height / 2, width, height, 28, 'rgba(255, 252, 247, 0.98)');
    ctx.shadowColor = 'transparent';
    strokeRoundedRect(ctx, -width / 2, -height / 2, width, height, 28, 'rgba(228, 204, 173, 0.96)', 4);
    drawStickerTape(ctx, -width * 0.16, -height / 2 + 4, width * 0.32, -0.1, 'rgba(255, 245, 211, 0.82)');
    fillRoundedRect(ctx, -width / 2 + 14, -height / 2 + 18, width - 28, height - 54, 22, 'rgba(255, 237, 213, 0.72)');
    drawCircle(ctx, 0, 2, 44, 'rgba(255, 255, 255, 0.56)');
    drawCircle(ctx, -36, -28, 8, 'rgba(255, 191, 104, 0.62)');
    drawCircle(ctx, 42, 24, 10, 'rgba(255, 154, 182, 0.46)');
    ctx.fillStyle = '#6f4020';
    ctx.font = '900 58px "Zen Maru Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`+${count}`, 0, 18);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  function drawStickerTape(ctx, x, y, width, rotation, color) {
    ctx.save();
    ctx.translate(x + width / 2, y + 9);
    ctx.rotate(rotation);
    fillRoundedRect(ctx, -width / 2, -9, width, 18, 9, color);
    ctx.restore();
  }
  bindEconomyExtras();
  renderModeState({ resetMachineText: true });
  void handleReturnedCheckout();
})();;
