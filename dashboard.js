// Get data
const params = new URLSearchParams(window.location.search);
const dataParam = params.get('data');

let cgpa = [];
let attendance = [];
let currentSubject = null;

if (dataParam) {
  const parsed = JSON.parse(decodeURIComponent(dataParam));
  cgpa = parsed.cgpa || [];
  attendance = parsed.attendance || [];
  localStorage.setItem('vce_cgpa', JSON.stringify(cgpa));
  localStorage.setItem('vce_attendance', JSON.stringify(attendance));
} else {
  cgpa = JSON.parse(localStorage.getItem('vce_cgpa') || '[]');
  attendance = JSON.parse(localStorage.getItem('vce_attendance') || '[]');
}

// Name handling
function checkName() {
  const name = localStorage.getItem('vce_name');
  if (!name) {
    document.getElementById('nameModal').style.display = 'flex';
  } else {
    showApp(name);
  }
}

function saveName() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) return;
  localStorage.setItem('vce_name', name);
  document.getElementById('nameModal').style.display = 'none';
  showApp(name);
}

function showApp(name) {
  document.getElementById('mainApp').style.display = 'block';
  document.getElementById('navSub').textContent = `Welcome back, ${name}`;
  renderAll();
}

function signOut() {
  localStorage.removeItem('vce_name');
  localStorage.removeItem('vce_cgpa');
  localStorage.removeItem('vce_attendance');
  window.location.href = 'index.html';
}

