$(document).ready(function () {
    const apiBaseUrl = 'http://localhost:80'; // Set your API URL
    const token = localStorage.getItem('token');
    const userId = window.location.pathname.split('/')[2]; // Extract user ID from URL
    let user = {};
    let editMode = false;

    // Fetch user profile from the server
    function fetchUserProfile() {
        $.ajax({
            url: `${apiBaseUrl}/users/${userId}`,
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            success: function (data) {
                user = data;
                renderProfile(user);
            },
            error: function (xhr) {
                console.error('Error fetching user profile:', xhr.responseText);
                alert(`Failed to fetch user: ${xhr.responseText}`);
            }
        });
    }

    // Render the user profile
    function renderProfile(userData) {
        let profileHTML = '';
        if (!editMode) {
            profileHTML = `
                <h1>User Profile</h1>
                <div class="profileDetails">
                    <p><strong>Username:</strong> ${userData.username}</p>
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Role:</strong> ${userData.role}</p>
                    ${userData.subscriptionOption ? `<p><strong>Subscription Type:</strong> ${userData.subscriptionOption}</p>` : ''}
                    ${userData.studentId ? `<p><strong>Student ID:</strong> ${userData.studentId}</p>` : ''}
                    <button type="button" class="editButton">Edit Profile</button>
                </div>
            `;
        } else {
            profileHTML = `
                <h1>Edit User Profile</h1>
                <div class="profileEditForm">
                    <input type="text" name="username" placeholder="Username" value="${userData.username || ''}" class="profileInput" />
                    <input type="email" name="email" placeholder="Email" value="${userData.email || ''}" class="profileInput" />
                    <button type="button" class="saveButton">Save</button>
                    <button type="button" class="cancelButton">Cancel</button>
                </div>
            `;
        }
        $('#submenuItems').html(profileHTML);

        // Attach event handlers
        $('.editButton').on('click', function () {
            editMode = true;
            renderProfile(user);
        });

        $('.saveButton').on('click', handleUpdateProfile);
        $('.cancelButton').on('click', handleCancelEdit);
    }

    // Update user profile
    function handleUpdateProfile() {
        const formData = {
            username: $('input[name="username"]').val(),
            email: $('input[name="email"]').val(),
        };

        $.ajax({
            url: `${apiBaseUrl}/profile`,
            type: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            data: JSON.stringify(formData),
            success: function (updatedData) {
                alert('User profile updated successfully');
                user = updatedData; // Update user data
                editMode = false; // Exit edit mode
                renderProfile(user); // Re-render profile
            },
            error: function (xhr) {
                console.error('Error updating user profile:', xhr.responseText);
                alert(`Failed to update user profile: ${xhr.responseText}`);
            }
        });
    }

    // Cancel editing
    function handleCancelEdit() {
        editMode = false; // Exit edit mode
        renderProfile(user); // Re-render profile
    }

    // Initial fetch of user profile
    fetchUserProfile();
});
