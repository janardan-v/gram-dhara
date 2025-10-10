document.addEventListener('DOMContentLoaded', function () {
    const resetFormContainer = document.getElementById('reset-form-container');
    const successContainer = document.getElementById('success-container');
    const submitButton = document.getElementById('submit-reset');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const errorMessage = document.getElementById('error-message');
    const passwordMatchText = document.getElementById('password-match');
    const passwordStrengthBar = document.getElementById('password-strength-bar');
    const passwordStrengthText = document.getElementById('password-strength-text');
    const togglePasswordBtn = document.getElementById('toggle-password');

    // Password requirements elements
    const reqLength = document.getElementById('req-length');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqLowercase = document.getElementById('req-lowercase');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');

    // Toggle password visibility
    togglePasswordBtn.addEventListener('click', function () {
        if (newPasswordInput.type === 'password') {
            newPasswordInput.type = 'text';
            togglePasswordBtn.querySelector('span').textContent = 'visibility_off';
        } else {
            newPasswordInput.type = 'password';
            togglePasswordBtn.querySelector('span').textContent = 'visibility';
        }
    });

    // Password strength checker
    newPasswordInput.addEventListener('input', function () {
        const password = newPasswordInput.value;
        updatePasswordRequirements(password);
        updatePasswordStrength(password);
        checkPasswordMatch();
    });

    confirmPasswordInput.addEventListener('input', checkPasswordMatch);

    function updatePasswordRequirements(password) {
        // Check length
        if (password.length >= 8) {
            updateRequirement(reqLength, true);
        } else {
            updateRequirement(reqLength, false);
        }

        // Check uppercase
        if (/[A-Z]/.test(password)) {
            updateRequirement(reqUppercase, true);
        } else {
            updateRequirement(reqUppercase, false);
        }

        // Check lowercase
        if (/[a-z]/.test(password)) {
            updateRequirement(reqLowercase, true);
        } else {
            updateRequirement(reqLowercase, false);
        }

        // Check number
        if (/[0-9]/.test(password)) {
            updateRequirement(reqNumber, true);
        } else {
            updateRequirement(reqNumber, false);
        }

        // Check special character
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            updateRequirement(reqSpecial, true);
        } else {
            updateRequirement(reqSpecial, false);
        }
    }

    function updateRequirement(element, isMet) {
        if (isMet) {
            element.classList.add('met');
            element.querySelector('span').textContent = 'check';
            element.querySelector('span').classList.add('text-green-500');
        } else {
            element.classList.remove('met');
            element.querySelector('span').textContent = 'close';
            element.querySelector('span').classList.remove('text-green-500');
        }
    }

    function updatePasswordStrength(password) {
        // Simple password strength calculation
        let strength = 0;

        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;

        // Update the strength bar
        passwordStrengthBar.className = 'password-strength';

        if (strength <= 2) {
            passwordStrengthBar.classList.add('password-strength-weak');
            passwordStrengthText.textContent = 'Weak password';
            passwordStrengthText.className = 'text-xs mt-1 text-red-500';
        } else if (strength <= 3) {
            passwordStrengthBar.classList.add('password-strength-medium');
            passwordStrengthText.textContent = 'Medium password';
            passwordStrengthText.className = 'text-xs mt-1 text-orange-500';
        } else {
            passwordStrengthBar.classList.add('password-strength-strong');
            passwordStrengthText.textContent = 'Strong password';
            passwordStrengthText.className = 'text-xs mt-1 text-green-500';
        }
    }

    function checkPasswordMatch() {
        if (confirmPasswordInput.value === '') {
            passwordMatchText.classList.add('hidden');
            return;
        }

        if (newPasswordInput.value === confirmPasswordInput.value) {
            passwordMatchText.textContent = 'Passwords match';
            passwordMatchText.classList.remove('hidden', 'text-red-500');
            passwordMatchText.classList.add('text-green-500');
            confirmPasswordInput.classList.remove('border-red-500');
        } else {
            passwordMatchText.textContent = 'Passwords do not match';
            passwordMatchText.classList.remove('hidden', 'text-green-500');
            passwordMatchText.classList.add('text-red-500');
            confirmPasswordInput.classList.add('border-red-500');
        }
    }

    // Handle form submission
    submitButton.addEventListener('click', async function () {
        // Clear any previous error messages
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';

        const password = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validate password
        if (!validatePassword(password)) {
            errorMessage.textContent = 'Please meet all password requirements.';
            errorMessage.classList.remove('hidden');
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match.';
            errorMessage.classList.remove('hidden');
            return;
        }

        // Show a loading state
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Resetting...';

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            if (!token) {
                throw new Error('No reset token found in the URL.');
            }

            // 4. Prepare the data payload for the API
            const data = {
                newPassword: password
            };

            console.log('Sending reset password request with token:', token, 'and data:', data);
            
            console.log("Calling resetPassword API...");
            // 5. Call the API using your apiClient
            const response = await window.authAPI.resetPassword(token, data);
            if (!response || !response.success) {
                throw new Error(response.message || 'Failed to reset password');
            }

            console.log('Reset Password Response:', response);
            console.log("Reset password successful.");

            // 6. If successful, hide the form and show the success message
            resetFormContainer.classList.add('hidden');
            successContainer.classList.remove('hidden');

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 5000);

        } catch (error) {
            console.error('Reset Password Error:', error);
            errorMessage.textContent = 'This reset link is invalid or has expired. Please request a new one.';
            errorMessage.classList.remove('hidden');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    function validatePassword(password) {
        const minLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    }
});