// Draw ring
function drawRing(canvasId, percentage, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = cx - 12;
  const start = -Math.PI / 2;
  const end = start + (2 * Math.PI * percentage / 100);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.strokeStyle = '#1a1a25';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Progress
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function getColor(pct) {
  if (pct >= 85) return '#00e5a0';
  if (pct >= 75) return '#fbbf24';
  return '#f43f5e';
}

function getStatus(pct) {
  if (pct >= 85) return { text: '🟢 Safe', color: '#00e5a0', key: 'safe' };
  if (pct >= 75) return { text: '🟡 Borderline', color: '#fbbf24', key: 'borderline' };
  return { text: '🔴 At Risk', color: '#f43f5e', key: 'risk' };
}

function getBunkInfo(pct, total = 50) {
  const attended = Math.round((pct / 100) * total);
  if (pct >= 75) {
    const safe = Math.floor((attended - 0.75 * total) / 0.75);
    return { safe: Math.max(0, safe), needed: 0 };
  }
  const needed = Math.ceil((0.75 * total - attended) / 0.25);
  return { safe: 0, needed };
}

function getSubjects() {
  if (!attendance.length || attendance.length < 3) return [];
  const subjects = attendance[0];
  const lab = attendance[1];
  const theory = attendance[2];

  return subjects.map((name, i) => {
    const theoryPct = theory[i] || 0;
    const labPct = lab[i] || 0;
    const pct = theoryPct > 0 ? theoryPct : labPct;
    const type = theoryPct > 0 ? 'Theory' : 'Lab';
    const total = 50;
    const attended = Math.round((pct / 100) * total);
    return { name, pct, type, attended, total };
  });
}

function renderAll() {
  const subjects = getSubjects();
  renderOverview(subjects);
  renderAnalytics(subjects);
  renderSubjects(subjects);
  renderBunkChips(subjects);
}

function renderOverview(subjects) {
  const safe = subjects.filter(s => s.pct >= 85).length;
  const borderline = subjects.filter(s => s.pct >= 75 && s.pct < 85).length;
  const risk = subjects.filter(s => s.pct < 75).length;

  const items = [
    { icon: '📚', bg: '#0d1f3c', num: subjects.length, label: 'Total Subjects' },
    { icon: '🛡️', bg: '#0d2e1f', num: safe, label: 'Safe', color: '#00e5a0' },
    { icon: '⚠️', bg: '#2e2a0d', num: borderline, label: 'Borderline', color: '#fbbf24' },
    { icon: '🚨', bg: '#2e0d1a', num: risk, label: 'At Risk', color: '#f43f5e' },
  ];

  const grid = document.getElementById('overviewGrid');
  grid.innerHTML = items.map(item => `
    <div class="overview-card">
      <div class="overview-icon" style="background:${item.bg}">${item.icon}</div>
      <div>
        <div class="overview-num" style="color:${item.color || 'white'}">${item.num}</div>
        <div class="overview-label">${item.label}</div>
      </div>
    </div>
  `).join('');
}

function renderAnalytics(subjects) {
  // Overall attendance
  if (subjects.length) {
    const avg = Math.round(subjects.reduce((a, b) => a + b.pct, 0) / subjects.length);
    const totalClasses = subjects.reduce((a, b) => a + b.total, 0);
    const totalAttended = subjects.reduce((a, b) => a + b.attended, 0);
    const color = getColor(avg);
    const status = getStatus(avg);

    setTimeout(() => drawRing('overallRing', avg, color), 50);
    document.getElementById('overallPct').textContent = avg + '%';
    document.getElementById('overallPct').style.color = color;
    document.getElementById('overallClasses').textContent = `${totalAttended}/${totalClasses} classes`;
    document.getElementById('overallStatus').textContent = avg >= 75 ? '✅ Above 75% threshold' : '❌ Below 75% threshold';
    document.getElementById('overallStatus').style.color = color;
  }

  // CGPA
  const cgpaDiv = document.getElementById('cgpaAnalytics');
  if (cgpa.length) {
    const latest = cgpa[cgpa.length - 1];
    const pct = (latest.CPI / 10) * 100;
    cgpaDiv.innerHTML = `
      <div style="display:flex;align-items:center;gap:1.5rem;">
        <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;">
          <canvas id="cgpaRing" width="120" height="120"></canvas>
          <div style="position:absolute;text-align:center;">
            <div style="font-size:0.7rem;color:#555;">${Math.round(pct)}%</div>
          </div>
        </div>
        <div>
          <div style="font-size:0.75rem;color:#555;margin-bottom:0.3rem;">${latest.Semester}</div>
          <div style="font-size:2.5rem;font-weight:800;color:#00e5a0;">${latest.CPI}</div>
          <div style="font-size:0.75rem;color:#555;">CPI Score</div>
        </div>
      </div>
      ${cgpa.length > 1 ? cgpa.map(s => `
        <div class="cgpa-sem-item">
          <span class="cgpa-sem-name">${s.Semester}</span>
          <span class="cgpa-sem-val">${s.CPI}</span>
        </div>`).join('') : ''}
    `;
    setTimeout(() => drawRing('cgpaRing', pct, '#00e5a0'), 50);
  }
}

function renderBunkChips(subjects) {
  const chips = document.getElementById('bunkChips');
  chips.innerHTML = subjects.map((s, i) => `
    <span class="bunk-chip" onclick="selectBunk(${i})" id="chip-${i}">${s.name}</span>
  `).join('');
}

window.selectBunk = function(i) {
  document.querySelectorAll('.bunk-chip').forEach(c => c.classList.remove('active'));
  document.getElementById(`chip-${i}`).classList.add('active');
  const subjects = getSubjects();
  const s = subjects[i];
  const info = getBunkInfo(s.pct, s.total);
  const result = document.getElementById('bunkResult');
  if (info.safe > 0) {
    result.innerHTML = `Can bunk <strong>${info.safe}</strong> more classes<br><span style="color:#555;font-size:0.75rem;">Current: ${s.pct}%</span>`;
  } else {
    result.innerHTML = `Need <strong>${info.needed}</strong> more classes<br><span style="color:#555;font-size:0.75rem;">Current: ${s.pct}%</span>`;
  }
}

function renderSubjects(subjects, filter = 'all') {
  const grid = document.getElementById('subjectsGrid');
  const filtered = filter === 'all' ? subjects : subjects.filter(s => getStatus(s.pct).key === filter);

  grid.innerHTML = filtered.map((s, i) => {
    const status = getStatus(s.pct);
    const info = getBunkInfo(s.pct, s.total);
    const color = getColor(s.pct);
    return `
      <div class="subject-card" style="border-left-color:${color}" onclick="openDetail('${s.name}', '${s.type}', ${s.pct}, ${s.attended}, ${s.total})">
        <div class="subject-top">
          <div>
            <div class="subject-name-text">${s.name}</div>
            <div class="subject-type-text">${s.type.toUpperCase()}</div>
          </div>
          <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;">
            <canvas id="ring-${i}" width="80" height="80"></canvas>
            <div style="position:absolute;font-size:0.85rem;font-weight:800;color:${color}">${s.pct}%</div>
          </div>
        </div>
        <div class="subject-status-text" style="color:${color}">${status.text}</div>
        <div class="subject-bunk-text">
          ${info.safe > 0 ? `✅ Can bunk <strong>${info.safe}</strong> more` : `⚠️ Need <strong>${info.needed}</strong> more classes`}
        </div>
        <div class="subject-bar-row">
          <span>Attended ${s.attended}/${s.total}</span>
          <span>${s.pct}%</span>
        </div>
        <div class="subject-bar">
          <div class="subject-bar-fill" style="width:${s.pct}%;background:${color}"></div>
        </div>
      </div>
    `;
  }).join('');

  setTimeout(() => {
    filtered.forEach((s, i) => drawRing(`ring-${i}`, s.pct, getColor(s.pct)));
  }, 50);
}

window.filterCards = function(filter, btn) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderSubjects(getSubjects(), filter);
}

