document.addEventListener('DOMContentLoaded', function() {
    const questionContainers = document.querySelectorAll('.question-container');
    const nextButtons = document.querySelectorAll('.next-button');
    const submitButton = document.querySelector('.submit-button');
    const progress = document.querySelector('.progress');
    const progressBar = document.querySelector('.progress-bar'); // Get progress bar element
    let currentQuestionIndex = 0;
    const numQuestions = questionContainers.length;

    function updateProgressBar() {
        const progressPercentage = ((currentQuestionIndex + 1) / numQuestions) * 100;
        progress.style.width = `${progressPercentage}%`;

        // Set CSS variable for dot position
        progressBar.style.setProperty('--progress-percentage', `${progressPercentage}%`);
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

    submitButton.addEventListener('click', () => {
        alert('Form submitted! Thank you for your feedback.');
    });
});