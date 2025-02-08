// UserAnalytics.js
$(document).ready(function() {
  const token = localStorage.getItem('token');

  // Fetch user analytics
  function fetchAnalytics() {
    $.ajax({
      url: 'http://localhost:3306/admin/analytics',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      success: function(response) {
        $('#totalUsers').text(response.total_users);
        $('#activeUsers').text(response.active_users);
        $('#averageTimeSpent').text(response.average_time_spent);
      },
      error: function(xhr) {
        console.error('Failed to fetch user analytics:', xhr.responseJSON);
      },
    });
  }

  // Initial fetch
  fetchAnalytics();
});