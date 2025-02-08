$(document).ready(function () {
const token = localStorage.getItem('token');

// Fetch and display system metrics
function fetchMetrics() {
$.ajax({
url: 'http://localhost:3306/admin/monitoring',
method: 'GET',
headers: {
'Content-Type': 'application/json',
Authorization: `Bearer ${token}`,
},
success: function (response) {
$('#cpuUsage').text(response.cpu_usage);
$('#memoryUsage').text(response.memory_usage);
$('#diskIO').text(response.disk_io);
},
error: function (xhr) {
console.error('Failed to fetch system metrics:', xhr.responseJSON);
},
});
}

// Fetch and display user analytics
function fetchAnalytics() {
$.ajax({
url: 'http://localhost:3306/admin/analytics',
method: 'GET',
headers: {
'Content-Type': 'application/json',
Authorization: `Bearer ${token}`,
},
success: function (response) {
$('#totalUsers').text(response.total_users);
$('#activeUsers').text(response.active_users);
$('#averageTimeSpent').text(response.average_time_spent);

// Render user analytics chart
const ctx = document.getElementById('userAnalyticsChart').getContext('2d');
new Chart(ctx, {
type: 'bar',
data: {
labels: ['Total Users', 'Active Users', 'Average Time Spent'],
datasets: [{
label: 'User Analytics',
data: [response.total_users, response.active_users, response.average_time_spent],
backgroundColor: ['MediumSeaGreen', 'gray', 'lemonchiffon'],
}],
},
});
},
error: function (xhr) {
console.error('Failed to fetch user analytics:', xhr.responseJSON);
},
});
}

// Fetch recent user activity
function fetchRecentActivity() {
$.ajax({
url: 'http://localhost:3306/admin/activity',
method: 'GET',
headers: {
'Content-Type': 'application/json',
Authorization: `Bearer ${token}`,
},
success: function (response) {
const activityFeed = $('#activityFeed');
activityFeed.empty();
response.forEach((activity) => {
activityFeed.append(`<li>${activity.description} - ${new Date(activity.timestamp).toLocaleString()}</li>`);
});
},
error: function (xhr) {
console.error('Failed to fetch recent activity:', xhr.responseJSON);
},
});
}

// Handle notifications
$('#notificationBell').click(function () {
$('#notificationDropdown').toggle();
});

// Initial fetch
fetchMetrics();
fetchAnalytics();
fetchRecentActivity();
});