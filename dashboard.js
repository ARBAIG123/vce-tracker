// Event listeners — no inline handlers
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tabAll')?.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    renderSubjects(getSubjects(), 'all');
  });
  document.getElementById('tabSafe')?.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    renderSubjects(getSubjects(), 'safe');
  });
  document.getElementById('tabBorderline')?.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    renderSubjects(getSubjects(), 'borderline');
  });
  document.getElementById('tabRisk')?.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    renderSubjects(getSubjects(), 'risk');
  });
  document.getElementById('signOutBtn')?.addEventListener('click', signOut);
  document.getElementById('backBtn')?.addEventListener('click', closeDetail);
  document.getElementById('addAssessmentBtn')?.addEventListener('click', () => {
    const form = document.getElementById('addForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    document.getElementById('formDate').value = new Date().toISOString().split('T')[0];
  });
  document.getElementById('saveAssessmentBtn')?.addEventListener('click', saveAssessment);
  document.getElementById('cancelAssessmentBtn')?.addEventListener('click', () => {
    document.getElementById('addForm').style.display = 'none';
  });
});