$(document).ready(function () {
    const token = localStorage.getItem('token');
    const projectId = 'yourProjectId'; // Replace with actual project ID
    const apiBaseUrl = 'http://localhost:3006'; // Replace with your API base URL

    // Fetch project data
    const fetchProjectData = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/projects/${projectId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                $('#projectTitle').text(data.title);
                $('#projectDescription').text(data.description);
                $('#projectStatus').text(data.status);
                $('#tasksCompleted').text(data.tasksCompleted);
                $('#totalTasks').text(data.totalTasks);
                $('#progressFill').css('width', `${data.progress}%`);
            } else {
                console.error('Failed to fetch project data');
            }
        } catch (error) {
            console.error('Error fetching project data:', error);
        }
    };

    // Fetch recent activity
    const fetchRecentActivity = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/projects/${projectId}/activities`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const activities = await response.json();
                activities.forEach(activity => {
                    $('#activityFeed').append(`<li>${activity.description}</li>`);
                });
            } else {
                console.error('Failed to fetch recent activities');
            }
        } catch (error) {
            console.error('Error fetching recent activities:', error);
        }
    };

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/projects/${projectId}/notifications`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const notifications = await response.json();
                notifications.forEach(notification => {
                    $('#notificationList').append(`<div>${notification.message}</div>`);
                });
            } else {
                console.error('Failed to fetch notifications');
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // WebSocket for real-time updates
    const socket = new WebSocket('ws://localhost:3000'); // Replace with your WebSocket server

    socket.onopen = function () {
        console.log('WebSocket connection established');
    };

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
            $('#notificationList').append(`<div>${data.message}</div>`);
        }
        if (data.type === 'activity') {
            $('#activityFeed').append(`<li>${data.description}</li>`);
        }
    };

    // Logout functionality
    $('#logout').click(function () {
        localStorage.removeItem('token');
        window.location.href = 'index.html'; // Redirect to home page
    });

    // Initial fetch
    fetchProjectData();
    fetchRecentActivity();
    fetchNotifications();
});
