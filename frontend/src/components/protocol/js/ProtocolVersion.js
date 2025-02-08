const config = {
    apiBaseUrl: 'http://localhost:3306', // Your API base URL
};

$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const protocolId = urlParams.get('protocolId'); // Assuming protocolId is passed as a query parameter
    const token = localStorage.getItem('token');

    let versions = [];
    let selectedVersionId = null;

    // Fetch protocol details
    const fetchProtocol = async () => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const protocol = await response.json();
                $('#protocolTitle').text(protocol.title); // Display protocol title
                fetchVersionHistory(); // Fetch version history after loading protocol
            } else {
                const errorData = await response.json();
                alert(`Failed to fetch protocol: ${errorData.message}`);
                console.error('Failed to fetch protocol');
            }
        } catch (error) {
            alert(`Error fetching protocol: ${error.message}`);
            console.error('Error fetching protocol:', error);
        }
    };

    // Fetch version history
    const fetchVersionHistory = async () => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/versions`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                versions = await response.json();
                renderVersions();
            } else {
                const errorData = await response.json();
                alert(`Failed to fetch version history: ${errorData.message}`);
                console.error('Failed to fetch version history');
            }
        } catch (error) {
            alert(`Error fetching version history: ${error.message}`);
            console.error('Error fetching version history:', error);
        }
    };

    // Render versions
    const renderVersions = () => {
        $('#versionList ul').empty();
        versions.forEach(version => {
            const versionItem = $(`
                <li class="versionItem" data-id="${version.version_id}">
                    Version: ${version.version_id} - Date: ${new Date(version.version_date).toLocaleString()}
                    <button class="viewButton">View</button>
                    <button class="revertButton">Revert</button>
                </li>
            `);
            $('#versionList ul').append(versionItem);
        });
    };

    // Handle view version
    $('#versionList').on('click', '.viewButton', async function () {
        const versionId = $(this).closest('.versionItem').data('id');
        try {
            const response = await fetch(`${config.apiBaseUrl}/versions/${versionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                $('#selectedVersion').text(versionId);
                $('#contentText').text(data.content);
                $('#versionContent').show();
                selectedVersionId = versionId;
            } else {
                const errorData = await response.json();
                alert(`Failed to view version: ${errorData.message}`);
                console.error('Failed to view version');
            }
        } catch (error) {
            alert(`Error viewing version: ${error.message}`);
            console.error('Error viewing version:', error);
        }
    });

    // Handle revert version
    $('#versionList').on('click', '.revertButton', async function () {
        const versionId = $(this).closest('.versionItem').data('id');
        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/versions/${versionId}/revert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                alert('Protocol version reverted successfully');
                fetchVersionHistory(); // Refresh version history
            } else {
                const errorData = await response.json();
                alert(`Failed to revert to version: ${errorData.message}`);
                console.error('Failed to revert to version');
            }
        } catch (error) {
            alert(`Error reverting to version: ${error.message}`);
            console.error('Error reverting to version:', error);
        }
    });

    // Handle rollback feature
    $('#rollback-btn').on('click', async function() {
        const versionNumber = $('#versionNumber').val();
        if (!versionNumber) {
            alert('Please enter a valid version number.');
            return;
        }

        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/versions/${versionNumber}/rollback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                alert(`Rolled back to version ${versionNumber}`);
                fetchVersionHistory(); // Refresh version history after rollback
            } else {
                const errorData = await response.json();
                alert(`Failed to rollback to version: ${errorData.message}`);
                console.error('Failed to rollback to version.');
            }
        } catch (error) {
            alert(`Error rolling back version: ${error.message}`);
            console.error('Error rolling back version', error);
        }
    });

    // Initial data fetch
    if (protocolId) {
        fetchProtocol();
    } else {
        alert('Select a protocol to manage versions.');
    }
});
