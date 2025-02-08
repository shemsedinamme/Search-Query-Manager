//ProtocolShare.js
$(document).ready(function () {
    const token = localStorage.getItem('token');
    const protocolId = 'yourprotocolId'; // Replace with actual protocol ID
    const apiBaseUrl = 'http://localhost:3006'; // Replace with your API base URL

    const showNotification = (type, message) => {
        $('#notificationMessage').text(message).removeClass('error success').addClass(type);
    };

    const handleFetchShareLink = async () => {
        if (!protocolId) return;

        try {
            const response = await fetch(`${apiBaseUrl}/protocols/${protocolId}/share`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                const shareLink = data.share_link_id ? `${apiBaseUrl}/protocols/shared/${data.share_link_id}` : '';
                $('#shareLinkMessage').html(shareLink ? `Share Link: <a href="${shareLink}" target="_blank" rel="noopener noreferrer">${shareLink}</a>` : 'No share link generated.');
            } else {
                const errorData = await response.json();
                showNotification('error', `Failed to fetch share link: ${errorData.message}`);
            }
        } catch (error) {
            showNotification('error', `Error fetching share link: ${error.message}`);
        }
    };

    const handleShareProtocol = async () => {
        const shareWith = $('#shareWith').val();
        const accessType = $('#accessType').val();

        if (!shareWith) {
            showNotification('error', 'Share with user is required');
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/protocols/${protocolId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ share_with: shareWith, access_type: accessType }),
            });

            if (response.ok) {
                showNotification('success', 'Protocol shared successfully!');
                $('#shareWith').val('');
                $('#accessType').val('read-only');
            } else {
                const errorData = await response.json();
                showNotification('error', `Failed to share protocol: ${errorData.message}`);
            }
        } catch (error) {
            showNotification('error', `An error occurred while sharing: ${error.message}`);
        }
    };

    const handleGenerateShareLink = async () => {
        const password = $('#password').val();

        if (!password) {
            showNotification('error', 'Please provide a password for the share link.');
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/protocols/${protocolId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ share_link: true, password: password }),
            });

            if (response.ok) {
                const data = await response.json();
                const shareLink = data.share_link_id ? `${apiBaseUrl}/protocols/shared/${data.share_link_id}` : '';
                showNotification('success', 'Share link generated successfully!');
                $('#shareLinkMessage').html(shareLink ? `Share Link: <a href="${shareLink}" target="_blank" rel="noopener noreferrer">${shareLink}</a>` : '');
                $('#password').val('');
            } else {
                const errorData = await response.json();
                showNotification('error', `Failed to generate share link: ${errorData.message}`);
            }
        } catch (error) {
            showNotification('error', `An error occurred while generating the share link: ${error.message}`);
        }
    };

    $('#shareButton').click(handleShareProtocol);
    $('#generateShareLinkButton').click(handleGenerateShareLink);
    $('#fetchShareLinkButton').click(handleFetchShareLink);

    // Initial check for protocolId
    if (!protocolId) {
        $('#protocolShareContent').hide();
        $('#noprotocolMessage').show();
    } else {
        $('#protocolShareContent').show();
        $('#noprotocolMessage').hide();
    }
});

    