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
