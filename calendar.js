// Calendar Tab Logic
let calSubjects = [];
let calCurrentSubjectIndex = 0;
let calCurrentYear = new Date().getFullYear();
let calCurrentMonth = new Date().getMonth();
const CAL_STORAGE_KEY = 'vce_manual_attendance';

function getAttendanceData() {
  return JSON.parse(localStorage.getItem(CAL_STORAGE_KEY) || '{}');
}

function saveAttendanceData(data) {
  localStorage.setItem(CAL_STORAGE_KEY, JSON.stringify(data));
}

function getSubjectStats(subjectName) {
  const data = getAttendanceData();
  let present = 0, absent = 0;
  Object.keys(data).forEach(key => {
    if (key.startsWith(subjectName + '_')) {
      if (data[key] === 'present') present++;
      else if (data[key] === 'absent') absent++;
    }
  });
  const total = present + absent;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  return { present, absent, total, pct };
}

function initCalendar() {
  const savedSubjects = localStorage.getItem('vce_tracker_subjects');
  if (savedSubjects) {
    calSubjects = JSON.parse(savedSubjects);
    document.getElementById('attSetup').style.display = 'none';
    document.getElementById('attTracker').style.display = 'block';
    renderCalendarTracker();
  } else {
    for (let i = 0; i < 4; i++) addCalSetupSubject();
  }
}

let calSetupCount = 0;
function addCalSetupSubject(name = '') {
  calSetupCount++;
  const div = document.createElement('div');
  div.className = 'subject-input-row';
  div.innerHTML = `
    <div class="form-group flex2">
      <label>Subject Name</label>
      <input type="text" placeholder="e.g. Data Structures" class="setup-sub-name" value="${name}"/>
    </div>
    <button class="remove-btn" onclick="this.parentElement.remove()">✕</button>
  `;
  document.getElementById('setupSubjects').appendChild(div);
}

function renderCalendarTracker() {
  renderCalSubjectTabs();
  renderCalStats();
  renderCalendar();
  renderImpactGrid();
  checkEarlyWarning();
}

function renderCalSubjectTabs() {
  document.getElementById('subjectTabs').innerHTML = calSubjects.map((s, i) => `
    <button class="subject-tab ${i === calCurrentSubjectIndex ? 'active' : ''}" 
            onclick="switchCalSubject(${i})">${s}</button>
  `).join('');
}

window.switchCalSubject = function(i) {
  calCurrentSubjectIndex = i;
  renderCalSubjectTabs();
  renderCalStats();
  renderCalendar();
  renderImpactGrid();
  checkEarlyWarning();
}

function renderCalStats() {
  const s = calSubjects[calCurrentSubjectIndex];
  const stats = getSubjectStats(s);
  const color = stats.pct >= 85 ? '#00e5a0' : stats.pct >= 75 ? '#fbbf24' : '#f43f5e';
  const status = stats.pct >= 85 ? '🟢 Safe' : stats.pct >= 75 ? '🟡 Borderline' : '🔴 At Risk';
  const safeBunks = stats.pct >= 75 ? Math.floor((stats.present - 0.75 * stats.total) / 0.75) : 0;
  const needed = stats.pct < 75 && stats.total > 0 ? Math.ceil((0.75 * stats.total - stats.present) / 0.25) : 0;

  document.getElementById('attStats').innerHTML = `
    <div class="att-stat-card">
      <div class="att-stat-num" style="color:${color}">${stats.pct}%</div>
      <div class="att-stat-label">Attendance</div>
      <div style="font-size:0.75rem;color:${color};margin-top:0.2rem;">${status}</div>
    </div>
    <div class="att-stat-card">
      <div class="att-stat-num" style="color:#00e5a0">${stats.present}</div>
      <div class="att-stat-label">Present</div>
    </div>
    <div class="att-stat-card">
      <div class="att-stat-num" style="color:#f43f5e">${stats.absent}</div>
      <div class="att-stat-label">Absent</div>
    </div>
    <div class="att-stat-card">
      <div class="att-stat-num">${stats.total}</div>
      <div class="att-stat-label">Total</div>
    </div>
    <div class="att-stat-card">
      <div class="att-stat-num" style="color:${safeBunks > 0 ? '#00e5a0' : '#f43f5e'}">
        ${safeBunks > 0 ? safeBunks : needed}
      </div>
      <div class="att-stat-label">${safeBunks > 0 ? 'Safe Bunks' : 'Need'}</div>
    </div>
  `;
}

