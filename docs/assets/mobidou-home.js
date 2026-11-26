/* Reuse the existing diagnosis, contact, and social dialogs. */
document.querySelectorAll('[data-journey-popup]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    const popup = button.dataset.journeyPopup;
    if (typeof openPopup === 'function') openPopup(popup);
  });
});
document.querySelectorAll('.journey-page .home-main-action').forEach((button) => {
  // These are direct navigation controls; the old touch-preview gesture must
  // not consume the first tap on the new menu cards.
  button.querySelectorAll('.footer-action-preview').forEach((preview) => preview.remove());
});
