//ProtocolTemplate.js
const config = {
    apiBaseUrl: 'http://localhost:3306', // Your API base URL
    websocketUrl: 'ws://localhost:3000', // Your WebSocket server
};

$(document).ready(function () {
    const token = localStorage.getItem('token');
    let templates = [];
    let formData = { template_name: '', template_description: '', sections: [] };

    // Fetch existing templates
    const fetchTemplates = async () => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/templates`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                templates = await response.json();
                renderTemplates();
            } else {
                const errorData = await response.json();
                alert(`Failed to fetch protocol templates: ${errorData.message}`);
                console.error('Failed to fetch protocol templates');
            }
        } catch (error) {
            alert(`Error fetching protocol templates: ${error.message}`);
            console.error('Error fetching protocol templates:', error);
        }
    };

    const renderTemplates = () => {
        $('#existingTemplates').empty();
        templates.forEach(template => {
            const templateItem = $(`
                <div class="templateItem">
                    <span>${template.template_name}</span>
                    <button class="selectButton" data-id="${template.template_id}">Select</button>
                    <button class="shareButton" data-id="${template.template_id}">Share</button>
                </div>
            `);
            $('#existingTemplates').append(templateItem);
        });
    };

    // Handle adding a new section
    $('#addSection').click(function () {
        const newSectionName = $('#newSection').val();
        if (!newSectionName) return;

        formData.sections.push({
            section_id: uuid.v4(),
            section_name: newSectionName,
            data_fields: [],
        });
        $('#newSection').val(''); // Clear input field
        renderSections();
    });

    const renderSections = () => {
        $('#sectionList').empty();
        formData.sections.forEach(section => {
            const sectionItem = $(`
                <div class="sectionItem" data-id="${section.section_id}">
                    <h3>${section.section_name}</h3>
                    <div class="addDataField">
                        <input type="text" placeholder="Add new data field" class="dataFieldInput" />
                        <button class="addDataFieldButton">Add</button>
                    </div>
                    <ul class="dataFieldList"></ul>
                    <button class="deleteButton">Delete Section</button>
                </div>
            `);
            $('#sectionList').append(sectionItem);
        });
    };

    // Handle creating the template
    $('#createTemplate').click(async function () {
        try {
            const response = await fetch(`${config.apiBaseUrl}/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                const updatedData = await response.json();
                alert('New template created successfully');
                templates.push(updatedData);
                formData = { template_name: '', template_description: '', sections: [] };
                $('#template_name').val('');
                $('#template_description').val('');
                renderTemplates();
            } else {
                const errorData = await response.json();
                alert(`Failed to create new template: ${errorData.message}`);
                console.error('Failed to create new template');
            }
        } catch (error) {
            alert(`Error creating new template: ${error.message}`);
            console.error('Error creating new template:', error);
        }
    });

    // Event delegation for dynamically added buttons
    $('#sectionList').on('click', '.deleteButton', function () {
        const sectionId = $(this).closest('.sectionItem').data('id');
        formData.sections = formData.sections.filter(section => section.section_id !== sectionId);
        renderSections();
    });

    $('#sectionList').on('click', '.addDataFieldButton', function () {
        const sectionItem = $(this).closest('.sectionItem');
        const sectionId = sectionItem.data('id');
        const dataFieldName = sectionItem.find('.dataFieldInput').val();

        if (dataFieldName) {
            const section = formData.sections.find(s => s.section_id === sectionId);
            section.data_fields.push({ field_id: uuid.v4(), field_name: dataFieldName });
            sectionItem.find('.dataFieldInput').val(''); // Clear input field
            renderSections();
        }
    });

    // Fetch templates on page load
    fetchTemplates();
});

