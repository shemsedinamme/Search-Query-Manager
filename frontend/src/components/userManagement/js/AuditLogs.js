$(document).ready(function () {
    const apiBaseUrl = 'http://localhost:80'; // Set your API URL
    const token = localStorage.getItem('token');

    function fetchAuditLogs() {
        $.ajax({
            url: `${apiBaseUrl}/admin/audit-logs`,
            type: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            success: function (data) {
                renderAuditLogs(data);
            },
            error: function (xhr) {
                console.error('Error fetching audit logs:', xhr.responseText);
                alert(`Failed to fetch audit logs: ${xhr.responseText}`);
            }
        });
    }

    function renderAuditLogs(logs) {
        let logHTML = '';
        logs.forEach(log => {
            logHTML += `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td>${log.user}</td>
                    <td>${log.action}</td>
                    <td>${log.details}</td>
                </tr>
            `;
        });
        $('#submenuItems').html(`
            <h1>Audit Logs</h1>
            <table>
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>${logHTML}</tbody>
            </table>
        `);
    }

    fetchAuditLogs();
});
