$(document).ready(function () {
    const apiBaseUrl = 'http://localhost:80'; // Set your API URL
    const token = localStorage.getItem('token');

    function fetchRoles() {
        $.ajax({
            url: `${apiBaseUrl}/admin/roles`,
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            success: function (data) {
                renderRoles(data);
            },
            error: function (xhr) {
                console.error('Error fetching roles:', xhr.responseText);
                alert(`Failed to fetch roles: ${xhr.responseText}`);
            }
        });
    }

    function renderRoles(roles) {
        let rolesHTML = '';
        roles.forEach(role => {
            rolesHTML += `
                <tr>
                    <td>${role.name}</td>
                    <td>${role.permissions.join(', ')}</td>
                    <td>
                        <button class="edit-role" data-id="${role.id}">Edit</button>
                        <button class="delete-role" data-id="${role.id}">Delete</button>
                    </td>
                </tr>
            `;
        });
        $('#submenuItems').html(`
            <h1>Manage Roles</h1>
            <table>
                <thead>
                    <tr>
                        <th>Role Name</th>
                        <th>Permissions</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${rolesHTML}</tbody>
            </table>
        `);
    }

    fetchRoles();
});
