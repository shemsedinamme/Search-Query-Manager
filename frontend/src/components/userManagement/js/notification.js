
        const apiBaseUrl = 'http://localhost:80'; // Set your API URL
        const token = localStorage.getItem('token'); // Assume token is stored in localStorage

        function showNotification({ type, message }) {
            const notification = $(`<div class="notification ${type}">${message}</div>`);
            $('body').append(notification);
            setTimeout(() => {
                notification.fadeOut(() => {
                    notification.remove();
                });
            }, 3000);
        }

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
                    showNotification({ type: 'error', message: 'Failed to fetch notifications.' });
                }
            });
        }

        function renderNotifications(notifications) {
            const notificationsHTML = notifications.map(notification => `
                <li class="notificationItem ${notification.status === 'read' ? 'read' : ''}">
                    <span>${notification.message}</span>
                    <span class="timestamp">${new Date(notification.time).toLocaleString()}</span>
                    ${notification.status === 'unread' ? `<button class="mark-read-button" data-id="${notification.notification_id}">Mark as Read</button>` : ''}
                </li>
            `).join('');

            $('#notificationList').html(notificationsHTML);

            // Attach event handler for marking notifications as read
            $('.mark-read-button').on('click', function () {
                const notificationId = $(this).data('id');
                markAsRead(notificationId);
            });
        }

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
                    showNotification({ type: 'error', message: 'Failed to mark notification as read' });
                }
            });
        }

        // Initial fetch of notifications
        $(document).ready(function () {
            fetchNotifications();
        });

