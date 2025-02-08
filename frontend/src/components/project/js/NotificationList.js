$(document).ready(function () {
    const token = localStorage.getItem('token');
    const projectId = 'yourProjectId'; // Replace with actual project ID

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/notifications`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                renderNotifications(data);
            } else {
                console.error('Failed to fetch notifications.');
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const renderNotifications = (notifications) => {
        $('#notificationList').empty();
        if (!notifications || notifications.length === 0) {
            $('#notificationList').append('<li>No new notifications.</li>');
            return;
        }

        notifications.forEach((notification) => {
            const notificationItem = $(`
                <li class="${notification.status === 'read' ? 'read' : ''}">
                    <span>${notification.message}</span>
                    <span class="timestamp">${new Date(notification.time).toLocaleString()}</span>
                    ${notification.status === 'unread' ? 
                        `<button class="markReadButton" data-id="${notification.notification_id}">Mark as Read</button>` : ''
                    }
                </li>
            `);
            $('#notificationList').append(notificationItem);
        });
    };

    $(document).on('click', '.markReadButton', function () {
        const notificationId = $(this).data('id');
        markAsRead(notificationId);
    });

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/notifications/${notificationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                fetchNotifications(); // Refresh notifications
            } else {
                console.error('Failed to mark notification as read');
                alert('Failed to mark notification as read');
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            alert('Error marking notification as read');
        }
    };

    if (!projectId) {
        $('#notificationList').append('<li>Select a project to view notifications.</li>');
    } else {
        fetchNotifications();
    }
});