//ProtocolCreate.js
$(document).ready(function () {
    const token = localStorage.getItem('token');
    let templates = [];
    let selectedTemplate = '';
    let protocol = { title: '', sections: [] };

    // Fetch templates from the server
    const fetchTemplates = async () => {
        try {
            const response = await fetch('http://localhost:3306/templates', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                templates = await response.json();
                renderTemplates();
            } else {
                console.error('Failed to fetch protocol templates');
            }
        } catch (error) {
            console.error('Error fetching protocol templates:', error);
        }
    };

    const renderTemplates = () => {
        templates.forEach(template => {
            $('#templateSelect').append(`<option value="${template.template_id}">${template.template_name}</option>`);
        });
    };

    // Handle template selection
    $('#templateSelect').change(async function () {
        selectedTemplate = $(this).val();
        if (selectedTemplate) {
            await fetchTemplateSections(selectedTemplate);
        }
    });

    // Fetch sections of the selected template
    const fetchTemplateSections = async (templateId) => {
        try {
            const response = await fetch(`http://localhost:3306/templates/${templateId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const templateData = await response.json();
                protocol.sections = templateData.sections; // Update protocol sections
                renderSections();
            } else {
                console.error('Failed to fetch template sections');
            }
        } catch (error) {
            console.error('Error fetching template sections:', error);
        }
    };

    // Render sections
    const renderSections = () => {
        $('#sectionList').empty();
        protocol.sections.forEach(section => {
            const sectionItem = $(`
                <div class="sectionItem">
                    <h2>${section.section_name}</h2>
                    <textarea id="editor-${section.section_id}" class="editor"></textarea>
                    <button class="saveButton" data-section-id="${section.section_id}">Save Section</button>
                </div>
            `);
            $('#sectionList').append(sectionItem);

            // Initialize CKEditor
            ClassicEditor.create(document.querySelector(`#editor-${section.section_id}`))
                .then(editor => {
                    editor.setData(section.content || '');
                    sectionItem.find('.saveButton').click(() => {
                        handleUpdateSection(section.section_id, editor.getData());
                    });
                })
                .catch(error => {
                    console.error('Error initializing CKEditor:', error);
                });
        });
    };

    // Handle creating the protocol
    $('#createProtocol').click(async function () {
        if (!selectedTemplate) {
            $('#message').text('Please select a template to create a protocol');
            return;
        }

        try {
            const response = await fetch('http://localhost:3306/protocols', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ template_id: selectedTemplate, title: protocol.title }),
            });
            if (response.ok) {
                const data = await response.json();
                protocol = data; // Update protocol with created data
                renderSections(); // Render the sections if needed
                $('#message').text('Protocol created successfully');
            } else {
                const errorData = await response.json();
                console.error('Failed to create protocol:', errorData);
                $('#message').text('Failed to create Protocol');
            }
        } catch (error) {
            console.error('Error creating protocol:', error);
            $('#message').text('Error creating protocol');
        }
    });

    // Update section
    const handleUpdateSection = async (sectionId, content) => {
        try {
            const response = await fetch(`http://localhost:3306/protocols/${protocol.protocol_id}/sections/${sectionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content }),
            });
            if (response.ok) {
                $('#message').text('Protocol section saved');
            } else {
                console.error('Failed to update section');
                alert('Failed to update section');
            }
        } catch (error) {
            console.error('Error updating section:', error);
            alert('Error updating section');
        }
    };

    // Fetch templates on page load
    fetchTemplates();
});

//ProtocolEdit.js 
const config = {
  apiBaseUrl: 'http://localhost:3306', // Your API base URL
  websocketUrl: 'ws://localhost:3000', // Your WebSocket server
};


$(document).ready(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const protocolId = urlParams.get('protocolId'); // Get protocolId from query parameters
  const token = localStorage.getItem('token');

  let protocol = null;
  let comments = [];
  let versionHistory = [];

  // Continue with your logic...
});

// Fetch the protocol details
const fetchProtocol = async () => {
  try {
    const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (response.ok) {
      protocol = await response.json();
      $('#protocolTitle').text(protocol.title);
      renderSections();
    } else {
      const errorData = await response.json();
      alert(`Failed to fetch protocol: ${errorData.message}`);
      console.error('Failed to fetch protocol');
    }
  } catch (error) {
    alert(`Error fetching protocol: ${error.message}`);
    console.error('Error fetching protocol:', error);
  }
};

// Fetch comments
const fetchComments = async () => {
  try {
    const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/comments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (response.ok) {
      comments = await response.json();
      renderComments();
    } else {
      const errorData = await response.json();
      alert(`Failed to fetch comments: ${errorData.message}`);
      console.error('Failed to fetch comments');
    }
  } catch (error) {
    alert(`Error fetching comments: ${error.message}`);
    console.error('Error fetching comments:', error);
  }
};

// Fetch version history
const fetchVersionHistory = async () => {
  try {
    const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/versions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (response.ok) {
      versionHistory = await response.json();
      renderVersionHistory();
    } else {
      const errorData = await response.json();
      alert(`Failed to fetch version history: ${errorData.message}`);
      console.error('Failed to fetch version history');
    }
  } catch (error) {
    alert(`Error fetching version history: ${error.message}`);
    console.error('Error fetching version history:', error);
  }
};

// Render sections
const renderSections = () => {
  $('#sectionList').empty();
  protocol.sections.forEach(section => {
    const sectionItem = $(`
                <div class="sectionItem" data-id="${section.section_id}">
                    <h2>${section.section_name}</h2>
                    <textarea id="editor-${section.section_id}" class="editor"></textarea>
                    <button class="saveButton" data-section-id="${section.section_id}">Save Section</button>
                </div>
            `);
    $('#sectionList').append(sectionItem);

    // Initialize CKEditor
    ClassicEditor.create(document.querySelector(`#editor-${section.section_id}`))
      .then(editor => {
        editor.setData(section.content || '');
        sectionItem.find('.saveButton').click(() => {
          handleUpdateSection(section.section_id, editor.getData());
        });
      })
      .catch(error => {
        console.error('Error initializing CKEditor:', error);
      });
  });
};

