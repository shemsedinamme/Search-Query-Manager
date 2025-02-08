function showNotification({ type, message }) {
    // Create a notification element
    const notification = $(`<div class="notification ${type}">${message}</div>`);
    // Append to body or a specific container
    $('body').append(notification);
    // Automatically remove the notification after 3 seconds
    setTimeout(() => {
        notification.fadeOut(() => {
            notification.remove();
        });
    }, 3000);
}

// Usage example in other scripts
$(document).ready(function () {
    // Example call
    showNotification({ type: 'success', message: 'Operation successful!' });
});
