$(document).ready(function () {
    const apiBaseUrl = 'http://localhost:80'; // Set your API URL
    const token = localStorage.getItem('token');
    const projectId = [];/* Obtain projectId from your context or UI */;

    // Fetch notifications based on project ID
    function fetchNotifications() {
        $.ajax({
            url: `${apiBaseUrl}/notifications`,
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            success: function (data) {
                renderNotifications(data);
            },
            error: function (xhr) {
                console.error('Error fetching notifications:', xhr.responseText);
                alert('Failed to fetch notifications.');
            }
        });
    }

    // Render notifications to the DOM
    function renderNotifications(notifications) {
        if (!notifications || notifications.length === 0) {
            $('#submenuItems').html('<p>No new notifications.</p>');
            return;
        }

        const notificationsHTML = notifications.map(notification => `
            <li class="${notification.status === 'read' ? 'read' : ''}">
                <span>${notification.message}</span>
                <span class="timestamp">${new Date(notification.time).toLocaleString()}</span>
                ${notification.status === 'unread' ? `<button class="mark-read-button" data-id="${notification.notification_id}">Mark as Read</button>` : ''}
            </li>
        `).join('');

        $('#submenuItems').html(`
            <div class="notificationContainer">
                <h1>Notifications</h1>
                <ul class="notificationList">${notificationsHTML}</ul>
            </div>
        `);

        // Attach event handler for marking notifications as read
        $('.mark-read-button').on('click', function () {
            const notificationId = $(this).data('id');
            markAsRead(notificationId);
        });
    }

    // Mark a notification as read
    function markAsRead(notificationId) {
        $.ajax({
            url: `${apiBaseUrl}/notifications/${notificationId}`,
            type: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            success: function () {
                fetchNotifications(); // Refresh notifications
            },
            error: function (xhr) {
                console.error('Failed to mark notification as read:', xhr.responseText);
                alert('Failed to mark notification as read');
            }
        });
    }

    // Initial fetch of notifications
    fetchNotifications();
});
