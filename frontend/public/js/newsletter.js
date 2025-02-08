const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3306'; 

const newsletterButton = document.getElementById('newsletterButton');
const newsletterEmailInput = document.getElementById('newsletterEmail');
const newsletterMessages = document.getElementById('newsletter-messages');

newsletterButton.addEventListener('click', async () => {
  const email = newsletterEmailInput.value;

  if (!isValidEmail(email)) {
    newsletterMessages.innerHTML = '<div class="error">Please enter a valid email address.</div>';
    return;
  }

  newsletterMessages.innerHTML = '<div class="loading">Subscribing...</div>';

  try {
    const response = await fetch(`${apiBaseUrl}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      newsletterMessages.innerHTML = `<div class="error">${errorMessage}</div>`;
      return;
    }

    newsletterMessages.innerHTML = '<div class="success">Subscription Successful!</div>';

  } catch (error) {
    console.error('Error during newsletter subscription:', error);
    newsletterMessages.innerHTML = `<div class="error">Error during subscription. Please try again later.</div>`;
  }
});

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
  return emailRegex.test(email);
};
