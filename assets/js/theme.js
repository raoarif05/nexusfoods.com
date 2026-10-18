/* Applies the saved light/dark choice before the page paints, to avoid a flash. */
try {
  var saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
} catch (e) {}
