// project_metadata.js
$(document).ready(function () {
    const projectId = 'your_project_id'; // Replace with actual project ID
    const token = localStorage.getItem('token');

    // Fetch Metadata
    const fetchMetadata = async () => {
        if (!projectId) return;
        try {
            const response = await fetch(`http://localhost:3306/projects/${projectId}/metadata`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                renderMetadata(data);
            } else {
                console.error('Failed to fetch metadata');
                $('#message').text('Failed to fetch metadata');
            }
        } catch (error) {
            console.error('Error fetching metadata:', error);
            $('#message').text('Error fetching metadata');
        }
    };

    // Render Metadata
    const renderMetadata = (metadata) => {
        $('#metadataList').empty();
        metadata.forEach(item => {
            $('#metadataList').append(`
                <div class="metadataItem">
                    <label>${item.field_name}: </label>
                    <input type="text" value="${item.value}" data-meta-id="${item.meta_id}" class="metadataInput" />
                </div>
            `);
        });
    };

    // Add Metadata
    $('#addMetadataButton').click(async function () {
        const newMetadataField = $('#newMetadataField').val();
        if (!newMetadataField) return;

        try {
            const response = await fetch(`http://localhost:3306/projects/${projectId}/metadata`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ field_name: newMetadataField }),
            });
            if (response.ok) {
                const data = await response.json();
                $('#metadataList').append(`
                    <div class="metadataItem">
                        <label>${data.field_name}: </label>
                        <input type="text" value="${data.value}" data-meta-id="${data.meta_id}" class="metadataInput" />
                    </div>
                `);
                $('#newMetadataField').val('');
                $('#message').text('Metadata added successfully!');
            } else {
                const errorData = await response.json();
                console.error('Failed to add metadata: ', errorData);
                $('#message').text('Failed to add metadata');
            }
        } catch (error) {
            console.error('Error adding metadata:', error);
            $('#message').text('Error adding metadata');
        }
    });

    // Update Metadata
    $('#metadataList').on('change', '.metadataInput', async function () {
        const metaId = $(this).data('meta-id');
        const value = $(this).val();

        try {
            const response = await fetch(`http://localhost:3306/projects/${projectId}/metadata`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ meta_id: metaId, value: value }),
            });
            if (response.ok) {
                const updatedData = await response.json();
                $('#message').text('Metadata updated successfully!');
            } else {
                console.error('Failed to update metadata');
                $('#message').text('Failed to update metadata');
            }
        } catch (error) {
            console.error('Error updating metadata:', error);
            $('#message').text('Error updating metadata');
        }
    });

    // Search Metadata
    $('#searchButton').click(async function () {
        const searchQuery = $('#searchQuery').val();
        if (!searchQuery) return;

        try {
            const response = await fetch(`http://localhost:3306/projects/search?query=${searchQuery}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                renderSearchResults(data);
            } else {
                console.error('Search failed:', response);
                $('#message').text('Search failed, try another search query');
            }
        } catch (error) {
            console.error('Error searching:', error);
            $('#message').text('Error while searching');
        }
    });

    // Render Search Results
    const renderSearchResults = (results) => {
        $('#metadataList').empty();
        if (results.length > 0) {
            results.forEach(result => {
                $('#metadataList').append(`<div>${result.title}</div>`);
            });
        } else {
            $('#metadataList').append('<p>No results found.</p>');
        }
    };

    // Initial Metadata Fetch
    fetchMetadata();
});
