// SystemSettings.js
$(document).ready(function() {
  const token = localStorage.getItem('token');
  let settings = {};

  // Fetch system settings
  function fetchSettings() {
    $.ajax({
      url: 'http://localhost:3306/admin/settings',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      success: function(response) {
        settings = response;
        $('#emailNotifications').prop('checked', settings.email_notifications);
        $('#defaultSettings').val(settings.default_settings);
        $('#branding').val(settings.branding);
      },
      error: function(xhr) {
        console.error('Failed to fetch system settings:', xhr.responseJSON);
      },
    });
  }

  // Handle saving settings
  $('#saveSettingsButton').click(function() {
    settings.email_notifications = $('#emailNotifications').prop('checked');
    settings.default_settings = $('#defaultSettings').val();
    settings.branding = $('#branding').val();

    $.ajax({
      url: 'http://localhost:3306/admin/settings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify(settings),
      success: function() {
        alert('System settings updated successfully!');
      },
      error: function(xhr) {
        console.error('Failed to update system settings:', xhr.responseJSON);
        alert('Failed to update system settings');
      },
    });
  });

  // Initial fetch
  fetchSettings();
});