// Update section
const handleUpdateSection = async (sectionId, content) => {
  try {
    const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/sections/${sectionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
    if (response.ok) {
      alert('Protocol section updated successfully.');
    } else {
      const errorData = await response.json();
      alert(`Failed to update section: ${errorData.message}`);
      console.error('Failed to update section');
    }
  } catch (error) {
    alert(`Error updating section: ${error.message}`);
    console.error('Error updating section:', error);
  }
};

// Render comments
const renderComments = () => {
  $('#commentsList').empty();
  comments.forEach(comment => {
    const commentItem = $(`
                <div class="comment">
                    <p>${comment.text}</p>
                </div>
            `);
    $('#commentsList').append(commentItem);
  });
};

// Add comment
$('#addComment').click(async function() {
  const newComment = $('#newComment').val();
  if (!newComment) return;

  try {
    const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text: newComment }),
    });
    if (response.ok) {
      const data = await response.json();
      comments.push(data);
      renderComments();
      $('#newComment').val(''); // Clear input
      alert('Comment added successfully.');
    } else {
      const errorData = await response.json();
      alert(`Failed to add comment: ${errorData.message}`);
      console.error('Failed to add comment');
    }
  } catch (error) {
    alert(`Error adding comment: ${error.message}`);
    console.error('Error adding comment:', error);
  }
});

// Render version history
const renderVersionHistory = () => {
  $('#versionHistoryList').empty();
  versionHistory.forEach(version => {
    const versionItem = $(`
                <li>
                    <button class="revertButton" data-version-id="${version.version_id}">
                        Version: ${version.version_id} - Date: ${new Date(version.version_date).toLocaleString()}
                    </button>
                </li>
            `);
    $('#versionHistoryList').append(versionItem);
  });
};

// Revert version
$('#versionHistoryList').on('click', '.revertButton', async function() {
  const versionId = $(this).data('version-id');
  try {
    const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/versions/${versionId}/revert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      protocol = data; // Update protocol with reverted data
      renderSections(); // Re-render sections
      alert(`Document version reverted to ${versionId}`);
    } else {
      const errorData = await response.json();
      alert(`Failed to revert to a version: ${errorData.message}`);
      console.error('Failed to revert to a version.');
    }
  } catch (error) {
    alert(`Error reverting to version: ${error.message}`);
    console.error('Error reverting to version', error);
  }
});