// Detail page
window.openDetail = function(name, type, pct, attended, total) {
  currentSubject = { name, type, pct, attended, total };
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('detailPage').style.display = 'block';
  document.getElementById('detailSubjectName').textContent = name;
  document.getElementById('detailSubjectType').textContent = type;
  document.getElementById('detailAttended').textContent = `${attended}/${total}`;
  document.getElementById('detailStatus').textContent = getStatus(pct).text;
  document.getElementById('detailStatus').style.color = getColor(pct);

  setTimeout(() => {
    drawRing('detailRing', pct, getColor(pct));
    renderAssessments(name);
  }, 50);
}

window.closeDetail = function() {
  document.getElementById('detailPage').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
}

// Assessments
function getAssessments(subject) {
  return JSON.parse(localStorage.getItem(`assess_${subject}`) || '[]');
}

function saveAssessments(subject, data) {
  localStorage.setItem(`assess_${subject}`, JSON.stringify(data));
}

function renderAssessments(subject) {
  const list = getAssessments(subject);
  const container = document.getElementById('assessmentsList');

  if (!list.length) {
    container.innerHTML = '<div class="no-assessments">No assessments logged yet. Click "+ Add Assessment" to start tracking.</div>';
    document.getElementById('detailMarks').textContent = '0/0';
    document.getElementById('detailAssessments').textContent = '0 assessments logged';
    document.getElementById('detailBestScore').textContent = 'No data yet';
    drawRing('marksRing', 0, '#333');
    return;
  }

  const totalObtained = list.reduce((a, b) => a + b.obtained, 0);
  const totalMax = list.reduce((a, b) => a + b.outOf, 0);
  const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
  const best = list.reduce((a, b) => (b.obtained / b.outOf) > (a.obtained / a.outOf) ? b : a);

  document.getElementById('detailMarks').textContent = `${totalObtained}/${totalMax}`;
  document.getElementById('detailAssessments').textContent = `${list.length} assessments logged`;
  document.getElementById('detailBestScore').textContent = `${best.title}: ${best.obtained}/${best.outOf}`;

  setTimeout(() => drawRing('marksRing', overallPct, '#00e5a0'), 50);

  container.innerHTML = list.map((a, i) => `
    <div class="assessment-item">
      <div>
        <div class="assessment-title">${a.title}</div>
        <div class="assessment-category">${a.category} ${a.date ? '· ' + a.date : ''} ${a.notes ? '· ' + a.notes : ''}</div>
      </div>
      <div style="text-align:right;">
        <div class="assessment-score">${a.obtained}/${a.outOf}</div>
        <div class="assessment-pct">${Math.round((a.obtained/a.outOf)*100)}%</div>
      </div>
    </div>
  `).join('');
}

window.toggleAddForm = function() {
  const form = document.getElementById('addForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  document.getElementById('formDate').value = new Date().toISOString().split('T')[0];
}

window.saveAssessment = function() {
  const title = document.getElementById('formTitle').value.trim();
  const obtained = parseFloat(document.getElementById('formObtained').value);
  const outOf = parseFloat(document.getElementById('formOutOf').value);

  if (!title || isNaN(obtained) || isNaN(outOf)) return;

  const assessment = {
    title,
    category: document.getElementById('formCategory').value,
    date: document.getElementById('formDate').value,
    notes: document.getElementById('formNotes').value,
    obtained,
    outOf
  };

  const list = getAssessments(currentSubject.name);
  list.push(assessment);
  saveAssessments(currentSubject.name, list);
  renderAssessments(currentSubject.name);

  // Reset form
  document.getElementById('formTitle').value = '';
  document.getElementById('formObtained').value = '';
  document.getElementById('formOutOf').value = '';
  document.getElementById('formNotes').value = '';
  document.getElementById('addForm').style.display = 'none';
}

// Init
checkName();