import Modal from '../components/Modal.js';

export class Registry {
    constructor() {
        this.mockServers = [
            {
                id: 1,
                name: 'File System MCP',
                author: 'Anthropic',
                description: 'Provides secure access to local file system operations including reading, writing, and directory management.',
                version: '1.2.0',
                downloads: 15420,
                rating: 4.8,
                tags: ['filesystem', 'files', 'official'],
                installed: false,
                official: true,
                lastUpdated: '2024-01-10',
                size: '2.1 MB'
            },
            {
                id: 2,
                name: 'PostgreSQL Connector',
                author: 'Database Team',
                description: 'Connect to PostgreSQL databases with full query support, transactions, and connection pooling.',
                version: '2.0.5',
                downloads: 8730,
                rating: 4.6,
                tags: ['database', 'postgresql', 'sql'],
                installed: true,
                official: true,
                lastUpdated: '2024-01-08',
                size: '3.8 MB'
            },
            {
                id: 3,
                name: 'Web Scraper Pro',
                author: 'Community',
                description: 'Advanced web scraping capabilities with support for JavaScript-heavy sites, rate limiting, and proxy rotation.',
                version: '0.9.2',
                downloads: 5240,
                rating: 4.2,
                tags: ['scraping', 'web', 'automation'],
                installed: false,
                official: false,
                lastUpdated: '2024-01-05',
                size: '4.2 MB'
            },
            {
                id: 4,
                name: 'Email Integration',
                author: 'Communication Tools',
                description: 'Send and receive emails, manage attachments, and integrate with popular email providers.',
                version: '1.1.8',
                downloads: 12100,
                rating: 4.4,
                tags: ['email', 'smtp', 'communication'],
                installed: false,
                official: true,
                lastUpdated: '2024-01-12',
                size: '2.9 MB'
            },
            {
                id: 5,
                name: 'REST API Client',
                author: 'API Tools',
                description: 'Make HTTP requests to REST APIs with authentication, headers, and response parsing.',
                version: '1.5.3',
                downloads: 9870,
                rating: 4.7,
                tags: ['api', 'http', 'rest'],
                installed: false,
                official: true,
                lastUpdated: '2024-01-11',
                size: '1.8 MB'
            },
            {
                id: 6,
                name: 'Docker Manager',
                author: 'DevOps Community',
                description: 'Manage Docker containers, images, and compose files directly from Claude.',
                version: '0.7.1',
                downloads: 3420,
                rating: 4.0,
                tags: ['docker', 'containers', 'devops'],
                installed: false,
                official: false,
                lastUpdated: '2024-01-09',
                size: '5.1 MB'
            }
        ];

        this.filteredServers = [...this.mockServers];
        this.currentCategory = 'all';
        this.currentSort = 'popularity';
    }

