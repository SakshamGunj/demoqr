// Detect which page is loaded (wheel page or form page)
const isWheelPage = document.getElementById('wheelCanvas') !== null;
const isFormPage = document.getElementById('step1') !== null;

// Wheel Page Functionality (index.html)
if (isWheelPage) {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const spinButton = document.getElementById('spinButton');
    const prizeModal = document.getElementById('prizeModal');
    const prizeText = document.getElementById('prizeText');
    const claimRewardButton = document.getElementById('claimReward');
    const spinAgainButton = document.getElementById('spinAgain');

    const colors = ['#5e17eb', '#9d6cff']; // Deep purple and light purple
    const slices = 6;
    const offers = ['20% Off', '30% Off', 'Free Drink', '50% Off', 'Buy 1 Get 1', '10% Off'];
    let currentAngle = 0;
    let isSpinning = false;
    let wonPrize = '';

    function drawWheel() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2;
        const fontSize = 16;

        for (let i = 0; i < slices; i++) {
            const startAngle = (i * 2 * Math.PI) / slices + currentAngle;
            const endAngle = ((i + 1) * 2 * Math.PI) / slices + currentAngle;

            // Alternate between the two colors
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.fillStyle = colors[i % 2]; // Alternate colors
            ctx.fill();
            ctx.closePath();

            // Draw offer text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + (Math.PI / slices));
            ctx.fillStyle = 'white';
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'right';
            ctx.fillText(offers[i], radius - 20, 5);
            ctx.restore();
        }
    }

    function spinWheel() {
        if (isSpinning) return;

        isSpinning = true;
        const randomDegrees = Math.floor(Math.random() * 360) + 720; // Minimum 2 full rotations
        const spinDuration = 5000; // 5 seconds
        const startTime = performance.now();

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            // Easing function for smooth stop
            const easedProgress = 1 - Math.pow(1 - progress, 4);
            currentAngle = (randomDegrees * easedProgress) * Math.PI / 180;

            drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                isSpinning = false;
                // Determine winning offer based on final position
                const winningSlice = Math.floor((360 - (currentAngle * 180 / Math.PI) % 360) / (360 / slices)) % slices;
                wonPrize = offers[winningSlice];
                
                // Show modal with the prize
                prizeText.textContent = `You won: ${wonPrize}`;
                prizeModal.style.display = 'block';
            }
        }

        requestAnimationFrame(animate);
    }

    spinButton.addEventListener('click', spinWheel);

    // Modal button functionality
    claimRewardButton.addEventListener('click', () => {
        prizeModal.style.display = 'none';
        // Redirect to form page with the won prize as a query parameter
        window.location.href = `http://localhost:8000/form`;
    });
   

    spinAgainButton.addEventListener('click', () => {
        prizeModal.style.display = 'none';
        // Reset and allow spinning again (you might want to add spin limit logic here)
        isSpinning = false;
    });

    drawWheel(); // Initial draw
}

// Form Page Functionality (form.html)
if (isFormPage) {
    console.log('Form Page');
    let currentStep = 1;

    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const nextStep1 = document.getElementById('nextStep11');
    const nextStep2 = document.getElementById('nextStep2');
    const submitForm = document.getElementById('submitForm');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmationText = document.getElementById('confirmationText');
    const okButton = document.getElementById('okButton');

    // Get the prize from the URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    let wonPrize = decodeURIComponent(urlParams.get('prize') || '20% Off'); // Default to '20% Off' if no prize

    nextStep1.addEventListener('click', () => {
        console.log('Next Step 1');
        const name = document.getElementById('name').value;
        if (name.trim() === '') {
            alert('Please enter your name.');
            return;
        }
        step1.style.display = 'none';
        step2.style.display = 'block';
        currentStep = 2;
    });

    nextStep2.addEventListener('click', () => {
        const phone = document.getElementById('phone').value;
        if (!phone.match(/[0-9]{10}/)) {
            alert('Please enter a valid 10-digit phone number.');
            return;
        }
        step2.style.display = 'none';
        step3.style.display = 'block';
        currentStep = 3;
    });

    submitForm.addEventListener('click', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;

        if (!email.match(/^\S+@\S+\.\S+$/)) {
            alert('Please enter a valid email address.');
            return;
        }

        // Simulate sending data to a server or processing (for demo, just show confirmation)
        const couponCode = `REST${Math.floor(Math.random() * 10000)}`; // Generate a random coupon code
        confirmationText.textContent = `Congratulations, ${name}! You've claimed your prize: ${wonPrize}. Your coupon code is: ${couponCode}. We'll send it to your phone (${phone}) and email (${email}). Visit Tasty Bites Restaurant to redeem your prize!`;
        step3.style.display = 'none';
        confirmationModal.style.display = 'block';
    });

    // Confirmation modal OK button
    okButton.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
        // Reset the form and return to Step 1
        document.getElementById('rewardForm').reset();
        currentStep = 1;
        step1.style.display = 'block';
        step2.style.display = 'none';
        step3.style.display = 'none';
    });
}