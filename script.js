const API_URL = 'http://localhost:4000';

// State
const appState = {
    orders: [],
    currentFilter: 'all',
    isLoading: false,
    settings: null
};

// DOM Elements
const elements = {
    // Navigation
    navLinks: document.querySelectorAll('.nav-link, .mobile-nav-link'),
    views: document.querySelectorAll('.view-section'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    closeMenuBtn: document.getElementById('close-menu-btn'),
    mobileMenu: document.getElementById('mobile-menu'),
    
    // Loading & Toasts
    loadingOverlay: document.getElementById('loading-overlay'),
    toastContainer: document.getElementById('toast-container'),
    
    // Dashboard Stats
    statTotal: document.getElementById('stat-total'),
    statPending: document.getElementById('stat-pending'),
    statAccepted: document.getElementById('stat-accepted'),
    statCompleted: document.getElementById('stat-completed'),
    statRejected: document.getElementById('stat-rejected'),
    latestOrdersTbody: document.getElementById('latest-orders-tbody'),
    latestOrdersEmpty: document.getElementById('latest-orders-empty'),
    
    // Orders View
    filterBtns: document.querySelectorAll('.filter-btn'),
    ordersGrid: document.getElementById('orders-grid'),
    ordersEmpty: document.getElementById('orders-empty'),
    
    // Create Order Form
    createOrderForm: document.getElementById('create-order-form'),
    btnResetForm: document.getElementById('btn-reset-form'),
    itemInput: document.getElementById('itemInput'),
    itemsChipsContainer: document.getElementById('items-chips-container'),
    
    // Sidebar Brand
    sidebarBrand: document.getElementById('sidebar-brand')
};

// Form State
let currentOrderItems = [];

// API Functions
const api = {
    async request(endpoint, options = {}) {
        app.setLoading(true);
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            app.showToast('Connection error. Is json-server running?', 'error');
            throw error;
        } finally {
            app.setLoading(false);
        }
    },
    
    getOrders: () => api.request('/orders'),
    getSettings: () => api.request('/settings'),
    createOrder: (data) => api.request('/orders', { method: 'POST', body: JSON.stringify(data) }),
    updateOrderStatus: (id, status) => api.request(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    deleteOrder: (id) => api.request(`/orders/${id}`, { method: 'DELETE' })
};

// App Logic
const app = {
    async init() {
        this.setupEventListeners();
        
        try {
            // Fetch initial data
            appState.settings = await api.getSettings();
            if(appState.settings && appState.settings.restaurantName) {
                elements.sidebarBrand.textContent = appState.settings.restaurantName;
            }
            
            await this.loadOrders();
        } catch (e) {
            console.log("Failed to initialize. Make sure json-server is running.");
        }
    },

    setupEventListeners() {
        // Navigation
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                this.switchView(target);
                this.closeMobileMenu();
            });
        });

        elements.mobileMenuBtn.addEventListener('click', () => this.openMobileMenu());
        elements.closeMenuBtn.addEventListener('click', () => this.closeMobileMenu());

        // Filters
        elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                elements.filterBtns.forEach(b => {
                    b.classList.remove('bg-primary', 'text-white', 'active');
                    b.classList.add('bg-stone-800', 'text-textMuted');
                });
                
                const target = e.currentTarget;
                target.classList.remove('bg-stone-800', 'text-textMuted');
                target.classList.add('bg-primary', 'text-white', 'active');
                
                appState.currentFilter = target.dataset.filter;
                this.renderOrdersView();
            });
        });

        // Form - Item Chips
        elements.itemInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const value = e.target.value.trim().replace(/,$/, '');
                if (value && !currentOrderItems.includes(value)) {
                    currentOrderItems.push(value);
                    this.renderChips();
                    e.target.value = '';
                }
            }
        });

        // Form Submit
        elements.createOrderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (currentOrderItems.length === 0) {
                this.showToast('Please add at least one item', 'error');
                return;
            }

            const customerName = document.getElementById('customerName').value;
            const totalPrice = parseFloat(document.getElementById('totalPrice').value);
            
            const newOrder = {
                id: Date.now().toString(),
                customerName,
                items: [...currentOrderItems],
                totalPrice,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            try {
                await api.createOrder(newOrder);
                this.showToast('Order created successfully!', 'success');
                this.resetForm();
                await this.loadOrders();
                this.switchView('orders-view'); // Redirect to orders
            } catch (error) {
                // Error handled in API wrapper
            }
        });

        // Form Reset
        elements.btnResetForm.addEventListener('click', () => this.resetForm());
    },

    switchView(viewId) {
        // Update nav styling
        elements.navLinks.forEach(link => {
            if (link.dataset.target === viewId) {
                link.classList.add('bg-primary/10', 'text-primary');
                link.classList.remove('text-textMuted', 'hover:bg-stone-700/50', 'hover:text-white');
            } else {
                link.classList.remove('bg-primary/10', 'text-primary');
                link.classList.add('text-textMuted', 'hover:bg-stone-700/50', 'hover:text-white');
            }
        });

        // Toggle visibility
        elements.views.forEach(view => {
            if (view.id === viewId) {
                view.classList.remove('hidden');
                view.classList.add('block');
            } else {
                view.classList.add('hidden');
                view.classList.remove('block');
            }
        });
    },

    openMobileMenu() {
        elements.mobileMenu.classList.remove('translate-x-full');
    },

    closeMobileMenu() {
        elements.mobileMenu.classList.add('translate-x-full');
    },

    setLoading(isLoading) {
        appState.isLoading = isLoading;
        if (isLoading) {
            elements.loadingOverlay.classList.remove('hidden');
        } else {
            elements.loadingOverlay.classList.add('hidden');
        }
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
        const icon = type === 'success' 
            ? '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
            : '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
        
        toast.className = `flex items-center text-white px-4 py-3 rounded-xl shadow-lg ${bgColor} animate-slide-in-right max-w-sm`;
        toast.innerHTML = `${icon} <span class="font-medium text-sm">${message}</span>`;
        
        elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('animate-slide-in-right');
            toast.classList.add('animate-fade-out-right');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    async loadOrders() {
        try {
            appState.orders = await api.getOrders();
            // Sort by createdAt desc
            appState.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            this.updateDashboard();
            this.renderOrdersView();
        } catch(e) {
            console.error("Error loading orders", e);
        }
    },

    updateDashboard() {
        const orders = appState.orders;
        
        // Update Stats
        const stats = orders.reduce((acc, order) => {
            acc.total++;
            if (acc[order.status] !== undefined) acc[order.status]++;
            return acc;
        }, { total: 0, pending: 0, accepted: 0, completed: 0, rejected: 0 });

        elements.statTotal.textContent = stats.total;
        elements.statPending.textContent = stats.pending;
        elements.statAccepted.textContent = stats.accepted;
        elements.statCompleted.textContent = stats.completed;
        elements.statRejected.textContent = stats.rejected;

        // Update Latest 5 Orders Table
        elements.latestOrdersTbody.innerHTML = '';
        const latest = orders.slice(0, 5);
        
        if (latest.length === 0) {
            elements.latestOrdersEmpty.classList.remove('hidden');
        } else {
            elements.latestOrdersEmpty.classList.add('hidden');
            latest.forEach(order => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-stone-800 transition-colors border-b border-stone-700';
                tr.innerHTML = `
                    <td class="p-4 font-medium text-white">#${order.id.slice(-6)}</td>
                    <td class="p-4">${order.customerName}</td>
                    <td class="p-4 font-medium text-emerald-400">$${order.totalPrice.toFixed(2)}</td>
                    <td class="p-4">${this.getStatusBadge(order.status)}</td>
                `;
                elements.latestOrdersTbody.appendChild(tr);
            });
        }
    },

    renderOrdersView() {
        const filtered = appState.currentFilter === 'all' 
            ? appState.orders 
            : appState.orders.filter(o => o.status === appState.currentFilter);

        elements.ordersGrid.innerHTML = '';
        
        if (filtered.length === 0) {
            elements.ordersEmpty.classList.remove('hidden');
        } else {
            elements.ordersEmpty.classList.add('hidden');
            filtered.forEach((order, index) => {
                const card = document.createElement('div');
                card.className = `bg-cardBg border border-stone-700/50 rounded-2xl p-5 shadow-sm hover:border-stone-600 transition-colors animate-slide-up flex flex-col`;
                card.style.animationDelay = `${index * 0.05}s`;
                
                const date = new Date(order.createdAt).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                card.innerHTML = `
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <span class="text-xs font-mono text-textMuted block mb-1">#${order.id}</span>
                            <h4 class="text-lg font-bold text-white">${order.customerName}</h4>
                        </div>
                        ${this.getStatusBadge(order.status)}
                    </div>
                    
                    <div class="text-xs text-textMuted mb-4">${date}</div>
                    
                    <div class="mb-4 flex-1">
                        <div class="flex flex-wrap gap-2">
                            ${order.items.map(item => `<span class="px-2 py-1 bg-stone-900 text-stone-300 text-xs rounded-lg border border-stone-700">${item}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between mt-auto pt-4 border-t border-stone-700/50">
                        <div class="text-lg font-bold text-emerald-400">$${order.totalPrice.toFixed(2)}</div>
                        
                        <div class="flex items-center gap-2">
                            <select onchange="app.handleStatusChange('${order.id}', this.value)" class="bg-stone-900 border border-stone-700 text-stone-300 text-sm rounded-lg px-2 py-1.5 focus:border-amber-500 focus:outline-none appearance-none pr-8 relative custom-select">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="accepted" ${order.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                                <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                                <option value="rejected" ${order.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                            </select>
                            
                            <button onclick="app.handleDeleteOrder('${order.id}')" class="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Order">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </div>
                `;
                elements.ordersGrid.appendChild(card);
            });
        }
    },

    getStatusBadge(status) {
        const styles = {
            pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
            accepted: 'bg-green-500/20 text-green-400',
            completed: 'bg-blue-500/20 text-blue-400',
            rejected: 'bg-red-500/20 text-red-400'
        };
        const style = styles[status] || 'bg-stone-500/20 text-stone-400';
        return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold ${style} capitalize inline-flex items-center shadow-sm">
            ${status}
        </span>`;
    },

    async handleStatusChange(id, newStatus) {
        try {
            await api.updateOrderStatus(id, newStatus);
            this.showToast('Status updated successfully');
            await this.loadOrders();
        } catch(e) {
            this.showToast('Failed to update status', 'error');
            this.renderOrdersView(); // reset dropdown
        }
    },

    async handleDeleteOrder(id) {
        if (!confirm('Are you sure you want to delete this order?')) return;
        try {
            await api.deleteOrder(id);
            this.showToast('Order deleted successfully');
            await this.loadOrders();
        } catch(e) {
            this.showToast('Failed to delete order', 'error');
        }
    },

    // Form Chip Methods
    renderChips() {
        elements.itemsChipsContainer.innerHTML = currentOrderItems.map((item, index) => `
            <span class="bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded-lg text-sm flex items-center animate-fade-in">
                ${item}
                <button type="button" onclick="app.removeChip(${index})" class="ml-1.5 text-primary hover:text-white rounded-full p-0.5 transition-colors focus:outline-none">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </span>
        `).join('');
    },

    removeChip(index) {
        currentOrderItems.splice(index, 1);
        this.renderChips();
    },

    resetForm() {
        elements.createOrderForm.reset();
        currentOrderItems = [];
        this.renderChips();
    }
};

// Expose app methods to global scope for inline HTML event handlers
window.app = app;

// Init
document.addEventListener('DOMContentLoaded', () => app.init());