document.addEventListener('DOMContentLoaded', function () {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function () {
            sidebar.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
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

    // Notification button
    const notificationButton = document.getElementById('notification-link');

    if (notificationButton) {
        notificationButton.addEventListener('click', () => {
            window.location.href = '../notifications/notifications.html';
        });
    }

    // Pump selector
    const pumpSelector = document.getElementById('pump-selector');
    if (pumpSelector) {
        pumpSelector.addEventListener('change', function () {
            updatePumpDetails(this.value);
        });
    }

    // Chart period buttons
    const chartButtons = document.querySelectorAll('.chart-btn');
    if (chartButtons) {
        chartButtons.forEach(button => {
            button.addEventListener('click', function () {
                // Remove active class from all buttons
                chartButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                // Update chart data
                updatePerformanceChart(this.dataset.period);
            });
        });
    }

    // Energy time period selector
    const energyTimeSelector = document.getElementById('energy-time-selector');
    if (energyTimeSelector) {
        energyTimeSelector.addEventListener('change', function () {
            updateEnergyChart(this.value);
        });
    }

    // Initialize charts
    initializeCharts();

    // Pump control buttons with enhanced effects
    const startBtn = document.querySelector('.start-btn');
    const stopBtn = document.querySelector('.stop-btn');
    const resetBtn = document.querySelector('.reset-btn');

    if (startBtn) {
        startBtn.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default button behavior

            // Show success toast
            showToast('Pump started successfully', 'success');
            updatePumpStatus('active');
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default button behavior

            // Show warning toast
            showToast('Pump stopped successfully', 'warning');
            updatePumpStatus('offline');
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default button behavior

            // Show info toast
            showToast('Pump system reset successfully', 'info');
            updatePumpStatus('active');
        });
    }

    // Alert action buttons
    const alertButtons = document.querySelectorAll('.btn-alert-action');
    if (alertButtons) {
        alertButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault(); // Prevent default button behavior

                const alertItem = this.closest('.alert-item');
                const alertTitle = alertItem.querySelector('h3').textContent;

                showToast(`Action taken for: ${alertTitle}`, 'info');
                // Visual feedback
                alertItem.style.opacity = '0.7';
                setTimeout(() => {
                    alertItem.style.opacity = '1';
                }, 500);
            });
        });
    }

    // Schedule button
    const scheduleBtn = document.querySelector('.btn-schedule');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default button behavior

            showToast('Maintenance scheduling feature will be available soon', 'info');
        });
    }

    // Show toast notification
    function showToast(message, type = 'info') {
        // Check if a toast container exists
        let toastContainer = document.getElementById('toast-container');

        // Create one if it doesn't exist
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.bottom = '20px';
            toastContainer.style.right = '20px';
            toastContainer.style.zIndex = '1000';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.classList.add('toast', `toast-${type}`);
        toast.style.minWidth = '250px';
        toast.style.backgroundColor = getToastColor(type);
        toast.style.color = 'white';
        toast.style.borderRadius = '4px';
        toast.style.padding = '12px 20px';
        toast.style.marginBottom = '10px';
        toast.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.justifyContent = 'space-between';
        toast.style.animation = 'slideInRight 0.3s, fadeOut 0.5s 2.5s forwards';

        // Add icon based on type
        const icon = document.createElement('i');
        icon.classList.add('bi');
        icon.classList.add(getToastIcon(type));
        icon.style.marginRight = '10px';

        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;

        const content = document.createElement('div');
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.appendChild(icon);
        content.appendChild(messageSpan);

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'white';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.marginLeft = '10px';
        closeBtn.onclick = function () {
            toast.style.opacity = '0';
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        };

        toast.appendChild(content);
        toast.appendChild(closeBtn);

        // Add to container
        toastContainer.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    function getToastColor(type) {
        switch (type) {
            case 'success': return '#43a047';
            case 'warning': return '#ffa000';
            case 'error': return '#e53935';
            case 'info':
            default: return '#1976d2';
        }
    }

    function getToastIcon(type) {
        switch (type) {
            case 'success': return 'bi-check-circle-fill';
            case 'warning': return 'bi-exclamation-triangle-fill';
            case 'error': return 'bi-x-circle-fill';
            case 'info':
            default: return 'bi-info-circle-fill';
        }
    }

    // Function to initialize charts
    function initializeCharts() {
        // Performance chart - SIMPLIFIED VERSION WITH SINGLE Y AXIS
        const performanceCtx = document.getElementById('pumpPerformanceChart');
        if (performanceCtx) {
            // Create gradient for chart background
            const ctx = performanceCtx.getContext('2d');
            const flowGradient = ctx.createLinearGradient(0, 0, 0, 400);
            flowGradient.addColorStop(0, 'rgba(25, 118, 210, 0.2)');
            flowGradient.addColorStop(1, 'rgba(25, 118, 210, 0.0)');

            const powerGradient = ctx.createLinearGradient(0, 0, 0, 400);
            powerGradient.addColorStop(0, 'rgba(255, 160, 0, 0.2)');
            powerGradient.addColorStop(1, 'rgba(255, 160, 0, 0.0)');

            const pressureGradient = ctx.createLinearGradient(0, 0, 0, 400);
            pressureGradient.addColorStop(0, 'rgba(67, 160, 71, 0.2)');
            pressureGradient.addColorStop(1, 'rgba(67, 160, 71, 0.0)');

            window.performanceChart = new Chart(performanceCtx, {
                type: 'line',
                data: {
                    labels: ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
                    datasets: [
                        {
                            label: 'Flow Rate (L/min)',
                            data: [78, 82, 85, 75, 80, 85, 88, 85],
                            borderColor: 'rgba(25, 118, 210, 1)',
                            backgroundColor: flowGradient,
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: 'rgba(25, 118, 210, 1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Power Usage (kW)',
                            data: [55, 62, 73, 60, 65, 70, 75, 68],
                            borderColor: 'rgba(255, 160, 0, 1)',
                            backgroundColor: powerGradient,
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: 'rgba(255, 160, 0, 1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Pressure (bar)',
                            data: [85, 76, 78, 80, 82, 79, 81, 77],
                            borderColor: 'rgba(67, 160, 71, 1)',
                            backgroundColor: pressureGradient,
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: 'rgba(67, 160, 71, 1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(50, 50, 50, 0.9)',
                            titleFont: {
                                size: 14,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 13
                            },
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: true,
                            boxWidth: 10,
                            boxHeight: 10,
                            boxPadding: 3
                        },
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                drawBorder: false,
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                font: {
                                    size: 11
                                },
                                callback: function (value) {
                                    return value;
                                }
                            },
                            title: {
                                display: true,
                                text: 'System Throughput',
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 11
                                }
                            }
                        }
                    }
                }
            });
        }

        // Energy consumption chart
        const energyCtx = document.getElementById('energyConsumptionChart');
        if (energyCtx) {
            // Create gradients for bars
            const ctx = energyCtx.getContext('2d');
            const energyGradient = ctx.createLinearGradient(0, 0, 0, 400);
            energyGradient.addColorStop(0, 'rgba(25, 118, 210, 0.9)');
            energyGradient.addColorStop(1, 'rgba(25, 118, 210, 0.6)');

            const waterGradient = ctx.createLinearGradient(0, 0, 0, 400);
            waterGradient.addColorStop(0, 'rgba(67, 160, 71, 0.9)');
            waterGradient.addColorStop(1, 'rgba(67, 160, 71, 0.6)');

            window.energyChart = new Chart(energyCtx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                        {
                            label: 'Energy Consumption (kWh)',
                            data: [52, 48, 50, 45, 55, 40, 35],
                            backgroundColor: energyGradient,
                            borderWidth: 0,
                            borderRadius: 4,
                            hoverBackgroundColor: 'rgba(25, 118, 210, 1)'
                        },
                        {
                            label: 'Water Pumped (kL)',
                            data: [7.5, 7.2, 7.8, 6.9, 8.2, 7.0, 6.5],
                            backgroundColor: waterGradient,
                            borderWidth: 0,
                            borderRadius: 4,
                            hoverBackgroundColor: 'rgba(67, 160, 71, 1)'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(50, 50, 50, 0.9)',
                            titleFont: {
                                size: 14,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 13
                            },
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: true
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Value',
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                drawBorder: false,
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                font: {
                                    size: 11
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 11
                                }
                            }
                        }
                    }
                }
            });
        }

        // Add animation to metric cards
        animateMetricValues();
    }

    // Animate metric values
    function animateMetricValues() {
        const metricValues = document.querySelectorAll('.metric-value');

        metricValues.forEach(valueElement => {
            const valueText = valueElement.textContent;
            const numberPart = parseFloat(valueText);
            const unitPart = valueText.replace(numberPart, '');

            // Reset content for animation
            valueElement.textContent = '0' + unitPart;

            // Animate to actual value
            let start = 0;
            const end = numberPart;
            const duration = 1500;
            const startTime = performance.now();

            function animateNumber(currentTime) {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);

                // Easing function for smooth animation
                const easeOutQuad = function (t) { return t * (2 - t); };
                const easedProgress = easeOutQuad(progress);

                const currentValue = start + (end - start) * easedProgress;
                valueElement.textContent = currentValue.toFixed(1) + unitPart;

                if (progress < 1) {
                    requestAnimationFrame(animateNumber);
                }
            }

            requestAnimationFrame(animateNumber);
        });
    }

    // Function to update performance chart data based on selected period
    function updatePerformanceChart(period) {
        if (!window.performanceChart) return;

        let labels, flowData, powerData, pressureData;

        switch (period) {
            case 'daily':
                labels = ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
                flowData = [78, 82, 85, 75, 80, 85, 88, 85];
                powerData = [55, 62, 73, 60, 65, 70, 75, 68];
                pressureData = [85, 76, 78, 80, 82, 79, 81, 77];
                break;

            case 'weekly':
                labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                flowData = [80, 82, 78, 85, 84, 75, 82];
                // Scale up powerData and pressureData to make them appear closer to flowData line
                powerData = [72, 75, 70, 78, 76, 68, 74];
                pressureData = [78, 80, 76, 82, 81, 72, 79];
                break;

            case 'monthly':
                labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                flowData = [81, 83, 80, 84];
                // Scale up powerData and pressureData to make them appear closer to flowData line
                powerData = [77, 79, 75, 80];
                pressureData = [79, 81, 78, 82];
                break;

            default:
                return;
        }

        // Complete chart reset to fix persistence issues when switching periods
        window.performanceChart.data.labels = labels;
        window.performanceChart.data.datasets[0].data = flowData;
        window.performanceChart.data.datasets[1].data = powerData;
        window.performanceChart.data.datasets[2].data = pressureData;
        window.performanceChart.update('none');
    }

    // Function to update energy chart based on selected period
    function updateEnergyChart(period) {
        if (!window.energyChart) return;

        let labels, energyData, waterData;

        switch (period) {
            case 'week':
                labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                energyData = [52, 48, 50, 45, 55, 40, 35];
                waterData = [58, 52, 54, 50, 60, 45, 40];
                break;

            case 'month':
                labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                energyData = [210, 195, 230, 200];
                waterData = [28, 27, 32, 30];
                break;

            case 'quarter':
                labels = ['Jan', 'Feb', 'Mar'];
                energyData = [900, 850, 950];
                waterData = [120, 115, 130];
                break;

            case 'year':
                labels = ['Q1', 'Q2', 'Q3', 'Q4'];
                energyData = [2700, 3100, 2900, 2800];
                waterData = [360, 420, 390, 370];
                break;

            default:
                return;
        }

        // Complete chart reset to fix persistence issues when switching periods
        window.energyChart.data.labels = labels;
        window.energyChart.data.datasets[0].data = energyData;
        window.energyChart.data.datasets[1].data = waterData;
        window.energyChart.update('none');
    }

    // Function to update pump status indicator
    function updatePumpStatus(status) {
        const statusIndicator = document.querySelector('.status-indicator');
        if (!statusIndicator) return;

        // Remove all status classes
        statusIndicator.classList.remove('active', 'warning', 'offline', 'maintenance');

        // Add appropriate status class
        statusIndicator.classList.add(status);

        // Update text
        const statusText = statusIndicator.querySelector('span');
        if (statusText) {
            switch (status) {
                case 'active':
                    statusText.textContent = 'Active';
                    break;
                case 'warning':
                    statusText.textContent = 'Warning';
                    break;
                case 'offline':
                    statusText.textContent = 'Offline';
                    break;
                case 'maintenance':
                    statusText.textContent = 'Maintenance';
                    break;
            }
        }

        // Update last updated time
        const lastUpdated = document.querySelector('.last-updated span');
        if (lastUpdated) {
            lastUpdated.textContent = 'Updated: Just now';
        }

        // Add highlighting effect
        statusIndicator.style.transform = 'scale(1.1)';
        statusIndicator.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.15)';

        setTimeout(() => {
            statusIndicator.style.transform = '';
            statusIndicator.style.boxShadow = '';
        }, 500);
    }

    // Add logout functionality
    document.querySelectorAll('.logout').forEach(element => {
        element.addEventListener('click', function (e) {
            e.preventDefault();
            // Perform logout actions here
            console.log('Logging out...');
            localStorage.removeItem('token');
            window.location.href = '../../../index.html';
        });
    });

    // Handle window resize to redraw charts properly
    window.addEventListener('resize', function () {
        if (window.performanceChart) {
            window.performanceChart.resize();
        }
        if (window.energyChart) {
            window.energyChart.resize();
        }
    });
    switch (period) {
        case 'week':
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            energyData = [52, 48, 50, 45, 55, 40, 35];
            waterData = [7.5, 7.2, 7.8, 6.9, 8.2, 7.0, 6.5];
            break;

        case 'month':
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            energyData = [210, 195, 230, 200];
            waterData = [28, 27, 32, 30];
            break;

        case 'quarter':
            labels = ['Jan', 'Feb', 'Mar'];
            energyData = [900, 850, 950];
            waterData = [120, 115, 130];
            break;

        case 'year':
            labels = ['Q1', 'Q2', 'Q3', 'Q4'];
            energyData = [2700, 3100, 2900, 2800];
            waterData = [360, 420, 390, 370];
            break;

        default:
            return;
    }

    // Update chart labels immediately
    window.energyChart.data.labels = labels;

    // Animate datasets with a slight delay between them
    animateChartDataset(window.energyChart, 0, energyData, 1000);
    setTimeout(() => {
        animateChartDataset(window.energyChart, 1, waterData, 1000);
    }, 200);

    // Function to update pump status indicator
    function updatePumpStatus(status) {
        const statusIndicator = document.querySelector('.status-indicator');
        if (!statusIndicator) return;

        // Remove all status classes
        statusIndicator.classList.remove('active', 'warning', 'offline', 'maintenance');

        // Add appropriate status class
        statusIndicator.classList.add(status);

        // Update text
        const statusText = statusIndicator.querySelector('span');
        if (statusText) {
            switch (status) {
                case 'active':
                    statusText.textContent = 'Active';
                    break;
                case 'warning':
                    statusText.textContent = 'Warning';
                    break;
                case 'offline':
                    statusText.textContent = 'Offline';
                    break;
                case 'maintenance':
                    statusText.textContent = 'Maintenance';
                    break;
            }
        }

        // Update last updated time
        const lastUpdated = document.querySelector('.last-updated span');
        if (lastUpdated) {
            lastUpdated.textContent = 'Updated: Just now';
        }

        // Add highlighting effect
        statusIndicator.style.transform = 'scale(1.1)';
        statusIndicator.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.15)';

        setTimeout(() => {
            statusIndicator.style.transform = '';
            statusIndicator.style.boxShadow = '';
        }, 500);
    }

    // Function to update pump details based on selected pump
    function updatePumpDetails(pumpId) {
        // Show loading state
        const pumpStatusInfo = document.querySelector('.pump-status-info');
        const pumpPerformance = document.querySelector('.pump-performance');

        if (pumpStatusInfo && pumpPerformance) {
            pumpStatusInfo.style.opacity = '0.6';
            pumpPerformance.style.opacity = '0.6';

            setTimeout(() => {
                // Simulate data loading
                showToast(`Loading data for pump: ${pumpId}`, 'info');

                // Restore opacity after "loading"
                pumpStatusInfo.style.opacity = '1';
                pumpPerformance.style.opacity = '1';

                // Update performance chart with new random data
                if (window.performanceChart) {
                    const randomFlow = Array.from({ length: 8 }, () => Math.floor(Math.random() * 15) + 75);
                    const randomPower = Array.from({ length: 8 }, () => (Math.random() * 0.5 + 1).toFixed(1));
                    const randomPressure = Array.from({ length: 8 }, () => (Math.random() * 0.8 + 3.8).toFixed(1));

                    animateChartDataset(window.performanceChart, 0, randomFlow, 1000);
                    setTimeout(() => {
                        animateChartDataset(window.performanceChart, 1, randomPower, 1000);
                    }, 200);
                    setTimeout(() => {
                        animateChartDataset(window.performanceChart, 2, randomPressure, 1000);
                    }, 400);
                }

                // Update metric values with animation
                updateMetricValues();
            }, 800);
        }
    }

    // Function to update metric values with animation
    function updateMetricValues() {
        const metricValues = document.querySelectorAll('.metric-value');

        metricValues.forEach(valueElement => {
            const valueText = valueElement.textContent;
            const numberPart = parseFloat(valueText);
            const unitPart = valueText.replace(numberPart, '');

            // Generate new random value based on unit type
            let newValue;
            if (unitPart.includes('hrs')) {
                newValue = (Math.random() * 3 + 5).toFixed(1);
            } else if (unitPart.includes('kWh')) {
                newValue = (Math.random() * 5 + 10).toFixed(1);
            } else if (unitPart.includes('L/min')) {
                newValue = Math.floor(Math.random() * 20 + 75);
            } else if (unitPart.includes('bar')) {
                newValue = (Math.random() * 1 + 3.8).toFixed(1);
            } else {
                newValue = numberPart;
            }

            // Animate to new value
            let start = numberPart;
            const end = parseFloat(newValue);
            const duration = 1000;
            const startTime = performance.now();

            function animateNumber(currentTime) {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);

                // Easing function for smooth animation
                const easeOutQuad = function (t) { return t * (2 - t); };
                const easedProgress = easeOutQuad(progress);

                const currentValue = start + (end - start) * easedProgress;
                valueElement.textContent = currentValue.toFixed(1).replace(/\.0$/, '') + unitPart;

                if (progress < 1) {
                    requestAnimationFrame(animateNumber);
                }
            }

            requestAnimationFrame(animateNumber);

            // Also update progress bars
            const progressParent = valueElement.closest('.metric-data');
            if (progressParent) {
                const progressBar = progressParent.querySelector('.progress');
                if (progressBar) {
                    let percentage;
                    if (unitPart.includes('hrs')) {
                        percentage = (newValue / 10) * 100;
                    } else if (unitPart.includes('kWh')) {
                        percentage = (newValue / 20) * 100;
                    } else if (unitPart.includes('L/min')) {
                        percentage = (newValue / 100) * 100;
                    } else if (unitPart.includes('bar')) {
                        percentage = (newValue / 6) * 100;
                    } else {
                        percentage = 50;
                    }

                    // Animate progress bar
                    const currentWidth = parseInt(progressBar.style.width) || 0;
                    animateProgressBar(progressBar, currentWidth, percentage);
                }
            }
        });
    }

    // Function to animate progress bar
    function animateProgressBar(element, start, end) {
        const duration = 1000;
        const startTime = performance.now();

        function updateProgress(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            const easeOutQuad = function (t) { return t * (2 - t); };
            const easedProgress = easeOutQuad(progress);

            const currentWidth = start + (end - start) * easedProgress;
            element.style.width = currentWidth + '%';

            if (progress < 1) {
                requestAnimationFrame(updateProgress);
            }
        }

        requestAnimationFrame(updateProgress);
    }

    // Add CSS for toast and remove ripple effect
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        .control-btn {
            position: relative;
            overflow: hidden;
            width: 120px !important;
            max-width: 120px !important;
            flex: 0 0 120px !important;
            transform: none !important;
        }
    `;
    document.head.appendChild(style);

    // Add logout functionality
    document.querySelectorAll('.logout').forEach(element => {
        element.addEventListener('click', function (e) {
            e.preventDefault();
            // Perform logout actions here
            console.log('Logging out...');
            localStorage.removeItem('token');
            window.location.href = '../../../index.html';
        });
    });

    // Handle window resize to redraw charts properly
    window.addEventListener('resize', function () {
        if (window.performanceChart) {
            window.performanceChart.resize();
        }
        if (window.energyChart) {
            window.energyChart.resize();
        }
    });

    // Add hover effects to timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineItems) {
        timelineItems.forEach(item => {
            item.addEventListener('mouseenter', function () {
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.1)';
            });

            item.addEventListener('mouseleave', function () {
                this.style.transform = '';
                this.style.boxShadow = '';
            });
        });
    }

    document.head.appendChild(style);

    // Add logout functionality
    document.querySelectorAll('.logout').forEach(element => {
        element.addEventListener('click', function (e) {
            e.preventDefault();
            // Perform logout actions here
            console.log('Logging out...');
            localStorage.removeItem('token');
            window.location.href = '../../../index.html';
        });
    });

    // Handle window resize to redraw charts properly
    window.addEventListener('resize', function () {
        if (window.performanceChart) {
            window.performanceChart.resize();
        }
        if (window.energyChart) {
            window.energyChart.resize();
        }
    });
});
