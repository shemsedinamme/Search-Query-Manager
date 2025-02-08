$(document).ready(function () {
    const apiBaseUrl = 'http://localhost:80'; // Set your API URL
    const token = localStorage.getItem('token');
    let notifications = [];

    // Fetch notifications from the server
    function fetchNotifications() {
        $.ajax({
            url: `${apiBaseUrl}/notifications`,
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            success: function (data) {
                notifications = data;
                renderNotifications();
            },
            error: function (xhr) {
                console.error('Error fetching notifications:', xhr.responseText);
                alert(`Failed to fetch notifications: ${xhr.responseText}`);
            }
        });
    }

    // Render notifications to the DOM
    function renderNotifications() {
        const notificationsHTML = notifications.map(notification => `
            <li class="${notification.isRead ? 'read' : 'unread'}">
                ${notification.message}
                <button class="mark-read-button" data-id="${notification.id}">Mark as Read</button>
            </li>
        `).join('');

        $('#submenuItems').html(`
            <div class="notificationsContainer">
                <h1>Notifications</h1>
                <ul>${notificationsHTML}</ul>
            </div>
        `);

        // Attach event handler for marking notifications as read
        $('.mark-read-button').on('click', function () {
            const notificationId = $(this).data('id');
            handleMarkAsRead(notificationId);
        });
    }

    // Mark a notification as read
    function handleMarkAsRead(notificationId) {
        $.ajax({
            url: `${apiBaseUrl}/notifications/${notificationId}/read`,
            type: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            success: function () {
                notifications = notifications.map(notification => (
                    notification.id === notificationId ? { ...notification, isRead: true } : notification
                ));
                renderNotifications(); // Re-render notifications
            },
            error: function (xhr) {
                console.error('Failed to mark notification as read:', xhr.responseText);
                alert(`Failed to mark notification as read: ${xhr.responseText}`);
            }
        });
    }

    // Initial fetch of notifications
    fetchNotifications();
});
