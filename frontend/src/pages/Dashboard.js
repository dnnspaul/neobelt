import Modal from '../components/Modal.js';
import { logger } from '../utils/logger.js';

export class Dashboard {
    constructor() {
        this.servers = [];
        this.serverStats = {
            total: 0,
            running: 0,
            stopped: 0,
            errors: 0
        };
        this.recentLogs = [];
        this.loading = true; // Start with loading state for better UX
        this.refreshInterval = null;
    }

    render() {
        return `
            <div class="h-full flex flex-col overflow-hidden">
                <!-- Header -->
                <div class="bg-white border-b border-gray-200 flex-shrink-0">
                    <div class="pl-6 pr-0 py-4">
                        <div class="flex items-center justify-between">
                            <div class="flex-1 min-w-0">
                                <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
                                <p class="text-gray-600">Overview of your MCP servers</p>
                            </div>
                            <div class="flex space-x-3 ml-6 pr-6">
                                <button id="refresh-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="flex-1 overflow-y-auto p-6">
                    <!-- Stats Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div class="flex items-center">
                                <div class="flex-1">
                                    <p class="text-sm font-medium text-gray-600">Total Servers</p>
                                    <p class="text-3xl font-bold text-gray-900">${this.serverStats.total}</p>
                                </div>
                                <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div class="flex items-center">
                                <div class="flex-1">
                                    <p class="text-sm font-medium text-gray-600">Running</p>
                                    <p class="text-3xl font-bold text-green-600">${this.serverStats.running}</p>
                                </div>
                                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div class="flex items-center">
                                <div class="flex-1">
                                    <p class="text-sm font-medium text-gray-600">Stopped</p>
                                    <p class="text-3xl font-bold text-gray-500">${this.serverStats.stopped}</p>
                                </div>
                                <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div class="flex items-center">
                                <div class="flex-1">
                                    <p class="text-sm font-medium text-gray-600">Errors</p>
                                    <p class="text-3xl font-bold text-red-600">${this.serverStats.errors}</p>
                                </div>
                                <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Logs -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <!-- Server Status -->
                        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h2 class="text-lg font-semibold text-gray-900">Server Status</h2>
                            </div>
                            <div class="p-6">
                                <div class="space-y-4" id="server-status-list">
                                    ${this.renderServerStatus()}
                                </div>
                            </div>
                        </div>

                        <!-- Recent Logs -->
                        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h2 class="text-lg font-semibold text-gray-900">Recent Logs</h2>
                            </div>
                            <div class="p-6">
                                <div class="space-y-4 max-h-96 overflow-y-auto" id="recent-logs-list">
                                    ${this.renderRecentLogs()}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const refreshBtn = document.getElementById('refresh-btn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                logger.debug('Refresh button clicked');
                this.refreshData();
            });
        }

        // Load initial data and start auto-refresh
        this.loadDashboardData();
        this.startAutoRefresh();
    }

    async loadDashboardData() {
        this.loading = true;
        try {
            logger.debug('Loading dashboard data...');
            
            // Load servers and recent logs in parallel
            const [servers, recentLogs] = await Promise.all([
                window.go.app.App.GetManagedContainers(),
                window.go.app.App.GetRecentLogMessages(100)
            ]);
            
            logger.debug('Loaded servers:', servers ? servers.length : 0);
            logger.debug('Loaded recent logs:', recentLogs ? recentLogs.length : 0);
            
            this.servers = servers || [];
            this.recentLogs = recentLogs || [];
            this.calculateStats();
            this.updateUI();
        } catch (error) {
            logger.error('Failed to load dashboard data:', error);
            this.servers = [];
            this.recentLogs = [];
            this.calculateStats();
            this.updateUI();
        }
        this.loading = false;
        this.updateUI();
    }

    async loadServers() {
        // For compatibility with existing refresh button
        await this.loadDashboardData();
    }

    calculateStats() {
        const stats = {
            total: this.servers.length,
            running: 0,
            stopped: 0,
            errors: 0
        };

        this.servers.forEach(server => {
            switch (server.state) {
                case 'running':
                    stats.running++;
                    break;
                case 'stopped':
                    stats.stopped++;
                    break;
                case 'error':
                case 'restarting':
                    stats.errors++;
                    break;
                default:
                    stats.stopped++;
                    break;
            }
        });

        this.serverStats = stats;
        logger.debug('Updated server stats:', JSON.stringify(this.serverStats));
    }

    renderLoadingState() {
        return `
            <div class="animate-pulse space-y-4">
                <div class="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                    <div class="flex items-center space-x-3">
                        <div class="w-3 h-3 bg-gray-300 rounded-full"></div>
                        <div>
                            <div class="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                            <div class="h-3 bg-gray-300 rounded w-16"></div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="h-3 bg-gray-300 rounded w-12 mb-1"></div>
                        <div class="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                </div>
                <div class="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                    <div class="flex items-center space-x-3">
                        <div class="w-3 h-3 bg-gray-300 rounded-full"></div>
                        <div>
                            <div class="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                            <div class="h-3 bg-gray-300 rounded w-20"></div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="h-3 bg-gray-300 rounded w-12 mb-1"></div>
                        <div class="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                </div>
                <div class="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                    <div class="flex items-center space-x-3">
                        <div class="w-3 h-3 bg-gray-300 rounded-full"></div>
                        <div>
                            <div class="h-4 bg-gray-300 rounded w-28 mb-2"></div>
                            <div class="h-3 bg-gray-300 rounded w-18"></div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="h-3 bg-gray-300 rounded w-12 mb-1"></div>
                        <div class="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                </div>
            </div>
        `;
    }

    renderLogsLoadingState() {
        return `
            <div class="animate-pulse space-y-4">
                <div class="flex items-start space-x-3">
                    <div class="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
                    <div class="min-w-0 flex-1">
                        <div class="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                        <div class="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                </div>
                <div class="flex items-start space-x-3">
                    <div class="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
                    <div class="min-w-0 flex-1">
                        <div class="h-4 bg-gray-300 rounded w-2/3 mb-1"></div>
                        <div class="h-3 bg-gray-300 rounded w-20"></div>
                    </div>
                </div>
                <div class="flex items-start space-x-3">
                    <div class="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
                    <div class="min-w-0 flex-1">
                        <div class="h-4 bg-gray-300 rounded w-5/6 mb-1"></div>
                        <div class="h-3 bg-gray-300 rounded w-24"></div>
                    </div>
                </div>
                <div class="flex items-start space-x-3">
                    <div class="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
                    <div class="min-w-0 flex-1">
                        <div class="h-4 bg-gray-300 rounded w-1/2 mb-1"></div>
                        <div class="h-3 bg-gray-300 rounded w-18"></div>
                    </div>
                </div>
                <div class="flex items-start space-x-3">
                    <div class="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
                    <div class="min-w-0 flex-1">
                        <div class="h-4 bg-gray-300 rounded w-4/5 mb-1"></div>
                        <div class="h-3 bg-gray-300 rounded w-22"></div>
                    </div>
                </div>
            </div>
        `;
    }

    renderServerStatus() {
        if (this.loading) {
            return this.renderLoadingState();
        }
        
        if (this.servers.length === 0) {
            return `
                <div class="text-center py-8">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No servers</h3>
                    <p class="mt-1 text-sm text-gray-500">Get started by adding a new server.</p>
                </div>
            `;
        }

        return this.servers.map(server => `
            <div class="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                <div class="flex items-center space-x-3">
                    <div class="w-3 h-3 rounded-full ${this.getStatusColor(server.state)}"></div>
                    <div>
                        <p class="font-medium text-gray-900">${server.display_name || server.name}</p>
                        <p class="text-sm text-gray-600">Uptime: ${server.uptime}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm text-gray-600">CPU: ${server.cpu}</p>
                    <p class="text-sm text-gray-600">Memory: ${server.memory}</p>
                </div>
            </div>
        `).join('');
    }

    renderRecentLogs() {
        if (this.loading) {
            return this.renderLogsLoadingState();
        }
        
        if (this.recentLogs.length === 0) {
            return `
                <div class="text-center py-8">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No recent logs</h3>
                    <p class="mt-1 text-sm text-gray-500">Logs will appear here as they happen.</p>
                </div>
            `;
        }

        // Sort logs by timestamp descending (newest first)
        const sortedLogs = [...this.recentLogs].sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        return sortedLogs.map(log => `
            <div class="flex items-start space-x-3">
                <div class="w-2 h-2 ${this.getLogLevelColor(log.level)} rounded-full mt-2 flex-shrink-0"></div>
                <div class="min-w-0 flex-1">
                    <p class="text-sm text-gray-900 break-words">${this.escapeHtml(log.message)}</p>
                    <p class="text-xs text-gray-500">${this.formatRelativeTime(log.timestamp)}</p>
                </div>
            </div>
        `).join('');
    }

    getLogLevelColor(level) {
        switch (level) {
            case 0: // Info
                return 'bg-blue-500';
            case 1: // Error
                return 'bg-red-500';
            case 2: // Debug
                return 'bg-gray-500';
            case 3: // Warning
                return 'bg-yellow-500';
            default:
                return 'bg-gray-400';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const logTime = new Date(timestamp);
        const diffMs = now - logTime;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) {
            return diffSeconds <= 1 ? 'just now' : `${diffSeconds} seconds ago`;
        } else if (diffMinutes < 60) {
            return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
        } else if (diffHours < 24) {
            return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
        } else {
            return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
        }
    }

    updateUI() {
        // Update statistics in the cards
        const totalEl = document.querySelector('.text-3xl.font-bold.text-gray-900');
        if (totalEl) totalEl.textContent = this.serverStats.total;

        const runningEl = document.querySelector('.text-3xl.font-bold.text-green-600');
        if (runningEl) runningEl.textContent = this.serverStats.running;

        const stoppedEl = document.querySelector('.text-3xl.font-bold.text-gray-500');
        if (stoppedEl) stoppedEl.textContent = this.serverStats.stopped;

        const errorsEl = document.querySelector('.text-3xl.font-bold.text-red-600');
        if (errorsEl) errorsEl.textContent = this.serverStats.errors;

        // Update server status list
        const serverStatusList = document.getElementById('server-status-list');
        if (serverStatusList) {
            serverStatusList.innerHTML = this.renderServerStatus();
        }

        // Update recent logs list
        const recentLogsList = document.getElementById('recent-logs-list');
        if (recentLogsList) {
            recentLogsList.innerHTML = this.renderRecentLogs();
        }
    }

    startAutoRefresh() {
        // Refresh every 5 seconds
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, 5000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async refreshData() {
        logger.debug('refreshData called');
        // Check if a modal is currently open before refreshing to prevent modal from closing
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            logger.debug('Modal detected, skipping dashboard refresh to preserve modal');
            return;
        }
        await this.loadDashboardData();
    }

    // Add cleanup method
    cleanup() {
        this.stopAutoRefresh();
    }

    getStatusColor(status) {
        switch (status) {
            case 'running':
                return 'bg-green-500';
            case 'stopped':
                return 'bg-gray-400';
            case 'error':
                return 'bg-red-500';
            case 'restarting':
                return 'bg-yellow-500';
            default:
                return 'bg-gray-400';
        }
    }



}