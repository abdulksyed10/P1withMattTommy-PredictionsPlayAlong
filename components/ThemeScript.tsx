export function ThemeScript() {
  const code = `
(function () {
  try {
    var stored = localStorage.getItem('theme'); // 'light' | 'dark' | null
    var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    var theme = stored ? stored : (prefersLight ? 'light' : 'dark');

    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Keep color-scheme aligned (helps form controls)
    root.style.colorScheme = theme;
  } catch (e) {}
})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}