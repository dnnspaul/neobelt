import Modal from '../components/Modal.js';
import { logger } from '../utils/logger.js';

export class Registry {
    constructor() {
        this.servers = [];
        this.loading = false;
        this.error = null;
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

        this.filteredServers = [];
        this.currentRegistry = 'all';
        this.availableRegistries = [];
        // Don't call loadServers() in constructor - only when page is actually shown
    }

    render() {
        return `
            <div class="h-full flex flex-col overflow-hidden">
                <!-- Header -->
                <div class="bg-white border-b border-gray-200 flex-shrink-0">
                    <div class="pl-6 pr-0 py-4">
                        <div class="flex items-center justify-between">
                            <div class="flex-1 min-w-0">
                                <h1 class="text-2xl font-bold text-gray-900">Registry</h1>
                                <p class="text-gray-600">Discover and install MCP server images</p>
                            </div>
                            <div class="flex space-x-3 ml-6 pr-6">
                                <button id="refresh-registry-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                    Refresh
                                </button>
                                <button id="manage-registries-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    Manage Registries
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
                                    <label class="text-sm font-medium text-gray-700">Registry:</label>
                                    <div class="relative">
                                        <select id="registry-filter" class="text-sm border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer">
                                            <option value="all">All Registries</option>
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
                    ${this.renderContent()}
                </div>
            </div>
        `;
    }

