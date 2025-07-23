import Modal from '../components/Modal.js';

export class Dashboard {
    constructor() {
        this.mockServers = [
            { id: 1, name: 'File System Server', status: 'running', uptime: '2d 4h', memory: '45MB', cpu: '2%' },
            { id: 2, name: 'Database Connector', status: 'running', uptime: '1d 12h', memory: '32MB', cpu: '1%' },
            { id: 3, name: 'Web Scraper', status: 'stopped', uptime: '0h', memory: '0MB', cpu: '0%' },
            { id: 4, name: 'Email Handler', status: 'error', uptime: '0h', memory: '0MB', cpu: '0%' }
        ];
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
                                <button id="add-server-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                    Add Server
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
                                    <p class="text-3xl font-bold text-gray-900">4</p>
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
                                    <p class="text-3xl font-bold text-green-600">2</p>
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
                                    <p class="text-3xl font-bold text-gray-500">1</p>
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
                                    <p class="text-3xl font-bold text-red-600">1</p>
                                </div>
                                <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <!-- Server Status -->
                        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h2 class="text-lg font-semibold text-gray-900">Server Status</h2>
                            </div>
                            <div class="p-6">
                                <div class="space-y-4">
                                    ${this.mockServers.map(server => `
                                        <div class="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                                            <div class="flex items-center space-x-3">
                                                <div class="w-3 h-3 rounded-full ${this.getStatusColor(server.status)}"></div>
                                                <div>
                                                    <p class="font-medium text-gray-900">${server.name}</p>
                                                    <p class="text-sm text-gray-600">Uptime: ${server.uptime}</p>
                                                </div>
                                            </div>
                                            <div class="text-right">
                                                <p class="text-sm text-gray-600">CPU: ${server.cpu}</p>
                                                <p class="text-sm text-gray-600">Memory: ${server.memory}</p>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- Recent Activity -->
                        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
                            </div>
                            <div class="p-6">
                                <div class="space-y-4">
                                    <div class="flex items-start space-x-3">
                                        <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                        <div>
                                            <p class="text-sm text-gray-900">File System Server started</p>
                                            <p class="text-xs text-gray-500">2 hours ago</p>
                                        </div>
                                    </div>
                                    <div class="flex items-start space-x-3">
                                        <div class="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                                        <div>
                                            <p class="text-sm text-gray-900">Email Handler encountered an error</p>
                                            <p class="text-xs text-gray-500">4 hours ago</p>
                                        </div>
                                    </div>
                                    <div class="flex items-start space-x-3">
                                        <div class="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                                        <div>
                                            <p class="text-sm text-gray-900">Web Scraper stopped</p>
                                            <p class="text-xs text-gray-500">6 hours ago</p>
                                        </div>
                                    </div>
                                    <div class="flex items-start space-x-3">
                                        <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                        <div>
                                            <p class="text-sm text-gray-900">Database Connector updated</p>
                                            <p class="text-xs text-gray-500">1 day ago</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
                        </div>
                        <div class="p-6">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button id="browse-registry-btn" class="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-900">Browse Registry</p>
                                            <p class="text-sm text-gray-600">Find new MCP servers</p>
                                        </div>
                                    </div>
                                </button>

                                <button id="claude-setup-btn" class="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-900">Configure Claude</p>
                                            <p class="text-sm text-gray-600">Set up Claude Desktop integration</p>
                                        </div>
                                    </div>
                                </button>

                                <button id="system-health-btn" class="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-900">System Health</p>
                                            <p class="text-sm text-gray-600">Monitor system resources</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const refreshBtn = document.getElementById('refresh-btn');
        const addServerBtn = document.getElementById('add-server-btn');
        const browseRegistryBtn = document.getElementById('browse-registry-btn');
        const claudeSetupBtn = document.getElementById('claude-setup-btn');
        const systemHealthBtn = document.getElementById('system-health-btn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }

        if (addServerBtn) {
            addServerBtn.addEventListener('click', () => {
                this.showAddServerModal();
            });
        }

        if (browseRegistryBtn) {
            browseRegistryBtn.addEventListener('click', () => {
                window.location.hash = 'registry';
            });
        }

        if (claudeSetupBtn) {
            claudeSetupBtn.addEventListener('click', () => {
                this.showClaudeSetupModal();
            });
        }

        if (systemHealthBtn) {
            systemHealthBtn.addEventListener('click', () => {
                this.showSystemHealthModal();
            });
        }
    }

    getStatusColor(status) {
        switch (status) {
            case 'running':
                return 'bg-green-500';
            case 'stopped':
                return 'bg-gray-400';
            case 'error':
                return 'bg-red-500';
            default:
                return 'bg-gray-400';
        }
    }

    refreshData() {
        console.log('Refreshing dashboard data...');
    }

    showAddServerModal() {
        const content = `
            <div class="space-y-4">
                <p class="text-gray-600">Choose how you want to add a new MCP server:</p>
                <div class="grid grid-cols-1 gap-3">
                    <button class="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div class="flex items-center space-x-3">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            <div>
                                <p class="font-medium text-gray-900">Browse Registry</p>
                                <p class="text-sm text-gray-600">Install from official registry</p>
                            </div>
                        </div>
                    </button>
                    <button class="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div class="flex items-center space-x-3">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            <div>
                                <p class="font-medium text-gray-900">Manual Installation</p>
                                <p class="text-sm text-gray-600">Add custom server configuration</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Add New Server',
            size: 'md'
        });
    }

    showClaudeSetupModal() {
        const content = `
            <div class="space-y-4">
                <p class="text-gray-600">Configure Claude Desktop to work with your MCP servers:</p>
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div class="flex">
                        <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-yellow-800">Claude Desktop not detected</p>
                            <p class="text-sm text-yellow-700">Please install Claude Desktop first</p>
                        </div>
                    </div>
                </div>
                <div class="space-y-3">
                    <button class="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <p class="font-medium text-gray-900">Auto-configure</p>
                        <p class="text-sm text-gray-600">Automatically set up config file</p>
                    </button>
                    <button class="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <p class="font-medium text-gray-900">Manual setup</p>
                        <p class="text-sm text-gray-600">Get instructions for manual configuration</p>
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Claude Desktop Integration',
            size: 'md'
        });
    }

    showSystemHealthModal() {
        const content = `
            <div class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div class="ml-3">
                                <p class="text-sm font-medium text-green-800">CPU Usage</p>
                                <p class="text-lg font-bold text-green-900">15%</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7c0 2.21-3.582 4-8 4s-8-1.79-8-4z"></path>
                            </svg>
                            <div class="ml-3">
                                <p class="text-sm font-medium text-primary-700">Memory</p>
                                <p class="text-lg font-bold text-primary-700">77MB</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-3">System Information</h4>
                    <dl class="grid grid-cols-1 gap-2 text-sm">
                        <div class="flex justify-between">
                            <dt class="text-gray-600">Platform:</dt>
                            <dd class="text-gray-900">macOS</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-gray-600">Architecture:</dt>
                            <dd class="text-gray-900">arm64</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-gray-600">Node.js:</dt>
                            <dd class="text-gray-900">v20.11.0</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-gray-600">Docker:</dt>
                            <dd class="text-gray-900">Available</dd>
                        </div>
                    </dl>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'System Health',
            size: 'md'
        });
    }
}