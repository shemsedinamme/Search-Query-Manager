const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3306'; 

document.getElementById('registrationForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const subscriptionOption = document.getElementById('subscriptionOption').value;
    const studentIDInput = document.getElementById('studentID');
    let studentID = null;

    if (subscriptionOption === 'Student' && studentIDInput) {
        const studentIDFile = studentIDInput.files[0]; 

        if (studentIDFile) {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('subscriptionOption', subscriptionOption);
            formData.append('studentID', studentIDFile); 

            try {
                const response = await fetch(`${apiBaseUrl}/register`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorMessage = await response.text();
                    messagesDiv.innerHTML = `<div class="error">${errorMessage}</div>`; 
                    return;
                }

                const data = await response.json(); 
                messagesDiv.innerHTML = `<div class="success">Thank you for creating an account! Your registration is successful.</div>`; 
                window.location.href = '/login.html'; 

            } catch (error) {
                console.error('Error during registration:', error);
                messagesDiv.innerHTML = `<div class="error">Error during registration, please verify your inputs, and try again.</div>`;
            }
        } else {
            messagesDiv.innerHTML = `<div class="error">Please select a student ID file.</div>`;
        }
    } else {
        try {
            const response = await fetch(`${apiBaseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    username, 
                    email, 
                    password, 
                    subscriptionOption 
                }) 
            });

            if (!response.ok) {
                const errorMessage = await response.text(); 
                messagesDiv.innerHTML = `<div class="error">${errorMessage}</div>`; 
                return;
            }

            const data = await response.json(); 
            messagesDiv.innerHTML = `<div class="success">Thank you for creating an account! Your registration is successful.</div>`; 
            window.location.href = '/login.html'; 

        } catch (error) {
            console.error('Error during registration:', error);
            messagesDiv.innerHTML = `<div class="error">Error during registration, please verify your inputs, and try again.</div>`;
        }
    }
});

document.getElementById('subscriptionOption').addEventListener('change', () => {
    const studentIDField = document.getElementById('studentIDField');
    studentIDField.style.display = 
        document.getElementById('subscriptionOption').value === 'Student' ? 'block' : 'none';
});
