$(document).ready(function () {
    const token = localStorage.getItem('token');
    const projectId = 'yourProjectId'; // Replace with actual project ID
    const apiBaseUrl = 'http://localhost:3006'; // Replace with your API base URL

    const showNotification = (type, message) => {
        $('#notificationMessage').text(message).removeClass('error success').addClass(type);
    };

    const handleFetchShareLink = async () => {
        if (!projectId) return;

        try {
            const response = await fetch(`${apiBaseUrl}/projects/${projectId}/share`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                const shareLink = data.share_link_id ? `${apiBaseUrl}/projects/shared/${data.share_link_id}` : '';
                $('#shareLinkMessage').html(shareLink ? `Share Link: <a href="${shareLink}" target="_blank" rel="noopener noreferrer">${shareLink}</a>` : 'No share link generated.');
            } else {
                const errorData = await response.json();
                showNotification('error', `Failed to fetch share link: ${errorData.message}`);
            }
        } catch (error) {
            showNotification('error', `Error fetching share link: ${error.message}`);
        }
    };

    const handleShareProject = async () => {
        const shareWith = $('#shareWith').val();
        const accessType = $('#accessType').val();

        if (!shareWith) {
            showNotification('error', 'Share with user is required');
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/projects/${projectId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ share_with: shareWith, access_type: accessType }),
            });

            if (response.ok) {
                showNotification('success', 'Project shared successfully!');
                $('#shareWith').val('');
                $('#accessType').val('read-only');
            } else {
                const errorData = await response.json();
                showNotification('error', `Failed to share project: ${errorData.message}`);
            }
        } catch (error) {
            showNotification('error', `An error occurred during share: ${error.message}`);
        }
    };

    const handleGenerateShareLink = async () => {
        const password = $('#password').val();

        if (!password) {
            showNotification('error', 'Please provide a password for the share link.');
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/projects/${projectId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ share_link: true, password: password }),
            });

            if (response.ok) {
                const data = await response.json();
                const shareLink = data.share_link_id ? `${apiBaseUrl}/projects/shared/${data.share_link_id}` : '';
                showNotification('success', 'Share link generated successfully!');
                $('#shareLinkMessage').html(shareLink ? `Share Link: <a href="${shareLink}" target="_blank" rel="noopener noreferrer">${shareLink}</a>` : '');
                $('#password').val('');
            } else {
                const errorData = await response.json();
                showNotification('error', `Failed to generate share link: ${errorData.message}`);
            }
        } catch (error) {
            showNotification('error', `An error occurred generating share link: ${error.message}`);
        }
    };

    $('#shareButton').click(handleShareProject);
    $('#generateShareLinkButton').click(handleGenerateShareLink);
    $('#fetchShareLinkButton').click(handleFetchShareLink);

    // Initial check for projectId
    if (!projectId) {
        $('#projectShareContent').hide();
        $('#noProjectMessage').show();
    } else {
        $('#projectShareContent').show();
        $('#noProjectMessage').hide();
    }
});
