$(document).ready(function () {
    const token = localStorage.getItem('token');
    const documentType = 'yourDocumentType'; // Replace with actual document type
    const documentId = 'yourDocumentId'; // Replace with actual document ID
    const quill = new Quill('#editor', {
        modules: {
            toolbar: [
                [{ header: [1, 2, false] }],
                ['bold', 'italic', 'underline'],
                ['image', 'code-block']
            ],
        },
        placeholder: 'Compose your document...',
        theme: 'snow',
    });

    const socket = io('http://localhost:3000', {
        auth: { token: `Bearer ${token}` },
    });

    // Fetch document content
    const fetchDocument = async () => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/collaboration/${documentType}/${documentId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                quill.setContents(data.content);
            } else {
                console.error('Failed to fetch document content');
            }
        } catch (error) {
            console.error('Error fetching document content:', error);
        }
    };

    // Set up WebSocket connection
    socket.on('connect', () => {
        console.log('Connected to WebSocket');
    });

    socket.on('document-update', (data) => {
        if (data.documentId === documentId && data.documentType === documentType) {
            quill.updateContents(data.delta);
        }
    });

    quill.on('text-change', (delta, oldDelta, source) => {
        if (source !== 'api') {
            socket.emit('document-update', {
                documentId,
                documentType,
                delta,
            });
        }
    });

    // Handle revert action
    $('#revertButton').click(function () {
        alert('Implement Revert operation with a version id');
    });

    // Initial fetch
    fetchDocument();
});
