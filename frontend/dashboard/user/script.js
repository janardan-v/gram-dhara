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

    async function updateStatCard () {
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

    async function addDynamicReports() {
        try {
            if (!window.reportsAPI) {
                console.error("Reports API is not available.");
                return;
            }

            const response = await window.reportsAPI.getMyReports();
            if (response && response.success && Array.isArray(response.data)) {
                const reports = response.data;

                // Reverse to show the newest first
                reports.reverse().forEach(report => {
                    const reportHTML = createReportHTML(report);
                    // Add the new report at the beginning of the container
                    recentReportsContainer.insertAdjacentHTML('afterbegin', reportHTML);
                });
            }
        } catch (error) {
            console.error("Error fetching user reports:", error);
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
            addDynamicReports()
        ]).then(() => {
            console.log("Dashboard initialized successfully.");
        });
    }

    // --- START THE DASHBOARD INITIALIZATION ---
    initializeDashboard();
});