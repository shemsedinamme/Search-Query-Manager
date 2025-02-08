$(document).ready(function () {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3306'; // Set your API URL
    const token = localStorage.getItem('token'); /* Obtain the token from the URL or session storage */

    let newPassword = '';
    let confirmPassword = '';

    // Show notification function
    function showNotification({ type, message }) {
        const notification = $(`<div class="notification ${type}">${message}</div>`);
        $('body').append(notification);
        setTimeout(() => {
            notification.fadeOut(() => {
                notification.remove();
            });
        }, 3000);
    }

    // Handle input change for new password
    $('#newPassword').on('input', function (event) {
        newPassword = event.target.value;
    });

    // Handle input change for confirm password
    $('#confirmPassword').on('input', function (event) {
        confirmPassword = event.target.value;
    });

    // Handle form submission
    $('#resetPasswordForm').on('submit', function (event) {
        event.preventDefault();

        if (newPassword !== confirmPassword) {
            showNotification({ type: 'error', message: 'Passwords do not match.' });
            return;
        }

        $.ajax({
            url: `${apiBaseUrl}/auth/reset-password/${token}`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ newPassword }),
            success: function () {
                showNotification({ type: 'success', message: 'Password reset successful!' });
                // Redirect to login page after successful password reset
                window.location.href = '/login';
            },
            error: function (xhr) {
                const errorData = xhr.responseJSON || {};
                showNotification({ type: 'error', message: `Error resetting password: ${errorData.message || 'An error occurred.'}` });
            }
        });
    });

    // HTML structure for the reset password form
      const html = `
        <div class="resetPasswordContainer">
            <h2>Reset Password</h2>
            <form id="resetPasswordForm">
                <div>
                    <label for="newPassword">New Password:</label>
                    <input type="password" id="newPassword" required />
                </div>
                <div>
                    <label for="confirmPassword">Confirm Password:</label>
                    <input type="password" id="confirmPassword" required />
                </div>
                <button type="submit">Reset Password</button>
            </form>
        </div>
    `;

    // Append the form to the body or a specific container
    $('#submenuItems').html(html);
});
