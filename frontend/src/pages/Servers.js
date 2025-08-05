import Modal from '../components/Modal.js';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime.js';
import { 
    renderMarkdown, 
    getStatusBgColor, 
    getStatusTextColor, 
    getStatusBadgeColor,
    handleExternalLinks 
} from './servers-helpers.js';
import { 
    loadServers, 
    refreshServers, 
    startServer, 
    stopServer, 
    restartServer, 
    debugServer, 
    updateUI, 
    attachMainEventListeners,
    applyFilters,
    refreshResourceUsage,
    updateServerResourceDisplay,
    startResourceUsageRefresh,
    stopResourceUsageRefresh
} from './servers-logic.js';
import { 
    renderMainTemplate, 
    renderServerCard, 
    renderLoadingState, 
    renderEmptyState, 
    renderErrorModal, 
    renderSuccessModal 
} from './servers-templates.js';

export class Servers {
    constructor() {
        this.servers = [];
        this.loading = false;
        this.resourceRefreshInterval = null;
    }

    render() {
        return renderMainTemplate(this.servers, this.loading);
    }

    // Import core functionality
    loadServers = loadServers.bind(this);
    refreshServers = refreshServers.bind(this);
    startServer = startServer.bind(this);
    stopServer = stopServer.bind(this);
    restartServer = restartServer.bind(this);
    debugServer = debugServer.bind(this);
    updateUI = updateUI.bind(this);
    applyFilters = applyFilters.bind(this);
    refreshResourceUsage = refreshResourceUsage.bind(this);
    updateServerResourceDisplay = updateServerResourceDisplay.bind(this);
    startResourceUsageRefresh = startResourceUsageRefresh.bind(this);
    stopResourceUsageRefresh = stopResourceUsageRefresh.bind(this);

    // Helper functions
    renderMarkdown = renderMarkdown;
    getStatusBgColor = getStatusBgColor;
    getStatusTextColor = getStatusTextColor;
    getStatusBadgeColor = getStatusBadgeColor;

    attachEventListeners() {
        // Load servers on page load
        this.loadServers();
        handleExternalLinks();
    }

    cleanup() {
        // Stop the resource usage refresh interval when the page is destroyed
        this.stopResourceUsageRefresh();
    }

    attachEventListenersAfterRender() {
        attachMainEventListeners.call(this);
    }

    renderLoadingState() {
        return renderLoadingState();
    }

    renderEmptyState() {
        return renderEmptyState();
    }

    showErrorModal(title, message) {
        const content = renderErrorModal(title, message);
        Modal.show(content, { title: title });
    }

    showSuccessModal(title, message) {
        const content = renderSuccessModal(title, message);
        Modal.show(content, { title: title });
    }

    // Keep the remaining complex functions from the original file
    // TODO: These should be moved to separate modules as well

    showServerMenu(serverId, target) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;

        const menu = document.createElement('div');
        menu.className = 'fixed w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50';
        menu.innerHTML = `
            <div class="py-1">
                <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 server-configure-btn" data-server-id="${serverId}">
                    <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Configure
                </button>
                <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 server-logs-btn" data-server-id="${serverId}">
                    <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    View Logs
                </button>
                <hr class="my-1 border-gray-200">
                <button class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 server-remove-btn" data-server-id="${serverId}">
                    <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Remove
                </button>
            </div>
        `;

        // Remove any existing menus
        document.querySelectorAll('.server-menu').forEach(m => m.remove());

        // Position the menu using fixed positioning relative to the viewport
        const targetRect = target.getBoundingClientRect();
        document.body.appendChild(menu);
        menu.classList.add('server-menu');
        
        // Calculate position - align right edge of menu with right edge of button
        const menuWidth = 192; // w-48 = 12rem = 192px
        let left = targetRect.right - menuWidth;
        let top = targetRect.bottom + 8; // 8px gap below button
        
        // Ensure menu doesn't go off-screen
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (left < 8) {
            left = 8; // 8px margin from left edge
        }
        if (left + menuWidth > viewportWidth - 8) {
            left = viewportWidth - menuWidth - 8; // 8px margin from right edge
        }
        
        // Check if menu would go below viewport and position above button if needed
        if (top + menu.offsetHeight > viewportHeight - 8) {
            top = targetRect.top - menu.offsetHeight - 8; // Position above button
        }
        
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;

