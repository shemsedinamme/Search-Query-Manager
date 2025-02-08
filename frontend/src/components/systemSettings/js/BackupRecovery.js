$(document).ready(function() {
  const token = localStorage.getItem('token');

  // Handle initiating backup
  $('#initiateBackupButton').click(function() {
    $.ajax({
      url: 'http://localhost:3306/admin/backup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      success: function() {
        alert('Backup initiated successfully!');
      },
      error: function(xhr) {
        console.error('Failed to initiate backup:', xhr.responseJSON);
        alert('Failed to initiate backup');
      },
    });
  });

  // Handle testing recovery
  $('#testRecoveryButton').click(function() {
    $.ajax({
      url: 'http://localhost:3306/admin/recovery-test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      success: function() {
        alert('Recovery test completed successfully!');
      },
      error: function(xhr) {
        console.error('Failed to test recovery:', xhr.responseJSON);
        alert('Failed to test recovery');
      },
    });
  });
});
