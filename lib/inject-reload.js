import fs from 'fs';
import path from 'path';

export function injectReloadScript(themePath) {
  const layoutPath = path.join(themePath, 'layouts', 'master.njk');

  if (!fs.existsSync(layoutPath)) return false;

  let content = fs.readFileSync(layoutPath, 'utf-8');

  if (content.includes('__SELLAUTH_LIVE_RELOAD__')) return false;

  const script = `
{% if isBuilder %}
<!-- __SELLAUTH_LIVE_RELOAD__ -->
<script>
(function() {
  let lastTs = 0;

  async function check() {
    try {
      const res = await fetch('http://127.0.0.1:3456/__reload', {
        cache: 'no-store'
      });

      const data = await res.json();

      if (lastTs && data.ts !== lastTs) {
        window.location.reload();
      }

      lastTs = data.ts;
    } catch (e) {}

    setTimeout(check, 1000);
  }

  check();
})();
</script>
{% endif %}
`;

  content = content.replace('</body>', script + '\n</body>');

  fs.writeFileSync(layoutPath, content, 'utf-8');

  return true;
}