// Fetch data on page load
fetchProtocol();
fetchComments();
fetchVersionHistory();
});

//ProtocolReview.js 
const config = {
    apiBaseUrl: 'http://localhost:3306', // Your API base URL
};

$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const protocolId = urlParams.get('protocolId'); // Assuming protocolId is passed as a query parameter
    const token = localStorage.getItem('token');

    let reviews = [];
    let approvalHistory = [];
    let availableUsers = [];

    // Fetch users for reviewer selection
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/admin/users`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                availableUsers = await response.json();
                renderUsers();
            } else {
                const errorData = await response.json();
                alert(`Failed to fetch users: ${errorData.message}`);
                console.error('Failed to fetch users');
            }
        } catch (error) {
            alert(`Error fetching users: ${error.message}`);
            console.error('Error fetching users:', error);
        }
    };

    // Fetch reviews for the protocol
    const fetchReviews = async () => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/reviews`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                reviews = await response.json();
                renderReviews();
            } else {
                const errorData = await response.json();
                alert(`Failed to fetch reviews: ${errorData.message}`);
                console.error('Failed to fetch reviews');
            }
        } catch (error) {
            alert(`Error fetching reviews: ${error.message}`);
            console.error('Error fetching reviews:', error);
        }
    };

    // Fetch approval history
    const fetchApprovalHistory = async () => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/approvals`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                approvalHistory = await response.json();
                renderApprovalHistory();
            } else {
                const errorData = await response.json();
                alert(`Failed to fetch approval history: ${errorData.message}`);
                console.error('Failed to fetch approval history');
            }
        } catch (error) {
            alert(`Error fetching approval history: ${error.message}`);
            console.error('Error fetching approval history:', error);
        }
    };

    // Render users in the reviewer selection dropdown
    const renderUsers = () => {
        availableUsers.forEach(user => {
            $('#reviewerSelect').append(`<option value="${user.user_id}">${user.username}</option>`);
        });
    };

    // Render reviews
    const renderReviews = () => {
        $('#reviewList').empty();
        reviews.forEach(review => {
            const reviewItem = $(`
                <div class="reviewItem" data-id="${review.review_id}">
                    <h3>Review for ${review.section_name}</h3>
                    <p>Reviewer: ${availableUsers.find(user => user.user_id === review.reviewer_id)?.username || 'Unassigned'}</p>
                    ${review.comment ? `<p>Comment: ${review.comment}</p>` : ''}
                    <div class="commentAction">
                        <input type="text" class="commentInput" placeholder="Add comment" />
                        <button class="commentButton" data-review-id="${review.review_id}">Add Comment</button>
                    </div>
                </div>
            `);
            $('#reviewList').append(reviewItem);
        });
    };

    // Render approval history
    const renderApprovalHistory = () => {
        $('#approvalHistoryList').empty();
        approvalHistory.forEach(approval => {
            $('#approvalHistoryList').append(`<li>Approved on: ${new Date(approval.approval_date).toLocaleDateString()}</li>`);
        });
    };

    // Assign reviewer
    $('#assignReviewerBtn').click(async function () {
        const selectedSection = $('#sectionSelect').val();
        const selectedReviewer = $('#reviewerSelect').val();
        if (!selectedSection || !selectedReviewer) return;

        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    section_id: selectedSection,
                    reviewer_id: selectedReviewer,
                }),
            });
            if (response.ok) {
                const updatedReview = await response.json();
                alert('Reviewer assigned successfully');
                reviews.push(updatedReview);
                renderReviews();
                $('#sectionSelect').val('');
                $('#reviewerSelect').val('');
            } else {
                const errorData = await response.json();
                alert(`Failed to assign reviewer: ${errorData.message}`);
                console.error('Failed to assign reviewer');
            }
        } catch (error) {
            alert(`Error assigning reviewer: ${error.message}`);
            console.error('Error assigning reviewer:', error);
        }
    });

    // Add comment to a review
    $('#reviewList').on('click', '.commentButton', async function () {
        const reviewId = $(this).data('review-id');
        const commentInput = $(this).siblings('.commentInput');
        const newComment = commentInput.val();
        if (!newComment) return;

        try {
            const response = await fetch(`${config.apiBaseUrl}/reviews/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ comment: newComment }),
            });
            if (response.ok) {
                const updatedReview = await response.json();
                alert('Review comment added successfully');
                reviews = reviews.map(review => review.review_id === updatedReview.review_id ? updatedReview : review);
                renderReviews();
                commentInput.val(''); // Clear input
            } else {
                const errorData = await response.json();
                alert(`Failed to add review comment: ${errorData.message}`);
                console.error('Failed to add review comment');
            }
        } catch (error) {
            alert(`Error adding review comment: ${error.message}`);
            console.error('Error adding review comment:', error);
        }
    });

    // Approve protocol
    $('#approveBtn').click(async function () {
        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/approvals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const updatedApproval = await response.json();
                alert('Protocol Approved');
                approvalHistory.push(updatedApproval);
                renderApprovalHistory();
            } else {
                const errorData = await response.json();
                alert(`Failed to approve protocol: ${errorData.message}`);
                console.error('Failed to approve protocol');
            }
        } catch (error) {
            alert(`Error approving protocol: ${error.message}`);
            console.error('Error approving protocol:', error);
        }
    });

    // Initial data fetch
    fetchUsers();
    fetchReviews();
    fetchApprovalHistory();
});


