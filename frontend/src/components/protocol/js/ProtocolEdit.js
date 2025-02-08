//ProtocolEdit.js 
const config = {
    apiBaseUrl: 'http://localhost:3306', // Your API base URL
    websocketUrl: 'ws://localhost:3000', // Your WebSocket server
};


$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const protocolId = urlParams.get('protocolId'); // Get protocolId from query parameters
    const token = localStorage.getItem('token');

    let protocol = null;
    let comments = [];
    let versionHistory = [];
    
    // Continue with your logic...
});

    // Fetch the protocol details
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
                protocol = await response.json();
                $('#protocolTitle').text(protocol.title);
                renderSections();
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

    // Fetch comments
    const fetchComments = async () => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/comments`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                comments = await response.json();
                renderComments();
            } else {
                const errorData = await response.json();
                alert(`Failed to fetch comments: ${errorData.message}`);
                console.error('Failed to fetch comments');
            }
        } catch (error) {
            alert(`Error fetching comments: ${error.message}`);
            console.error('Error fetching comments:', error);
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
                versionHistory = await response.json();
                renderVersionHistory();
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

    // Render sections
    const renderSections = () => {
        $('#sectionList').empty();
        protocol.sections.forEach(section => {
            const sectionItem = $(`
                <div class="sectionItem" data-id="${section.section_id}">
                    <h2>${section.section_name}</h2>
                    <textarea id="editor-${section.section_id}" class="editor"></textarea>
                    <button class="saveButton" data-section-id="${section.section_id}">Save Section</button>
                </div>
            `);
            $('#sectionList').append(sectionItem);

            // Initialize CKEditor
            ClassicEditor.create(document.querySelector(`#editor-${section.section_id}`))
                .then(editor => {
                    editor.setData(section.content || '');
                    sectionItem.find('.saveButton').click(() => {
                        handleUpdateSection(section.section_id, editor.getData());
                    });
                })
                .catch(error => {
                    console.error('Error initializing CKEditor:', error);
                });
        });
    };

    // Update section
    const handleUpdateSection = async (sectionId, content) => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/sections/${sectionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content }),
            });
            if (response.ok) {
                alert('Protocol section updated successfully.');
            } else {
                const errorData = await response.json();
                alert(`Failed to update section: ${errorData.message}`);
                console.error('Failed to update section');
            }
        } catch (error) {
            alert(`Error updating section: ${error.message}`);
            console.error('Error updating section:', error);
        }
    };

    // Render comments
    const renderComments = () => {
        $('#commentsList').empty();
        comments.forEach(comment => {
            const commentItem = $(`
                <div class="comment">
                    <p>${comment.text}</p>
                </div>
            `);
            $('#commentsList').append(commentItem);
        });
    };

    // Add comment
    $('#addComment').click(async function () {
        const newComment = $('#newComment').val();
        if (!newComment) return;

        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ text: newComment }),
            });
            if (response.ok) {
                const data = await response.json();
                comments.push(data);
                renderComments();
                $('#newComment').val(''); // Clear input
                alert('Comment added successfully.');
            } else {
                const errorData = await response.json();
                alert(`Failed to add comment: ${errorData.message}`);
                console.error('Failed to add comment');
            }
        } catch (error) {
            alert(`Error adding comment: ${error.message}`);
            console.error('Error adding comment:', error);
        }
    });

    // Render version history
    const renderVersionHistory = () => {
        $('#versionHistoryList').empty();
        versionHistory.forEach(version => {
            const versionItem = $(`
                <li>
                    <button class="revertButton" data-version-id="${version.version_id}">
                        Version: ${version.version_id} - Date: ${new Date(version.version_date).toLocaleString()}
                    </button>
                </li>
            `);
            $('#versionHistoryList').append(versionItem);
        });
    };

    // Revert version
    $('#versionHistoryList').on('click', '.revertButton', async function () {
        const versionId = $(this).data('version-id');
        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/versions/${versionId}/revert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                protocol = data; // Update protocol with reverted data
                renderSections(); // Re-render sections
                alert(`Document version reverted to ${versionId}`);
            } else {
                const errorData = await response.json();
                alert(`Failed to revert to a version: ${errorData.message}`);
                console.error('Failed to revert to a version.');
            }
        } catch (error) {
            alert(`Error reverting to version: ${error.message}`);
            console.error('Error reverting to version', error);
        }
    });

    // Fetch data on page load
    fetchProtocol();
    fetchComments();
    fetchVersionHistory();
});