    renderContent() {
        if (this.loading) {
            return this.renderLoadingState();
        }
        
        if (this.error) {
            return this.renderErrorState();
        }
        
        if (this.filteredServers.length === 0) {
            return this.renderEmptyState();
        }
        
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="servers-grid">
                ${this.filteredServers.map(server => this.renderServerCard(server)).join('')}
            </div>
        `;
    }

    renderLoadingState() {
        return `
            <div class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-primary-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">Loading servers...</h3>
                <p class="mt-1 text-sm text-gray-500">Fetching data from registries</p>
            </div>
        `;
    }

    renderErrorState() {
        return `
            <div class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">Failed to load servers</h3>
                <p class="mt-1 text-sm text-gray-500">${this.error}</p>
                <button id="retry-load-btn" class="mt-3 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    Try Again
                </button>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div id="empty-state" class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">No servers found</h3>
                <p class="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
            </div>
        `;
    }

    async loadServers() {
        this.loading = true;
        this.error = null;
        this.updateUI();

        try {
            // Fetch available registries first
            const registries = await window.go.main.App.GetRegistries();
            this.availableRegistries = registries;

            // Call the backend to fetch servers from all configured registries
            const servers = await window.go.main.App.FetchAllRegistries();
            
            // Get installed servers to check installation status
            let installedServers = [];
            try {
                installedServers = await window.go.main.App.GetInstalledServers();
            } catch (error) {
                logger.warning('Failed to fetch installed servers:', error);
            }
            
            // Create a map of installed Docker images for quick lookup
            const installedImageMap = new Map();
            installedServers.forEach(installed => {
                installedImageMap.set(installed.docker_image, installed);
            });
            
            // Convert backend format to frontend format
            this.servers = servers.map((server, index) => ({
                id: index + 1,
                name: server.name,
                author: server.maintainer,
                description: server.description,
                version: server.version,
                tags: server.tags || [],
                installed: installedImageMap.has(server.docker_image), // Check if this Docker image is installed
                official: server.is_official, // Use the backend-provided flag
                lastUpdated: new Date().toISOString().split('T')[0], // Mock last updated
                dockerImage: server.docker_image,
                setupDescription: server.setup_description,
                supportURL: server.support_url,
                license: server.license,
                architecture: server.architecture || [],
                healthCheck: server.health_check || {},
                resourceRequirements: server.resource_requirements || {},
                dockerCommand: server.docker_command || '',
                environmentVariables: server.environment_variables || {},
                ports: server.ports || {},
                volumes: server.volumes || [],
                sourceRegistryName: server.source_registry_name,
                sourceRegistryURL: server.source_registry_url
            }));

            this.filteredServers = [...this.servers];
            this.filterServers();
        } catch (error) {
            logger.error('Failed to load servers:', error);
            this.error = error.message || 'Failed to load servers from registry';
        } finally {
            this.loading = false;
            this.updateUI();
        }
    }


    updateUI() {
        // Check if a modal is currently open before re-rendering to prevent modal from closing
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            logger.debug('Modal detected, skipping UI update to preserve modal');
            return;
        }
        
        const mainContent = document.querySelector('.flex-1.overflow-y-auto.p-6');
        if (mainContent) {
            mainContent.innerHTML = this.renderContent();
            this.attachContentEventListeners();
        }
        
        // Update registry filter dropdown - use setTimeout to ensure DOM is ready
        setTimeout(() => {
            this.updateRegistryFilter();
        }, 10);
    }

    updateRegistryFilter() {
        const registryFilter = document.getElementById('registry-filter');
        if (registryFilter) {
            if (this.availableRegistries.length > 0) {
                registryFilter.innerHTML = `
                    <option value="all">All Registries</option>
                    ${this.availableRegistries.map(registry => `
                        <option value="${registry.name}" ${this.currentRegistry === registry.name ? 'selected' : ''}>${registry.name}</option>
                    `).join('')}
                `;
            } else {
                // Show loading state or keep default option
                registryFilter.innerHTML = `<option value="all">All Registries</option>`;
            }
        }
    }

    attachContentEventListeners() {
        // Retry button for error state
        const retryBtn = document.getElementById('retry-load-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.loadServers());
        }
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
                    <div class="flex flex-wrap gap-2 mb-8">
                        ${server.tags.map(tag => `
                            <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">${tag}</span>
                        `).join('')}
                    </div>

                    <!-- Version and Registry Info -->
                    <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div class="flex items-center space-x-2">
                            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                ${server.sourceRegistryName || 'Unknown Registry'}
                            </span>
                        </div>
                        <div class="flex items-center space-x-1">
                            <span class="text-xs text-gray-400">v</span>
                            <span class="font-medium text-gray-600">${server.version}</span>
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
        // Load servers when page is actually shown
        this.loadServers();
        
        // Header buttons
        const refreshBtn = document.getElementById('refresh-registry-btn');
        const manageRegistriesBtn = document.getElementById('manage-registries-btn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshRegistry());
        }

        if (manageRegistriesBtn) {
            manageRegistriesBtn.addEventListener('click', () => this.showManageRegistriesModal());
        }

        // Search and filters
        const searchInput = document.getElementById('registry-search');
        const registryFilter = document.getElementById('registry-filter');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterServers());
        }

        if (registryFilter) {
            registryFilter.addEventListener('change', () => {
                this.currentRegistry = registryFilter.value;
                this.filterServers();
            });
        }

        // Update registry filter dropdown after DOM is ready
        this.updateRegistryFilter();

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
        
        this.filteredServers = this.servers.filter(server => {
            // Search filter
            const matchesSearch = !searchTerm || 
                server.name.toLowerCase().includes(searchTerm) ||
                server.description.toLowerCase().includes(searchTerm) ||
                server.tags.some(tag => tag.toLowerCase().includes(searchTerm));

            // Registry filter
            let matchesRegistry = true;
            if (this.currentRegistry !== 'all') {
                matchesRegistry = server.sourceRegistryName === this.currentRegistry;
            }

            return matchesSearch && matchesRegistry;
        });

        // Sort servers alphabetically by name
        this.filteredServers.sort((a, b) => a.name.localeCompare(b.name));

        this.updateUI();
    }


    refreshRegistry() {
        this.loadServers();
    }

    async showManageRegistriesModal() {
        try {
            const registries = await window.go.main.App.GetRegistries();
            
            const content = `
                <div class="space-y-6">
                    <div>
                        <p class="text-gray-600">Manage your configured registries. You can add, edit, or remove registry sources.</p>
                    </div>

                    <div class="space-y-4">
                        <h4 class="font-medium text-gray-900">Configured Registries</h4>
                        <div class="space-y-3">
                            ${registries.map((registry, index) => `
                                <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                    <div class="flex-1">
                                        <div class="flex items-center space-x-2">
                                            <h5 class="font-medium text-gray-900">${registry.name}</h5>
                                            ${index === 0 ? '<span class="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">Official</span>' : ''}
                                        </div>
                                        <p class="text-sm text-gray-600 mt-1">${registry.description}</p>
                                        <p class="text-xs text-gray-500 mt-1">${registry.url}</p>
                                    </div>
                                    <div class="flex space-x-2">
                                        ${index === 0 ? '' : `
                                            <button class="edit-registry-btn px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50" data-index="${index}">
                                                Edit
                                            </button>
                                            <button class="remove-registry-btn px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200" data-index="${index}">
                                                Remove
                                            </button>
                                        `}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button id="close-manage-registries" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            Close
                        </button>
                        <button id="add-new-registry" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700">
                            Add New Registry
                        </button>
                    </div>
                </div>
            `;

            Modal.show(content, {
                title: 'Manage Registries',
                size: 'lg'
            });

            setTimeout(() => {
                document.getElementById('close-manage-registries')?.addEventListener('click', () => {
                    Modal.hide();
                });

                document.getElementById('add-new-registry')?.addEventListener('click', () => {
                    Modal.hide();
                    this.showAddRegistryModal();
                });

                // Handle edit and remove buttons
                document.querySelectorAll('.edit-registry-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const index = e.target.getAttribute('data-index');
                        this.editRegistry(registries[index]);
                    });
                });

                document.querySelectorAll('.remove-registry-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const index = e.target.getAttribute('data-index');
                        this.removeRegistry(registries[index]);
                    });
                });
            }, 100);
        } catch (error) {
            logger.error('Failed to load registries:', error);
        }
    }

    editRegistry(registry) {
        Modal.hide();
        setTimeout(() => {
            this.showAddRegistryModal(registry);
        }, 300);
    }

    removeRegistry(registry) {
        Modal.hide();
        setTimeout(() => {
            const content = `
                <div class="space-y-6">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900">Remove Registry</h3>
                        <p class="text-gray-600">Are you sure you want to remove "${registry.name}"?</p>
                    </div>

                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div class="flex">
                            <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                            <div class="ml-3">
                                <h4 class="text-sm font-medium text-yellow-800">Warning</h4>
                                <p class="mt-1 text-sm text-yellow-700">This action cannot be undone. You will lose access to all servers from this registry.</p>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button id="cancel-remove" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancel
                        </button>
                        <button id="confirm-remove" class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">
                            Remove Registry
                        </button>
                    </div>
                </div>
            `;

            Modal.show(content, {
                title: 'Confirm Removal',
                size: 'md'
            });

            setTimeout(() => {
                document.getElementById('cancel-remove')?.addEventListener('click', () => {
                    Modal.hide();
                });

                document.getElementById('confirm-remove')?.addEventListener('click', async () => {
                    const confirmBtn = document.getElementById('confirm-remove');
                    const cancelBtn = document.getElementById('cancel-remove');
                    
                    // Set loading state
                    confirmBtn.disabled = true;
                    cancelBtn.disabled = true;
                    confirmBtn.innerHTML = `
                        <svg class="w-4 h-4 mr-2 inline animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Removing...
                    `;
                    
                    try {
                        await window.go.main.App.RemoveCustomRegistry(registry.url);
                        Modal.hide();
                        // Refresh the servers list
                        this.loadServers();
                    } catch (error) {
                        // Reset button state
                        confirmBtn.disabled = false;
                        cancelBtn.disabled = false;
                        confirmBtn.innerHTML = 'Remove Registry';
                        
                        alert('Failed to remove registry: ' + error.message);
                    }
                });
            }, 100);
        }, 300);
    }

    installServer(serverId) {
        const server = this.servers.find(s => s.id == serverId);
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
                            <dt class="font-medium text-gray-900">Docker Image</dt>
                            <dd class="text-gray-700">${server.dockerImage}</dd>
                        </div>
                        <div>
                            <dt class="font-medium text-gray-900">Author</dt>
                            <dd class="text-gray-700">${server.author}</dd>
                        </div>
                        <div>
                            <dt class="font-medium text-gray-900">License</dt>
                            <dd class="text-gray-700">${server.license || 'Unknown'}</dd>
                        </div>
                        ${server.ports && Object.keys(server.ports).length > 0 ? `
                            <div>
                                <dt class="font-medium text-gray-900">Default Port</dt>
                                <dd class="text-gray-700">${Object.values(server.ports)[0] || 'Not specified'}</dd>
                            </div>
                        ` : ''}
                        ${server.resourceRequirements && server.resourceRequirements.memory ? `
                            <div>
                                <dt class="font-medium text-gray-900">Memory</dt>
                                <dd class="text-gray-700">${server.resourceRequirements.memory}</dd>
                            </div>
                        ` : ''}
                    </dl>
                </div>

                ${server.environmentVariables && this.parseEnvironmentVariables(server.environmentVariables).length > 0 ? `
                    <div class="space-y-3">
                        <h4 class="font-medium text-gray-900">Environment Variables</h4>
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div class="flex">
                                <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <div class="ml-3">
                                    <h5 class="text-sm font-medium text-yellow-800">Configuration Required</h5>
                                    <div class="mt-2 text-sm text-yellow-700">
                                        <p class="mb-2">This server requires environment variables to be configured:</p>
                                        <ul class="list-disc list-inside space-y-1">
                                            ${this.parseEnvironmentVariables(server.environmentVariables).map(envVar => {
                                                const badgeClass = envVar.type === 'required' ? 'text-red-600' : envVar.type === 'default' ? 'text-green-600' : 'text-gray-600';
                                                const label = envVar.type === 'required' ? 'Required' : envVar.type === 'default' ? 'Default' : 'Optional';
                                                return `<li><strong>${envVar.name}</strong> <span class="${badgeClass}">(${label})</span>: ${envVar.description || 'No description'}</li>`;
                                            }).join('')}
                                        </ul>
                                        <p class="mt-2 text-xs">You can configure these after installation on the Servers page.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${server.setupDescription ? `
                    <div class="space-y-3">
                        <h4 class="font-medium text-gray-900">Setup Instructions</h4>
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div class="text-sm text-blue-900 setup-markdown">${this.renderMarkdown(server.setupDescription)}</div>
                        </div>
                    </div>
                ` : ''}

                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex">
                        <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <div class="ml-3">
                            <h4 class="text-sm font-medium text-blue-800">Installation Process</h4>
                            <p class="mt-1 text-sm text-blue-700">This will pull the Docker image and add it to your installed servers. You can configure and run it later from the Servers page.</p>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button id="cancel-install" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button id="confirm-install" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700">
                        Install MCP Server Image
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Server Installation',
            size: 'xl'
        });

        setTimeout(() => {
            document.getElementById('cancel-install')?.addEventListener('click', () => {
                Modal.hide();
            });

            document.getElementById('confirm-install')?.addEventListener('click', () => {
                this.performInstallation(server);
            });
        }, 100);
    }

    async performInstallation(server) {
        // Convert frontend server format to backend RegistryServer format
        const registryServer = {
            name: server.name,
            description: server.description,
            setup_description: server.setupDescription || '',
            support_url: server.supportURL || '',
            docker_image: server.dockerImage,
            version: server.version,
            license: server.license || '',
            maintainer: server.author,
            tags: server.tags || [],
            architecture: server.architecture || [],
            health_check: server.healthCheck || {},
            resource_requirements: server.resourceRequirements || {},
            docker_command: server.dockerCommand || '',
            environment_variables: server.environmentVariables || {},
            ports: server.ports || {},
            volumes: server.volumes || [],
            source_registry_name: server.sourceRegistryName,
            source_registry_url: server.sourceRegistryURL,
            is_official: server.official
        };

        this.showInstallProgress(server, registryServer);
    }

    showInstallProgress(server, registryServer) {
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

                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-2">Installation Log</h4>
                    <div id="install-log" class="text-xs text-gray-700 font-mono space-y-1 max-h-32 overflow-y-auto">
                        <div class="text-blue-600">→ Starting installation process...</div>
                        <div class="text-blue-600">→ Pulling Docker image: ${server.dockerImage}</div>
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

        // Start the actual installation process
        this.executeInstallation(server, registryServer);
    }

    async executeInstallation(server, registryServer) {
        const logContainer = document.getElementById('install-log');
        
        const addLogEntry = (message, type = 'info') => {
            if (logContainer) {
                const logEntry = document.createElement('div');
                logEntry.className = type === 'error' ? 'text-red-600' : type === 'success' ? 'text-green-600' : 'text-blue-600';
                logEntry.textContent = type === 'error' ? `✗ ${message}` : type === 'success' ? `✓ ${message}` : `→ ${message}`;
                logContainer.appendChild(logEntry);
                logContainer.scrollTop = logContainer.scrollHeight;
            }
        };

        try {
            addLogEntry('Validating server configuration...');
            
            // Call the backend InstallServer method
            addLogEntry('Downloading Docker image (this may take a few minutes)...');
            await window.go.main.App.InstallServer(registryServer);
            
            addLogEntry('Docker image downloaded successfully', 'success');
            addLogEntry('Server added to installed servers', 'success');
            addLogEntry('Installation completed successfully!', 'success');
            
            // Wait a moment to show the success messages
            setTimeout(() => {
                Modal.hide();
                this.showInstallComplete(server);
                
                // Update server status in the UI
                const serverToUpdate = this.servers.find(s => s.id === server.id);
                if (serverToUpdate) {
                    serverToUpdate.installed = true;
                    this.filterServers();
                }
                
                // Reload servers to get the updated list
                this.loadServers();
            }, 2000);

        } catch (error) {
            logger.error('Installation failed:', error);
            addLogEntry(`Installation failed: ${error.message}`, 'error');
            
            // Show error state and enable retry
            setTimeout(() => {
                const content = `
                    <div class="space-y-6">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900">Installation Failed</h3>
                            <p class="text-gray-600">There was an error installing ${server.name}.</p>
                        </div>

                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div class="flex">
                                <svg class="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <div class="ml-3">
                                    <h4 class="text-sm font-medium text-red-800">Error Details</h4>
                                    <p class="mt-1 text-sm text-red-700">${error.message}</p>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button id="close-error" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                Close
                            </button>
                            <button id="retry-install" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700">
                                Try Again
                            </button>
                        </div>
                    </div>
                `;

                Modal.show(content, {
                    title: 'Installation Failed',
                    size: 'md'
                });

                setTimeout(() => {
                    document.getElementById('close-error')?.addEventListener('click', () => {
                        Modal.hide();
                    });

                    document.getElementById('retry-install')?.addEventListener('click', () => {
                        Modal.hide();
                        this.installServer(server.id);
                    });
                }, 100);
            }, 3000);
        }
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
                    <p class="text-gray-600">${server.name} has been successfully installed.</p>
                </div>

                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div class="flex">
                        <svg class="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <div class="ml-3">
                            <h4 class="text-sm font-medium text-green-800">What's Next?</h4>
                            <p class="mt-1 text-sm text-green-700">Go to the Servers page to create and configure a mcp server instance.</p>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button id="close-success" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Close
                    </button>
                    <button id="view-servers" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700">
                        Go to Servers
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Installation Complete',
            size: 'md'
        });

        setTimeout(() => {
            document.getElementById('close-success')?.addEventListener('click', () => {
                Modal.hide();
            });

            document.getElementById('view-servers')?.addEventListener('click', () => {
                Modal.hide();
                window.location.hash = 'servers';
            });
        }, 100);
    }

    uninstallServer(serverId) {
        const server = this.servers.find(s => s.id == serverId);
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
                        <input type="checkbox" id="remove-config-data" class="mr-3">
                        <span class="text-sm text-gray-700">Remove configuration data</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" id="remove-claude-config" class="mr-3">
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
            document.getElementById('confirm-uninstall')?.addEventListener('click', async () => {
                const confirmBtn = document.getElementById('confirm-uninstall');
                const cancelBtn = document.querySelector('.px-4.py-2.text-sm.font-medium.text-gray-700');
                
                // Set loading state
                confirmBtn.disabled = true;
                if (cancelBtn) cancelBtn.disabled = true;
                confirmBtn.innerHTML = `
                    <svg class="w-4 h-4 mr-2 inline animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Uninstalling...
                `;
                
                try {
                    // Check if user wants to remove configuration data
                    const removeConfigData = document.getElementById('remove-config-data')?.checked || false;
                    
                    // Find the installed server by Docker image
                    const installedServers = await window.go.main.App.GetInstalledServers();
                    const installedServer = installedServers.find(installed => installed.docker_image === server.dockerImage);
                    
                    if (installedServer) {
                        // If user checked "Remove configuration data", remove configured servers first
                        let removedConfiguredServers = false;
                        if (removeConfigData) {
                            try {
                                const configuredServers = await window.go.main.App.GetConfiguredServers();
                                const relatedConfiguredServers = configuredServers.filter(
                                    configured => configured.installed_server_id === installedServer.id
                                );
                                
                                // Remove each configured server (this will also remove the Docker containers)
                                for (const configuredServer of relatedConfiguredServers) {
                                    if (configuredServer.container_id) {
                                        await window.go.main.App.RemoveContainer(configuredServer.container_id, true);
                                    }
                                }
                                
                                if (relatedConfiguredServers.length > 0) {
                                    removedConfiguredServers = true;
                                }
                            } catch (configError) {
                                logger.warning('Warning: Failed to remove some configured servers:', configError);
                                // Continue with uninstall even if configured server removal fails
                            }
                        }
                        
                        // Call backend to remove installed server and Docker image
                        await window.go.main.App.RemoveInstalledServer(installedServer.id, true);
                        
                        // Update local UI state
                        const serverToUpdate = this.servers.find(s => s.id === server.id);
                        if (serverToUpdate) {
                            serverToUpdate.installed = false;
                        }
                        
                        Modal.hide();
                        this.showUninstallComplete(server, removedConfiguredServers);
                        this.filterServers();
                        this.updateUI();
                    } else {
                        throw new Error('Installed server not found');
                    }
                } catch (error) {
                    logger.error('Uninstall failed:', error);
                    
                    // Reset button state
                    confirmBtn.disabled = false;
                    if (cancelBtn) cancelBtn.disabled = false;
                    confirmBtn.innerHTML = 'Uninstall Server';
                    
                    alert('Failed to uninstall server: ' + error.message);
                }
            });
        }, 100);
    }

    showUninstallComplete(server, removedConfigData = false) {
        const content = `
            <div class="space-y-6">
                <div class="text-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">Uninstall Complete!</h3>
                    <p class="text-gray-600">${server.name} has been successfully uninstalled.</p>
                </div>

                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div class="flex">
                        <svg class="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <div class="ml-3">
                            <h4 class="text-sm font-medium text-green-800">Cleanup Complete</h4>
                            <ul class="mt-2 text-sm text-green-700 space-y-1">
                                <li>• MCP server image has been removed from your system</li>
                                ${removedConfigData ? '<li>• All configured containers and their data have been removed</li>' : ''}
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button id="close-uninstall-success" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Close
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Uninstall Complete',
            size: 'md'
        });

        setTimeout(() => {
            document.getElementById('close-uninstall-success')?.addEventListener('click', () => {
                Modal.hide();
            });
        }, 100);
    }

    configureServer(serverId) {
        const server = this.servers.find(s => s.id == serverId);
        window.location.hash = 'servers';
    }

    showServerDetails(serverId) {
        const server = this.servers.find(s => s.id == serverId);
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
                                <dt class="text-gray-600">Registry:</dt>
                                <dd class="text-gray-900">${server.sourceRegistryName || 'Unknown Registry'}</dd>
                            </div>
                        </dl>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-900 mb-2">Information</h4>
                        <dl class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <dt class="text-gray-600">Category:</dt>
                                <dd class="text-gray-900">${server.official ? 'Official' : 'Custom'}</dd>
                            </div>
                            <div class="flex justify-between">
                                <dt class="text-gray-600">License:</dt>
                                <dd class="text-gray-900">${server.license}</dd>
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

    showAddRegistryModal(editRegistry = null) {
        const isEditing = editRegistry !== null;
        const content = `
            <div class="space-y-6">
                <div>
                    <p class="text-gray-600">${isEditing ? 'Edit registry configuration.' : 'Add a custom registry to discover more MCP servers.'}</p>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Registry Name</label>
                        <input type="text" id="registry-name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="My Custom Registry" value="${isEditing ? editRegistry.name : ''}">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Registry URL</label>
                        <input type="url" id="registry-url" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="https://example.com/registry.json" value="${isEditing ? editRegistry.url : ''}">
                        <p class="mt-1 text-xs text-gray-500">HTTPS is required for custom registries</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea id="registry-description" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" rows="2" placeholder="Brief description of this registry">${isEditing ? editRegistry.description : ''}</textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Authentication</label>
                        <div class="relative">
                            <select id="auth-type" class="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer">
                                <option value="none" ${isEditing && editRegistry.auth_type === 'none' ? 'selected' : ''}>No Authentication</option>
                                <option value="basic" ${isEditing && editRegistry.auth_type === 'basic' ? 'selected' : ''}>Basic Authentication (Username/Password)</option>
                                <option value="header" ${isEditing && editRegistry.auth_type === 'header' ? 'selected' : ''}>Custom Header</option>
                            </select>
                            <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- Basic Auth Fields -->
                    <div id="basic-auth-fields" class="space-y-4 ${isEditing && editRegistry.auth_type === 'basic' ? '' : 'hidden'}">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input type="text" id="auth-username" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="Username" value="${isEditing ? editRegistry.auth_username || '' : ''}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input type="password" id="auth-password" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="Password" value="${isEditing ? editRegistry.auth_password || '' : ''}">
                        </div>
                    </div>

                    <!-- Custom Header Fields -->
                    <div id="header-auth-fields" class="${isEditing && editRegistry.auth_type === 'header' ? '' : 'hidden'}">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Custom Header</label>
                            <input type="text" id="auth-header" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="Authorization: Bearer your-token-here" value="${isEditing ? editRegistry.auth_header || '' : ''}">
                            <p class="mt-1 text-xs text-gray-500">Format: Header-Name: Header-Value (e.g., "Authorization: Bearer token123")</p>
                        </div>
                    </div>
                </div>

                <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <div class="flex">
                        <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <div class="ml-3">
                            <h4 class="text-sm font-medium text-blue-800">Registry Format</h4>
                            <p class="mt-1 text-sm text-blue-700">The registry URL should point to a JSON file containing server definitions compatible with the MCP registry format. <button type="button" onclick="window.runtime.BrowserOpenURL('https://github.com/dnnspaul/neobelt/blob/main/docs/registry-example.json')" class="font-medium text-blue-800 hover:text-blue-900 underline cursor-pointer bg-transparent border-none p-0">View example registry format</button>.</p>
                        </div>
                    </div>
                </div>

                <!-- Error message container -->
                <div id="form-error-container" class="hidden">
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex">
                            <svg class="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div class="ml-3">
                                <h4 class="text-sm font-medium text-red-800">Error</h4>
                                <p id="form-error-message" class="mt-1 text-sm text-red-700"></p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button id="cancel-registry" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button id="submit-registry" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700">
                        ${isEditing ? 'Update Registry' : 'Add Registry'}
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: isEditing ? 'Edit Registry' : 'Add Custom Registry',
            size: 'md'
        });

        setTimeout(() => {
            // Handle auth type change
            const authTypeSelect = document.getElementById('auth-type');
            const basicAuthFields = document.getElementById('basic-auth-fields');
            const headerAuthFields = document.getElementById('header-auth-fields');
            
            if (authTypeSelect) {
                authTypeSelect.addEventListener('change', () => {
                    const authType = authTypeSelect.value;
                    basicAuthFields.classList.toggle('hidden', authType !== 'basic');
                    headerAuthFields.classList.toggle('hidden', authType !== 'header');
                });
            }

            document.getElementById('cancel-registry')?.addEventListener('click', () => {
                Modal.hide();
            });

            document.getElementById('submit-registry')?.addEventListener('click', async () => {
                const nameInput = document.getElementById('registry-name');
                const urlInput = document.getElementById('registry-url');
                const descriptionInput = document.getElementById('registry-description');
                const authTypeInput = document.getElementById('auth-type');
                const authUsernameInput = document.getElementById('auth-username');
                const authPasswordInput = document.getElementById('auth-password');
                const authHeaderInput = document.getElementById('auth-header');
                const submitBtn = document.getElementById('submit-registry');
                const cancelBtn = document.getElementById('cancel-registry');

                const name = nameInput.value.trim();
                const url = urlInput.value.trim();
                const description = descriptionInput.value.trim();
                const authType = authTypeInput.value;
                const authUsername = authUsernameInput.value.trim();
                const authPassword = authPasswordInput.value.trim();
                const authHeader = authHeaderInput.value.trim();

                // Clear any existing error messages
                this.clearFormErrors();

                // Validate required fields
                if (!name) {
                    this.showFieldError(nameInput, 'Registry name is required.');
                    return;
                }

                if (!url) {
                    this.showFieldError(urlInput, 'Registry URL is required.');
                    return;
                }

                // Basic URL validation
                try {
                    const urlObj = new URL(url);
                    // Enforce HTTPS for custom registries
                    if (urlObj.protocol !== 'https:') {
                        this.showFieldError(urlInput, 'Custom registries must use HTTPS.');
                        return;
                    }
                } catch (e) {
                    this.showFieldError(urlInput, 'Please enter a valid URL.');
                    return;
                }

                // Validate authentication fields based on auth type
                if (authType === 'basic') {
                    if (!authUsername) {
                        this.showFieldError(authUsernameInput, 'Username is required for basic authentication.');
                        return;
                    }
                    if (!authPassword) {
                        this.showFieldError(authPasswordInput, 'Password is required for basic authentication.');
                        return;
                    }
                } else if (authType === 'header') {
                    if (!authHeader) {
                        this.showFieldError(authHeaderInput, 'Custom header is required for header authentication.');
                        return;
                    }
                    // Basic header format validation
                    if (!authHeader.includes(':')) {
                        this.showFieldError(authHeaderInput, 'Header must be in format "Header-Name: Header-Value".');
                        return;
                    }
                }

                // Set loading state
                submitBtn.disabled = true;
                cancelBtn.disabled = true;
                submitBtn.innerHTML = `
                    <svg class="w-4 h-4 mr-2 inline animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Validating...
                `;

                try {
                    if (isEditing) {
                        // Update existing registry
                        await window.go.main.App.UpdateCustomRegistry(editRegistry.url, name, url, description, authType, authUsername, authPassword, authHeader);
                    } else {
                        // Add new registry
                        await window.go.main.App.AddCustomRegistry(name, url, description, authType, authUsername, authPassword, authHeader);
                    }
                    
                    // Success - show success message briefly then close modal
                    submitBtn.innerHTML = `
                        <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Success!
                    `;
                    submitBtn.className = submitBtn.className.replace('bg-primary-600 hover:bg-primary-700', 'bg-green-600 hover:bg-green-700');
                    
                    setTimeout(() => {
                        Modal.hide();
                        // Refresh the servers to include the new/updated registry
                        this.loadServers();
                    }, 1000);

                } catch (error) {
                    // Reset button state
                    submitBtn.disabled = false;
                    cancelBtn.disabled = false;
                    submitBtn.innerHTML = `${isEditing ? 'Update Registry' : 'Add Registry'}`;
                    submitBtn.className = submitBtn.className.replace('bg-green-600 hover:bg-green-700', 'bg-primary-600 hover:bg-primary-700');
                    
                    // Show error message
                    this.showFormError(error.message || `Failed to ${isEditing ? 'update' : 'add'} registry. Please check the URL and try again.`);
                }
            });
        }, 100);
    }

    // Parse environment variables from nested registry structure
    parseEnvironmentVariables(environmentVariables) {
        let envVarsConfig = [];
        
        if (environmentVariables) {
            // Handle required variables
            if (environmentVariables.required && Array.isArray(environmentVariables.required)) {
                environmentVariables.required.forEach(envVar => {
                    envVarsConfig.push({
                        name: envVar.name,
                        value: envVar.value || '',
                        description: envVar.description || '',
                        required: true,
                        type: 'required'
                    });
                });
            }
            
            // Handle default variables
            if (environmentVariables.default && Array.isArray(environmentVariables.default)) {
                environmentVariables.default.forEach(envVar => {
                    envVarsConfig.push({
                        name: envVar.name,
                        value: envVar.value || '',
                        description: envVar.description || '',
                        required: false,
                        type: 'default'
                    });
                });
            }
            
            // Handle optional variables
            if (environmentVariables.optional && Array.isArray(environmentVariables.optional)) {
                environmentVariables.optional.forEach(envVar => {
                    envVarsConfig.push({
                        name: envVar.name,
                        value: envVar.value || '',
                        description: envVar.description || '',
                        required: false,
                        type: 'optional'
                    });
                });
            }
        }
        
        return envVarsConfig;
    }

    // Simple markdown renderer for basic formatting
    renderMarkdown(text) {
        if (!text) return '';
        
        return text
            // Bold text **bold**
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic text *italic*
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks `code`
            .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
            // Links [text](url)
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
            // Line breaks
            .replace(/\n/g, '<br>')
            // Headers ### Header
            .replace(/^### (.*$)/gm, '<h3 class="font-semibold text-base mt-2 mb-1">$1</h3>')
            .replace(/^## (.*$)/gm, '<h2 class="font-semibold text-lg mt-3 mb-2">$1</h2>')
            .replace(/^# (.*$)/gm, '<h1 class="font-bold text-xl mt-4 mb-3">$1</h1>');
    }

    // Helper methods for form error handling
    clearFormErrors() {
        // Clear general form error
        const errorContainer = document.getElementById('form-error-container');
        if (errorContainer) {
            errorContainer.classList.add('hidden');
        }

        // Clear field-specific errors
        document.querySelectorAll('.field-error').forEach(el => el.remove());
        document.querySelectorAll('.border-red-300').forEach(el => {
            el.classList.remove('border-red-300', 'focus:ring-red-500', 'focus:border-red-500');
            el.classList.add('border-gray-300', 'focus:ring-primary-500', 'focus:border-primary-500');
        });
    }

    showFormError(message) {
        const errorContainer = document.getElementById('form-error-container');
        const errorMessage = document.getElementById('form-error-message');
        
        if (errorContainer && errorMessage) {
            errorMessage.textContent = message;
            errorContainer.classList.remove('hidden');
            
            // Scroll to error message
            errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    showFieldError(inputElement, message) {
        // Remove any existing error for this field
        const existingError = inputElement.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Style the input as error
        inputElement.classList.remove('border-gray-300', 'focus:ring-primary-500', 'focus:border-primary-500');
        inputElement.classList.add('border-red-300', 'focus:ring-red-500', 'focus:border-red-500');

        // Add error message
        const errorEl = document.createElement('p');
        errorEl.className = 'field-error mt-1 text-sm text-red-600';
        errorEl.textContent = message;
        inputElement.parentNode.appendChild(errorEl);

        // Focus the input
        inputElement.focus();
    }
}