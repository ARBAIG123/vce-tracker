(async function() {
  try {
    // Fetch CGPA
    const cgpaRes = await fetch('/Dashboard.aspx/GetStudentSPICPI', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: '{}'
    });

    // Fetch Attendance - GET request, correct path
    const attendanceRes = await fetch('/Attendance.aspx/ChartData', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const cgpaData = await cgpaRes.json();
    const attendanceData = await attendanceRes.json();

    const cgpa = JSON.parse(cgpaData.d || '[]');
    const attendance = JSON.parse(attendanceData.d || '[]');

    const data = { cgpa, attendance };
    const encoded = encodeURIComponent(JSON.stringify(data));
    window.open(`http://127.0.0.1:5500/dashboard.html?data=${encoded}`, '_blank');

  } catch(e) {
    alert('VCE Tracker Error: ' + e.message);
  }
})();