        // Add event listeners
        menu.addEventListener('click', (e) => {
            if (e.target.classList.contains('server-configure-btn')) {
                this.showServerConfiguration(serverId);
            } else if (e.target.classList.contains('server-logs-btn')) {
                this.showServerLogs(serverId);
            } else if (e.target.classList.contains('server-remove-btn')) {
                this.removeServer(serverId);
            }
            menu.remove();
        });

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                }
            }, { once: true });
        }, 100);
    }

    async showServerConfiguration(serverId) {
        // Implementation for server configuration
        console.log('Configure server:', serverId);
    }

    async showServerLogs(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) {
            this.showErrorModal('Server Not Found', 'Could not find server information.');
            return;
        }

        try {
            const logs = await window.go.main.App.GetContainerLogs(serverId, 50);
            
            const content = `
                <div class="space-y-4">
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 class="font-medium text-gray-900 mb-2">Container Information</h4>
                        <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                                <dt class="font-medium text-gray-500">Name</dt>
                                <dd class="text-gray-900">${server.name}</dd>
                            </div>
                            <div>
                                <dt class="font-medium text-gray-500">Status</dt>
                                <dd class="text-gray-900">${server.status}</dd>
                            </div>
                            <div>
                                <dt class="font-medium text-gray-500">Container ID</dt>
                                <dd class="text-gray-900 font-mono text-xs">${serverId}</dd>
                            </div>
                            <div>
                                <dt class="font-medium text-gray-500">Uptime</dt>
                                <dd class="text-gray-900">${server.uptime || 'N/A'}</dd>
                            </div>
                        </dl>
                    </div>
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 class="font-medium text-gray-900 mb-2">Recent Logs (last 50 lines)</h4>
                        <div class="max-h-64 overflow-y-auto">
                            <pre class="text-xs text-gray-700 whitespace-pre-wrap font-mono">${logs || 'No logs available'}</pre>
                        </div>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onclick="Modal.hide()">
                            Close
                        </button>
                    </div>
                </div>
            `;
            Modal.show(content, { title: 'Server Logs', size: 'lg' });
        } catch (error) {
            this.showErrorModal('Error', `Failed to get logs: ${error.message || error}`);
        }
    }

    async removeServer(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) return;

        const content = `
            <div class="space-y-4">
                <p class="text-gray-700">Are you sure you want to remove server "${server.name}"? This will stop and remove the container.</p>
                <div class="flex justify-end space-x-3">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onclick="Modal.hide()">
                        Cancel
                    </button>
                    <button class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700" onclick="Servers.confirmRemoveServer('${serverId}')">
                        Remove
                    </button>
                </div>
            </div>
        `;
        Modal.show(content, { title: 'Remove Server' });
    }

    static async confirmRemoveServer(serverId) {
        try {
            await window.go.main.App.RemoveContainer(serverId);
            Modal.hide();
            // Refresh the servers list
            window.currentPage?.loadServers();
        } catch (error) {
            console.error('Failed to remove server:', error);
        }
    }

    async showManageInstalledServers() {
        try {
            // Get installed servers with version information
            const serversWithVersionInfo = await window.go.main.App.GetInstalledServersWithVersionCheck();
            
            if (serversWithVersionInfo.length === 0) {
                this.showEmptyInstalledServersModal();
                return;
            }

            const content = `
                <div class="space-y-6">
                    <div class="text-center">
                        <p class="text-gray-600">Manage your installed server images and check for updates.</p>
                    </div>
                    
                    <div class="max-h-96 overflow-y-auto">
                        <div class="space-y-4">
                            ${serversWithVersionInfo.map(serverInfo => this.renderInstalledServerItem(serverInfo)).join('')}
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onclick="Modal.hide()">
                            Close
                        </button>
                    </div>
                </div>
            `;

            Modal.show(content, {
                title: 'Manage Installed Servers',
                size: 'xl'
            });

            // Add event listeners after modal is shown
            setTimeout(() => {
                this.attachInstalledServersEventListeners();
            }, 100);

        } catch (error) {
            console.error('Failed to load installed servers:', error);
            this.showErrorModal('Load Failed', 'Failed to load installed servers information.');
        }
    }

    showEmptyInstalledServersModal() {
        const content = `
            <div class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">No installed servers</h3>
                <p class="mt-1 text-sm text-gray-500">Install servers from the registry to manage them here.</p>
                <div class="mt-6">
                    <button type="button" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" onclick="Modal.hide(); window.location.hash='registry'">
                        <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        Browse Registry
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'No Installed Servers',
            size: 'md'
        });
    }

    renderInstalledServerItem(serverInfo) {
        const server = serverInfo.installed_server;
        const updateAvailable = serverInfo.update_available;
        const latestVersion = serverInfo.latest_version;
        const hasRegistryError = serverInfo.registry_error;

        return `
            <div class="bg-white border border-gray-200 rounded-lg p-6">
                <div class="flex items-start justify-between">
                    <div class="flex items-start space-x-4 flex-1">
                        <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-2">
                                <h3 class="text-lg font-medium text-gray-900">${server.name}</h3>
                                ${server.is_official ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Official</span>' : ''}
                            </div>
                            <p class="text-sm text-gray-600 mt-1">${server.description || 'No description available'}</p>
                            <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>Version: <span class="font-medium">${server.version}</span></span>
                                <span>•</span>
                                <span>Image: <code class="text-xs bg-gray-100 px-1 py-0.5 rounded">${server.docker_image}</code></span>
                                <span>•</span>
                                <span>Installed: ${new Date(server.install_date).toLocaleDateString()}</span>
                            </div>
                            
                            ${hasRegistryError ? `
                                <div class="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <p class="text-xs text-yellow-800">
                                        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                        </svg>
                                        Unable to check for updates: ${hasRegistryError}
                                    </p>
                                </div>
                            ` : updateAvailable ? `
                                <div class="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center">
                                            <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                            </svg>
                                            <span class="text-sm text-green-800">
                                                <strong>Update available!</strong> Version ${latestVersion} is now available.
                                            </span>
                                        </div>
                                        <button class="update-server-btn text-sm text-green-700 hover:text-green-800 underline" data-server-id="${server.id}">
                                            Update in Registry
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <div class="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-md">
                                    <p class="text-xs text-gray-600">
                                        <svg class="w-4 h-4 inline mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        Up to date (${server.version})
                                    </p>
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-2 ml-4">
                        <button class="delete-installed-btn px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200" data-server-id="${server.id}" data-server-name="${server.name}">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachInstalledServersEventListeners() {
        // Delete buttons
        document.querySelectorAll('.delete-installed-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const serverId = e.target.getAttribute('data-server-id');
                const serverName = e.target.getAttribute('data-server-name');
                
                const confirmContent = `
                    <div class="space-y-4">
                        <p class="text-gray-700">Are you sure you want to delete the installed server "<strong>${serverName}</strong>"?</p>
                        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <p class="text-sm text-yellow-800">This will remove the Docker image and all associated data. Any running containers using this image will be stopped.</p>
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onclick="Modal.hide()">
                                Cancel
                            </button>
                            <button class="confirm-delete-btn px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700" data-server-id="${serverId}">
                                Delete
                            </button>
                        </div>
                    </div>
                `;

                Modal.show(confirmContent, { title: 'Confirm Delete' });

                // Handle confirmation
                setTimeout(() => {
                    document.querySelector('.confirm-delete-btn')?.addEventListener('click', async () => {
                        try {
                            await window.go.main.App.DeleteInstalledServer(serverId);
                            Modal.hide();
                            this.showSuccessModal('Success', 'Installed server deleted successfully.');
                            
                            // Refresh the installed servers list after a short delay
                            setTimeout(() => {
                                this.showManageInstalledServers();
                            }, 1500);
                            
                        } catch (error) {
                            console.error('Failed to delete installed server:', error);
                            this.showErrorModal('Delete Failed', `Failed to delete installed server: ${error.message || error}`);
                        }
                    });
                }, 100);
            });
        });

        // Update buttons
        document.querySelectorAll('.update-server-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const serverId = e.target.getAttribute('data-server-id');
                Modal.hide();
                window.location.hash = 'registry';
                // TODO: Focus on the specific server in registry
            });
        });
    }

    async showAddServerWizard() {
        try {
            // Get installed servers (those with pulled images)
            const installedServers = await window.go.main.App.GetInstalledServers();
            
            const content = `
                <div class="space-y-6">
                    <div class="text-center">
                        <p class="text-gray-600">How would you like to add a new MCP server?</p>
                    </div>
                    
                    <div class="grid grid-cols-1 gap-4">
                        ${installedServers.length == 0 ? `
                        <button id="wizard-registry" class="p-6 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-medium text-gray-900">Browse Registry</h3>
                                    <p class="text-sm text-gray-600">There are no installed servers. Browse the registry to install a server.</p>
                                </div>
                            </div>
                        </button>
                        ` : ''}

                        ${installedServers.length > 0 ? `
                        <button id="wizard-installed" class="p-6 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-medium text-gray-900">Create from Installed (${installedServers.length})</h3>
                                    <p class="text-sm text-gray-600">Create MCP Servers from already installed server images</p>
                                </div>
                            </div>
                        </button>
                        ` : ''}

                        <button id="wizard-manual" class="p-6 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-medium text-gray-900">Manual Docker Setup</h3>
                                    <p class="text-sm text-gray-600">Add a custom Docker container configuration</p>
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

                document.getElementById('wizard-installed')?.addEventListener('click', () => {
                    Modal.hide();
                    this.showInstalledServersWizard(installedServers);
                });

                document.getElementById('wizard-manual')?.addEventListener('click', () => {
                    Modal.hide();
                    this.showManualInstallWizard();
                });
            }, 100);
        } catch (error) {
            console.error('Failed to load installed servers:', error);
            this.showErrorModal('Load Failed', 'Failed to load installed servers list.');
        }
    }

    showInstalledServersWizard(installedServers) {
        const content = `
            <div class="space-y-6">
                <div class="text-center">
                    <p class="text-gray-600">Choose from your installed server images to create a new MCP Server:</p>
                </div>
                
                <div class="max-h-96 overflow-y-auto">
                    <div class="grid grid-cols-1 gap-3">
                        ${installedServers.map(server => `
                            <div class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer server-option" data-server-id="${server.id}">
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                        <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"></path>
                                        </svg>
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-medium text-gray-900">${server.name}</h3>
                                        <p class="text-sm text-gray-600">${server.docker_image}</p>
                                        <p class="text-xs text-gray-500">Installed: ${new Date(server.install_date).toLocaleDateString()}</p>
                                    </div>
                                    <div class="text-right">
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Installed
                                        </span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="flex justify-end space-x-3">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onclick="Modal.hide()">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Create MCP Server from Installed Images',
            size: 'lg'
        });

        // Add click handlers for server options
        setTimeout(() => {
            document.querySelectorAll('.server-option').forEach(option => {
                option.addEventListener('click', () => {
                    const serverId = option.getAttribute('data-server-id');
                    const server = installedServers.find(s => s.id === serverId);
                    if (server) {
                        Modal.hide();
                        this.showServerConfigurationWizard(server);
                    }
                });
            });
        }, 100);
    }

    showManualInstallWizard() {
        this.showErrorModal('Not Implemented', 'Manual Docker setup is not yet implemented.');
    }

    showServerConfigurationWizard(server) {
        // Extract default values from registry metadata
        const defaultPort = server.ports && Object.keys(server.ports).length > 0 ? Object.values(server.ports)[0] : '';
        const memoryRequirement = server.resource_requirements && server.resource_requirements.memory ? server.resource_requirements.memory : '';
        
        // Pre-populate environment variables from registry metadata
        let envVarsConfig = [];
        if (server.environment_variables) {
            // Handle required variables
            if (server.environment_variables.required && Array.isArray(server.environment_variables.required)) {
                server.environment_variables.required.forEach(envVar => {
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
            if (server.environment_variables.default && Array.isArray(server.environment_variables.default)) {
                server.environment_variables.default.forEach(envVar => {
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
            if (server.environment_variables.optional && Array.isArray(server.environment_variables.optional)) {
                server.environment_variables.optional.forEach(envVar => {
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
        
        // Pre-populate volumes from registry metadata
        let volumesText = '';
        if (server.volumes && Array.isArray(server.volumes) && server.volumes.length > 0) {
            volumesText = server.volumes.map(volume => {
                if (typeof volume === 'string') {
                    return volume;
                } else if (volume.host_path && volume.container_path) {
                    return `${volume.host_path}:${volume.container_path}`;
                }
                return '';
            }).filter(v => v).join('\\n');
        }

        const content = `
            <div class="space-y-6">
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-2">Server Details</h4>
                    <dl class="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <dt class="text-gray-600">Name:</dt>
                            <dd class="text-gray-900">${server.name}</dd>
                        </div>
                        <div>
                            <dt class="text-gray-600">Image:</dt>
                            <dd class="text-gray-900 font-mono text-xs">${server.docker_image}</dd>
                        </div>
                        ${server.version ? `
                            <div>
                                <dt class="text-gray-600">Version:</dt>
                                <dd class="text-gray-900">${server.version}</dd>
                            </div>
                        ` : ''}
                        ${memoryRequirement ? `
                            <div>
                                <dt class="text-gray-600">Memory:</dt>
                                <dd class="text-gray-900">${memoryRequirement}</dd>
                            </div>
                        ` : ''}
                        ${server.docker_command ? `
                            <div class="col-span-2">
                                <dt class="text-gray-600">Docker Command:</dt>
                                <dd class="text-gray-900 font-mono text-xs bg-gray-100 p-2 rounded mt-1">${server.docker_command}</dd>
                            </div>
                        ` : ''}
                    </dl>
                </div>
                
                ${server.setup_description ? `
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 class="font-medium text-gray-900 mb-2">Setup Instructions</h4>
                        <div class="text-sm text-blue-900">${this.renderMarkdown(server.setup_description)}</div>
                    </div>
                ` : ''}

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Container Name</label>
                        <input type="text" id="container-name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="${server.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}" value="${server.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}">
                    </div>
                    
                    
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium text-gray-700">Environment Variables</label>
                            <button type="button" id="add-env-var-btn" class="flex items-center px-2 py-1 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded hover:bg-primary-100 focus:outline-none focus:ring-1 focus:ring-primary-500">
                                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                Add Variable
                            </button>
                        </div>
                        <div id="env-vars-container" class="space-y-2">
                            ${envVarsConfig.map((envVar, index) => `
                                <div class="env-var-row flex items-center space-x-2" data-required="${envVar.required}" data-type="${envVar.type}">
                                    <div class="flex-1">
                                        <input type="text" class="env-var-name w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm" placeholder="Variable name" value="${envVar.name}" ${envVar.required ? 'readonly' : ''}>
                                    </div>
                                    <div class="flex-1">
                                        <input type="text" class="env-var-value w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm" placeholder="Value" value="${envVar.value}">
                                    </div>
                                    <button type="button" class="remove-env-var-btn p-1 ${envVar.required ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}" ${envVar.required ? 'disabled' : ''} title="${envVar.required ? 'Required variable cannot be removed' : 'Remove variable'}">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                                ${envVar.description ? `
                                    <div class="text-xs text-gray-500 ml-2 mb-4">
                                        <span class="inline-flex items-center">
                                            <span class="w-2 h-2 ${envVar.type === 'required' ? 'bg-red-400' : envVar.type === 'default' ? 'bg-green-400' : 'bg-blue-400'} rounded-full mr-1"></span>
                                            ${envVar.type === 'required' ? 'Required' : envVar.type === 'default' ? 'Default' : 'Optional'}: ${envVar.description}
                                        </span>
                                    </div>
                                ` : ''}
                            `).join('')}
                        </div>
                        ${envVarsConfig.length === 0 ? `
                            <div class="env-var-row flex items-center space-x-2" data-required="false">
                                <div class="flex-1">
                                    <input type="text" class="env-var-name w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm" placeholder="Variable name">
                                </div>
                                <div class="flex-1">
                                    <input type="text" class="env-var-value w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm" placeholder="Value">
                                </div>
                                <button type="button" class="remove-env-var-btn p-1 text-red-500 hover:text-red-700" title="Remove variable">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Volume Mounts${volumesText ? ' (pre-populated from registry)' : ' (optional)'}</label>
                        <textarea id="volume-mounts" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" rows="3" placeholder="/host/path:/container/path
/host/config:/app/config">${volumesText}</textarea>
                        <p class="text-xs text-gray-500 mt-1">One mount per line in host_path:container_path format</p>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onclick="Modal.hide()">
                        Cancel
                    </button>
                    <button id="create-container-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700">
                        Setup MCP Server
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: `Setup MCP Server: ${server.name}`,
            size: 'xl'
        });

        // Add create container handler and environment variable management
        setTimeout(() => {
            document.getElementById('create-container-btn')?.addEventListener('click', () => {
                this.createContainerFromForm(server);
            });

            // Add environment variable functionality
            this.attachEnvVarEventListeners();
            
            // Add external link handling for markdown content within the modal
            this.attachExternalLinkHandlers();
        }, 100);
    }

    showContainerIssueModal(containerName, container, logs) {
        const statusColor = container.state === 'restarting' ? 'yellow' : 'red';
        const statusIcon = container.state === 'restarting' ? 
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>' :
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';

        const content = `
            <div class="space-y-6">
                <div class="bg-${statusColor}-50 border border-${statusColor}-200 rounded-lg p-4">
                    <div class="flex">
                        <svg class="w-5 h-5 text-${statusColor}-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${statusIcon}
                        </svg>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-${statusColor}-800">
                                Container "${containerName}" ${container.state === 'restarting' ? 'is restarting' : 'has issues'}
                            </h3>
                            <p class="text-sm text-${statusColor}-700 mt-1">
                                ${container.state === 'restarting' ? 
                                    'The container is currently restarting. This may take a moment.' :
                                    'The container encountered an error and stopped running.'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-2">Container Details</h4>
                    <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                            <dt class="font-medium text-gray-500">Status</dt>
                            <dd class="text-gray-900">${container.status}</dd>
                        </div>
                        <div>
                            <dt class="font-medium text-gray-500">State</dt>
                            <dd class="text-gray-900">${container.state}</dd>
                        </div>
                        <div>
                            <dt class="font-medium text-gray-500">Container ID</dt>
                            <dd class="text-gray-900 font-mono text-xs">${container.id}</dd>
                        </div>
                        <div>
                            <dt class="font-medium text-gray-500">Exit Code</dt>
                            <dd class="text-gray-900">${container.exit_code || 'N/A'}</dd>
                        </div>
                    </dl>
                </div>

                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-2">Container Logs (last 50 lines)</h4>
                    <div class="max-h-64 overflow-y-auto">
                        <pre class="text-xs text-gray-700 whitespace-pre-wrap font-mono">${logs || 'No logs available'}</pre>
                    </div>
                </div>

                <div class="flex justify-end space-x-3">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onclick="Modal.hide()">
                        Close
                    </button>
                    <button class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700" onclick="Modal.hide(); window.currentPage?.startServer('${container.id}')">
                        Try Restart
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Container Debug Information',
            size: 'lg'
        });
    }

    attachEnvVarEventListeners() {
        // Add new environment variable
        document.getElementById('add-env-var-btn')?.addEventListener('click', () => {
            this.addEnvironmentVariable();
        });

        // Handle remove buttons for existing variables
        document.querySelectorAll('.remove-env-var-btn').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', (e) => {
                    this.removeEnvironmentVariable(e.target.closest('.env-var-row'));
                });
            }
        });
    }

    attachExternalLinkHandlers() {
        // Find all external links in the current modal and add click handlers
        document.querySelectorAll('.external-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = e.target.getAttribute('data-url');
                
                if (url) {
                    try {
                        BrowserOpenURL(url);
                    } catch (error) {
                        // Fallback for web version or if Wails runtime not available
                        window.open(url, '_blank');
                    }
                }
            });
        });
    }

    addEnvironmentVariable() {
        const container = document.getElementById('env-vars-container');
        if (!container) return;

        const newRow = document.createElement('div');
        newRow.className = 'env-var-row flex items-center space-x-2';
        newRow.setAttribute('data-required', 'false');
        newRow.innerHTML = `
            <div class="flex-1">
                <input type="text" class="env-var-name w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm" placeholder="Variable name">
            </div>
            <div class="flex-1">
                <input type="text" class="env-var-value w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm" placeholder="Value">
            </div>
            <button type="button" class="remove-env-var-btn p-1 text-red-500 hover:text-red-700" title="Remove variable">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

        container.appendChild(newRow);

        // Add event listener to the new remove button
        const removeBtn = newRow.querySelector('.remove-env-var-btn');
        removeBtn.addEventListener('click', () => {
            this.removeEnvironmentVariable(newRow);
        });

        // Focus on the name input
        newRow.querySelector('.env-var-name').focus();
    }

    removeEnvironmentVariable(row) {
        if (row && row.getAttribute('data-required') !== 'true') {
            // Find and remove any associated hint element that comes immediately after this row
            const nextElement = row.nextElementSibling;
            if (nextElement && nextElement.classList.contains('text-xs') && 
                nextElement.classList.contains('text-gray-500') && 
                nextElement.classList.contains('ml-2')) {
                nextElement.remove();
            }
            row.remove();
        }
    }

    async findAvailablePort(startPort) {
        // Get all currently configured servers to check for port conflicts
        let configuredServers = [];
        try {
            configuredServers = await window.go.main.App.GetConfiguredServers();
        } catch (error) {
            console.warn('Failed to get configured servers for port checking:', error);
        }

        const usedPorts = new Set(configuredServers.map(server => server.port));
        
        // Find the first available port starting from startPort
        let port = startPort;
        while (usedPorts.has(port)) {
            port++;
            // Safety check to prevent infinite loop
            if (port > 65535) {
                throw new Error('No available ports found in valid range');
            }
        }
        
        return port;
    }

    async createContainerFromForm(server) {
        const containerName = document.getElementById('container-name').value.trim();
        
        // Get server defaults for configuration
        let serverDefaults = {};
        try {
            serverDefaults = await window.go.main.App.GetServerDefaults();
        } catch (error) {
            console.warn('Failed to load server defaults, using fallbacks:', error);
            serverDefaults = {
                auto_start: false,
                default_port: 8000,
                max_memory_mb: 512,
                restart_on_failure: true
            };
        }
        
        // Handle port allocation starting from default port range
        const port = await this.findAvailablePort(serverDefaults.default_port || 8000);
        const volumesText = document.getElementById('volume-mounts').value.trim();

        if (!containerName) {
            this.showErrorModal('Validation Error', 'Container name is required.');
            return;
        }

        try {
            // Parse environment variables from individual input fields
            const environment = {};
            const envVarRows = document.querySelectorAll('.env-var-row');
            envVarRows.forEach(row => {
                const nameInput = row.querySelector('.env-var-name');
                const valueInput = row.querySelector('.env-var-value');
                
                if (nameInput && valueInput) {
                    const name = nameInput.value.trim();
                    const value = valueInput.value.trim();
                    
                    if (name) {
                        environment[name] = value;
                    }
                }
            });

            // Parse volume mounts
            const volumes = {};
            if (volumesText) {
                volumesText.split('\n').forEach(line => {
                    const [hostPath, containerPath] = line.split(':');
                    if (hostPath && containerPath) {
                        volumes[hostPath.trim()] = containerPath.trim();
                    }
                });
            }

            // Extract MCP port from registry data
            let containerPort = 0;
            if (server.ports && server.ports.mcp) {
                containerPort = parseInt(server.ports.mcp) || 0;
            }

            const config = {
                name: containerName,
                image: server.docker_image,
                port: port,
                container_port: containerPort,
                environment: environment,
                volumes: volumes,
                docker_command: server.docker_command || '',
                memory_limit_mb: serverDefaults.max_memory_mb || 512,
                restart_policy: serverDefaults.restart_on_failure ? "on-failure" : "no",
                labels: {
                    "neobelt.server-id": server.id,
                    "neobelt.server-name": server.name
                }
            };

            console.log('Creating container with config:', config);
            const containerId = await window.go.main.App.CreateContainer(config);
            console.log('Container created successfully with ID:', containerId);
            
            // Start the container only if auto-start is enabled in server defaults
            if (serverDefaults.auto_start) {
                console.log('Auto-start enabled, starting container:', containerId);
                await window.go.main.App.StartContainer(containerId);
                console.log('Container started automatically');
            } else {
                console.log('Auto-start disabled, container created but not started');
            }
            
            // Create a configured server entry for this container
            try {
                console.log('Creating configured server entry');
                await window.go.main.App.CreateConfiguredServer(
                    server.id,
                    containerName,
                    containerId,
                    port,
                    environment,
                    volumes
                );
                console.log('Configured server entry created successfully');
            } catch (configError) {
                console.warn('Failed to create configured server entry:', configError);
                // Don't fail the whole operation - container was created successfully
            }
            
            Modal.hide();
            console.log('Refreshing servers list...');
            await this.loadServers(); // Refresh the list
            
            // Check container status and show appropriate modal
            console.log('Checking container creation result...');
            await this.showContainerCreationResult(containerId, containerName);
        } catch (error) {
            console.error('Failed to create container:', error);
            this.showErrorModal('Create MCP Server Failed', `Failed to create MCP Server: ${error.message || error}`);
        }
    }

    async showContainerCreationResult(containerId, containerName) {
        try {
            console.log(`Checking container creation result for ID: ${containerId}, Name: ${containerName}`);
            
            // Get managed containers to verify the container exists and get its status
            const containers = await window.go.main.App.GetManagedContainers();
            const container = containers.find(c => c.id === containerId || c.id.startsWith(containerId) || containerId.startsWith(c.id));
            
            if (!container) {
                console.error('Container not found in managed containers list');
                console.log('Available container IDs:', containers.map(c => c.id));
                console.log('Searching container ID:', containerId);
                
                // Try to get ALL containers (not just managed ones) for debugging
                try {
                    console.log('Attempting to get container logs to verify container exists...');
                    const logs = await window.go.main.App.GetContainerLogs(containerId, 10);
                    console.log('Container logs retrieved successfully, container exists but not in managed list');
                    
                    // Show a different error message with more debugging information
                    this.showContainerNotInManagedListModal(containerId, containerName, containers);
                } catch (logError) {
                    console.error('Container logs also failed, container may not exist:', logError);
                    this.showContainerNotFoundModal(containerId, containerName, containers);
                }
                return;
            }

            console.log('Container found:', container);
            const isRunning = container.status === 'running';
            if (isRunning) {
                console.log('Container is running successfully');
                // Container is running successfully
                this.showSuccessModal('MCP Server Created', `MCP Server "${containerName}" has been created and is running successfully. Container ID: ${containerId.substring(0, 12)}`);
            } else {
                console.log('Container has issues, getting logs...');
                // Container has issues, show detailed modal with logs
                const logs = await window.go.main.App.GetContainerLogs(containerId, 50);
                console.log('Container logs retrieved for troubleshooting');
                this.showContainerIssueModal(containerName, container, logs);
            }
        } catch (error) {
            console.error('Failed to check container status:', error);
            // Fallback to basic success message
            this.showSuccessModal('MCP Server Created', `MCP Server "${containerName}" has been created. Container ID: ${containerId.substring(0, 12)}`);
        }
    }

    showContainerNotInManagedListModal(containerId, containerName, managedContainers) {
        const content = `
            <div class="space-y-4">
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div class="flex">
                        <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-yellow-800">Container Created But Not Managed</h3>
                            <p class="text-sm text-yellow-700 mt-1">The container "${containerName}" was created successfully but is not appearing in the managed containers list.</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-2">Debug Information</h4>
                    <dl class="grid grid-cols-1 gap-2 text-sm">
                        <div>
                            <dt class="font-medium text-gray-500">Container ID:</dt>
                            <dd class="text-gray-900 font-mono">${containerId}</dd>
                        </div>
                        <div>
                            <dt class="font-medium text-gray-500">Container Name:</dt>
                            <dd class="text-gray-900">${containerName}</dd>
                        </div>
                        <div>
                            <dt class="font-medium text-gray-500">Managed Containers Found:</dt>
                            <dd class="text-gray-900">${managedContainers.length}</dd>
                        </div>
                    </dl>
                </div>

                <div class="flex justify-end space-x-3">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onclick="Modal.hide()">
                        Close
                    </button>
                    <button class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700" onclick="Modal.hide(); window.currentPage?.loadServers()">
                        Refresh Servers
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Container Status Warning',
            size: 'lg'
        });
    }

    showContainerNotFoundModal(containerId, containerName, managedContainers) {
        const content = `
            <div class="space-y-4">
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="flex">
                        <svg class="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800">Container Not Found</h3>
                            <p class="text-sm text-red-700 mt-1">The container "${containerName}" could not be found or verified after creation.</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-2">Debug Information</h4>
                    <dl class="grid grid-cols-1 gap-2 text-sm">
                        <div>
                            <dt class="font-medium text-gray-500">Expected Container ID:</dt>
                            <dd class="text-gray-900 font-mono">${containerId}</dd>
                        </div>
                        <div>
                            <dt class="font-medium text-gray-500">Expected Container Name:</dt>
                            <dd class="text-gray-900">${containerName}</dd>
                        </div>
                        <div>
                            <dt class="font-medium text-gray-500">Available Managed Containers:</dt>
                            <dd class="text-gray-900">${managedContainers.length}</dd>
                        </div>
                    </dl>
                </div>

                <div class="flex justify-end space-x-3">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onclick="Modal.hide()">
                        Close
                    </button>
                    <button class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700" onclick="Modal.hide(); window.currentPage?.loadServers()">
                        Refresh Servers
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Container Creation Failed',
            size: 'lg'
        });
    }
}