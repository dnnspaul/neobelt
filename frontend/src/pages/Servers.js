import Modal from '../components/Modal.js';

export class Servers {
    constructor() {
        this.mockServers = [
            {
                id: 1,
                name: 'File System Server',
                description: 'Provides access to local file system operations',
                version: '1.2.0',
                status: 'running',
                uptime: '2d 4h 12m',
                memory: '45MB',
                cpu: '2%',
                port: 8001,
                config: { allowedPaths: ['/Users/documents'], readOnly: false }
            },
            {
                id: 2,
                name: 'Database Connector',
                description: 'Connects to various database systems',
                version: '2.1.5',
                status: 'running',
                uptime: '1d 12h 45m',
                memory: '32MB',
                cpu: '1%',
                port: 8002,
                config: { databases: ['postgresql://localhost:5432'], maxConnections: 10 }
            },
            {
                id: 3,
                name: 'Web Scraper',
                description: 'Scrapes web content and extracts data',
                version: '0.8.2',
                status: 'stopped',
                uptime: '0h',
                memory: '0MB',
                cpu: '0%',
                port: 8003,
                config: { userAgent: 'Neobelt-Scraper', rateLimit: 1000 }
            },
            {
                id: 4,
                name: 'Email Handler',
                description: 'Manages email operations and notifications',
                version: '1.0.1',
                status: 'error',
                uptime: '0h',
                memory: '0MB',
                cpu: '0%',
                port: 8004,
                config: { smtp: 'smtp.gmail.com:587', ssl: true }
            }
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
                                <h1 class="text-2xl font-bold text-gray-900">Servers</h1>
                                <p class="text-gray-600">Manage your MCP servers</p>
                            </div>
                            <div class="flex space-x-3 ml-6 pr-6">
                                <button id="refresh-servers-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                    Refresh
                                </button>
                                <button id="add-new-server-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                    Add Server
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2">
                            <label class="text-sm font-medium text-gray-700">Filter:</label>
                            <div class="relative">
                                <select id="status-filter" class="text-sm border border-gray-300 rounded-md px-3 py-1 pr-8 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer">
                                    <option value="all">All Status</option>
                                    <option value="running">Running</option>
                                    <option value="stopped">Stopped</option>
                                    <option value="error">Error</option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <label class="text-sm font-medium text-gray-700">Search:</label>
                            <input id="server-search" type="text" placeholder="Search servers..." class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500">
                        </div>
                    </div>
                </div>

                <!-- Servers List -->
                <div class="flex-1 overflow-y-auto p-6">
                    <div class="grid grid-cols-1 gap-6">
                        ${this.mockServers.map(server => `
                            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div class="p-6">
                                    <div class="flex items-start justify-between">
                                        <div class="flex items-start space-x-4">
                                            <div class="w-12 h-12 ${this.getStatusBgColor(server.status)} rounded-lg flex items-center justify-center">
                                                <svg class="w-6 h-6 ${this.getStatusTextColor(server.status)}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"></path>
                                                </svg>
                                            </div>
                                            <div class="flex-1">
                                                <div class="flex items-center space-x-2">
                                                    <h3 class="text-lg font-semibold text-gray-900">${server.name}</h3>
                                                    <span class="px-2 py-1 text-xs font-medium ${this.getStatusBadgeColor(server.status)} rounded-full">${server.status.toUpperCase()}</span>
                                                </div>
                                                <p class="text-gray-600 mt-1 selectable-text">${server.description}</p>
                                                <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                                    <span>Version: ${server.version}</span>
                                                    <span>Port: ${server.port}</span>
                                                    <span>Uptime: ${server.uptime}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="flex items-center space-x-2">
                                            ${server.status === 'running' ? `
                                                <button class="server-stop-btn px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200" data-server-id="${server.id}">
                                                    Stop
                                                </button>
                                                <button class="server-restart-btn px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded hover:bg-yellow-200" data-server-id="${server.id}">
                                                    Restart
                                                </button>
                                            ` : server.status === 'stopped' ? `
                                                <button class="server-start-btn px-3 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded hover:bg-green-200" data-server-id="${server.id}">
                                                    Start
                                                </button>
                                            ` : `
                                                <button class="server-debug-btn px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200" data-server-id="${server.id}">
                                                    Debug
                                                </button>
                                            `}
                                            
                                            <div class="relative">
                                                <button class="server-menu-btn p-1 text-gray-400 hover:text-gray-600" data-server-id="${server.id}">
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Resource Usage -->
                                    <div class="mt-4 pt-4 border-t border-gray-200">
                                        <div class="grid grid-cols-3 gap-4 text-sm">
                                            <div class="flex items-center space-x-2">
                                                <div class="w-2 h-2 bg-primary-600 rounded-full"></div>
                                                <span class="text-gray-600">CPU: <span class="font-medium text-gray-900">${server.cpu}</span></span>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span class="text-gray-600">Memory: <span class="font-medium text-gray-900">${server.memory}</span></span>
                                            </div>
                                            <div class="flex items-center space-x-2">
                                                <div class="w-2 h-2 ${server.status === 'running' ? 'bg-green-500' : 'bg-gray-400'} rounded-full"></div>
                                                <span class="text-gray-600">Status: <span class="font-medium text-gray-900">${server.status}</span></span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Expandable Details -->
                                    <div class="mt-4">
                                        <button class="server-details-toggle text-sm text-primary-600 hover:text-primary-700" data-server-id="${server.id}">
                                            <span class="details-text">Show details</span>
                                            <svg class="w-4 h-4 inline ml-1 transform transition-transform details-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </button>
                                        <div class="server-details mt-3 hidden" data-server-id="${server.id}">
                                            <div class="bg-gray-50 rounded-lg p-4 text-sm">
                                                <h4 class="font-medium text-gray-900 mb-2">Configuration</h4>
                                                <pre class="text-gray-700 whitespace-pre-wrap">${JSON.stringify(server.config, null, 2)}</pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Header buttons
        const refreshBtn = document.getElementById('refresh-servers-btn');
        const addServerBtn = document.getElementById('add-new-server-btn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshServers());
        }

        if (addServerBtn) {
            addServerBtn.addEventListener('click', () => this.showAddServerWizard());
        }

        // Direct event listeners for server details toggle buttons
        const detailsToggleButtons = document.querySelectorAll('.server-details-toggle');
        detailsToggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const serverId = button.getAttribute('data-server-id');
                this.toggleServerDetails(serverId);
            });
        });

        // Other server action buttons with event delegation
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.addEventListener('click', (e) => {
                if (e.target.classList.contains('server-start-btn')) {
                    const serverId = e.target.getAttribute('data-server-id');
                    this.startServer(serverId);
                }
                
                if (e.target.classList.contains('server-stop-btn')) {
                    const serverId = e.target.getAttribute('data-server-id');
                    this.stopServer(serverId);
                }
                
                if (e.target.classList.contains('server-restart-btn')) {
                    const serverId = e.target.getAttribute('data-server-id');
                    this.restartServer(serverId);
                }

                if (e.target.classList.contains('server-debug-btn')) {
                    const serverId = e.target.getAttribute('data-server-id');
                    this.debugServer(serverId);
                }

                if (e.target.closest('.server-menu-btn')) {
                    const serverId = e.target.closest('.server-menu-btn').getAttribute('data-server-id');
                    this.showServerMenu(serverId, e.target);
                }
            });
        }

        // Filters
        const statusFilter = document.getElementById('status-filter');
        const searchInput = document.getElementById('server-search');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterServers());
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterServers());
        }
    }

    getStatusBgColor(status) {
        switch (status) {
            case 'running': return 'bg-green-100';
            case 'stopped': return 'bg-gray-100';
            case 'error': return 'bg-red-100';
            default: return 'bg-gray-100';
        }
    }

    getStatusTextColor(status) {
        switch (status) {
            case 'running': return 'text-green-600';
            case 'stopped': return 'text-gray-600';
            case 'error': return 'text-red-600';
            default: return 'text-gray-600';
        }
    }

    getStatusBadgeColor(status) {
        switch (status) {
            case 'running': return 'bg-green-100 text-green-800';
            case 'stopped': return 'bg-gray-100 text-gray-800';
            case 'error': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    refreshServers() {
        console.log('Refreshing servers...');
    }

    startServer(serverId) {
        console.log('Starting server:', serverId);
    }

    stopServer(serverId) {
        console.log('Stopping server:', serverId);
    }

    restartServer(serverId) {
        console.log('Restarting server:', serverId);
    }

    debugServer(serverId) {
        const server = this.mockServers.find(s => s.id == serverId);
        const content = `
            <div class="space-y-4">
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 class="font-medium text-red-800 mb-2">Error Details</h4>
                    <p class="text-sm text-red-700">Port 8004 is already in use by another process</p>
                </div>
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-2">Logs (last 50 lines)</h4>
                    <pre class="text-xs text-gray-700 whitespace-pre-wrap font-mono">2024-01-15 10:30:45 [INFO] Starting Email Handler server
2024-01-15 10:30:45 [ERROR] Failed to bind to port 8004: address already in use
2024-01-15 10:30:45 [ERROR] Server startup failed</pre>
                </div>
                <div class="flex space-x-3">
                    <button class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700">
                        Change Port
                    </button>
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        View Full Logs
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: `Debug ${server.name}`,
            size: 'lg'
        });
    }

    showServerMenu(serverId, target) {
        const server = this.mockServers.find(s => s.id == serverId);
        const content = `
            <div class="py-1">
                <button class="configure-server-btn w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" data-server-id="${serverId}">
                    Configure
                </button>
                <button class="view-logs-btn w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" data-server-id="${serverId}">
                    View Logs
                </button>
                <button class="export-config-btn w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" data-server-id="${serverId}">
                    Export Config
                </button>
                <button class="update-server-btn w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" data-server-id="${serverId}">
                    Update
                </button>
                <div class="border-t border-gray-100 my-1"></div>
                <button class="remove-server-btn w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" data-server-id="${serverId}">
                    Remove Server
                </button>
            </div>
        `;

        Modal.show(content, {
            title: `${server.name} Actions`,
            size: 'sm'
        });
    }

    toggleServerDetails(serverId) {
        const detailsEl = document.querySelector(`.server-details[data-server-id="${serverId}"]`);
        const toggleBtn = document.querySelector(`.server-details-toggle[data-server-id="${serverId}"]`);
        
        if (!detailsEl || !toggleBtn) {
            return;
        }
        
        const chevron = toggleBtn.querySelector('.details-chevron');
        const text = toggleBtn.querySelector('.details-text');

        if (detailsEl.classList.contains('hidden')) {
            detailsEl.classList.remove('hidden');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
            if (text) text.textContent = 'Hide details';
        } else {
            detailsEl.classList.add('hidden');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
            if (text) text.textContent = 'Show details';
        }
    }

    filterServers() {
        console.log('Filtering servers...');
    }

    showAddServerWizard() {
        const content = `
            <div class="space-y-6">
                <div class="text-center">
                    <p class="text-gray-600">How would you like to add a new MCP server?</p>
                </div>
                
                <div class="grid grid-cols-1 gap-4">
                    <button id="wizard-registry" class="p-6 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-medium text-gray-900">Browse Registry</h3>
                                <p class="text-sm text-gray-600">Install from the official MCP registry</p>
                            </div>
                        </div>
                    </button>

                    <button id="wizard-manual" class="p-6 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-medium text-gray-900">Manual Installation</h3>
                                <p class="text-sm text-gray-600">Add a custom server configuration</p>
                            </div>
                        </div>
                    </button>

                    <button id="wizard-import" class="p-6 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-medium text-gray-900">Import Configuration</h3>
                                <p class="text-sm text-gray-600">Import from a config file or URL</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Add New Server',
            size: 'lg'
        });

        // Add event listeners for wizard options
        setTimeout(() => {
            document.getElementById('wizard-registry')?.addEventListener('click', () => {
                Modal.hide();
                window.location.hash = 'registry';
            });

            document.getElementById('wizard-manual')?.addEventListener('click', () => {
                Modal.hide();
                this.showManualInstallWizard();
            });

            document.getElementById('wizard-import')?.addEventListener('click', () => {
                Modal.hide();
                this.showImportConfigWizard();
            });
        }, 100);
    }

    showManualInstallWizard() {
        const content = `
            <div class="space-y-6">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Server Name</label>
                        <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="My Custom Server">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" rows="2" placeholder="Brief description of what this server does"></textarea>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Command</label>
                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="node server.js">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Port</label>
                            <input type="number" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="8005">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Working Directory</label>
                        <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="/path/to/server">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Environment Variables</label>
                        <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" rows="3" placeholder="KEY1=value1
KEY2=value2"></textarea>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700">
                        Create Server
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Manual Server Installation',
            size: 'lg'
        });
    }

    showImportConfigWizard() {
        const content = `
            <div class="space-y-6">
                <div class="text-center">
                    <p class="text-gray-600">Import server configuration from a file or URL</p>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Import Method</label>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="radio" name="import-method" value="file" class="mr-2" checked>
                                <span class="text-sm text-gray-700">Upload configuration file</span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" name="import-method" value="url" class="mr-2">
                                <span class="text-sm text-gray-700">Import from URL</span>
                            </label>
                        </div>
                    </div>
                    
                    <div id="file-import" class="space-y-4">
                        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <div class="mt-4">
                                <label class="cursor-pointer">
                                    <span class="mt-2 block text-sm font-medium text-gray-900">
                                        Click to upload or drag and drop
                                    </span>
                                    <input type="file" class="sr-only" accept=".json,.yaml,.yml">
                                </label>
                                <p class="mt-1 text-xs text-gray-500">JSON or YAML files up to 10MB</p>
                            </div>
                        </div>
                    </div>
                    
                    <div id="url-import" class="hidden space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Configuration URL</label>
                            <input type="url" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="https://example.com/server-config.json">
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700">
                        Import Configuration
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Import Server Configuration',
            size: 'lg'
        });
    }
}