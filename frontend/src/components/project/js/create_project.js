// create_project.js
$(document).ready(function () {
    const token = localStorage.getItem('token');

    $('#createProjectForm').on('submit', async function (e) {
        e.preventDefault();
        
        const projectData = {
            title: $('#title').val(),
            description: $('#description').val(),
            start_date: $('#start_date').val(),
            end_date: $('#end_date').val(),
            status: $('#status').val(),
        };

        // Validate start and end dates
        if (new Date(projectData.start_date) >= new Date(projectData.end_date)) {
            $('#message').text('Start date must be before the end date.').css('color', 'red');
            return;
        }

        try {
            const response = await fetch('http://localhost:3306/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(projectData),
            });

            if (response.ok) {
                const data = await response.json();
                $('#message').text(`Project "${data.title}" created successfully!`).css('color', 'green');
                $('#createProjectForm')[0].reset(); // Reset form fields
            } else {
                const errorData = await response.json();
                $('#message').text(`Failed to create project: ${errorData.message}`).css('color', 'red');
            }
        } catch (error) {
            console.error('Error creating project:', error);
            $('#message').text('An error occurred while creating the project.').css('color', 'red');
        }
    });
});
