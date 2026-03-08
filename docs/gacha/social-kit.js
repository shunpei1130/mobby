(() => {
  const feedback = document.getElementById('copyFeedback');
  const buttons = Array.from(document.querySelectorAll('[data-copy-target]'));

  function setFeedback(message) {
    if (!feedback) return;
    feedback.textContent = message;
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const fallback = document.createElement('textarea');
    fallback.value = text;
    fallback.setAttribute('readonly', '');
    fallback.style.position = 'absolute';
    fallback.style.left = '-9999px';
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand('copy');
    fallback.remove();
  }

  buttons.forEach((button) => {
    const originalLabel = button.textContent;
    button.addEventListener('click', async () => {
      const target = document.getElementById(button.dataset.copyTarget);
      if (!target) return;

      try {
        await copyText(target.textContent.trim());
        button.textContent = 'コピー済み';
        setFeedback('投稿文をコピーした。すぐ貼れます。');
      } catch {
        button.textContent = '手動でコピー';
        setFeedback('自動コピーに失敗。表示された文をそのまま使ってください。');
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1600);
    });
  });
})();