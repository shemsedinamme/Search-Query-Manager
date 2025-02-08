$(document).ready(function () {
    const token = localStorage.getItem('token');
    const projectId = 'yourProjectId'; // Replace with actual project ID

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/admin/users`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                renderUsers(data);
            } else {
                console.error('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/tasks?project_id=${projectId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                renderTasks(data);
            } else {
                console.error('Failed to fetch tasks');
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const renderUsers = (users) => {
        users.forEach(user => {
            $('#assignedUser').append(`<option value="${user.user_id}">${user.username}</option>`);
        });
    };

    const renderTasks = (tasks) => {
        $('#taskList').empty();
        tasks.forEach(task => {
            $('#taskList').append(`
                <li class="taskItem">
                    Task: ${task.task_name} - Assigned To: ${task.assigned_user_id} - Due Date: ${new Date(task.due_date).toLocaleDateString()} - Status: ${task.task_status}
                </li>
            `);
        });
    };

    $('#createTaskButton').click(async function () {
        const taskName = $('#newTaskName').val();
        const taskDescription = $('#newTaskDescription').val();
        const assignedUser = $('#assignedUser').val();
        const dueDate = $('#dueDate').val();

        if (!taskName) return;

        try {
            const response = await fetch(`${config.apiBaseUrl}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    task_name: taskName,
                    task_description: taskDescription,
                    project_id: projectId,
                    due_date: dueDate,
                    assigned_user_id: assignedUser,
                }),
            });
            if (response.ok) {
                const updatedData = await response.json();
                renderTasks([...tasks, updatedData]); // Append new task
                $('#newTaskName').val('');
                $('#newTaskDescription').val('');
                $('#dueDate').val('');
                $('#assignedUser').val('');
            } else {
                console.error('Failed to create new task.');
                alert('Failed to create new task.');
            }
        } catch (error) {
            console.error('Error creating new task:', error);
            alert('Error creating new task.');
        }
    });

    // Initial fetch
    fetchUsers();
    fetchTasks();
});
