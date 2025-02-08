const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3306'; // Fetch API base URL from environment variables

document.getElementById('loginButton').addEventListener('click', async (event) => {
    event.preventDefault(); 

    const usernameEmail = document.getElementById('usernameEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messagesDiv = document.getElementById('login-messages');

    try {
        const response = await fetch(`${apiBaseUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usernameEmail, password })
        });

        if (!response.ok) {
            const errorMessage = await response.text(); 
            messagesDiv.innerHTML = `<div class="error">${errorMessage}</div>`; 
            return;
        }

        const data = await response.json();
        localStorage.setItem('token', data.token); 
        window.location.href = '/dashboard.html'; 

    } catch (error) {
        console.error('Error during login:', error);
        messagesDiv.innerHTML = `<div class="error">An error occurred during login. Please try again later.</div>`;
    }
});

document.getElementById('forgotPassword').addEventListener('click', async (event) => {
    event.preventDefault(); 

    const usernameEmail = document.getElementById('usernameEmail').value;
    const messagesDiv = document.getElementById('login-messages');

    try {
        const response = await fetch(`${apiBaseUrl}/reset-password-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: usernameEmail })
        });

        if (!response.ok) {
            const errorMessage = await response.text(); 
            messagesDiv.innerHTML = `<div class="error">${errorMessage}</div>`; 
            return;
        }

        messagesDiv.innerHTML = `<div class="success">Password reset email sent successfully. Please check your inbox.</div>`;

    } catch (error) {
        console.error('Error while reset password:', error);
        messagesDiv.innerHTML = `<div class="error">Unable to send password reset email. Please try again later.</div>`;
    }
});
