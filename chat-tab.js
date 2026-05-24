// Chat Tab Logic
const SYSTEM_PROMPT = `You are a smart AI assistant for VCE Tracker — a web tool for Vardhaman College of Engineering students to track attendance and CGPA.

You ONLY answer questions related to:
1. Attendance calculations, percentages, recovery strategies
2. CGPA calculations, grade points, semester GPA
3. VCE Tracker features (bookmarklet, dashboard, bunk calculator, CGPA calculator, manual attendance tracker, AI chat)
4. Academic advice for VCE students

VCE Tracker features:
- Bookmarklet: drag to browser bar, click while on student.vardhaman.org to fetch live data
- Dashboard tab: attendance %, safe bunk count, CGPA, subject-wise breakdown
- Calendar tab: manually mark present/absent/holiday per subject per day
- CGPA tab: enter subjects, credits, grades to predict GPA
- AI Chat tab: that's you!

Attendance rules at VCE:
- Minimum 75% attendance required
- Formula: (Attended / Total) × 100
- Recovery: Classes Needed = (0.75 × Total - Attended) / 0.25
- Safe bunks: (Attended - 0.75 × Total) / 0.75

Grade points: O=10, A+=9, A=8, B+=7, B=6, C=5, F=0
SGPA = Sum(Grade Points × Credits) / Sum(Credits)

If asked something unrelated, politely decline and redirect to attendance/CGPA topics.
Keep responses concise, clear, friendly. Use numbers when relevant.`;

let chatMessages = [];
let chatIsLoading = false;

function addChatMessage(role, content, isStreaming = false) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `chat-message ${role} ${isStreaming ? 'streaming' : ''}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'assistant' ? '🤖' : '👤';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.innerHTML = formatChatMessage(content);

  div.appendChild(avatar);
  div.appendChild(contentDiv);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return contentDiv;
}

function formatChatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function setChatLoading(loading) {
  chatIsLoading = loading;
  const btn = document.getElementById('sendBtn');
  const input = document.getElementById('chatInput');
  if (btn) btn.disabled = loading;
  if (input) input.disabled = loading;
  if (btn) btn.innerHTML = loading
    ? '<div class="send-spinner"></div>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const text = input?.value.trim();
  if (!text || chatIsLoading) return;

  document.getElementById('suggestions').style.display = 'none';
  addChatMessage('user', text);
  chatMessages.push({ role: 'user', content: text });
  input.value = '';
  input.style.height = 'auto';

  setChatLoading(true);
  const contentDiv = addChatMessage('assistant', '', true);
  let fullResponse = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatMessages, systemPrompt: SYSTEM_PROMPT })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error ${response.status}: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              fullResponse += text;
              contentDiv.innerHTML = formatChatMessage(fullResponse);
              document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
            }
          } catch {}
        }
      }
    }

    chatMessages.push({ role: 'assistant', content: fullResponse });
    contentDiv.closest('.chat-message').classList.remove('streaming');

  } catch (err) {
    contentDiv.innerHTML = `<p style="color:var(--red)">Error: ${err.message}</p>`;
  }

  setChatLoading(false);
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');

  input?.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  sendBtn?.addEventListener('click', sendChatMessage);

  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (input) input.value = chip.dataset.q;
      document.getElementById('suggestions').style.display = 'none';
      sendChatMessage();
    });
  });
});