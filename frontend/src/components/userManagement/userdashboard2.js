$(document).ready(function () {
    const apiBaseUrl = 'http://localhost:80'; // Set your API URL

    // Render Dashboard
    $('#adashboard').click(renderDashboard);
    
    function renderDashboard() {
        const pageContent = `
            <div class="adminTaskbar" id="menuItems"></div>
            <main class="dashboardGrid">
                <section class="dashboardSection" id="dashboardContentArea">
                    <div id="submenuItems"></div>
                </section>
            </main>
        `;
        $('#content').html(pageContent);
        const menuItems = getMenuItems('admin'); // Change role as per the user
        renderMenuItems(menuItems);
    }

    // Menu Items Rendering
    function getMenuItems(role) {
        if (role === 'admin') {
            return [
                { label: 'User Registration', section: 'User Registration' },
                { label: 'Reset Password', section: 'Reset Password' },
                { label: 'User Profile', section: 'User Profile' },
                { label: 'User Activity', section: 'User Activity' },
                { label: 'User List', section: 'User List' },
                { label: 'Manage Roles', section: 'Manage Roles' },
                { label: 'Audit Logs', section: 'Audit Logs' }
            ];
        }
        return []; // Return an empty array if the role is not 'admin'
    }

    function renderMenuItems(menuItems) {
        let menuHTML = '';
        if (menuItems.length > 0) {
            menuItems.forEach(item => {
                menuHTML += `<li><a class="menu-link" data-section="${item.section}">${item.label}</a></li>`;
            });
        }
        $('#menuItems').html(`<h2>User Management</h2><ul>${menuHTML}</ul>`);
        $('#menuItems').on('click', '.menu-link', function (e) {
            e.preventDefault();
            const section = $(this).data('section');
            renderSection(section);
        });
    }

    // Section Rendering
    function renderSection(section) {
        let sectionContent = '';
        switch (section) {
            case 'User Registration':
                sectionContent = renderRegistrationForm();
                break;
            case 'Reset Password':
                sectionContent = renderResetPasswordForm();
                break;
            case 'User Profile':
                sectionContent = renderUserProfile();
                break;
            case 'User Activity':
                sectionContent = renderUserActivity();
                break;
            case 'User List':
                sectionContent = renderUserList();
                break;
            case 'Manage Roles':
                sectionContent = renderManageRoles();
                break;
            case 'Audit Logs':
                sectionContent = renderAuditLogs();
                break;
            default:
                sectionContent = `<h2>Welcome to User Management</h2>`;
        }
        $('#submenuItems').html(sectionContent);
    }

    // Registration Form
    function renderRegistrationForm() {
        return `
            <h2>User Registration</h2>
            <form id="registrationForm">
                <input type="text" id="username" placeholder="Username..." required />
                <input type="email" id="email" placeholder="Email..." required />
                <input type="password" id="password" placeholder="Enter Password..." required />
                <button type="submit" class="button1">Submit</button>
            </form>
            <div class="error" id="registrationError"></div>
        `;
    }

    $('#content').on('submit', '#registrationForm', function (event) {
        event.preventDefault();
        const username = $('#username').val();
        const email = $('#email').val();
        const password = $('#password').val();
        $.ajax({
            url: `${apiBaseUrl}/register`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, email, password }),
            success: function (data) {
                alert('Registration successful!');
            },
            error: function (xhr) {
                $('#registrationError').text(`Error: ${xhr.responseText}`);
            }
        });
    });

    // Reset Password Form
    function renderResetPasswordForm() {
        return `
            <h2>Reset Password</h2>
            <form id="resetPasswordForm">
                <input type="email" id="resetEmail" placeholder="Email..." required />
                <input type="password" id="newPassword" placeholder="New Password..." required />
                <button type="submit" class="button1">Reset Password</button>
            </form>
            <div class="error" id="resetError"></div>
        `;
    }

    $('#content').on('submit', '#resetPasswordForm', function (event) {
        event.preventDefault();
        const email = $('#resetEmail').val();
        const newPassword = $('#newPassword').val();
        $.ajax({
            url: `${apiBaseUrl}/reset-password`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, newPassword }),
            success: function (data) {
                alert('Password reset successful!');
            },
            error: function (xhr) {
                $('#resetError').text(`Error: ${xhr.responseText}`);
            }
        });
    });

    // User Profile
    function renderUserProfile() {
        $.ajax({
            url: `${apiBaseUrl}/user-profile`,
            type: 'GET',
            success: function (data) {
                $('#submenuItems').html(`
                    <h2>User Profile</h2>
                    <div>Name: ${data.name}</div>
                    <div>Email: ${data.email}</div>
                `);
            },
            error: function (xhr) {
                $('#submenuItems').html(`<div class="error">Error fetching profile: ${xhr.responseText}</div>`);
            }
        });
    }

    // Other rendering functions
    function renderUserActivity() {
        return `<h2>User Activity</h2><div id="root"></div><script src="UserActivity.js"></script>`;
    }

    function renderUserList() {
        return `<h2>User List</h2><div id="root"></div><script src="UserList.js"></script>`;
    }

    function renderManageRoles() {
        return `<h2>Manage Roles</h2><div id="root"></div><script src="ManageRoles.js"></script>`;
    }

    function renderAuditLogs() {
        return `<h2>Audit Logs</h2><div id="root"></div><script src="AuditLogs.js"></script>`;
    }

    // Logout Functionality
    $('#logoutButton').click(function () {
        $.ajax({
            url: `${apiBaseUrl}/logout`,
            type: 'POST',
            success: function () {
                alert('Logged out successfully');
                window.location.href = '/login';
            },
            error: function (xhr) {
                alert(`Error logging out: ${xhr.responseText}`);
            }
        });
    });

    // Initial load
    renderDashboard();
});