function renderCalendar() {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calMonthLabel').textContent = `${months[calCurrentMonth]} ${calCurrentYear}`;
  const data = getAttendanceData();
  const subject = calSubjects[calCurrentSubjectIndex];
  const firstDay = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
  const daysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();
  const today = new Date();
  let html = '';

  for (let i = 0; i < firstDay; i++) html += `<div class="cal-cell empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${subject}_${calCurrentYear}_${calCurrentMonth}_${d}`;
    const status = data[key] || 'none';
    const isToday = today.getDate() === d && today.getMonth() === calCurrentMonth && today.getFullYear() === calCurrentYear;
    const isFuture = new Date(calCurrentYear, calCurrentMonth, d) > today;

    html += `
      <div class="cal-cell ${status} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}"
           ${!isFuture ? `onclick="cycleCalStatus('${key}')"` : ''}>
        <span class="cal-date">${d}</span>
        <span class="cal-status-icon">
          ${status === 'present' ? '✓' : status === 'absent' ? '✗' : status === 'holiday' ? '—' : ''}
        </span>
      </div>
    `;
  }
  document.getElementById('calGrid').innerHTML = html;
}

window.cycleCalStatus = function(key) {
  const data = getAttendanceData();
  const current = data[key] || 'none';
  const next = current === 'none' ? 'present' : current === 'present' ? 'absent' : current === 'absent' ? 'holiday' : 'none';
  if (next === 'none') delete data[key];
  else data[key] = next;
  saveAttendanceData(data);
  renderCalStats();
  renderCalendar();
  renderImpactGrid();
  checkEarlyWarning();
}

function renderImpactGrid() {
  const stats = getSubjectStats(calSubjects[calCurrentSubjectIndex]);
  const scenarios = [10, 20, 30, 50, 75, 100];
  document.getElementById('impactGrid').innerHTML = scenarios.map(total => {
    const attended = Math.round((stats.pct / 100) * (stats.total || total));
    const currentPct = stats.total > 0 ? stats.pct : Math.round((attended / total) * 100);
    const afterAttend = Math.round(((attended + 1) / (total + 1)) * 100);
    const afterAbsent = Math.round((attended / (total + 1)) * 100);
    const impact = afterAttend - currentPct;
    return `
      <div class="impact-card">
        <div class="impact-total">${total} classes</div>
        <div class="impact-row">
          <span class="impact-label">Attend 1 more</span>
          <span class="impact-val green">+${Math.abs(impact)}%</span>
        </div>
        <div class="impact-row">
          <span class="impact-label">Miss 1 class</span>
          <span class="impact-val red">-${Math.abs(currentPct - afterAbsent)}%</span>
        </div>
      </div>
    `;
  }).join('');
}

function checkEarlyWarning() {
  const stats = getSubjectStats(calSubjects[calCurrentSubjectIndex]);
  const warning = document.getElementById('earlyWarning');
  if (stats.total < 20) {
    const impact = stats.total > 0 ? Math.round((1 / (stats.total + 1)) * 100) : 10;
    document.getElementById('warningText').textContent =
      `You've had ${stats.total} classes so far. Each class changes your % by ~${impact}%. This shrinks as semester progresses.`;
    warning.style.display = 'flex';
  } else {
    warning.style.display = 'none';
  }
}

// Init calendar when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addSubjectSetupBtn')?.addEventListener('click', () => addCalSetupSubject());

  document.getElementById('startTrackingBtn')?.addEventListener('click', () => {
    const names = [...document.querySelectorAll('.setup-sub-name')]
      .map(i => i.value.trim()).filter(Boolean);
    if (!names.length) { alert('Add at least one subject!'); return; }
    calSubjects = names;
    localStorage.setItem('vce_tracker_subjects', JSON.stringify(calSubjects));
    document.getElementById('attSetup').style.display = 'none';
    document.getElementById('attTracker').style.display = 'block';
    renderCalendarTracker();
  });

  document.getElementById('prevMonth')?.addEventListener('click', () => {
    calCurrentMonth--;
    if (calCurrentMonth < 0) { calCurrentMonth = 11; calCurrentYear--; }
    renderCalendar();
  });

  document.getElementById('nextMonth')?.addEventListener('click', () => {
    calCurrentMonth++;
    if (calCurrentMonth > 11) { calCurrentMonth = 0; calCurrentYear++; }
    renderCalendar();
  });

  document.getElementById('resetTrackerBtn')?.addEventListener('click', () => {
    if (confirm('Reset subjects?')) {
      localStorage.removeItem('vce_tracker_subjects');
      document.getElementById('attTracker').style.display = 'none';
      document.getElementById('attSetup').style.display = 'block';
      document.getElementById('setupSubjects').innerHTML = '';
      calSetupCount = 0;
      for (let i = 0; i < 4; i++) addCalSetupSubject();
    }
  });
});