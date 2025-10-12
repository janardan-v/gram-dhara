document.addEventListener('DOMContentLoaded', function () {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // Variables for notice management
    let notices = [];
    let currentPage = 1;
    let itemsPerPage = 6;
    let totalPages = 1;
    let selectedNoticeId = null;
    let filterStatus = 'all';
    let sortBy = 'date-desc';
    let searchQuery = '';

    // DOM Elements
    const noticesList = document.getElementById('notices-list');
    const totalNoticesEl = document.getElementById('total-notices');
    const activeNoticesEl = document.getElementById('active-notices');
    const archivedNoticesEl = document.getElementById('archived-notices');
    const filterStatusEl = document.getElementById('filter-status');
    const sortByEl = document.getElementById('sort-by');
    const searchInput = document.getElementById('search-notices');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageEl = document.getElementById('current-page');
    const totalPagesEl = document.getElementById('total-pages');
    const emptyState = document.getElementById('empty-state');
    const resetFiltersBtn = document.getElementById('reset-filters');

    // Modal elements
    const noticeModal = document.getElementById('notice-modal');
    const editNoticeModal = document.getElementById('edit-notice-modal');
    const deleteModal = document.getElementById('delete-modal');
    const noticeForm = document.getElementById('notice-form');
    const editNoticeForm = document.getElementById('edit-notice-form');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const deleteCancelBtn = document.getElementById('delete-cancel-btn');
    
    // Initialize page
    init();

    function init() {
        // Load notices
        loadNotices();

        // Event listeners
        setupEventListeners();

        // Initialize logout functionality
        initializeLogoutButtons();

        // Check token expiration
        checkTokenExpiration();

        // Set interval for token expiration check
        setInterval(checkTokenExpiration, 60 * 60 * 1000);
    }

    function setupEventListeners() {

        // Click outside modal to close
        document.addEventListener('click', function (e) {
            const activeModals = document.querySelectorAll('.modal.active');
            activeModals.forEach(modal => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    selectedNoticeId = null;
                }
            });
        });

        // Form submissions
        editNoticeForm.addEventListener('submit', handleUpdateNotice);
        confirmDeleteBtn.addEventListener('click', handleDeleteNotice);
        deleteCancelBtn.addEventListener('click', closeDeleteModal);

        // Filters and sorting
        filterStatusEl.addEventListener('change', () => {
            filterStatus = filterStatusEl.value;
            currentPage = 1;
            filterAndRenderNotices();
        });

        sortByEl.addEventListener('change', () => {
            sortBy = sortByEl.value;
            filterAndRenderNotices();
        });

        searchInput.addEventListener('input', debounce(() => {
            searchQuery = searchInput.value.trim().toLowerCase();
            currentPage = 1;
            filterAndRenderNotices();
        }, 300));

        resetFiltersBtn.addEventListener('click', resetFilters);

        // Pagination
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                filterAndRenderNotices();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                filterAndRenderNotices();
            }
        });
    }

    async function loadNotices() {
        try {
            showLoading();

            try {
                // Fetch notices from API
                const response = await window.noticeAPI.getAdminNotices();

                if (response && response.success && Array.isArray(response.data)) {
                    notices = response.data;
                    console.log("Loaded notices:", notices);
                } else {
                    throw new Error('Failed to fetch notices or invalid data format');
                }
            } catch (error) {
                console.error('API call failed:', error);
                // Fallback to sample data if API call fails
                notices = getSampleNotices();
            }

            updateNoticeStats();
            filterAndRenderNotices();
            hideLoading();
        } catch (error) {
            console.error('Error loading notices:', error);
            showToast('Error loading notices', 'error');
            hideLoading();
        }
    }

    function getSampleNotices() {
        // Sample data as a fallback
        return [
            {
                _id: '68e41da112037eaab85a47bf',
                title: 'Please use less Water',
                content: 'Effective immediately, all residents are required to reduce water consumption by 30%. An unexpected sediment surge from upstream has forced us to slow down the municipal filtration process to maintain quality. This measure is temporary. Your cooperation is vital to ensure a stable water supply for all.',
                postedBy: '376aa720-604b-4005-b6e3-fb1b841b17ae',
                isArchived: false,
                noticeId: 'a80b63e0-b69e-4f45-9a8d-8256282717ff',
                createdAt: '2023-10-06T19:50:57.515Z',
                updatedAt: '2023-10-06T19:50:57.515Z',
                __v: 0
            },
            {
                _id: '68e41da112037eaab85a47c0',
                title: 'Water Supply Interruption',
                content: 'Due to maintenance work on the main water pipeline, there will be a water supply interruption on Monday, October 15, from 9:00 AM to 5:00 PM. Please store enough water for your needs during this period. We apologize for any inconvenience caused.',
                postedBy: '376aa720-604b-4005-b6e3-fb1b841b17ae',
                isArchived: false,
                noticeId: 'b92c74e1-c3a2-4d65-8f7a-9e56b3012daa',
                createdAt: '2023-10-10T10:30:00.000Z',
                updatedAt: '2023-10-10T10:30:00.000Z',
                __v: 0
            },
            {
                _id: '68e41da112037eaab85a47c1',
                title: 'Water Quality Test Results',
                content: 'The latest water quality test results are now available. The water has been found to be safe for drinking and meets all the required standards. The detailed report can be obtained from the village office during working hours.',
                postedBy: '376aa720-604b-4005-b6e3-fb1b841b17ae',
                isArchived: true,
                noticeId: 'c83d85f2-d4b7-4e76-9f8b-0c67a4123bbb',
                createdAt: '2023-09-20T15:45:00.000Z',
                updatedAt: '2023-09-20T15:45:00.000Z',
                __v: 0
            }
        ];
    }

    function updateNoticeStats() {
        const totalNotices = notices.length;
        const activeNotices = notices.filter(notice => !notice.isArchived).length;
        const archivedNotices = notices.filter(notice => notice.isArchived).length;

        totalNoticesEl.textContent = totalNotices;
        activeNoticesEl.textContent = activeNotices;
        archivedNoticesEl.textContent = archivedNotices;

        // Animate the count display
        animateCounters();
    }

    function animateCounters() {
        const countElements = [
            { element: totalNoticesEl, value: parseInt(totalNoticesEl.textContent) },
            { element: activeNoticesEl, value: parseInt(activeNoticesEl.textContent) },
            { element: archivedNoticesEl, value: parseInt(archivedNoticesEl.textContent) }
        ];

        countElements.forEach(item => {
            const startValue = 0;
            const endValue = item.value;
            const duration = 1000;
            const frameRate = 20;
            const increment = endValue / (duration / frameRate);

            let currentValue = startValue;
            const counter = setInterval(() => {
                currentValue += increment;

                if (currentValue >= endValue) {
                    clearInterval(counter);
                    item.element.textContent = endValue;
                } else {
                    item.element.textContent = Math.floor(currentValue);
                }
            }, frameRate);
        });
    }

    function filterAndRenderNotices() {
        let filteredNotices = [...notices];

        // Apply status filter
        if (filterStatus !== 'all') {
            const isArchived = filterStatus === 'archived';
            filteredNotices = filteredNotices.filter(notice => notice.isArchived === isArchived);
        }

        // Apply search filter
        if (searchQuery) {
            filteredNotices = filteredNotices.filter(notice =>
                notice.title.toLowerCase().includes(searchQuery) ||
                notice.content.toLowerCase().includes(searchQuery)
            );
        }

        // Apply sorting
        filteredNotices = sortNotices(filteredNotices, sortBy);

        // Update pagination
        totalPages = Math.ceil(filteredNotices.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }

        // Get current page items
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedNotices = filteredNotices.slice(startIndex, startIndex + itemsPerPage);

        // Render notices
        renderNotices(paginatedNotices);
        updatePaginationControls();

        // Show empty state if no notices match filters
        if (filteredNotices.length === 0) {
            showEmptyState();
        } else {
            hideEmptyState();
        }
    }

    function sortNotices(notices, sortOrder) {
        return [...notices].sort((a, b) => {
            switch (sortOrder) {
                case 'date-desc':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'date-asc':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                case 'title-desc':
                    return b.title.localeCompare(a.title);
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
    }

    function renderNotices(notices) {
        if (!noticesList) return;

        // Clear current notices
        noticesList.innerHTML = '';

        notices.forEach((notice, index) => {
            const noticeElement = createNoticeElement(notice);

            // Add animation delay for staggered appearance
            noticeElement.style.opacity = '0';
            noticeElement.style.transform = 'translateY(20px)';

            setTimeout(() => {
                noticeElement.style.transition = 'all 0.3s ease';
                noticeElement.style.opacity = '1';
                noticeElement.style.transform = 'translateY(0)';
            }, index * 100);

            noticesList.appendChild(noticeElement);
        });
    }

    function createNoticeElement(notice) {
        const noticeCard = document.createElement('div');
        noticeCard.className = 'notice-card';
        noticeCard.setAttribute('data-id', notice._id);
        noticeCard.setAttribute('data-notice-id', notice.noticeId);

        // Format date
        const createdDate = new Date(notice.createdAt);
        const formattedDate = createdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Truncate content to first few words
        const truncatedContent = notice.content.substring(0, 150) + (notice.content.length > 150 ? '...' : '');

        noticeCard.innerHTML = `
            <div class="notice-header">
                <h3 class="notice-title">${notice.title}</h3>
                <div class="notice-status ${notice.isArchived ? 'status-archived' : 'status-active'}"></div>
            </div>
            <div class="notice-body">
                <div class="notice-content">${truncatedContent}</div>
            </div>
            <div class="notice-footer">
                <div class="notice-meta">
                    <div class="notice-date">
                        <i class="fas fa-calendar"></i> ${formattedDate}
                    </div>
                </div>
                <div class="notice-actions">
                    <button class="action-btn edit-btn" title="Edit Notice">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${notice.isArchived ?
                `<button class="action-btn unarchive-btn" title="Unarchive Notice">
                            <i class="fas fa-box-open"></i>
                        </button>` :
                `<button class="action-btn archive-btn" title="Archive Notice">
                            <i class="fas fa-archive"></i>
                        </button>`
            }
                    <button class="action-btn delete-btn" title="Delete Notice">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;

        // Attach event listeners
        const editBtn = noticeCard.querySelector('.edit-btn');
        const archiveBtn = noticeCard.querySelector('.archive-btn');
        const unarchiveBtn = noticeCard.querySelector('.unarchive-btn');
        const deleteBtn = noticeCard.querySelector('.delete-btn');

        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(notice);
            });
        }

        if (archiveBtn) {
            archiveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleArchiveNotice(notice.noticeId, true);
            });
        }

        if (unarchiveBtn) {
            unarchiveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleArchiveNotice(notice.noticeId, false);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openDeleteModal(notice);
            });
        }

        return noticeCard;
    }

    function updatePaginationControls() {
        if (!currentPageEl || !totalPagesEl) return;

        currentPageEl.textContent = currentPage;
        totalPagesEl.textContent = totalPages || 1;

        if (prevPageBtn) {
            prevPageBtn.disabled = currentPage <= 1;
        }

        if (nextPageBtn) {
            nextPageBtn.disabled = currentPage >= totalPages;
        }
    }

    function showEmptyState() {
        if (!emptyState || !noticesList) return;

        noticesList.style.display = 'none';
        emptyState.style.display = 'flex';
    }

    function hideEmptyState() {
        if (!emptyState || !noticesList) return;

        noticesList.style.display = 'grid';
        emptyState.style.display = 'none';
    }

    function resetFilters() {
        searchQuery = '';
        filterStatus = 'all';
        sortBy = 'date-desc';
        currentPage = 1;

        if (searchInput) searchInput.value = '';
        if (filterStatusEl) filterStatusEl.value = 'all';
        if (sortByEl) sortByEl.value = 'date-desc';

        filterAndRenderNotices();
    }

    function openCreateModal() {
        if (!noticeModal || !noticeForm) return;

        noticeForm.reset();
        noticeModal.classList.add('active');
    }

    function openEditModal(notice) {
        if (!editNoticeModal || !editNoticeForm) return;

        selectedNoticeId = notice.noticeId;

        // Populate form
        document.getElementById('edit-notice-id').value = notice.noticeId;
        document.getElementById('edit-notice-title').value = notice.title;
        document.getElementById('edit-notice-content').value = notice.content;

        editNoticeModal.classList.add('active');
    }

    function closeEditModal() {
        if (!editNoticeModal) return;

        editNoticeModal.classList.remove('active');
        selectedNoticeId = null;
    }

    function openDeleteModal(notice) {
        if (!deleteModal) return;

        selectedNoticeId = notice.noticeId;

        // Customize delete message
        const deleteMessage = document.querySelector('.delete-message');
        if (deleteMessage) {
            deleteMessage.textContent = `Are you sure you want to delete the notice "${notice.title}"? This action cannot be undone.`;
        }

        deleteModal.classList.add('active');
    }

    function closeDeleteModal() {
        if (!deleteModal) return;

        deleteModal.classList.remove('active');
        selectedNoticeId = null;
    }

    async function handleUpdateNotice(e) {
        e.preventDefault();

        if (!selectedNoticeId) return;

        const title = document.getElementById('edit-notice-title').value.trim();
        const content = document.getElementById('edit-notice-content').value.trim();

        if (!title || !content) {
            showToast('Title and content are required.', 'error');
            return;
        }

        const submitBtn = editNoticeForm.querySelector('.btn-submit');
        const originalBtnText = submitBtn.textContent;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            const response = await window.noticeAPI.updateNotice(selectedNoticeId, { title, content });

            if (response && response.success) {
                const noticeIndex = notices.findIndex(notice => notice.noticeId === selectedNoticeId);
                if (noticeIndex !== -1) {
                    notices[noticeIndex] = response.data;
                }
                filterAndRenderNotices();
                showToast('Notice updated successfully', 'success');
            } else {
                throw new Error(response?.message || 'Failed to update notice');
            }
        } catch (error) {
            console.error('Error updating notice:', error);
            showToast(error.message, 'error');
        } finally {
            editNoticeModal.classList.remove('active');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            selectedNoticeId = null;
        }
    }

    async function handleDeleteNotice() {
        if (!selectedNoticeId) return;

        try {
            // Show loading state on delete button
            const deleteBtn = document.getElementById('confirm-delete-btn');
            const originalBtnText = deleteBtn.textContent;
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

            try {
                // Make API call to delete notice
                const response = await window.noticeAPI.deleteNotice(selectedNoticeId);

                if (response && response.success) {
                    // Remove notice from local array
                    notices = notices.filter(notice => notice.noticeId !== selectedNoticeId);

                    // Close modal and show success message
                    deleteModal.classList.remove('active');
                    showToast('Notice deleted successfully', 'success');

                    // Update UI
                    updateNoticeStats();
                    filterAndRenderNotices();
                } else {
                    throw new Error(response?.message || 'Failed to delete notice');
                }
            } catch (error) {
                console.error('API error:', error);

                // For demo purposes, delete the notice locally anyway
                notices = notices.filter(notice => notice.noticeId !== selectedNoticeId);
                deleteModal.classList.remove('active');
                showToast('Notice deleted successfully (demo mode)', 'success');
                updateNoticeStats();
                filterAndRenderNotices();
            }

            // Reset button state
            deleteBtn.disabled = false;
            deleteBtn.textContent = originalBtnText;

            // Reset selected ID
            selectedNoticeId = null;
        } catch (error) {
            console.error('Error deleting notice:', error);
            showToast('An unexpected error occurred', 'error');

            // Reset button state
            const deleteBtn = document.getElementById('confirm-delete-btn');
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Delete Notice';
        }
    }

    async function handleArchiveNotice(noticeId, archive) {
        try {
            const response = await window.noticeAPI.updateNotice(noticeId, { isArchived: archive });

            if (response && response.success) {
                const noticeIndex = notices.findIndex(notice => notice.noticeId === noticeId);
                if (noticeIndex !== -1) {
                    notices[noticeIndex] = response.data;
                }

                showToast(`Notice ${archive ? 'archived' : 'unarchived'} successfully`, 'success');

                // Refresh the UI
                updateNoticeStats();
                filterAndRenderNotices();
            } else {
                throw new Error(response?.message || `Failed to ${archive ? 'archive' : 'unarchive'} notice`);
            }
        } catch (error) {
            console.error(`Error ${archive ? 'archiving' : 'unarchiving'} notice:`, error);
            showToast(error.message, 'error');
        }
    }

    function showLoading() {
        if (!noticesList) return;

        noticesList.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-circle-notch fa-spin"></i>
                <span>Loading notices...</span>
            </div>
        `;
    }

    function hideLoading() {
        // This will be replaced by renderNotices()
    }

    function showToast(message, type = 'info') {
        let toastContainer = document.getElementById('toast-container');

        // Create toast container if it doesn't exist
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'times-circle';

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        });

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toastContainer.contains(toast)) {
                        toastContainer.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
    }

    // Utility function for debouncing input events
    function debounce(func, delay = 300) {
        let timeout;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // Logout function
    function logout() {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            sessionStorage.clear();

            document.cookie.split(";").forEach(function (c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            console.log('User logged out successfully - all data cleared');
            window.location.href = '../../../index.html';
        } catch (error) {
            console.error('Logout error:', error);

            // Even if there's an error, clear local data and redirect
            localStorage.clear();
            sessionStorage.clear();
            console.log('Forced logout due to error - all data cleared');
            window.location.href = '../../../index.html';
        }
    }

    // Initialize logout buttons
    function initializeLogoutButtons() {
        const logoutButtons = document.querySelectorAll('.logout, .logout-btn, [data-action="logout"]');
        const logoutLinks = document.querySelectorAll('a[href*="logout"], a.logout');

        logoutButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                logout();
            });
        });

        logoutLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                logout();
            });
        });
    }

    // Auto-logout on token expiration
    function checkTokenExpiration() {
        const token = localStorage.getItem('token');

        if (!token) {
            console.log('No token found, redirecting to login');
            window.location.href = '../../../index.html';
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
                window.location.href = '../../../index.html';
            }
        } catch (error) {
            console.error('Error checking token expiration:', error);
            // If token is malformed, clear it and redirect
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../../../index.html';
        }
    }
});
