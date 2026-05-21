// Get data from URL or localStorage
const params = new URLSearchParams(window.location.search);
const dataParam = params.get('data');

let cgpa = [];
let attendance = [];

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

// Render CGPA
function renderCGPA() {
  const grid = document.getElementById('cgpaGrid');
  if (!cgpa.length) {
    grid.innerHTML = '<p style="color:#aaa">No CGPA data found.</p>';
    return;
  }
  cgpa.forEach(sem => {
    const card = document.createElement('div');
    card.className = 'cgpa-card';
    card.innerHTML = `
      <div class="cgpa-sem">${sem.Semester}</div>
      <div class="cgpa-value">${sem.CPI}</div>
      <div class="cgpa-label">CPI</div>
    `;
    grid.appendChild(card);
  });
}

function getBunkInfo(percentage) {
  if (percentage >= 75) {
    const safeBunks = Math.floor((percentage - 75) / 0.75);
    return { status: 'safe', safeBunks: Math.max(0, safeBunks), needed: 0 };
  } else {
    const needed = Math.ceil((75 - percentage) / 0.25);
    return { status: 'danger', safeBunks: 0, needed };
  }
}

function renderAttendance() {
  const grid = document.getElementById('attendanceGrid');
  if (!attendance.length || attendance.length < 2) {
    grid.innerHTML = '<p style="color:#aaa">No attendance data found.</p>';
    return;
  }

  const subjects = attendance[0];
  const lab = attendance[1];
  const theory = attendance[2];

  subjects.forEach((subject, i) => {
    const theoryPct = theory[i] || 0;
    const labPct = lab[i] || 0;
    const mainPct = theoryPct > 0 ? theoryPct : labPct;
    const type = theoryPct > 0 ? 'Theory' : 'Lab';
    const bunk = getBunkInfo(mainPct);

    const statusColor = mainPct >= 85 ? '#4ade80' : mainPct >= 75 ? '#fbbf24' : '#f87171';
    const statusText = mainPct >= 85 ? '🟢 Safe' : mainPct >= 75 ? '🟡 Borderline' : '🔴 At Risk';

    const card = document.createElement('div');
    card.className = 'subject-card';
    card.style.borderLeftColor = statusColor;
    card.innerHTML = `
      <div class="subject-name">${subject}</div>
      <div class="subject-pct" style="color:${statusColor}">${mainPct}%</div>
      <div class="subject-type">${type}</div>
      <div class="subject-status">${statusText}</div>
      <div class="subject-bunk">
        ${bunk.status === 'safe'
          ? `✅ Can bunk <strong>${bunk.safeBunks}</strong> more`
          : `⚠️ Need <strong>${bunk.needed}</strong> more classes`
        }
      </div>
    `;
    grid.appendChild(card);
  });
}

renderCGPA();
renderAttendance();