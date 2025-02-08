const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3306'; // Assuming backend API for sending emails

document.getElementById('contactForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('contactName').value;
  const email = document.getElementById('contactEmail').value;
  const message = document.getElementById('contactMessage').value;

  try {
    const response = await fetch(`${apiBaseUrl}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, message })
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error('Error sending email:', errorMessage);
      alert('An error occurred while sending your message. Please try again later.');
      return;
    }

    alert('Thanks for contacting us! We will be in touch shortly.');
    // Clear the form after successful submission
    document.getElementById('contactForm').reset();

  } catch (error) {
    console.error('Error sending email:', error);
    alert('An error occurred while sending your message. Please try again later.');
  }
});