//ProtocolVersion.js
const config = {
    apiBaseUrl: 'http://localhost:3006', // Your API base URL
};

$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const protocolId = urlParams.get('protocolId'); // Assuming protocolId is passed as a query parameter
    const token = localStorage.getItem('token');

    let versions = [];
    let selectedVersionId = null;

    // Fetch version history
    const fetchVersionHistory = async () => {
        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/versions`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                versions = await response.json();
                renderVersions();
            } else {
                const errorData = await response.json();
                alert(`Failed to fetch version history: ${errorData.message}`);
                console.error('Failed to fetch version history');
            }
        } catch (error) {
            alert(`Error fetching version history: ${error.message}`);
            console.error('Error fetching version history:', error);
        }
    };

    // Render versions
    const renderVersions = () => {
        $('#versionList ul').empty();
        versions.forEach(version => {
            const versionItem = $(`
                <li class="versionItem" data-id="${version.version_id}">
                    Version: ${version.version_id} - Date: ${new Date(version.version_date).toLocaleString()}
                    <button class="viewButton">View</button>
                    <button class="revertButton">Revert</button>
                </li>
            `);
            $('#versionList ul').append(versionItem);
        });
    };

    // Handle view version
    $('#versionList').on('click', '.viewButton', async function () {
        const versionId = $(this).closest('.versionItem').data('id');
        try {
            const response = await fetch(`${config.apiBaseUrl}/versions/${versionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                $('#selectedVersion').text(versionId);
                $('#content').text(data.content);
                $('#versionContent').show();
                selectedVersionId = versionId;
            } else {
                const errorData = await response.json();
                alert(`Failed to view version: ${errorData.message}`);
                console.error('Failed to view version');
            }
        } catch (error) {
            alert(`Error viewing version: ${error.message}`);
            console.error('Error viewing version:', error);
        }
    });

    // Handle revert version
    $('#versionList').on('click', '.revertButton', async function () {
        const versionId = $(this).closest('.versionItem').data('id');
        try {
            const response = await fetch(`${config.apiBaseUrl}/protocols/${protocolId}/versions/${versionId}/revert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                alert('Protocol version reverted successfully');
                fetchVersionHistory(); // Refresh version history
            } else {
                const errorData = await response.json();
                alert(`Failed to revert to version: ${errorData.message}`);
                console.error('Failed to revert to version');
            }
        } catch (error) {
            alert(`Error reverting to version: ${error.message}`);
            console.error('Error reverting to version:', error);
        }
    });

    // Initial data fetch
    if (protocolId) {
        fetchVersionHistory();
    } else {
        alert('Select a protocol to manage versions.');
    }
});
