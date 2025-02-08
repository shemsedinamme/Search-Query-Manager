$(document).ready(function () {
    const protocolId = "{{ protocol.id }}"; // Get protocol ID from the server
    const username = "{{ session['username'] }}"; // Get username from the session
    const socket = io();

    // Join protocol room
    socket.emit('join', { protocol_id: protocolId, username: username });

    // Display Protocol Title
    $('#protocolTitle').text("{{ protocol.title }}");

    // Handle collaborator invitation
    $('#inviteCollaboratorsForm').on('submit', async function (e) {
        e.preventDefault();
        const collaboratorEmail = $('#collaboratorEmail').val();
        const collaboratorRole = $('#collaboratorRole').val();

        try {
            const response = await $.post(`/protocols/${protocolId}/invite`, {
                email: collaboratorEmail,
                role: collaboratorRole
            });
            alert('Collaborator invited successfully!');
            $('#collaboratorEmail').val(''); // Clear input
        } catch (error) {
            console.error('Error inviting collaborator:', error);
            alert('Failed to invite collaborator.');
        }
    });

    // Update online users list
    socket.on('update_users', function (users) {
        $('#users-list').empty();
        users.forEach(user => {
            $('#users-list').append(`<li>${user}</li>`);
        });
    });

    // Handle new comments
    socket.on('new_comment', function (data) {
        const commentsDiv = $('#comments');
        const newComment = `<p><strong>${data.username}</strong>: ${data.comment}</p>`;
        commentsDiv.append(newComment);
    });

    // Send new comment
    $('#comment-form').on('submit', function (e) {
        e.preventDefault();
        const commentText = $('#comment-input').val();
        socket.emit('comment', { protocol_id: protocolId, username: username, comment: commentText });
        $('#comment-input').val(''); // Clear input
    });

    // Update tasks
    const updateTaskList = async () => {
        try {
            const response = await $.get(`/protocols/${protocolId}/tasks`);
            const tasks = response.tasks;
            $('#tasks-list').empty();
            tasks.forEach(task => {
                const taskItem = `<li><strong>${task.task_name}</strong> - Assigned to: ${task.assigned_to} - Status: ${task.status}</li>`;
                $('#tasks-list').append(taskItem);
            });
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    // Fetch tasks on page load
    updateTaskList();
});
