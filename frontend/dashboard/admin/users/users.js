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

    let currentLoggedInUserId = null;

    // Variables for user management
    let users = [];
    let currentPage = 1;
    let itemsPerPage = 10;
    let totalPages = 1;
    let selectedUserId = null;
    let filterRole = 'all';
    let sortBy = 'name-asc';
    let searchQuery = '';

    // DOM Elements
    const usersList = document.getElementById('users-list');
    const totalUsersEl = document.getElementById('total-users');
    const citizenCountEl = document.getElementById('citizen-count');
    const adminCountEl = document.getElementById('admin-count');
    const filterRoleEl = document.getElementById('filter-role');
    const sortByEl = document.getElementById('sort-by');
    const searchInput = document.getElementById('search-users');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageEl = document.getElementById('current-page');
    const totalPagesEl = document.getElementById('total-pages');
    const emptyState = document.getElementById('empty-state');
    const resetFiltersBtn = document.getElementById('reset-filters');

    // Modal elements
    const addUserModal = document.getElementById('add-user-modal');
    const editUserModal = document.getElementById('edit-user-modal');
    const changeRoleModal = document.getElementById('change-role-modal');
    const deleteModal = document.getElementById('delete-modal');
    const addUserForm = document.getElementById('add-user-form');
    const editUserForm = document.getElementById('edit-user-form');
    const changeRoleForm = document.getElementById('change-role-form');
    console.log("Found changeRoleForm element:", changeRoleForm);

    // Modal buttons
    const addUserBtn = document.getElementById('add-user-btn');
    const cancelAddUserBtn = document.querySelector('.cancel-add-user');
    const cancelEditUserBtn = document.querySelector('.cancel-edit-user');
    const cancelRoleChangeBtn = document.querySelector('.close-modal');
    const deleteCancelBtn = document.getElementById('delete-cancel-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal');

    // Initialize the page
    init();

    function init() {
        // Get current user
        fetchCurrentUserId();

        // Load users
        loadUsers();

        // Set up event listeners
        setupEventListeners();

        // Setup password toggle
        setupPasswordToggle();

        // Initialize logout functionality
        initializeLogoutButtons();

        // Check token expiration
        checkTokenExpiration();

        // Set interval for token expiration check
        setInterval(checkTokenExpiration, 60 * 60 * 1000);
    }

    async function fetchCurrentUserId() {
        try {
            const response = await window.authAPI.getCurrentUser(); // Assumes this API exists
            if (response && response.success && response.data) {
                currentLoggedInUserId = response.data.userId; // Or ._id
            }
        } catch (error) {
            console.error("Could not fetch current user:", error);
        }
    }

    function setupEventListeners() {
        // Modal open/close
        cancelRoleChangeBtn.addEventListener('click', closeChangeRoleModal);
        deleteCancelBtn.addEventListener('click', closeDeleteModal);

        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
                selectedUserId = null;
            });
        });

        // Click outside modal to close
        document.addEventListener('click', function (e) {
            const modals = document.querySelectorAll('.modal.active');
            modals.forEach(modal => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    selectedUserId = null;
                }
            });
        });

        // Form submissions
        changeRoleForm.addEventListener('submit', handleChangeRole);
        confirmDeleteBtn.addEventListener('click', handleDeleteUser);

        // Filters
        filterRoleEl.addEventListener('change', () => {
            filterRole = filterRoleEl.value;
            currentPage = 1;
            filterAndRenderUsers();
        });

        sortByEl.addEventListener('change', () => {
            sortBy = sortByEl.value;
            filterAndRenderUsers();
        });

        searchInput.addEventListener('input', debounce(() => {
            searchQuery = searchInput.value.trim().toLowerCase();
            currentPage = 1;
            filterAndRenderUsers();
        }, 300));

        resetFiltersBtn.addEventListener('click', resetFilters);

        // Pagination
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                filterAndRenderUsers();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                filterAndRenderUsers();
            }
        });
    }

    function setupPasswordToggle() {
        const togglePasswordBtns = document.querySelectorAll('.toggle-password');
        togglePasswordBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const passwordInput = this.previousElementSibling;
                const icon = this.querySelector('i');

                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }

    async function loadUsers() {
        try {
            showLoading();

            const response = await window.adminAPI.getAllUsers();

            if (response && response.success && Array.isArray(response.data)) {
                users = response.data;
            } else {
                // If the API fails, show an error instead of sample data
                throw new Error(response?.message || 'Failed to fetch users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            showToast(error.message, 'error');
            users = []; // Default to an empty array on failure
        } finally {
            updateUserStats();
            filterAndRenderUsers();
            hideLoading();
        }
    }

    function getSampleUsers() {
        // Sample data as a fallback
        return [
            {
                _id: "68e238300d0110227e68698c",
                username: "john_doe",
                name: "John Doe",
                email: "john.doe@example.com",
                passwordHash: "$2b$10$fZ415FlysNytmVKMTf6./eU8XthYOWa6hp.I03C.GrfOfqwb7M/Fa",
                role: "citizen",
                phoneNumber: "9876543210",
                userId: "ecb79b9c-019f-42aa-8117-1ef51995ead7",
                createdAt: "2023-10-05T09:19:44.781Z",
                updatedAt: "2023-10-07T19:25:53.779Z"
            },
            {
                _id: "68e238300d0110227e68698d",
                username: "admin_raj",
                name: "Raj Kumar",
                email: "raj.kumar@gramdhara.gov.in",
                passwordHash: "$2b$10$fZ415FlysNytmVKMTf6./eU8XthYOWa6hp.I03C.GrfOfqwb7M/Fa",
                role: "department-admin",
                phoneNumber: "9988776655",
                userId: "67db4860-5e9d-4811-b2b6-5a6d48767a05",
                createdAt: "2023-09-15T10:30:00.781Z",
                updatedAt: "2023-10-07T19:25:53.779Z"
            },
            {
                _id: "68e238300d0110227e68698e",
                username: "super_priya",
                name: "Priya Sharma",
                email: "priya.sharma@gramdhara.gov.in",
                passwordHash: "$2b$10$fZ415FlysNytmVKMTf6./eU8XthYOWa6hp.I03C.GrfOfqwb7M/Fa",
                role: "super-admin",
                phoneNumber: "7766554433",
                userId: "f7c12d40-3a1c-4c9f-9e21-9d6c87f23a04",
                createdAt: "2023-09-01T08:45:30.781Z",
                updatedAt: "2023-10-07T19:25:53.779Z"
            },
            {
                _id: "68e238300d0110227e68698f",
                username: "jane_smith",
                name: "Jane Smith",
                email: "jane.smith@example.com",
                passwordHash: "$2b$10$fZ415FlysNytmVKMTf6./eU8XthYOWa6hp.I03C.GrfOfqwb7M/Fa",
                role: "citizen",
                phoneNumber: "8877665544",
                userId: "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
                createdAt: "2023-10-01T15:30:00.000Z",
                updatedAt: "2023-10-07T19:25:53.779Z"
            },
            {
                _id: "68e238300d0110227e686990",
                username: "dept_amit",
                name: "Amit Verma",
                email: "amit.verma@gramdhara.gov.in",
                passwordHash: "$2b$10$fZ415FlysNytmVKMTf6./eU8XthYOWa6hp.I03C.GrfOfqwb7M/Fa",
                role: "department-admin",
                phoneNumber: "7788996655",
                userId: "2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
                createdAt: "2023-09-20T10:15:00.000Z",
                updatedAt: "2023-10-07T19:25:53.779Z"
            }
        ];
    }

    function updateUserStats() {
        // Update count statistics
        const totalUsers = users.length;
        const citizenCount = users.filter(user => user.role === 'citizen').length;
        const adminCount = users.filter(user => user.role === 'department_admin' || user.role === 'super_admin').length;

        totalUsersEl.textContent = totalUsers;
        citizenCountEl.textContent = citizenCount;
        adminCountEl.textContent = adminCount;

        // Add animation
        animateCounters();
    }

    function animateCounters() {
        const countElements = [
            { element: totalUsersEl, value: parseInt(totalUsersEl.textContent) },
            { element: citizenCountEl, value: parseInt(citizenCountEl.textContent) },
            { element: adminCountEl, value: parseInt(adminCountEl.textContent) }
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

    function filterAndRenderUsers() {
        let filteredUsers = [...users];

        // Apply role filter
        if (filterRole !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.role === filterRole);
        }

        // Apply search filter
        if (searchQuery) {
            filteredUsers = filteredUsers.filter(user =>
                user.name.toLowerCase().includes(searchQuery) ||
                user.username.toLowerCase().includes(searchQuery) ||
                user.email.toLowerCase().includes(searchQuery) ||
                (user.phoneNumber && user.phoneNumber.includes(searchQuery))
            );
        }

        // Apply sorting
        filteredUsers = sortUsers(filteredUsers, sortBy);

        // Update pagination
        totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }

        // Get current page users
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        // Render users
        renderUsers(paginatedUsers);
        updatePaginationControls();

        // Show empty state if no users match filters
        if (filteredUsers.length === 0) {
            showEmptyState();
        } else {
            hideEmptyState();
        }
    }

    function sortUsers(users, sortOrder) {
        return [...users].sort((a, b) => {
            switch (sortOrder) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'date-desc':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'date-asc':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                default:
                    return a.name.localeCompare(b.name);
            }
        });
    }

    function renderUsers(users) {
        if (!usersList) return;

        // Clear current users
        usersList.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');

            // Format date
            const createdDate = new Date(user.createdAt);
            const formattedDate = createdDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            // Capitalize role for display
            const displayRole = user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

            row.innerHTML = `
                <td>
                    <div class="user-name-cell">
                        <span class="user-name">${user.name}</span>
                    </div>
                </td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.phoneNumber || '-'}</td>
                <td>
                    <span class="role-badge role-${user.role}">${displayRole}</span>
                </td>
                <td>${formattedDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn role-btn" title="Change Role">
                            <i class="fas fa-user-tag"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Delete User">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            `;

            // Add event listeners for action buttons
            const roleBtn = row.querySelector('.role-btn');
            const deleteBtn = row.querySelector('.delete-btn');

            if (user.userId === currentLoggedInUserId) {
                roleBtn.disabled = true;
                roleBtn.title = "You cannot change your own role.";
                deleteBtn.disabled = true; // Also disable deleting oneself
                deleteBtn.title = "You cannot delete your own account.";
            }

            roleBtn.addEventListener('click', () => openChangeRoleModal(user));
            deleteBtn.addEventListener('click', () => openDeleteModal(user));

            usersList.appendChild(row);
        });
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
        if (!emptyState || !usersList) return;

        usersList.style.display = 'none';
        emptyState.style.display = 'flex';
    }

    function hideEmptyState() {
        if (!emptyState || !usersList) return;

        usersList.style.display = 'table-row-group';
        emptyState.style.display = 'none';
    }

    function resetFilters() {
        if (filterRoleEl) filterRoleEl.value = 'all';
        if (sortByEl) sortByEl.value = 'name-asc';
        if (searchInput) searchInput.value = '';

        filterRole = 'all';
        sortBy = 'name-asc';
        searchQuery = '';
        currentPage = 1;

        filterAndRenderUsers();
    }

    function openAddUserModal() {
        if (!addUserModal || !addUserForm) return;

        addUserForm.reset();
        addUserModal.classList.add('active');
    }

    function closeAddUserModal() {
        if (!addUserModal) return;

        addUserModal.classList.remove('active');
    }

    function openEditModal(user) {
        if (!editUserModal || !editUserForm) return;

        selectedUserId = user.userId;

        // Populate form
        document.getElementById('edit-user-id').value = user.userId;
        document.getElementById('edit-user-name').value = user.name;
        document.getElementById('edit-user-username').value = user.username;
        document.getElementById('edit-user-email').value = user.email;
        document.getElementById('edit-user-phone').value = user.phoneNumber || '';
        document.getElementById('edit-user-role').value = user.role;

        editUserModal.classList.add('active');
    }

    function closeEditUserModal() {
        if (!editUserModal) return;

        editUserModal.classList.remove('active');
        selectedUserId = null;
    }

    function openChangeRoleModal(user) {
        if (!changeRoleModal || !changeRoleForm) return;

        selectedUserId = user.userId;

        // Update display elements
        document.getElementById('role-user-id').value = user.userId;
        document.getElementById('role-user-name').textContent = user.name;

        const currentRoleEl = document.getElementById('current-role');
        currentRoleEl.textContent = user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        currentRoleEl.className = 'badge';
        currentRoleEl.classList.add('role-' + user.role);

        // Set current role as default selected in dropdown
        document.getElementById('new-user-role').value = user.role;

        changeRoleModal.classList.add('active');
    }

    function closeChangeRoleModal() {
        if (!changeRoleModal) return;

        changeRoleModal.classList.remove('active');
        selectedUserId = null;
    }

    function openDeleteModal(user) {
        if (!deleteModal) return;

        selectedUserId = user.userId;

        // Update delete message
        document.getElementById('delete-user-id').value = user.userId;
        document.getElementById('delete-user-name').textContent = user.name;

        deleteModal.classList.add('active');
    }

    function closeDeleteModal() {
        if (!deleteModal) return;

        deleteModal.classList.remove('active');
        selectedUserId = null;
    }



    async function handleUpdateUser(e) {
        e.preventDefault();

        if (!selectedUserId) return;

        const role = document.getElementById('edit-user-role').value;

        if (!role) {
            showToast('Please Select a Role', 'error');
            return;
        }

        try {
            // Show loading state on submit button
            const submitBtn = editUserForm.querySelector('.btn-submit');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

            // Prepare user data
            const userData = {
                role: role
            };

            try {
                // Make API call to update user
                const response = await window.adminAPI.updateUserRole({ userId: userId, userData });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();

                if (data && data.success) {
                    // Update user in local array
                    const userIndex = users.findIndex(user => user.userId === selectedUserId);
                    if (userIndex !== -1) {
                        users[userIndex] = {
                            ...users[userIndex],
                            ...userData,
                            updatedAt: new Date().toISOString()
                        };
                    }

                    // Close modal and show success message
                    editUserModal.classList.remove('active');
                    showToast('User updated successfully', 'success');

                    // Update UI
                    updateUserStats();
                    filterAndRenderUsers();
                } else {
                    throw new Error(data?.message || 'Failed to update user');
                }
            } catch (error) {
                console.error('API error:', error);
                showToast(error.message || 'Failed to update user', 'error');

                // For demo purposes: update user locally
                const userIndex = users.findIndex(user => user.userId === selectedUserId);
                if (userIndex !== -1) {
                    users[userIndex] = {
                        ...users[userIndex],
                        name,
                        username,
                        email,
                        phoneNumber: phone,
                        role,
                        updatedAt: new Date().toISOString()
                    };

                    editUserModal.classList.remove('active');
                    showToast('User updated successfully (demo mode)', 'success');
                    updateUserStats();
                    filterAndRenderUsers();
                }
            }

            // Reset button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;

            // Reset selected ID
            selectedUserId = null;
        } catch (error) {
            console.error('Error updating user:', error);
            showToast('An unexpected error occurred', 'error');

            // Reset button state
            const submitBtn = editUserForm.querySelector('.btn-submit');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update User';
        }
    }

    async function handleChangeRole(e) {
        e.preventDefault();

        const userId = document.getElementById('role-user-id').value;
        if (!userId) return;

        const newRole = document.getElementById('new-user-role').value;
        const submitBtn = changeRoleForm.querySelector('.btn-submit');
        const originalBtnText = submitBtn.textContent;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating Role...';

            console.log("Changing role for userId:", userId, "to newRole:", newRole);

            const response = await window.adminAPI.updateUserRole(userId, { newRole: newRole });

            if (response && response.success) {
                const userIndex = users.findIndex(user => user.userId === userId);
                if (userIndex !== -1) {
                    users[userIndex] = response.data;
                }
                updateUserStats();
                filterAndRenderUsers();
                showToast('User role updated successfully', 'success');
                console.log("User Role Update Successfully")
            } else {
                throw new Error(response?.message || 'Failed to update user role');
            }
        } catch (error) {
            console.error('Error changing user role:', error);
            showToast(error.message, 'error');
        } finally {
            closeChangeRoleModal();
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }

    async function handleDeleteUser() {
        const userId = document.getElementById('delete-user-id').value;
        if (!userId) return;

        const deleteBtn = document.getElementById('confirm-delete-btn');
        const originalBtnText = deleteBtn.textContent;

        try {
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

            const response = await window.adminAPI.deleteUser(userId);

            if (response && response.success) {
                users = users.filter(user => user.userId !== userId);
                updateUserStats();
                filterAndRenderUsers();
                showToast('User deleted successfully', 'success');
            } else {
                throw new Error(response?.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showToast(error.message, 'error');
        } finally {
            closeDeleteModal();
            deleteBtn.disabled = false;
            deleteBtn.textContent = originalBtnText;
        }
    }

    function showLoading() {
        if (!usersList) return;

        usersList.innerHTML = `
            <tr>
                <td colspan="7" class="loading-row">
                    <div class="loading-spinner">
                        <i class="fas fa-circle-notch fa-spin"></i>
                        <span>Loading users...</span>
                    </div>
                </td>
            </tr>
        `;
    }

    function hideLoading() {
        // This is implicitly handled by renderUsers which will clear the usersList
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
        if (type === 'warning') icon = 'exclamation-circle';

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="toast-content">
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

        // Use setTimeout to trigger the animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto dismiss after 5 seconds
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

    // Initialize logout functionality
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
    }

    // Check token expiration
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