    render() {
        return `
            <div class="h-full flex flex-col overflow-hidden">
                <!-- Header -->
                <div class="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
                    <div class="pl-6 pr-0 py-4">
                        <div class="flex items-center justify-between">
                            <div class="flex-1 min-w-0">
                                <h1 class="text-2xl font-bold text-gray-900">Registry</h1>
                                <p class="text-gray-600">Discover and install MCP servers</p>
                            </div>
                            <div class="flex space-x-3 ml-6 pr-6">
                                <button id="refresh-registry-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                    Refresh
                                </button>
                                <button id="add-registry-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                    Add Registry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters and Search -->
                <div class="bg-white border-b border-gray-200 flex-shrink-0">
                    <div class="px-6 py-4">
                        <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                            <!-- Search -->
                            <div class="flex-1 max-w-lg">
                                <div class="relative">
                                    <svg class="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                    <input id="registry-search" type="text" placeholder="Search servers..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500">
                                </div>
                            </div>

                            <!-- Filters -->
                            <div class="flex items-center space-x-4">
                                <div class="flex items-center space-x-2">
                                    <label class="text-sm font-medium text-gray-700">Category:</label>
                                    <div class="relative">
                                        <select id="category-filter" class="text-sm border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer">
                                            <option value="all">All</option>
                                            <option value="official">Official</option>
                                            <option value="community">Community</option>
                                            <option value="installed">Installed</option>
                                        </select>
                                        <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <label class="text-sm font-medium text-gray-700">Sort:</label>
                                    <div class="relative">
                                        <select id="sort-filter" class="text-sm border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer">
                                            <option value="popularity">Popularity</option>
                                            <option value="rating">Rating</option>
                                            <option value="name">Name</option>
                                            <option value="updated">Recently Updated</option>
                                        </select>
                                        <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Server Grid -->
                <div class="flex-1 overflow-y-auto p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="servers-grid">
                        ${this.filteredServers.map(server => this.renderServerCard(server)).join('')}
                    </div>

                    <!-- Empty State -->
                    <div id="empty-state" class="text-center py-12 ${this.filteredServers.length > 0 ? 'hidden' : ''}">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <h3 class="mt-2 text-sm font-medium text-gray-900">No servers found</h3>
                        <p class="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderServerCard(server) {
        return `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div class="p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"></path>
                                </svg>
                            </div>
                            <div>
                                <div class="flex items-center space-x-2">
                                    <h3 class="text-lg font-semibold text-gray-900">${server.name}</h3>
                                    ${server.official ? '<span class="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">Official</span>' : ''}
                                    ${server.installed ? '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Installed</span>' : ''}
                                </div>
                                <p class="text-sm text-gray-600">by ${server.author}</p>
                            </div>
                        </div>
                    </div>

                    <p class="text-gray-700 text-sm mb-4 line-clamp-3 selectable-text">${server.description}</p>

                    <!-- Tags -->
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${server.tags.map(tag => `
                            <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">${tag}</span>
                        `).join('')}
                    </div>

                    <!-- Stats -->
                    <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-1">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                </svg>
                                <span>${server.rating}</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                                </svg>
                                <span>${this.formatNumber(server.downloads)}</span>
                            </div>
                        </div>
                        <div class="text-xs">
                            <span>v${server.version}</span>
                            <span class="mx-1">•</span>
                            <span>${server.size}</span>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex space-x-3">
                        ${server.installed ? `
                            <button class="server-uninstall-btn flex-1 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500" data-server-id="${server.id}">
                                Uninstall
                            </button>
                            <button class="server-configure-btn flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500" data-server-id="${server.id}">
                                Configure
                            </button>
                        ` : `
                            <button class="server-install-btn flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500" data-server-id="${server.id}">
                                Install
                            </button>
                            <button class="server-details-btn flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500" data-server-id="${server.id}">
                                Details
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Header buttons
        const refreshBtn = document.getElementById('refresh-registry-btn');
        const addRegistryBtn = document.getElementById('add-registry-btn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshRegistry());
        }

        if (addRegistryBtn) {
            addRegistryBtn.addEventListener('click', () => this.showAddRegistryModal());
        }

        // Search and filters
        const searchInput = document.getElementById('registry-search');
        const categoryFilter = document.getElementById('category-filter');
        const sortFilter = document.getElementById('sort-filter');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterServers());
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.currentCategory = categoryFilter.value;
                this.filterServers();
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                this.currentSort = sortFilter.value;
                this.filterServers();
            });
        }

        // Server actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('server-install-btn')) {
                const serverId = e.target.getAttribute('data-server-id');
                this.installServer(serverId);
            }

            if (e.target.classList.contains('server-uninstall-btn')) {
                const serverId = e.target.getAttribute('data-server-id');
                this.uninstallServer(serverId);
            }

            if (e.target.classList.contains('server-configure-btn')) {
                const serverId = e.target.getAttribute('data-server-id');
                this.configureServer(serverId);
            }

            if (e.target.classList.contains('server-details-btn')) {
                const serverId = e.target.getAttribute('data-server-id');
                this.showServerDetails(serverId);
            }
        });
    }

    filterServers() {
        const searchTerm = document.getElementById('registry-search')?.value.toLowerCase() || '';
        
        this.filteredServers = this.mockServers.filter(server => {
            // Search filter
            const matchesSearch = !searchTerm || 
                server.name.toLowerCase().includes(searchTerm) ||
                server.description.toLowerCase().includes(searchTerm) ||
                server.tags.some(tag => tag.toLowerCase().includes(searchTerm));

            // Category filter
            let matchesCategory = true;
            switch (this.currentCategory) {
                case 'official':
                    matchesCategory = server.official;
                    break;
                case 'community':
                    matchesCategory = !server.official;
                    break;
                case 'installed':
                    matchesCategory = server.installed;
                    break;
            }

            return matchesSearch && matchesCategory;
        });

        // Sort servers
        this.filteredServers.sort((a, b) => {
            switch (this.currentSort) {
                case 'popularity':
                    return b.downloads - a.downloads;
                case 'rating':
                    return b.rating - a.rating;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'updated':
                    return new Date(b.lastUpdated) - new Date(a.lastUpdated);
                default:
                    return 0;
            }
        });

        this.updateServerGrid();
    }

    updateServerGrid() {
        const grid = document.getElementById('servers-grid');
        const emptyState = document.getElementById('empty-state');

        if (grid) {
            grid.innerHTML = this.filteredServers.map(server => this.renderServerCard(server)).join('');
        }

        if (emptyState) {
            if (this.filteredServers.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
            }
        }
    }

    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }

    refreshRegistry() {
        console.log('Refreshing registry...');
    }

    installServer(serverId) {
        const server = this.mockServers.find(s => s.id == serverId);
        const content = `
            <div class="space-y-6">
                <div class="text-center">
                    <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">Install ${server.name}</h3>
                    <p class="text-gray-600">This will download and install the server on your system.</p>
                </div>

                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <dl class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt class="font-medium text-gray-900">Version</dt>
                            <dd class="text-gray-700">${server.version}</dd>
                        </div>
                        <div>
                            <dt class="font-medium text-gray-900">Size</dt>
                            <dd class="text-gray-700">${server.size}</dd>
                        </div>
                        <div>
                            <dt class="font-medium text-gray-900">Author</dt>
                            <dd class="text-gray-700">${server.author}</dd>
                        </div>
                        <div>
                            <dt class="font-medium text-gray-900">Downloads</dt>
                            <dd class="text-gray-700">${this.formatNumber(server.downloads)}</dd>
                        </div>
                    </dl>
                </div>

                <div class="space-y-4">
                    <h4 class="font-medium text-gray-900">Installation Options</h4>
                    <div class="space-y-3">
                        <label class="flex items-center">
                            <input type="checkbox" class="mr-3" checked>
                            <span class="text-sm text-gray-700">Start server automatically after installation</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" class="mr-3" checked>
                            <span class="text-sm text-gray-700">Add to Claude Desktop configuration</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" class="mr-3">
                            <span class="text-sm text-gray-700">Create desktop shortcut</span>
                        </label>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button id="confirm-install" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700">
                        Install Server
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Server Installation',
            size: 'md'
        });

