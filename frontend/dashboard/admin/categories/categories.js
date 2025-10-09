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

    // Variables for category management
    let categories = [];
    let reports = [];
    let currentPage = 1;
    let itemsPerPage = 10;
    let totalPages = 1;
    let selectedCategoryId = null;

    // DOM Elements
    const categoryList = document.getElementById('category-list');
    const totalCategoriesEl = document.getElementById('total-categories');
    const totalReportsEl = document.getElementById('total-reports');
    const activeCategoriesEl = document.getElementById('active-categories');
    const inactiveCategoriesEl = document.getElementById('inactive-categories');
    const statusFilterEl = document.getElementById('status-filter');
    const sortByEl = document.getElementById('sort-by');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageEl = document.getElementById('current-page');
    const totalPagesEl = document.getElementById('total-pages');

    // Modal elements
    const categoryModal = document.getElementById('category-modal');
    const editCategoryModal = document.getElementById('edit-category-modal');
    const deleteModal = document.getElementById('delete-modal');
    const categoryForm = document.getElementById('category-form');
    categoryForm.addEventListener('submit', handleCreateCategory);
    const editCategoryForm = document.getElementById('edit-category-form');

    // Modal open/close buttons
    const createCategoryBtn = document.getElementById('create-category-btn');
    const cancelBtn = document.getElementById('close-modal');
    const editCancelBtn = document.getElementById('edit-cancel-btn');
    const deleteCancelBtn = document.getElementById('delete-cancel-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal');

    // Initialize page
    init();

    function init() {
        // Load categories
        loadCategories();

        // Event listeners
        setupEventListeners();

        // Icon selector previews
        setupIconSelectors();

        // Initialize logout functionality
        initializeLogoutButtons();

        // Check token expiration
        checkTokenExpiration();

        // Set interval for token expiration check
        setInterval(checkTokenExpiration, 60 * 60 * 1000);
    }

    function setupEventListeners() {
        // Modal open/close
        createCategoryBtn.addEventListener('click', openCreateModal);
        cancelBtn.addEventListener('click', closeCreateModal);
        editCancelBtn.addEventListener('click', closeEditModal);
        deleteCancelBtn.addEventListener('click', closeDeleteModal);

        // Fix the close modal buttons functionality
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
                selectedCategoryId = null;
            });
        });

        // Fix the click outside modal to close functionality
        document.addEventListener('click', function (e) {
            const modalElements = document.querySelectorAll('.modal.active');
            modalElements.forEach(modal => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    selectedCategoryId = null;
                }
            });
        });

        // Form submissions
        categoryForm.addEventListener('submit', handleCreateCategory);
        editCategoryForm.addEventListener('submit', handleUpdateCategory);
        confirmDeleteBtn.addEventListener('click', handleDeleteCategory);

        // Filters and sorting
        statusFilterEl.addEventListener('change', filterAndSortCategories);
        sortByEl.addEventListener('change', filterAndSortCategories);

        // Pagination
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderCategories();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderCategories();
            }
        });
    }

    async function loadCategories() {
        try {
            showLoading();

            // In a real application, fetch from API
            try {
                const response = await window.categoriesAPI.getAll();
                console.log("Categories Fetching ....");
                if (response && response.success) {
                    console.log("Categories Data", response.data);
                    categories = response.data;
                    console.log(categories)
                } else {
                    throw new Error('Failed to fetch categories');
                }
            } catch (error) {
                console.error('API call failed:', error);
                // Fallback to sample data
                categories = getSampleCategories();
            }

            updateCategoryStats();
            renderCategories();
            hideLoading();
        } catch (error) {
            console.error('Error loading categories:', error);
            showToast('Error loading categories', 'error');
            hideLoading();
        }
    }

    function getSampleCategories() {
        return [
            {
                id: '1',
                name: 'Water Supply',
                description: 'Issues related to water supply and distribution',
                icon: 'fa-faucet',
                color: '#2196f3',
                isActive: true,
                reportsCount: 42,
                createdAt: '2023-06-15T10:30:00Z'
            },
            {
                id: '2',
                name: 'Water Quality',
                description: 'Issues related to water quality and contamination',
                icon: 'fa-tint',
                color: '#00bcd4',
                isActive: true,
                reportsCount: 28,
                createdAt: '2023-06-20T14:45:00Z'
            },
            {
                id: '3',
                name: 'Leakage',
                description: 'Water leakage and pipe damage issues',
                icon: 'fa-faucet-drip',
                color: '#4caf50',
                isActive: true,
                reportsCount: 36,
                createdAt: '2023-07-05T09:15:00Z'
            },
            {
                id: '4',
                name: 'Billing',
                description: 'Issues related to water billing and payments',
                icon: 'fa-receipt',
                color: '#ff9800',
                isActive: true,
                reportsCount: 18,
                createdAt: '2023-07-12T16:30:00Z'
            },
            {
                id: '5',
                name: 'Pump Issues',
                description: 'Problems related to water pumps and motors',
                icon: 'fa-pump-medical',
                color: '#9c27b0',
                isActive: false,
                reportsCount: 12,
                createdAt: '2023-08-01T11:00:00Z'
            },
            {
                id: '6',
                name: 'Water Shortage',
                description: 'Reports about water shortage or low pressure',
                icon: 'fa-droplet-slash',
                color: '#e53935',
                isActive: true,
                reportsCount: 24,
                createdAt: '2023-08-15T13:20:00Z'
            },
            {
                id: '7',
                name: 'Meter Reading',
                description: 'Issues related to water meter readings',
                icon: 'fa-gauge-high',
                color: '#8e24aa',
                isActive: true,
                reportsCount: 16,
                createdAt: '2023-08-25T09:10:00Z'
            },
            {
                id: '8',
                name: 'New Connection',
                description: 'Requests for new water connections',
                icon: 'fa-link',
                color: '#3949ab',
                isActive: true,
                reportsCount: 31,
                createdAt: '2023-09-05T15:45:00Z'
            }
        ];
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

    function updateCategoryStats() {
        const totalCategories = categories.length;
        const totalReports = categories.reduce((sum, cat) => sum + cat.reportsCount, 0);
        const activeCategories = categories.filter(cat => cat.isActive).length;
        const inactiveCategories = categories.filter(cat => !cat.isActive).length;
    }


    function filterAndSortCategories() {
        const status = statusFilterEl.value;
        const sort = sortByEl.value;

        // Apply filter
        let filtered = [...categories];
        if (status !== 'all') {
            const isActive = status === 'active';
            filtered = filtered.filter(cat => cat.isActive === isActive);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sort) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'reports-desc':
                    return b.reportsCount - a.reportsCount;
                case 'reports-asc':
                    return a.reportsCount - b.reportsCount;
                case 'date-desc':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'date-asc':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                default:
                    return 0;
            }
        });

        // Reset pagination
        currentPage = 1;

        // Update UI with filtered and sorted categories
        renderCategories(filtered);
    }

    function renderCategories(filtered = null) {
        const categoriesToRender = filtered || categories;

        if (!categoryList) return;

        // Clear the list
        categoryList.innerHTML = '';

        // Check if empty
        if (categoriesToRender.length === 0) {
            renderEmptyState();
            return;
        }

        // Calculate pagination
        totalPages = Math.ceil(categoriesToRender.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, categoriesToRender.length);

        // Update pagination UI
        currentPageEl.textContent = currentPage;
        totalPagesEl.textContent = totalPages;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;

        // Render categories for current page
        const categorySlice = categoriesToRender.slice(startIndex, endIndex);

        categorySlice.forEach((category, index) => {
            const categoryElement = createCategoryElement(category);
            // Add animation delay for staggered appearance
            categoryElement.style.opacity = '0';
            categoryElement.style.transform = 'translateY(20px)';

            setTimeout(() => {
                categoryElement.style.transition = 'all 0.3s ease';
                categoryElement.style.opacity = '1';
                categoryElement.style.transform = 'translateY(0)';
            }, index * 100);

            categoryList.appendChild(categoryElement);
        });
    }

    function capitalizeWords(text) {
        // Return an empty string if the input is invalid
        if (!text || typeof text !== 'string') {
            return '';
        }

        return text.split(' ') // 1. Split the string into an array of words
            .map(word => {      // 2. Create a new array with modified words
                if (word.length === 0) return '';
                // 3. Capitalize the first letter and add the rest of the word
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');     // 4. Join the words back into a string
    }

    function createCategoryElement(category) {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.setAttribute('data-id', category.id);

        const iconStyle = `background-color: ${hexToRgba(category.color || '#cccccc', 0.1)}; color: ${category.color || '#03a9f4'};`;

        categoryItem.innerHTML = `
            <div class="category-icon" style="${iconStyle}">
                <i class="bi ${getCategoryIcon(category.name) || 'fa-list'}"></i>
            </div>
            <div class="category-info">
                <h3 class="category-name">${capitalizeWords(category.name)}</h3>
                <p class="category-description">${category.description}</p>
            </div>
            <div class="category-stats-info">
                <div class="category-status status-active}">
                    Active
                </div>
            </div>
        `;
        return categoryItem;
    }

    function renderEmptyState() {
        categoryList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <h3>No Categories Found</h3>
                <p>There are no categories matching your filter criteria.</p>
                <button class="btn-create-category">
                    <i class="fas fa-plus"></i> Create New Category
                </button>
            </div>
        `;

        const createBtn = categoryList.querySelector('.btn-create-category');
        createBtn.addEventListener('click', openCreateModal);
    }

    // Modal functions
    function openCreateModal() {
        categoryForm.reset();
        categoryModal.classList.add('active');

        // For debugging
        console.log('Opening create modal');
        console.log('Modal element:', categoryModal);
        console.log('Modal classes:', categoryModal.classList);
    }

    function closeCreateModal() {
        console.log("Attempting to close modal. Element is:", categoryModal);
        if (categoryModal) {
            categoryModal.classList.remove('active');
            console.log('Closing create modal');
        }
    }

    function openEditModal(category) {
        selectedCategoryId = category.id;

        // Populate form fields
        document.getElementById('edit-category-id').value = category.id;
        document.getElementById('edit-category-name').value = category.name;
        document.getElementById('edit-category-description').value = category.description;
        document.getElementById('edit-category-icon').value = category.icon;
        document.getElementById('edit-selected-icon-preview').className = 'fas ' + category.icon;
        document.getElementById('edit-category-color').value = category.color;
        document.getElementById('edit-category-status').checked = category.isActive;

        editCategoryModal.classList.add('active');
    }

    function closeEditModal() {
        editCategoryModal.classList.remove('active');
        selectedCategoryId = null;
    }

    function openDeleteModal(category) {
        selectedCategoryId = category.id;

        // Customize the delete message
        const deleteMessage = document.querySelector('.delete-message');
        if (deleteMessage) {
            deleteMessage.textContent = `Are you sure you want to delete the "${category.name}" category? This action cannot be undone.`;
        }

        deleteModal.classList.add('active');
    }

    function closeDeleteModal() {
        deleteModal.classList.remove('active');
        selectedCategoryId = null;
    }

    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        selectedCategoryId = null;
        console.log('Closing all modals');
    }

    // Form handling functions
    async function handleCreateCategory(e) {
        e.preventDefault();

        const name = document.getElementById('category-name').value;
        const description = document.getElementById('category-description').value;

        try {
            // Show loading state on the submit button
            const submitBtn = categoryForm.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

            const newCategory = {
                name: name,
                description: description
            }

            const response = await window.categoriesAPI.create(newCategory);

            // 2. Check if the API call was successful
            if (response && response.success) {
                // 3. Add the new category returned from the server to the list
                //    (This is better than using the local `newCategory` object)
                categories.unshift(response.data);

                // 4. Update the UI
                updateCategoryStats();
                renderCategories();
                closeCreateModal();
            } else {
                showToast('Error creating category', 'error');
                throw new Error('Failed to create category');
            }

            showToast('Category created successfully!', 'success');
        } catch (error) {
            console.error('Error creating category:', error);
            showToast('Error creating category', 'error');

            // Reset the submit button
            const submitBtn = categoryForm.querySelector('.btn-submit');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Category';
        }
    }

    async function handleUpdateCategory(e) {
        e.preventDefault();

        if (!selectedCategoryId) return;

        const name = document.getElementById('edit-category-name').value;
        const description = document.getElementById('edit-category-description').value;
        const icon = document.getElementById('edit-category-icon').value;
        const color = document.getElementById('edit-category-color').value;
        const isActive = document.getElementById('edit-category-status').checked;

        try {
            // Show loading state on the submit button
            const submitBtn = editCategoryForm.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

            // In a real application, you would send to API
            // Example API call (commented out):
            /*
            const response = await fetch(`/api/categories/${selectedCategoryId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    description,
                    icon,
                    color,
                    isActive
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update category');
            }
            */

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For demonstration, update local array
            const categoryIndex = categories.findIndex(cat => cat.id === selectedCategoryId);
            if (categoryIndex !== -1) {
                categories[categoryIndex] = {
                    ...categories[categoryIndex],
                    name,
                    description,
                    icon,
                    color,
                    isActive
                };
            }

            updateCategoryStats();
            renderCategories();
            closeEditModal();

            showToast('Category updated successfully!', 'success');

            // Reset the submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        } catch (error) {
            console.error('Error updating category:', error);
            showToast('Error updating category', 'error');

            // Reset the submit button
            const submitBtn = editCategoryForm.querySelector('.btn-submit');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Category';
        }
    }

    async function handleDeleteCategory() {
        if (!selectedCategoryId) return;

        try {
            // Show loading state on the delete button
            const deleteBtn = document.getElementById('confirm-delete-btn');
            const originalText = deleteBtn.textContent;
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

            // In a real application, you would send to API
            // Example API call (commented out):
            /*
            const response = await fetch(`/api/categories/${selectedCategoryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete category');
            }
            */

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For demonstration, remove from local array
            categories = categories.filter(cat => cat.id !== selectedCategoryId);

            updateCategoryStats();
            renderCategories();
            closeDeleteModal();

            showToast('Category deleted successfully!', 'success');

            // Reset the delete button
            deleteBtn.disabled = false;
            deleteBtn.textContent = originalText;
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast('Error deleting category', 'error');

            // Reset the delete button
            const deleteBtn = document.getElementById('confirm-delete-btn');
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Delete Category';
        }
    }

    // Utility functions
    function showLoading() {
        if (!categoryList) return;

        categoryList.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-circle-notch fa-spin"></i>
                <span>Loading categories...</span>
            </div>
        `;
    }

    function hideLoading() {
        // This will be replaced by renderCategories()
    }

    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');

        // Create toast if it doesn't exist
        if (!toastContainer) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
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

        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        });

        // Add to container
        document.getElementById('toast-container').appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto remove after 5 seconds
        setTimeout(() => {
            const toastContainer = document.getElementById('toast-container');
            if (toastContainer && toastContainer.contains(toast)) {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toastContainer.contains(toast)) {
                        toastContainer.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
    }

    function hexToRgba(hex, alpha = 1) {
        let r = 0, g = 0, b = 0;

        // 3 digits
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        }
        // 6 digits
        else if (hex.length === 7) {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
