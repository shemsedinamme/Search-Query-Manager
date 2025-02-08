// PerformanceMonitoring.js
$(document).ready(function() {
  const token = localStorage.getItem('token');

  // Fetch system metrics
  function fetchMetrics() {
    $.ajax({
      url: 'http://localhost:3306/admin/monitoring',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      success: function(response) {
        $('#cpuUsage').text(response.cpu_usage);
        $('#memoryUsage').text(response.memory_usage);
        $('#diskIO').text(response.disk_io);
      },
      error: function(xhr) {
        console.error('Failed to fetch system metrics:', xhr.responseJSON);
      },
    });
  }

  // Initial fetch
  fetchMetrics();
});