        setTimeout(() => {
            document.getElementById('confirm-install')?.addEventListener('click', () => {
                Modal.hide();
                this.showInstallProgress(server);
            });
        }, 100);
    }

    showInstallProgress(server) {
        const content = `
            <div class="space-y-6">
                <div class="text-center">
                    <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">Installing ${server.name}</h3>
                    <p class="text-gray-600">Please wait while the server is being installed...</p>
                </div>

                <div class="space-y-4">
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-700">Downloading...</span>
                            <span class="text-gray-500">75%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-primary-600 h-2 rounded-full" style="width: 75%"></div>
                        </div>
                    </div>

                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 class="font-medium text-gray-900 mb-2">Installation Log</h4>
                        <div class="text-xs text-gray-700 font-mono space-y-1">
                            <div>✓ Downloading ${server.name} v${server.version}</div>
                            <div>✓ Verifying package integrity</div>
                            <div>✓ Installing dependencies</div>
                            <div class="text-blue-600">→ Configuring server settings</div>
                            <div class="text-gray-400">- Starting server process</div>
                            <div class="text-gray-400">- Updating Claude configuration</div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-center pt-4 border-t border-gray-200">
                    <button disabled class="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed">
                        Installing...
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Installation Progress',
            size: 'md',
            closeButton: false
        });

        // Simulate installation completion
        setTimeout(() => {
            Modal.hide();
            this.showInstallComplete(server);
            
            // Update server status
            const serverToUpdate = this.mockServers.find(s => s.id === server.id);
            if (serverToUpdate) {
                serverToUpdate.installed = true;
                this.updateServerGrid();
            }
        }, 3000);
    }

    showInstallComplete(server) {
        const content = `
            <div class="space-y-6">
                <div class="text-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">Installation Complete!</h3>
                    <p class="text-gray-600">${server.name} has been successfully installed and is ready to use.</p>
                </div>

                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div class="flex">
                        <svg class="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <div class="ml-3">
                            <h4 class="text-sm font-medium text-green-800">What's Next?</h4>
                            <ul class="mt-2 text-sm text-green-700 space-y-1">
                                <li>• Server is running and available on port 8005</li>
                                <li>• Configuration has been added to Claude Desktop</li>
                                <li>• You can now use this server in your conversations</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button id="view-servers" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        View All Servers
                    </button>
                    <button id="configure-server" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700">
                        Configure Server
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Installation Complete',
            size: 'md'
        });

        setTimeout(() => {
            document.getElementById('view-servers')?.addEventListener('click', () => {
                Modal.hide();
                window.location.hash = 'servers';
            });

            document.getElementById('configure-server')?.addEventListener('click', () => {
                Modal.hide();
                this.configureServer(server.id);
            });
        }, 100);
    }

    uninstallServer(serverId) {
        const server = this.mockServers.find(s => s.id == serverId);
        const content = `
            <div class="space-y-6">
                <div class="text-center">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">Uninstall ${server.name}</h3>
                    <p class="text-gray-600">This will permanently remove the server from your system.</p>
                </div>

                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div class="flex">
                        <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <div class="ml-3">
                            <h4 class="text-sm font-medium text-yellow-800">Warning</h4>
                            <p class="mt-1 text-sm text-yellow-700">This action cannot be undone. All server data and configuration will be lost.</p>
                        </div>
                    </div>
                </div>

                <div class="space-y-3">
                    <label class="flex items-center">
                        <input type="checkbox" class="mr-3">
                        <span class="text-sm text-gray-700">Remove configuration data</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" class="mr-3">
                        <span class="text-sm text-gray-700">Remove from Claude Desktop configuration</span>
                    </label>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button id="confirm-uninstall" class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">
                        Uninstall Server
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Confirm Uninstall',
            size: 'md'
        });

        setTimeout(() => {
            document.getElementById('confirm-uninstall')?.addEventListener('click', () => {
                Modal.hide();
                const serverToUpdate = this.mockServers.find(s => s.id === server.id);
                if (serverToUpdate) {
                    serverToUpdate.installed = false;
                    this.updateServerGrid();
                }
            });
        }, 100);
    }

    configureServer(serverId) {
        const server = this.mockServers.find(s => s.id == serverId);
        window.location.hash = 'servers';
    }

    showServerDetails(serverId) {
        const server = this.mockServers.find(s => s.id == serverId);
        const content = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex items-start space-x-4">
                    <div class="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                        <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <h3 class="text-xl font-bold text-gray-900">${server.name}</h3>
                            ${server.official ? '<span class="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">Official</span>' : ''}
                        </div>
                        <p class="text-gray-600 mb-2">by ${server.author}</p>
                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                            <div class="flex items-center space-x-1">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                </svg>
                                <span>${server.rating}</span>
                            </div>
                            <span>${this.formatNumber(server.downloads)} downloads</span>
                            <span>Updated ${server.lastUpdated}</span>
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-2">Description</h4>
                    <p class="text-gray-700 selectable-text">${server.description}</p>
                </div>

                <!-- Tags -->
                <div>
                    <h4 class="font-medium text-gray-900 mb-2">Tags</h4>
                    <div class="flex flex-wrap gap-2">
                        ${server.tags.map(tag => `
                            <span class="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded-full">${tag}</span>
                        `).join('')}
                    </div>
                </div>

                <!-- Details -->
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-medium text-gray-900 mb-2">Version Information</h4>
                        <dl class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <dt class="text-gray-600">Current Version:</dt>
                                <dd class="text-gray-900 font-medium">v${server.version}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">Size:</dt>
                                <dd class="text-gray-900">${server.size}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">Last Updated:</dt>
                                <dd class="text-gray-900">${server.lastUpdated}</dd>
                            </div>
                        </dl>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-900 mb-2">Statistics</h4>
                        <dl class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <dt class="text-gray-600">Downloads:</dt>
                                <dd class="text-gray-900 font-medium">${this.formatNumber(server.downloads)}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">Rating:</dt>
                                <dd class="text-gray-900">${server.rating}/5.0</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">Category:</dt>
                                <dd class="text-gray-900">${server.official ? 'Official' : 'Community'}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <!-- Installation -->
                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 min-w-0">
                    <button id="close-details" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex-shrink-0">
                        Close
                    </button>
                    ${server.installed ? `
                        <button id="uninstall-from-details" class="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 flex-shrink-0" data-server-id="${server.id}">
                            Uninstall
                        </button>
                    ` : `
                        <button id="install-from-details" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 flex-shrink-0">
                            Install Server
                        </button>
                    `}
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Server Details',
            size: 'lg'
        });

        setTimeout(() => {
            // Close button
            document.getElementById('close-details')?.addEventListener('click', () => {
                Modal.hide();
            });

            // Install button (if server not installed)
            if (!server.installed) {
                document.getElementById('install-from-details')?.addEventListener('click', () => {
                    Modal.hide();
                    this.installServer(serverId);
                });
            }

            // Uninstall button (if server installed)
            if (server.installed) {
                document.getElementById('uninstall-from-details')?.addEventListener('click', () => {
                    Modal.hide();
                    this.uninstallServer(serverId);
                });
            }
        }, 100);
    }

    showAddRegistryModal() {
        const content = `
            <div class="space-y-6">
                <div>
                    <p class="text-gray-600">Add a custom registry to discover more MCP servers.</p>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Registry Name</label>
                        <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="My Custom Registry">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Registry URL</label>
                        <input type="url" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="https://example.com/registry.json">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" rows="2" placeholder="Brief description of this registry"></textarea>
                    </div>

                    <div class="flex items-center">
                        <input type="checkbox" id="verify-ssl" class="mr-2">
                        <label for="verify-ssl" class="text-sm text-gray-700">Verify SSL certificate</label>
                    </div>
                </div>

                <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <div class="flex">
                        <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <div class="ml-3">
                            <h4 class="text-sm font-medium text-blue-800">Registry Format</h4>
                            <p class="mt-1 text-sm text-blue-700">The registry URL should point to a JSON file containing server definitions compatible with the MCP registry format.</p>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700">
                        Add Registry
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Add Custom Registry',
            size: 'md'
        });
    }
}