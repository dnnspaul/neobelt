import Modal from '../components/Modal.js';

export async function loadServers() {
    this.loading = true;
    this.updateUI();

    try {
        // Load both Docker containers and configured servers
        const [containers, configuredServers] = await Promise.all([
            window.go.main.App.GetManagedContainers(),
            window.go.main.App.GetConfiguredServers()
        ]);

        // Filter containers to only show those that exist in the config file
        const configuredContainerIds = new Set(
            (configuredServers || []).map(server => server.container_id).filter(id => id)
        );

        this.servers = (containers || []).filter(container => {
            // Check if container ID matches any configured server ID (handle both short and full IDs)
            return Array.from(configuredContainerIds).some(configId => 
                configId === container.id || configId.startsWith(container.id) || container.id.startsWith(configId)
            );
        });
    } catch (error) {
        console.error('Failed to load servers:', error);
        this.servers = [];
    }

    this.loading = false;
    this.updateUI();
}

export async function refreshServers() {
    await this.loadServers();
}

export async function startServer(serverId) {
    try {
        await window.go.main.App.StartContainer(serverId);
        await this.loadServers(); // Refresh the list
    } catch (error) {
        console.error('Failed to start server:', error);
        this.showErrorModal('Start Server Failed', `Failed to start server: ${error.message || error}`);
    }
}

export async function stopServer(serverId) {
    try {
        await window.go.main.App.StopContainer(serverId);
        await this.loadServers(); // Refresh the list
    } catch (error) {
        console.error('Failed to stop server:', error);
        this.showErrorModal('Stop Server Failed', `Failed to stop server: ${error.message || error}`);
    }
}

export async function restartServer(serverId) {
    try {
        await window.go.main.App.RestartContainer(serverId);
        await this.loadServers(); // Refresh the list
    } catch (error) {
        console.error('Failed to restart server:', error);
        this.showErrorModal('Restart Server Failed', `Failed to restart server: ${error.message || error}`);
    }
}

export async function debugServer(serverId) {
    try {
        const logs = await window.go.main.App.GetContainerLogs(serverId, 50);
        const container = this.servers.find(s => s.id === serverId);
        const containerName = container ? container.name : serverId;
        
        this.showContainerIssueModal(containerName, container, logs);
    } catch (error) {
        console.error('Failed to get container logs:', error);
        this.showErrorModal('Debug Server Failed', `Failed to get container logs: ${error.message || error}`);
    }
}

export function updateUI() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = this.render();
        this.attachEventListenersAfterRender();
        this.startResourceUsageRefresh();
    }
}

export async function refreshResourceUsage() {
    if (!this.servers || this.servers.length === 0) return;
    
    try {
        // Get updated container information with resource usage
        const updatedContainers = await window.go.main.App.GetManagedContainers();
        
        // Update resource usage for each server without full re-render
        this.servers.forEach(server => {
            const updatedContainer = updatedContainers.find(c => 
                c.id === server.id || c.id.startsWith(server.id) || server.id.startsWith(c.id)
            );
            
            if (updatedContainer) {
                // Update server data
                server.cpu = updatedContainer.cpu;
                server.memory = updatedContainer.memory;
                server.status = updatedContainer.status;
                server.uptime = updatedContainer.uptime;
                
                // Update the DOM elements directly
                this.updateServerResourceDisplay(server.id, updatedContainer);
            }
        });
    } catch (error) {
        console.error('Failed to refresh resource usage:', error);
    }
}

