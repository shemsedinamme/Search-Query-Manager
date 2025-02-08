$(document).ready(function () {
    const token = localStorage.getItem('token');
    const projectId = 'yourProjectId'; // Replace with actual project ID
    const socket = io(`${config.apiBaseUrl}`, {
        auth: { token: `Bearer ${token}` },
    });

    const messages = [];

    socket.on('connect', () => {
        console.log('Connected to WebSocket');
    });

    socket.on('chat-message', (message) => {
        messages.push(message);
        renderMessages();
    });

    $('#sendButton').click(function () {
        const newMessage = $('#newMessage').val();
        if (newMessage && socket) {
            socket.emit('chat-message', {
                senderId: 1, // Replace with actual sender ID
                projectId,
                messageText: newMessage,
            });
            $('#newMessage').val('');
        }
    });

    const renderMessages = () => {
        $('#messageList').empty();
        messages.forEach((message) => {
            $('#messageList').append(`<div class="messageItem">${message.messageText}</div>`);
        });
    };

    $(window).on('beforeunload', function () {
        if (socket) {
            socket.disconnect();
            console.log("Disconnected from WebSocket");
        }
    });
});

