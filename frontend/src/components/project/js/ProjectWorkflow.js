$(document).ready(function () {
    const token = localStorage.getItem('token');
    const projectId = 'yourProjectId'; // Replace with actual project ID
    let workflow = {};
    let availableUsers = [];

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:3306/admin/users', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                availableUsers = await response.json();
                renderUsers();
            } else {
                console.error('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchWorkflow = async () => {
        try {
            const response = await fetch(`http://localhost:3306/projects/${projectId}/workflows`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                workflow = await response.json();
                renderWorkflow();
            } else {
                console.error('Failed to fetch workflow');
            }
        } catch (error) {
            console.error('Error fetching workflow:', error);
        }
    };

    const renderUsers = () => {
        availableUsers.forEach(user => {
            $('#assignee').append(`<option value="${user.user_id}">${user.username}</option>`);
        });
    };

    const renderWorkflow = () => {
        $('#selectedStage').empty().append('<option value="" disabled selected>Select a Stage</option>');
        $('#selectedTask').empty().append('<option value="" disabled selected>Select a task to assign</option>');
        $('#workflowList').empty();

        workflow.stages.forEach(stage => {
            $('#selectedStage').append(`<option value="${stage.stage_id}">${stage.stage_name}</option>`);
            const stageDiv = $(`<div class="workflowStage"><h3>${stage.stage_name}</h3></div>`);
            const taskList = $('<ul class="taskList"></ul>');

            stage.tasks.forEach(task => {
                taskList.append(`
                    <li class="taskItem">
                        ${task.task_name}
                        ${task.assigned_user_id ? `<span> - Assigned To: ${availableUsers.find(user => user.user_id === task.assigned_user_id)?.username}</span>` : ''}
                        ${task.due_date ? `<span> - Due date: ${new Date(task.due_date).toLocaleDateString()}</span>` : ''}
                        <div class="dependencyList">
                            <span>Dependencies:</span>
                            <ul>${task.dependencies.map(dep => `<li>${dep.task_name}</li>`).join('')}</ul>
                            <select class="dependencySelect">
                                <option value="" disabled selected>Select a task to add a dependency</option>
                                ${workflow.stages.flatMap(stage => stage.tasks.filter(depTask => depTask.task_id !== task.task_id).map(depTask => `<option value="${depTask.task_id}">${depTask.task_name} in ${stage.stage_name}</option>`)).join('')}
                            </select>
                        </div>
                    </li>
                `);
            });

            stageDiv.append(taskList);
            $('#workflowList').append(stageDiv);
        });
    };

    const handleAddStage = async () => {
        const newStage = $('#newStage').val();
        if (!newStage) return;

        try {
            const response = await fetch(`http://localhost:3306/workflows/${workflow.workflow_id}/stages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ stage_name: newStage }),
            });
            if (response.ok) {
                const updatedData = await response.json();
                workflow.stages.push(updatedData);
                $('#newStage').val('');
                renderWorkflow();
            } else {
                console.error('Failed to add stage');
                alert('Failed to add stage');
            }
        } catch (error) {
            console.error('Error adding stage:', error);
            alert('Error adding stage');
        }
    };

    const handleAddTask = async () => {
        const selectedStage = $('#selectedStage').val();
        const newTask = $('#newTask').val();
        if (!selectedStage || !newTask) return;

        try {
            const response = await fetch(`http://localhost:3306/stages/${selectedStage}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ task_name: newTask }),
            });
            if (response.ok) {
                const updatedData = await response.json();
                const stage = workflow.stages.find(stage => stage.stage_id === selectedStage);
                if (stage) stage.tasks.push(updatedData);
                $('#newTask').val('');
                $('#selectedStage').val('');
                renderWorkflow();
            } else {
                console.error('Failed to add task');
                alert('Failed to add task');
            }
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Error adding task');
        }
    };

    const handleAssignTask = async () => {
        const selectedTask = $('#selectedTask').val();
        const assignee = $('#assignee').val();
        const dueDate = $('#dueDate').val();

        if (!selectedTask || !assignee || !dueDate) return;

        try {
            const response = await fetch(`http://localhost:3306/tasks/${selectedTask}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ user_id: assignee, due_date: dueDate }),
            });
            if (response.ok) {
                const updatedData = await response.json();
                workflow.stages.forEach(stage => {
                    stage.tasks.forEach(task => {
                        if (task.task_id === updatedData.task_id) {
                            Object.assign(task, updatedData);
                        }
                    });
                });
                $('#assignee').val('');
                $('#dueDate').val('');
                $('#selectedTask').val('');
                renderWorkflow();
            } else {
                console.error('Failed to assign task');
                alert('Failed to assign task');
            }
        } catch (error) {
            console.error('Error assigning task:', error);
            alert('Error assigning task');
        }
    };

    const handleAddDependency = async (task_id, dependency_id) => {
        try {
            const response = await fetch(`http://localhost:3306/tasks/${task_id}/dependencies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ dependency_id: dependency_id }),
            });
            if (response.ok) {
                const updatedData = await response.json();
                workflow.stages.forEach(stage => {
                    stage.tasks.forEach(task => {
                        if (task.task_id === updatedData.task_id) {
                            Object.assign(task, updatedData);
                        }
                    });
                });
                renderWorkflow();
            } else {
                console.error('Failed to add dependency');
                alert('Failed to add dependency');
            }
        } catch (error) {
            console.error('Error adding dependency:', error);
            alert('Error adding dependency');
        }
    };

    $('#addStageButton').click(handleAddStage);
    $('#addTaskButton').click(handleAddTask);
    $('#assignTaskButton').click(handleAssignTask);

    // Initial fetch
    fetchUsers();
    fetchWorkflow();
});
