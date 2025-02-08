$(document).ready(function () {
    const apiBaseUrl = 'http://localhost:80'; // Set your API URL
    const token = localStorage.getItem('token');

    function fetchUserActivity() {
        $.ajax({
            url: `${apiBaseUrl}/admin/user-activity`,
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            success: function (data) {
                renderUserActivity(data);
            },
            error: function (xhr) {
                console.error('Error fetching user activity:', xhr.responseText);
                alert(`Failed to fetch user activity: ${xhr.responseText}`);
            }
        });
    }

    function renderUserActivity(activity) {
        let activityHTML = '';
        activity.forEach(log => {
            activityHTML += `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td>${log.user}</td>
                    <td>${log.action}</td>
                    <td>${log.details}</td>
                </tr>
            `;
        });
        $('#submenuItems').html(`
            <h1>User Activity</h1>
            <table>
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>${activityHTML}</tbody>
            </table>
        `);
    }

    fetchUserActivity();
});
