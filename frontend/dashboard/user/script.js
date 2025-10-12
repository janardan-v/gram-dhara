document.addEventListener('DOMContentLoaded', function () {
    // --- ELEMENT SELECTORS ---
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.querySelector('.user-info p');
    const currentDateEl = document.getElementById('current-date');
    const notificationBadgeEl = document.querySelector('.notifications .badge');
    const resolvedReportsEl = document.querySelector('.stat-card:nth-child(2) .card-info h3');
    const inProgressReportsEl = document.querySelector('.stat-card:nth-child(3) .card-info h3');

    function updateDateTime() {
        if (currentDateEl) {
            const now = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            currentDateEl.innerHTML = `<i class="bi bi-calendar3"></i> ${now.toLocaleDateString('en-IN', options)}`;
        }
    }

    async function updateUserInformation() {
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

    async function updateNotificationCount() {
        try {
            if (!window.notificationsAPI) {
                console.error("Notifications API is not available.");
                return;
            }

            const response = await window.notificationsAPI.getMyNotifications();
            if (response && response.success && Array.isArray(response.data)) {
                // Assuming your API returns an array of notification objects
                const unreadCount = response.data.filter(notif => !notif.isRead).length;

                if (notificationBadgeEl) {
                    if (unreadCount > 0) {
                        notificationBadgeEl.textContent = unreadCount;
                        notificationBadgeEl.style.display = 'flex';
                    } else {
                        notificationBadgeEl.style.display = 'none';
                    }
                }
            } else {
                if (notificationBadgeEl) {
                    notificationBadgeEl.style.display = 'none'; // Hide if no data
                }
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }

    async function updateStatCard() {
        try {
            if (!window.reportsAPI) {
                console.error("Reports API is not available.");
                return;
            }
            const response = await window.reportsAPI.getMyReports();
            if (response && response.success && Array.isArray(response.data)) {
                const reports = response.data;
                const resolvedReports = reports.filter(report => report.status === 'resolved').length;
                const inProgressReports = reports.filter(report => report.status === 'in_progress').length;

                // Update the stat card with the fetched data
                if (resolvedReportsEl) resolvedReportsEl.textContent = resolvedReports;
                if (inProgressReportsEl) inProgressReportsEl.textContent = inProgressReports;
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
        }
    }

    function createTimelineItemHTML(item) {
        // Determine icon and color based on the item type
        let iconClass = 'blue';
        let icon = 'bi-bell'; // Default to notification

        if (item.type === 'report') {
            iconClass = 'purple';
            icon = 'bi-file-earmark-plus';
        }

        // Format the date for display
        const itemDate = new Date(item.date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit'
        });

        return `
        <div class="timeline-item">
            <div class="timeline-icon ${iconClass}">
                <i class="bi ${icon}"></i>
            </div>
            <div class="timeline-content">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <span class="timeline-time">${itemDate}</span>
            </div>
        </div>
    `;
    }

    async function updateActivityTimeline() {
        const timelineContainer = document.querySelector('#activity-timeline .timeline');
        if (!timelineContainer) return;

        try {
            // Fetch both reports and notifications in parallel for speed
            const [reportsRes, notificationsRes] = await Promise.all([
                window.reportsAPI ? window.reportsAPI.getMyReports() : Promise.resolve({ data: [] }),
                window.notificationsAPI ? window.notificationsAPI.getMyNotifications() : Promise.resolve({ data: [] })
            ]);

            let combinedActivities = [];

            // Normalize reports into a common format
            if (reportsRes.success && Array.isArray(reportsRes.data)) {
                const normalizedReports = reportsRes.data.map(report => ({
                    date: new Date(report.createdAt),
                    title: 'New Report Submitted',
                    description: report.title || 'Untitled Report',
                    type: 'report'
                }));
                combinedActivities.push(...normalizedReports);
            }

            // Normalize notifications into a common format
            if (notificationsRes.success && Array.isArray(notificationsRes.data)) {
                const normalizedNotifications = notificationsRes.data.map(notif => ({
                    date: new Date(notif.createdAt),
                    title: notif.title || 'New Notification',
                    description: notif.message,
                    type: 'notification'
                }));
                combinedActivities.push(...normalizedNotifications);
            }

            // Sort all items by date, newest first
            combinedActivities.sort((a, b) => a.date - b.date);
            
            // Create and append the HTML for each item
            combinedActivities.forEach(item => {
                const itemHTML = createTimelineItemHTML(item);
                // insertAdjacentHTML is efficient and adds to the end of the container
                timelineContainer.insertAdjacentHTML('afterbegin', itemHTML);
            });

        } catch (error) {
            console.error("Error building activity timeline:", error);
        }
    }

    function createReportHTML(report) {
        // Determine status class and icon based on report status
        let statusClass = 'maintenance'; // Default
        let statusIcon = 'bi-tools';
        let statusText = 'Pending';

        if (report.status === 'in_progress') {
            statusClass = 'active';
            statusIcon = 'bi-hourglass-split';
            statusText = 'In Progress';
        } else if (report.status === 'resolved') {
            statusClass = 'resolved'; // You'll need to add a CSS class for 'resolved'
            statusIcon = 'bi-check-circle-fill';
            statusText = 'Resolved';
        }

        // Format the date
        const reportDate = new Date(report.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        // Create the HTML string for the new report
        return `
            <div class="status-item">
                <div class="status-icon ${statusClass}">
                    <i class="bi ${statusIcon}"></i>
                </div>
                <div class="status-details">
                    <h3>${report.title || 'Untitled Report'}</h3>
                    <p>Category: ${report.categoryId ? report.categoryId.name : 'General'}</p>
                    <div class="progress-bar">
                         </div>
                    <div class="status-meta">
                        <span><i class="bi bi-calendar3"></i> Reported on: ${reportDate}</span>
                        <span class="status-${statusClass}"><i class="bi ${statusIcon}"></i> ${statusText}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Add the logout function if it doesn't already exist
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
            window.location.href = '../../../index.html';
        } catch (error) {
            console.error('Logout error:', error);

            // Even if there's an error, clear local data and redirect
            localStorage.clear();
            sessionStorage.clear();
            console.log('Forced logout due to error - all data cleared');
            alert('Logged out successfully');
            window.location.href = '../../login/login.html';
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
            window.location.href = '../../login/login.html';
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
                window.location.href = '../../login/login.html';
            }
        } catch (error) {
            console.error('Error checking token expiration:', error);
            // If token is malformed, clear it and redirect
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../../login/login.html';
        }
    }

    // Initialize logout functionality
    initializeLogoutButtons();

    // Check token expiration immediately
    checkTokenExpiration();

    // Check token expiration every hour
    setInterval(checkTokenExpiration, 60 * 60 * 1000);

    console.log('Token expiration check initialized');

    async function initializeDashboard() {
        // Make sure the API client is ready before making calls
        if (typeof window.waitForAPI === 'function') {
            await window.waitForAPI();
        }

        // Run all update functions in parallel for faster loading
        Promise.all([
            updateDateTime(),
            updateUserInformation(),
            updateNotificationCount(),
            updateStatCard(),
            updateActivityTimeline()
        ]).then(() => {
            console.log("Dashboard initialized successfully.");
        });
    }

    // --- START THE DASHBOARD INITIALIZATION ---
    initializeDashboard();
});