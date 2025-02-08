$(document).ready(function () {
    const apiBaseUrl = 'http://localhost:80'; // Set your API URL
    const token = localStorage.getItem('token');
    
    // Initialize user data
    let users = [];

    // Fetch users from the server
    function fetchUsers() {
        $.ajax({
            url: `${apiBaseUrl}/users`,
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            success: function (data) {
                users = data; // Store users in the variable
                renderUserList();
            },
            error: function (xhr) {
                console.error('Error fetching users:', xhr.responseText);
                alert(`Failed to fetch users: ${xhr.responseText}`);
            }
        });
    }

    // Render the user list
    function renderUserList() {
        let userHTML = '';
        users.forEach(user => {
            userHTML += `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>
                        <button class="edit-user" data-id="${user.id}">Edit</button>
                        <button class="delete-user" data-id="${user.id}">Delete</button>
                    </td>
                </tr>
            `;
        });

        $('#submenuItems').html(`
            <div class="userListContainer">
                <h1>User List</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>${userHTML}</tbody>
                </table>
            </div>
        `);

        // Attach event handlers for edit and delete buttons
        $('.edit-user').on('click', function () {
            const userId = $(this).data('id');
            handleEditUser(userId);
        });

        $('.delete-user').on('click', function () {
            const userId = $(this).data('id');
            handleDeleteUser(userId);
        });
    }

    // Handle user editing
    function handleEditUser(userId) {
        // Implement logic for editing user details (potentially using a modal or form)
        alert(`Edit user with ID: ${userId}`);
        // You can add modal logic here to edit user details
    }

    // Handle user deletion
    function handleDeleteUser(userId) {
        if (window.confirm('Are you sure you want to delete this user?')) {
            $.ajax({
                url: `${apiBaseUrl}/users/${userId}`,
                type: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                success: function () {
                    users = users.filter((user) => user.id !== userId); // Remove user from the array
                    renderUserList(); // Re-render the user list
                    alert('User deleted successfully');
                },
                error: function (xhr) {
                    console.error('Error deleting user:', xhr.responseText);
                    alert(`Failed to delete user: ${xhr.responseText}`);
                }
            });
        }
    }

    // Initial fetch of users
    fetchUsers();
});
