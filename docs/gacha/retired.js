// Export only this service's local data. Never clear or migrate stored results.
document.getElementById('exportCollection').addEventListener('click', () => {
  const status = document.getElementById('exportStatus');
  try {
    const keys = ['mobbySealStickerBook', 'mobby-gacha-state-v2', 'mobby-gacha-state-v1'];
    const data = Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)]).filter(([, value]) => value !== null));
    if (!Object.keys(data).length) {
      status.textContent = 'このブラウザーにはコレクションデータが見つかりませんでした。';
      return;
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mobby-sticker-collection.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'コレクションの記録をJSON形式で保存しました。';
  } catch {
    status.textContent = '保存できませんでした。ブラウザーのストレージ設定をご確認ください。';
  }
});
