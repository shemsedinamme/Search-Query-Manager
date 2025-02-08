$(document).ready(function () {
    const token = localStorage.getItem('token');
    const projectId = localStorage.getItem('projectId'); // Retrieve projectId from local storage
    const apiBaseUrl = 'http://localhost:3006'; // Replace with your API base URL

    // Check if projectId exists
    if (!projectId) {
        // Show a message and a button to create a new project
        $('.workspaceContainer').hide(); // Hide the workspace content
        $('body').append(`
            <div class="noProjectMessage">
                <h2>No Project Selected</h2>
                <p>Please create a new project to get started.</p>
                <button id="createProjectButton">Create Project</button>
            </div>
        `);

        // Add click handler for the create project button
        $('#createProjectButton').click(function () {
            window.location.href = 'create_project.html'; // Redirect to the create project page
        });
    } else {
        // Fetch and display project data if projectId is available
        fetchProjectData();
        fetchRecentActivity();
        fetchNotifications();
    }

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
        localStorage.removeItem('projectId');
        window.location.href = 'index.html'; // Redirect to home page
    });

    // Action button handlers
    $('#collaborationButton').click(() => {
        window.location.href = 'ProjectCollaboration.html?projectId=' + projectId;
    });
    $('#tasksButton').click(() => {
        window.location.href = 'TaskManagement.html?projectId=' + projectId;
    });
    $('#workflowButton').click(() => {
        window.location.href = 'ProjectWorkflow.html?projectId=' + projectId;
    });
    $('#lifecycleButton').click(() => {
        window.location.href = 'ProjectLifecycle.html?projectId=' + projectId;
    });
    $('#shareButton').click(() => {
        window.location.href = 'ProjectShare.html?projectId=' + projectId;
    });
    $('#versionControlButton').click(() => {
        window.location.href = 'VersionControl.html?projectId=' + projectId;
    });
    $('#chatButton').click(() => {
        window.location.href = 'ChatComponent.html?projectId=' + projectId;
    });
    $('#notificationsButton').click(() => {
        window.location.href = 'NotificationList.html?projectId=' + projectId;
    });
});
