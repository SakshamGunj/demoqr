document.addEventListener('DOMContentLoaded', function() {
    const questionContainers = document.querySelectorAll('.question-container');
    const nextButtons = document.querySelectorAll('.next-button');
    const submitButton = document.querySelector('.submit-button');
    const progress = document.querySelector('.progress');
    const progressBar = document.querySelector('.progress-bar');
    const confirmationContainer = document.querySelector('.confirmation-container');
    const confirmationMessage = document.querySelector('#confirmation-message');
    const couponCodeDisplay = document.querySelector('#coupon-code');

    let currentQuestionIndex = 0;
    const numQuestions = questionContainers.length;

    function updateProgressBar() {
        const progressPercentage = ((currentQuestionIndex + 1) / numQuestions) * 100;
        progress.style.width = `${progressPercentage}%`;
        progressBar.style.setProperty('--progress-percentage', `${progressPercentage}%`);
    }

    function generateCouponCode() {
        const prefix = "TASTY";
        const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
        return `${prefix}-${randomNum}`;
    }

    updateProgressBar();

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            const nextQuestionId = button.dataset.next;
            const nextQuestionContainer = document.getElementById(nextQuestionId);

            questionContainers[currentQuestionIndex].classList.remove('active');
            nextQuestionContainer.classList.add('active');
            currentQuestionIndex++;
            updateProgressBar();
        });
    });

    submitButton.addEventListener('click', async () => {
        // Collect form data
        const name = document.getElementById('customerName').value;
        const birthday = document.getElementById('birthday').value;
        const whatsapp = document.getElementById('whatsapp').value;
        const gmail = document.getElementById('gmail').value;

        // Generate coupon code
        const couponCode = generateCouponCode();

        // Prepare data for WhatsApp endpoint
        const formData = new FormData();
        formData.append('phone', whatsapp);
        formData.append('message1', name);          // Variable 1: Name
        formData.append('message2', couponCode);    // Variable 2: Coupon Code
        formData.append('message3', 'Enjoy your 5% discount at Tasty Bites Restro!');

        try {
            // Send to WhatsApp endpoint
            const response = await fetch('http://localhost:8000/api/send-whatsapp', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();
            console.log('WhatsApp message sent:', result);

            // Update UI
            questionContainers.forEach(container => {
                container.style.display = 'none';
            });
            progressBar.style.width = '100%';
            updateProgressBar();
            confirmationContainer.style.display = 'block';
            confirmationMessage.textContent = `Thanks for filling out the form! You got your coupon on your WhatsApp number (${whatsapp}).`;
            couponCodeDisplay.textContent = couponCode;

        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            // Show fallback message
            questionContainers.forEach(container => {
                container.style.display = 'none';
            });
            progressBar.style.width = '100%';
            updateProgressBar();
            confirmationContainer.style.display = 'block';
            confirmationMessage.textContent = `Thanks for filling out the form! There was an issue sending the coupon to your WhatsApp number (${whatsapp}). Please use this code instead.`;
            couponCodeDisplay.textContent = couponCode;
        }
    });
});