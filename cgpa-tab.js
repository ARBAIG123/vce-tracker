// CGPA Tab Logic
const gradePoints = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0 };
let cgpaSubjectCount = 0;

function addCgpaSubject() {
  cgpaSubjectCount++;
  const row = document.createElement('div');
  row.className = 'subject-input-row';
  row.innerHTML = `
    <div class="form-group flex2">
      <label>Subject Name</label>
      <input type="text" placeholder="e.g. Data Structures" class="sub-name"/>
    </div>
    <div class="form-group">
      <label>Credits</label>
      <input type="number" placeholder="3" min="1" max="5" class="sub-credits"/>
    </div>
    <div class="form-group">
      <label>Grade</label>
      <select class="sub-grade">
        <option>O</option>
        <option>A+</option>
        <option>A</option>
        <option>B+</option>
        <option selected>B</option>
        <option>C</option>
        <option>F</option>
      </select>
    </div>
    <button class="remove-btn" onclick="this.parentElement.remove()">✕</button>
  `;
  document.getElementById('subjectRows').appendChild(row);
}

function calculateCgpa() {
  const rows = document.querySelectorAll('#subjectRows .subject-input-row');
  if (!rows.length) { alert('Add at least one subject!'); return; }

  let totalPoints = 0, totalCredits = 0;
  rows.forEach(row => {
    const credits = parseFloat(row.querySelector('.sub-credits').value) || 0;
    const grade = row.querySelector('.sub-grade').value;
    totalPoints += credits * (gradePoints[grade] || 0);
    totalCredits += credits;
  });

  const semGpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
  const prevCgpa = parseFloat(document.getElementById('prevCgpa').value) || 0;
  const prevCredits = parseFloat(document.getElementById('prevCredits').value) || 0;

  let cumCgpa = semGpa;
  let allCredits = totalCredits;

  if (prevCgpa && prevCredits) {
    allCredits = prevCredits + totalCredits;
    cumCgpa = ((prevCgpa * prevCredits + totalPoints) / allCredits).toFixed(2);
  }

  document.getElementById('semGpa').textContent = semGpa;
  document.getElementById('cumCgpa').textContent = cumCgpa;
  document.getElementById('totalCreditsResult').textContent = allCredits;

  const msg = document.getElementById('resultMessage');
  if (cumCgpa >= 9) msg.innerHTML = '🏆 Outstanding! You\'re in the top tier.';
  else if (cumCgpa >= 8) msg.innerHTML = '🎯 Excellent! Keep it up.';
  else if (cumCgpa >= 7) msg.innerHTML = '✅ Good job! Room to push higher.';
  else if (cumCgpa >= 6) msg.innerHTML = '⚠️ Average. Focus on improvement.';
  else msg.innerHTML = '📚 Below average. Attend more and study harder.';

  document.getElementById('cgpaResult').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addSubjectBtn')?.addEventListener('click', addCgpaSubject);
  document.getElementById('calculateCgpaBtn')?.addEventListener('click', calculateCgpa);
  for (let i = 0; i < 4; i++) addCgpaSubject();
});