export function updateServerResourceDisplay(serverId, containerData) {
    // Update CPU usage
    const cpuElement = document.querySelector(`[data-server-id="${serverId}"] .cpu-usage`);
    if (cpuElement) {
        cpuElement.textContent = containerData.cpu || 'N/A';
    }
    
    // Update memory usage  
    const memoryElement = document.querySelector(`[data-server-id="${serverId}"] .memory-usage`);
    if (memoryElement) {
        memoryElement.textContent = containerData.memory || 'N/A';
    }
    
    // Update status
    const statusElement = document.querySelector(`[data-server-id="${serverId}"] .status-text`);
    if (statusElement) {
        statusElement.textContent = containerData.status || 'unknown';
    }
    
    // Update status indicator dot
    const statusDot = document.querySelector(`[data-server-id="${serverId}"] .status-dot`);
    if (statusDot) {
        // Remove existing status classes
        statusDot.classList.remove('bg-green-500', 'bg-gray-400', 'bg-red-500');
        
        // Add appropriate status class
        if (containerData.status === 'running') {
            statusDot.classList.add('bg-green-500');
        } else if (containerData.status === 'stopped' || containerData.status === 'exited') {
            statusDot.classList.add('bg-gray-400');
        } else {
            statusDot.classList.add('bg-red-500');
        }
    }
}


export function startResourceUsageRefresh() {
    // Clear any existing interval
    if (this.resourceRefreshInterval) {
        clearInterval(this.resourceRefreshInterval);
    }
    
    // Start new interval for resource usage refresh every 2 seconds
    this.resourceRefreshInterval = setInterval(() => {
        this.refreshResourceUsage();
    }, 2000);
}

export function stopResourceUsageRefresh() {
    if (this.resourceRefreshInterval) {
        clearInterval(this.resourceRefreshInterval);
        this.resourceRefreshInterval = null;
    }
}

export function attachMainEventListeners() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        // Remove any existing listeners to prevent duplicates
        mainContent.replaceWith(mainContent.cloneNode(true));
        const newMainContent = document.getElementById('main-content');
        
        newMainContent.addEventListener('click', (e) => {
            // Header buttons
            if (e.target.id === 'refresh-servers-btn' || e.target.closest('#refresh-servers-btn')) {
                this.refreshServers();
                return;
            }
            
            if (e.target.id === 'manage-installed-btn' || e.target.closest('#manage-installed-btn')) {
                this.showManageInstalledServers();
                return;
            }
            
            if (e.target.id === 'add-new-server-btn' || e.target.closest('#add-new-server-btn') || 
                e.target.id === 'add-server-empty-state' || e.target.closest('#add-server-empty-state')) {
                this.showAddServerWizard();
                return;
            }
            
            // Server action buttons
            if (e.target.classList.contains('server-start-btn')) {
                const serverId = e.target.getAttribute('data-server-id');
                this.startServer(serverId);
                return;
            }
            
            if (e.target.classList.contains('server-stop-btn')) {
                const serverId = e.target.getAttribute('data-server-id');
                this.stopServer(serverId);
                return;
            }
            
            if (e.target.classList.contains('server-restart-btn')) {
                const serverId = e.target.getAttribute('data-server-id');
                this.restartServer(serverId);
                return;
            }

            if (e.target.classList.contains('server-debug-btn')) {
                const serverId = e.target.getAttribute('data-server-id');
                this.debugServer(serverId);
                return;
            }

            if (e.target.closest('.server-menu-btn')) {
                const serverId = e.target.closest('.server-menu-btn').getAttribute('data-server-id');
                this.showServerMenu(serverId, e.target);
                return;
            }
            
        });

        // Filter and search functionality
        const statusFilter = newMainContent.querySelector('#status-filter');
        const searchInput = newMainContent.querySelector('#server-search');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
    }
}


export function applyFilters() {
    const statusFilter = document.getElementById('status-filter');
    const searchInput = document.getElementById('server-search');
    
    if (!statusFilter || !searchInput) return;
    
    const filterValue = statusFilter.value;
    const searchValue = searchInput.value.toLowerCase();
    
    const serverCards = document.querySelectorAll('.bg-white.rounded-lg.shadow-sm');
    
    serverCards.forEach(card => {
        const serverName = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const serverStatus = card.querySelector('.rounded-full')?.textContent.toLowerCase() || '';
        
        const matchesSearch = !searchValue || serverName.includes(searchValue);
        const matchesFilter = filterValue === 'all' || serverStatus.includes(filterValue);
        
        if (matchesSearch && matchesFilter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}