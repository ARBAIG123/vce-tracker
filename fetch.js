// Generate the bookmarklet code
const bookmarkletCode = `javascript:(function(){
  const s=document.createElement('script');
  s.src='http://127.0.0.1:5500/bookmarklet.js?t='+Date.now();
  document.body.appendChild(s);
})();`;

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('bookmarkletBtn');
  if (btn) btn.href = bookmarkletCode;
});

function copyBookmarklet() {
  navigator.clipboard.writeText(bookmarkletCode);
  const msg = document.getElementById('statusMsg');
  msg.style.color = '#4ade80';
  msg.textContent = '✅ Copied! Now paste it as a bookmark URL.';
}