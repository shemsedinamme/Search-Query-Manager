$(document).ready(function () {
    const token = localStorage.getItem('token');
    const projectId = localStorage.getItem('projectId'); 
    const apiBaseUrl = 'http://localhost:3006'; 

    console.log('Token:', token);
    console.log('Project ID:', projectId);

    // Check if projectId exists
    if (!projectId) {
        // Display message prompting to create a project
        $('.mainContent').html(`
            <div class="noProjectMessage">
                <h2>No Project Selected</h2>
                <p>Please create a new project to get started.</p>
                <button id="createProjectButton">Create Project</button>
            </div>
        `);

        // Handle create project button click
        $('#createProjectButton').click(function () {
            window.location.href = 'create_project.html'; // Redirect to the create project page
        });
    } else {
        // Fetch project data and other content if projectId is available
        fetchProjectData();
        fetchRecentActivity();
        fetchNotifications();
    }

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

    // Logout functionality
    $('#logout').click(function () {
        localStorage.removeItem('token');
        localStorage.removeItem('projectId');
        window.location.href = '/frontend/public/index.html'; // Redirect to home page
    });

    // Search and filter functionality
    $('#activitySearch').on('input', function () {
        const query = $(this).val().toLowerCase();
        $('#activityFeed li').filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(query) > -1);
        });
    });

    $('#notificationSearch').on('input', function () {
        const query = $(this).val().toLowerCase();
        $('#notificationList div').filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(query) > -1);
        });
    });
});
