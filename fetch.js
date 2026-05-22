const bookmarkletCode = `javascript:(function(){
  const s=document.createElement('script');
  s.src='https://vce-tracker.vercel.app/bookmarklet.js?t='+Date.now();
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