$(document).ready(function () {
    const token = localStorage.getItem('token');
    const projectId = 'yourProjectId'; // Replace with actual project ID
    const apiBaseUrl = 'http://localhost:3306'; // Replace with your API base URL
    let lifecycleState = '';

    const fetchLifecycleState = async () => {
        if (!projectId) return;
        try {
            const response = await fetch(`${apiBaseUrl}/projects/${projectId}/lifecycle`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                lifecycleState = data.state; // Assuming data.state contains the lifecycle state
                $('#currentPhase').text(`Current Phase: ${lifecycleState || 'Not Started'}`);
            } else {
                const errorData = await response.json();
                showNotification('error', `Failed to fetch project lifecycle state: ${errorData.message}`);
                console.error('Failed to fetch project lifecycle state');
            }
        } catch (error) {
            showNotification('error', `Error fetching lifecycle state: ${error.message}`);
            console.error('Error fetching lifecycle state:', error);
        }
    };

    const handleLifecycleTransition = async (action) => {
        try {
            const response = await fetch(`${apiBaseUrl}/projects/${projectId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                lifecycleState = data.state; // Assuming data.state contains the updated lifecycle state
                $('#currentPhase').text(`Current Phase: ${lifecycleState}`);
                showNotification('success', `Project transitioned to: ${lifecycleState}`);
            } else {
                const errorData = await response.json();
                showNotification('error', `Failed to transition project lifecycle: ${errorData.message}`);
                console.error('Failed to transition project lifecycle:', errorData);
            }
        } catch (error) {
            showNotification('error', `Error transitioning project lifecycle: ${error.message}`);
            console.error('Error transitioning project lifecycle:', error);
        }
    };

    const showNotification = (type, message) => {
        $('#notificationMessage').text(message).removeClass('error success').addClass(type);
    };

    // Event handlers for lifecycle transition buttons
    $('#initiationButton').click(() => handleLifecycleTransition('initiation'));
    $('#planningButton').click(() => handleLifecycleTransition('planning'));
    $('#executionButton').click(() => handleLifecycleTransition('execution'));
    $('#monitoringButton').click(() => handleLifecycleTransition('monitoring'));
    $('#closureButton').click(() => handleLifecycleTransition('closure'));

    // Initial fetch
    fetchLifecycleState();
});
