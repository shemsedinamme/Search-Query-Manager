$(document).ready(function () {
  const token = localStorage.getItem('token');
  const projectId = 123; // Replace with the actual project ID

  // Existing fetch functions...

  // Fetch collaborators
  function fetchCollaborators() {
    $.ajax({
      url: `http://localhost:3306/projects/${projectId}/collaborators`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      success: function (response) {
        renderCollaborators(response);
      },
      error: function (xhr) {
        console.error('Failed to fetch collaborators:', xhr.responseJSON);
      },
    });
  }

  // Render collaborators
  function renderCollaborators(collaborators) {
    let collaboratorsHtml = '';
    collaborators.forEach((collaborator) => {
      collaboratorsHtml += `
        <li>
          ${collaborator.email} - 
          <button onclick="handleUpdateCollaboratorRole(${collaborator.id}, $('#collaboratorRole').val())">Update Role</button>
        </li>
      `;
    });
    $('#collaboratorList').html(collaboratorsHtml);
  }

  // Handle inviting collaborators
  $('#inviteButton').click(function () {
    const emails = $('#newCollaborators').val().split(',').map(email => email.trim());
    const role = $('#collaboratorRole').val();
    $.ajax({
      url: `http://localhost:3306/projects/${projectId}/collaborators/invite`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ emails, role }),
      success: function () {
        alert('Collaborators invited successfully!');
        fetchCollaborators(); // Refresh collaborators
        $('#newCollaborators').val(''); // Clear input
      },
      error: function (xhr) {
        console.error('Failed to invite collaborators:', xhr.responseJSON);
        alert('Failed to invite collaborators');
      },
    });
  });

  // Handle transferring ownership
  $('#transferOwnershipButton').click(function () {
    const newOwnerEmail = $('#newOwnerEmail').val();
    $.ajax({
      url: `http://localhost:3306/projects/${projectId}/transfer-ownership`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ newOwnerEmail }),
      success: function () {
        alert('Project ownership transferred successfully!');
        fetchCollaborators(); // Refresh collaborators
      },
      error: function (xhr) {
        console.error('Failed to transfer ownership:', xhr.responseJSON);
        alert('Failed to transfer ownership');
      },
    });
  });

  // Initial fetch
  fetchDocument();
  fetchComments();
  fetchFiles();
  fetchVersionHistory();
  fetchCollaborators();
});


// ProjectCollaboration.js
$(document).ready(function () {
  const token = localStorage.getItem('token');
  const projectId = 123; // Replace with actual project ID

  // Fetch document content
  function fetchDocument() {
    $.ajax({
      url: `http://localhost:3306/projects/${projectId}/documents/1`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      success: function (response) {
        $('#documentContent').val(response.content);
      },
      error: function (xhr) {
        console.error('Failed to fetch document:', xhr.responseJSON);
      },
    });
  }

  // Fetch comments
  function fetchComments() {
    $.ajax({
      url: `http://localhost:3306/projects/${projectId}/comments`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      success: function (response) {
        renderComments(response);
      },
      error: function (xhr) {
        console.error('Failed to fetch comments:', xhr.responseJSON);
      },
    });
  }

  // Fetch files
  function fetchFiles() {
    $.ajax({
      url: `http://localhost:3306/projects/${projectId}/files`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      success: function (response) {
        renderFiles(response);
      },
      error: function (xhr) {
        console.error('Failed to fetch files:', xhr.responseJSON);
      },
    });
  }

  // Fetch version history
  function fetchVersionHistory() {
    $.ajax({
      url: `http://localhost:3306/projects/${projectId}/documents/1/version`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      success: function (response) {
        renderVersionHistory(response);
      },
      error: function (xhr) {
        console.error('Failed to fetch version history:', xhr.responseJSON);
      },
    });
  }

  // Render comments
  function renderComments(comments) {
    let commentsHtml = '';
    comments.forEach((comment) => {
      commentsHtml += `<div class="comment"><p>${comment.text}</p></div>`;
    });
    $('#commentsList').html(commentsHtml);
  }

  // Render files
  function renderFiles(files) {
    let filesHtml = '';
    files.forEach((file) => {
      filesHtml += `
        <li>
          <a href="${file.file_path}" target="_blank" rel="noopener noreferrer">
            ${file.file_name}
          </a>
        </li>
      `;
    });
    $('#fileList').html(filesHtml);
  }

  // Render version history
  function renderVersionHistory(versions) {
    let versionsHtml = '';
    versions.forEach((version) => {
      versionsHtml += `
        <li>
          <button onclick="handleRevertVersion(${version.version_id})">
            Version: ${version.version_id} - Date: ${new Date(version.version_date).toLocaleString()}
          </button>
        </li>
      `;
    });
    $('#versionHistoryList').html(versionsHtml);
  }

  // Handle document content change
  $('#documentContent').on('input', function () {
    const content = $(this).val();
    $.ajax({
      url: `http://localhost:3306/projects/${projectId}/documents/1`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ content: content }),
      success: function () {
        console.log('Document content saved');
      },
      error: function (xhr) {
        console.error('Failed to save document content:', xhr.responseJSON);
      },
    });
  });

  // Handle adding a comment
  $('#addCommentButton').click(function () {
    const newComment = $('#newComment').val();
    if (!newComment) return;

    $.ajax({
      url: `http://localhost:3306/projects/${projectId}/comments`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({ text: newComment }),
      success: function (response) {
        fetchComments(); // Refresh comments list
        $('#newComment').val(''); // Clear input
      },
      error: function (xhr) {
        console.error('Failed to add comment:', xhr.responseJSON);
      },
    });
  });

  // Handle file upload
  $('#uploadFileButton').click(function () {
    const file = $('#newFile')[0].files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    $.ajax({
      url: `http://localhost:3306/projects/${projectId}/files`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: formData,
      processData: false,
      contentType: false,
      success: function (response) {
        fetchFiles(); // Refresh files list
        $('#newFile').val(''); // Clear input
      },
      error: function (xhr) {
        console.error('Failed to upload file:', xhr.responseJSON);
      },
    });
  });

  // Handle reverting to a version
  window.handleRevertVersion = function (versionId) {
    $.ajax({
      url: `http://localhost:3306/documents/1/versions/${versionId}/revert`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      success: function (response) {
        fetchDocument(); // Refresh document content
        alert(`Document version reverted to ${versionId}`);
      },
      error: function (xhr) {
        console.error('Failed to revert version:', xhr.responseJSON);
      },
    });
  };

  // Initial fetch
  fetchDocument();
  fetchComments();
  fetchFiles();
  fetchVersionHistory();
});