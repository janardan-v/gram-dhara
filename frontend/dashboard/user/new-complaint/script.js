document.addEventListener('DOMContentLoaded', function () {
    // Initialize date display
    const currentDateEl = document.getElementById('display-date');

    if (currentDateEl) {
        const now = new Date();

        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        currentDateEl.innerHTML = `${now.toLocaleDateString('en-IN', options)}`;
    }

    // Notification button
    const notificationButton = document.getElementById('notification-link');

    if (notificationButton) {
        notificationButton.addEventListener('click', () => {
            window.location.href = '../notifications/notifications.html';
        });
    }

    async function updateHeaderUI(user) {
        try {
            // Check if authAPI is available
            if (!window.authAPI) {
                console.error("Authentication API is not available.");
                return;
            }

            const response = await window.authAPI.getCurrentUser();
            if (response && response.success && response.data) {
                const user = response.data;
                if (userNameEl) {
                    userNameEl.textContent = user.name || 'User';
                }
                if (userRoleEl) {
                    // Capitalize the first letter of the role
                    const role = user.role || 'User';
                    userRoleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
                }
            } else {
                console.error("Failed to fetch user data:", response.message);
                // Fallback to default values if API call fails
                if (userNameEl) userNameEl.textContent = 'User';
                if (userRoleEl) userRoleEl.textContent = 'Village Member';
            }
        } catch (error) {
            console.error("Error fetching user information:", error);
        }
    }

    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    updateHeaderUI(JSON.parse(localStorage.getItem('user')) || {});

    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function () {
            sidebar.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        });
    }

    // DOM elements
    const photoInput = document.getElementById('photo-input');
    const descriptionInput = document.getElementById('description-input');
    const uploadArea = document.getElementById('upload-area');
    const previewImage = document.getElementById('preview-image');
    const uploadedImageDiv = document.getElementById('uploaded-image');
    const removeImageBtn = document.getElementById('remove-image');
    const submitBtn = document.getElementById('submit-complaint');
    const locationAddress = document.getElementById('location-address');
    const locationLat = document.getElementById('location-lat');
    const locationLng = document.getElementById('location-lng');

    // Audio elements
    const recordBtn = document.getElementById('record-btn');
    const stopBtn = document.getElementById('stop-btn');
    const audioInput = document.getElementById('audio-input');
    const audioPlayback = document.getElementById('audio-playback');
    const recordingStatus = document.getElementById('recording-status');
    const removeAudioBtn = document.getElementById('remove-audio-btn');
    const uploadAudioOption = document.getElementById('file-upload-option');

    // State variables
    let currentLocation = { lat: null, lng: null };
    let selectedCategory = null;
    let currentStep = 1;
    let map;
    let marker;
    let mediaRecorder;
    let audioChunks = [];
    let recordedAudioFile = null;

    // Initialize multi-step form
    initializeStepButtons();
    attachCategoryListeners();

    // Photo upload functionality
    if (uploadArea && photoInput) {
        uploadArea.addEventListener('click', () => {
            photoInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });

        photoInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }

    // Remove image functionality
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetImageUpload();
        });
    }

    // Initialize map when reaching step 3
    document.getElementById('next-2').addEventListener('click', () => {
        setTimeout(() => {
            initializeMap();
        }, 100);
    });

    // Description input character count
    if (descriptionInput) {
        descriptionInput.addEventListener('input', (e) => {
            updateCharCount(e.target.value.length);
            checkStep2Completion();
        });
    }

    // Audio recording functionality
    if (recordBtn) {
        recordBtn.addEventListener('click', startRecording);
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', stopRecording);
    }

    if (removeAudioBtn) {
        removeAudioBtn.addEventListener('click', removeAudio);
    }

    if (audioInput) {
        audioInput.addEventListener('change', handleAudioFileUpload);
    }

    if (uploadAudioOption) {
        uploadAudioOption.addEventListener('click', () => {
            audioInput.click();
        });
    }

    // Location detection
    const detectBtn = document.getElementById('detect-location');
    if (detectBtn) {
        detectBtn.addEventListener('click', getCurrentLocation);
    }

    // Success overlay buttons
    document.getElementById('track-complaint-btn').addEventListener('click', () => {
        window.location.href = "../my-reports/my-reports.html";
    });

    document.getElementById('new-complaint-btn').addEventListener('click', () => {
        window.location.reload();
    });

    document.getElementById('back-dashboard-btn').addEventListener('click', () => {
        window.location.href = "/dashboard/user/user-dashboard.html";
    });

    document.getElementById('close-success').addEventListener('click', () => {
        hideSuccessOverlay();
    });

    // Helper functions
    function initializeStepButtons() {
        // Next buttons
        document.querySelectorAll('.btn-next').forEach(btn => {
            btn.addEventListener('click', () => {
                if (currentStep < 4) {
                    currentStep++;
                    showStep(currentStep);

                    // Update progress indicators
                    updateProgressIndicators(currentStep);

                    // Update review section when reaching final step
                    if (currentStep === 4) {
                        updateReviewSection();
                    }
                }
            });
        });

        // Previous buttons
        document.querySelectorAll('.btn-prev').forEach(btn => {
            btn.addEventListener('click', () => {
                if (currentStep > 1) {
                    currentStep--;
                    showStep(currentStep);
                    updateProgressIndicators(currentStep);
                }
            });
        });
    }

    function showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });

        // Show the current step
        document.getElementById(`step-${stepNumber}`).classList.add('active');
    }

    function updateProgressIndicators(currentStep) {
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNum = index + 1;

            if (stepNum < currentStep) {
                // Completed steps
                step.classList.add('completed');
                step.classList.remove('active');
                step.querySelector('.step-number').style.display = 'none';
                step.querySelector('.step-check').style.display = 'block';
            }
            else if (stepNum === currentStep) {
                // Current step
                step.classList.add('active');
                step.classList.remove('completed');
                step.querySelector('.step-number').style.display = 'block';
                step.querySelector('.step-check').style.display = 'none';
            }
            else {
                // Future steps
                step.classList.remove('active', 'completed');
                step.querySelector('.step-number').style.display = 'block';
                step.querySelector('.step-check').style.display = 'none';
            }
        });
    }

    function handleFileUpload(file) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP).');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB.');
            return;
        }

        // Create file reader and display preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            uploadedImageDiv.style.display = 'block';
            const uploadContent = uploadArea.querySelector('.upload-content');
            if (uploadContent) {
                uploadContent.style.display = 'none';
            }

            // Enable next button
            document.getElementById('next-1').disabled = false;
        };

        reader.onerror = () => {
            alert('Error reading the file. Please try again.');
        };

        reader.readAsDataURL(file);
    }

    function resetImageUpload() {
        if (photoInput) photoInput.value = '';
        if (uploadedImageDiv) uploadedImageDiv.style.display = 'none';
        const uploadContent = uploadArea?.querySelector('.upload-content');
        if (uploadContent) {
            uploadContent.style.display = 'block';
        }

        // Disable next button
        document.getElementById('next-1').disabled = true;
    }

    function updateCharCount(count) {
        const charCountElement = document.getElementById('char-count');
        if (charCountElement) {
            charCountElement.textContent = count;
        }

        // Limit to 500 characters
        if (count > 500 && descriptionInput) {
            descriptionInput.value = descriptionInput.value.substring(0, 500);
            updateCharCount(500);
        }
    }

    function capitalizeWords(text) {
        if (!text) return '';
        return text.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Load categories from backend
    async function loadCategories() {
        try {
            console.log('Loading categories from backend...');
            const response = await window.categoriesAPI.getAll();

            if (response && response.success && response.data) {
                availableCategories = Array.isArray(response.data) ? response.data : [response.data];
                console.log('Categories loaded:', availableCategories);

                // Update category tiles with real data
                updateCategoryTiles();
            } else {
                console.warn('No categories received from backend, using default categories');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            console.warn('Using default categories due to API error');
        }
    }

    function updateCategoryTiles() {
        const categoryGrid = document.querySelector('.category-grid');
        if (!categoryGrid) return;

        // Clear existing tiles
        categoryGrid.innerHTML = '';

        // Create tiles for each category
        availableCategories.forEach(category => {
            const formattedTitle = capitalizeWords(category.name);
            const iconClass = getCategoryIcon(category.name);
            const categoryId = category.categoryId.toLowerCase().replace(/\s+/g, '-');

            const tile = document.createElement('div');
            tile.className = 'category-tile';
            tile.dataset.category = categoryId;

            tile.innerHTML = `
                        <i class="${iconClass}"></i>
                        <span>${formattedTitle}</span>
                    `;

            tile.addEventListener('click', () => {
                console.log(`Category selected: ${formattedTitle}`);
                document.querySelectorAll('.category-tile').forEach(t => t.classList.remove('selected'));
                tile.classList.add('selected');
            });

            categoryGrid.appendChild(tile);
        });

        // Re-attach event listeners
        attachCategoryListeners();
    }


    function getCategoryIcon(categoryName) {
        const iconMap = {
            'water supply': 'bi-water',
            'water quality': 'bi-droplet-half',
            'water leakage': 'bi-moisture',
            'pump issue': 'bi-activity',
            'billing issue': 'bi-receipt',
            'other': 'bi-three-dots',
            'meter reading': 'bi-speedometer2',
            'new connection': 'bi-plug'
        };

        const key = categoryName.toLowerCase();
        return iconMap[key] || 'bi-exclamation-circle';
    }

    loadCategories();

    function attachCategoryListeners() {
        document.querySelectorAll('.category-tile').forEach(tile => {
            tile.addEventListener('click', () => {
                // Remove previous selection
                document.querySelectorAll('.category-tile').forEach(t => t.classList.remove('selected'));

                // Add selection to clicked tile
                tile.classList.add('selected');
                selectedCategory = tile.dataset.category;

                // Check if description is also filled to enable next button
                checkStep2Completion();
            });
        });
    }

    function checkStep2Completion() {
        const nextBtn = document.getElementById('next-2');
        if (nextBtn) {
            const hasCategory = selectedCategory !== null;
            const hasDescription = descriptionInput && descriptionInput.value.trim().length > 0;
            nextBtn.disabled = !(hasCategory && hasDescription);
        }
    }

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                recordedAudioFile = new File([audioBlob], 'voice-recording.webm', { type: 'audio/webm' });
                audioPlayback.src = URL.createObjectURL(audioBlob);
                audioPlayback.style.display = 'block';
                recordingStatus.textContent = "Recording saved.";
                audioInput.disabled = true;
                removeAudioBtn.style.display = 'inline-block';
            };

            mediaRecorder.start();
            recordBtn.disabled = true;
            stopBtn.disabled = false;
            audioInput.disabled = true;
            recordingStatus.textContent = "Recording in progress...";
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access your microphone. Please check permissions.');
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            recordBtn.disabled = false;
            stopBtn.disabled = true;
        }
    }

    function handleAudioFileUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('audio/')) {
            recordedAudioFile = file;
            audioPlayback.src = URL.createObjectURL(file);
            audioPlayback.style.display = 'block';
            recordBtn.disabled = true;
            recordingStatus.textContent = `File selected: ${file.name}`;
            removeAudioBtn.style.display = 'inline-block';
        } else if (file) {
            alert('Please select a valid audio file.');
            audioInput.value = null;
        }
    }

    function removeAudio() {
        recordedAudioFile = null;
        audioPlayback.src = '';
        audioPlayback.style.display = 'none';
        audioInput.value = null;
        recordBtn.disabled = false;
        audioInput.disabled = false;
        recordingStatus.textContent = "Click record to start";
        removeAudioBtn.style.display = 'none';
    }

    function initializeMap() {
        const mapContainer = document.getElementById('location-map');
        if (!mapContainer || map) return; // Skip if already initialized

        // Create map
        map = L.map('location-map').setView([20.5937, 78.9629], 5); // Default to India center

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add click handler to map
        map.on('click', (e) => {
            updateMapAndFormState(e.latlng.lat, e.latlng.lng, map.getZoom());
        });

        // Add address search functionality
        const addressInput = document.getElementById('address-input');
        if (addressInput) {
            addressInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchLocation(addressInput.value);
                }
            });
        }
    }

    function searchLocation(query) {
        if (!query) return;

        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then((data) => {
                if (data && data.length > 0) {
                    const { lat, lon } = data[0];
                    updateMapAndFormState(parseFloat(lat), parseFloat(lon), 16);
                } else {
                    alert('Location not found.');
                }
            })
            .catch(() => {
                alert('Error searching location. Please try again.');
            });
    }

    function getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    updateMapAndFormState(position.coords.latitude, position.coords.longitude, 16);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    alert('Unable to get your location. Please check your browser permissions.');
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }

    function updateMapAndFormState(lat, lng, zoomLevel) {
        // Update the map and marker
        map.setView([lat, lng], zoomLevel);

        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            marker.on('dragend', (e) => {
                const newPos = e.target.getLatLng();
                updateMapAndFormState(newPos.lat, newPos.lng, map.getZoom());
            });
        }

        // Update location state
        currentLocation.lat = lat;
        currentLocation.lng = lng;

        // Fetch and display address
        fetchAddress(lat, lng);
    }

    function fetchAddress(lat, lng) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`)
            .then(res => res.json())
            .then(data => {
                const address = data.display_name || 'Address not found';

                // Update address in input field
                document.getElementById('address-input').value = address;

                // Update the location display
                document.getElementById('location-address').textContent = address;
                document.getElementById('location-lat').textContent = lat.toFixed(6);
                document.getElementById('location-lng').textContent = lng.toFixed(6);
                document.getElementById('selected-location').style.display = 'block';

                // Enable the Next button
                document.getElementById('next-3').disabled = false;
            })
            .catch(() => {
                document.getElementById('location-address').textContent = 'Could not fetch address';
                document.getElementById('location-lat').textContent = lat.toFixed(6);
                document.getElementById('location-lng').textContent = lng.toFixed(6);
                document.getElementById('selected-location').style.display = 'block';
                document.getElementById('next-3').disabled = false;
            });
    }

    function updateReviewSection() {
        // Update photo preview
        const reviewPhoto = document.getElementById('review-photo');
        if (reviewPhoto && previewImage.src) {
            reviewPhoto.innerHTML = `<img src="${previewImage.src}" alt="Review photo">`;
        }

        // Update category
        const reviewCategory = document.getElementById('review-category');
        if (reviewCategory && selectedCategory) {
            const categoryTile = document.querySelector(`.category-tile[data-category="${selectedCategory}"]`);
            if (categoryTile) {
                reviewCategory.textContent = categoryTile.querySelector('span').textContent;
            }
        }

        // Update description
        const reviewDescription = document.getElementById('review-description');
        if (reviewDescription && descriptionInput.value.trim()) {
            reviewDescription.textContent = descriptionInput.value.trim();
        }

        // Update audio
        const reviewAudioContainer = document.getElementById('review-audio-container');
        const reviewAudioPlayback = document.getElementById('review-audio-playback');
        const noAudioText = document.getElementById('no-audio-text');

        if (recordedAudioFile) {
            reviewAudioContainer.style.display = 'block';
            noAudioText.style.display = 'none';
            reviewAudioPlayback.src = audioPlayback.src;
        } else {
            reviewAudioContainer.style.display = 'none';
            noAudioText.style.display = 'block';
        }

        // Update location
        document.getElementById('review-address').textContent = document.getElementById('location-address').textContent;
        document.getElementById('review-coords').textContent =
            `${document.getElementById('location-lat').textContent}, ${document.getElementById('location-lng').textContent}`;

        if (submitBtn) {
            submitBtn.addEventListener('click', async (e) => {
                // 1. Prevent the default button action immediately. This stops the initial refresh.
                e.preventDefault();

                if (!validateComplaint()) {
                    return; // Stop if form validation fails
                }

                // Re-check authentication before making a network request
                if (!localStorage.getItem('token')) {
                    alert('Your session has expired. Please log in again.');
                    window.location.href = '../../../login/login.html';
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';

                let complaintId;

                try {
                    // Prepare form data for submission
                    const formData = new FormData();
                    const photoFile = photoInput.files[0];

                    if (!photoFile) throw new Error('Photo file is missing');

                    // Simplified category mapping from your original code
                    let categoryIdToSubmit = selectedCategory;
                    if (selectedCategory === 'roads') {
                        categoryIdToSubmit = '0e6e0a5b-258b-4eec-8817-564fbb1f0009';
                    }

                    formData.append('title', generateTitle());
                    formData.append('description', descriptionInput.value.trim());
                    formData.append('categoryId', categoryIdToSubmit);
                    formData.append('locationLat', currentLocation.lat);
                    formData.append('locationLng', currentLocation.lng);
                    formData.append('photo', photoFile);

                    if (recordedAudioFile) {
                        // The name 'voiceRecording' must match what your backend expects
                        formData.append('voiceRecording', recordedAudioFile);
                    }

                    // Make the API call
                    const response = await window.reportsAPI.submit(formData);
                    complaintId = response?.data?.reportId || generateComplaintId();

                } catch (error) {
                    console.error('SUBMISSION ERROR:', error);

                    // Handle authentication errors by redirecting and stopping execution
                    if (error.message.includes('Authentication failed') || error.message.includes('Unauthorized')) {
                        alert('Your session has expired. Please log in again.');
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '../../../login/login.html';
                        return; // Crucial: stops the code from trying to show the overlay
                    }

                    // For any other error, show the overlay with a generated ID as your code intended
                    alert('An error occurred during submission, but your report has been noted.');
                    complaintId = generateComplaintId(); // Generate a fallback ID
                }

                // --- Overlay Logic (FIXED) ---

                // 2. Show the success overlay now that the API call is complete.
                const successOverlay = document.getElementById('success-overlay');
                const complaintIdElement = document.getElementById('generated-complaint-id');

                if (complaintIdElement) {
                    complaintIdElement.textContent = `#${complaintId}`;
                }
                if (successOverlay) {
                    successOverlay.style.display = 'flex';
                }

                // 3. Attach event handlers for the overlay buttons IMMEDIATELY.
                //    The problematic 15-second delay is removed. The page will now only
                //    reload or navigate away when the user explicitly clicks a button.
                const closeBtn = document.getElementById('close-success');
                const newBtn = document.getElementById('new-complaint-btn');
                const dashboardBtn = document.getElementById('back-dashboard-btn');

                if (closeBtn) {
                    closeBtn.onclick = () => location.reload();
                }
                if (newBtn) {
                    newBtn.onclick = () => location.reload();
                }
                if (dashboardBtn) {
                    dashboardBtn.onclick = () => window.location.href = '/dashboard/user/user-dashboard.html';
                }

                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Complaint';
            });
        }
    }

    function generateTitle() {
        // Generate a descriptive title based on category and description
        const categoryName = selectedCategory ? selectedCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'General';
        const description = descriptionInput.value.trim();

        // Create a title from the first few words of description or use category name
        const title = description.split(' ').slice(0, 5).join(' ') || categoryName;
        return `Complaint about ${title}`;
    }

    function validateComplaint() {
        console.log('Validating complaint...');

        if (!photoInput || !photoInput.files || !photoInput.files[0]) {
            console.log('Photo validation failed:', {
                photoInput: !!photoInput,
                files: photoInput?.files,
                fileCount: photoInput?.files?.length
            });
            alert('Please upload a photo of the issue.');
            return false;
        }

        if (!selectedCategory || !selectedCategory) {
            console.log('Category validation failed:', {
                selectedCategory,
                selectedCategory
            });
            alert('Please select a category for your complaint.');
            return false;
        }

        if (!descriptionInput || !descriptionInput.value.trim()) {
            console.log('Description validation failed');
            alert('Please provide a description of the issue.');
            return false;
        }

        if (!currentLocation.lat || !currentLocation.lng) {
            console.log('Location validation failed:', currentLocation);
            alert('Please select a location for your complaint.');
            return false;
        }

        console.log('Validation passed');
        return true;
    }

    function generateComplaintId() {
        return Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    function showSuccessOverlay() {
        document.getElementById('success-overlay').style.display = 'flex';
    }

    function hideSuccessOverlay() {
        document.getElementById('success-overlay').style.display = 'none';
    }

    // Add the logout function if it doesn't exist
    function logout() {
        try {
            // Clear all authentication data from localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');

            // Clear all session storage
            sessionStorage.clear();

            // Clear any cookies (if using httpOnly cookies)
            document.cookie.split(";").forEach(function (c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            console.log('User logged out successfully - all data cleared');

            // Redirect to login page
            window.location.href = '../../../../index.html';
        } catch (error) {
            console.error('Logout error:', error);

            // Even if there's an error, clear local data and redirect
            localStorage.clear();
            sessionStorage.clear();
            console.log('Forced logout due to error - all data cleared');
            alert('Logged out successfully');
            window.location.href = '../../../login/login.html';
        }
    }

    // Logout function
    function initializeLogoutButtons() {
        // Find all possible logout elements
        const logoutButtons = document.querySelectorAll('.logout, .logout-btn, [data-action="logout"]');
        const logoutLinks = document.querySelectorAll('a[href*="logout"], a.logout');

        // Attach logout to all logout buttons
        logoutButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                logout();
            });
        });

        // Attach logout to all logout links
        logoutLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                logout();
            });
        });

        // Add keyboard shortcut for logout (Ctrl+Alt+L)
        document.addEventListener('keydown', function (e) {
            if (e.ctrlKey && e.altKey && e.key === 'l') {
                e.preventDefault();
                logout();
            }
        });

        console.log(`Logout functionality attached to ${logoutButtons.length + logoutLinks.length} elements`);
    }

    // Auto-logout on token expiration
    function checkTokenExpiration() {
        const token = localStorage.getItem('token');

        if (!token) {
            console.log('No token found, redirecting to login');
            window.location.href = '../../../login/login.html';
            return;
        }

        try {
            // Decode JWT token to check expiration
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);

            if (payload.exp && payload.exp < currentTime) {
                console.log('Token expired, auto-logging out');
                alert('Your session has expired. Please log in again.');
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '../../../login/login.html';
            }
        } catch (error) {
            console.error('Error checking token expiration:', error);
            // If token is malformed, clear it and redirect
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../../../login/login.html';
        }
    }

    // Initialize logout functionality
    initializeLogoutButtons();

    // Check token expiration immediately
    checkTokenExpiration();

    // Check token expiration every hour
    setInterval(checkTokenExpiration, 60 * 60 * 1000);

    console.log('Token expiration check initialized');
});
