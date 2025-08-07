import Modal from '../components/Modal.js';
import { getStatusBgColor, getStatusTextColor, getStatusBadgeColor } from './servers-helpers.js';
import { renderServerActionButtons } from './servers-templates.js';

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

export async function refreshServersWithoutLoading() {
    try {
        // Load both Docker containers and configured servers without setting loading state
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
        
        // Update UI without loading state
        this.updateUI();
    } catch (error) {
        console.error('Failed to refresh servers:', error);
    }
}

export async function startServer(serverId) {
    const button = document.querySelector(`[data-server-id="${serverId}"] .server-start-btn`);
    
    try {
        // Set button to loading state
        this.setButtonLoading(button, 'Starting...');
        
        await window.go.main.App.StartContainer(serverId);
        await this.refreshServersWithoutLoading(); // Refresh without showing loading state
    } catch (error) {
        console.error('Failed to start server:', error);
        this.showErrorModal('Start Server Failed', `Failed to start server: ${error.message || error}`);
    } finally {
        // Reset button state (will be updated by refresh)
        this.resetButtonLoading(button, 'Start');
    }
}

export async function stopServer(serverId) {
    const button = document.querySelector(`[data-server-id="${serverId}"] .server-stop-btn`);
    
    try {
        // Set button to loading state
        this.setButtonLoading(button, 'Stopping...');
        
        await window.go.main.App.StopContainer(serverId);
        await this.refreshServersWithoutLoading(); // Refresh without showing loading state
    } catch (error) {
        console.error('Failed to stop server:', error);
        this.showErrorModal('Stop Server Failed', `Failed to stop server: ${error.message || error}`);
    } finally {
        // Reset button state (will be updated by refresh)
        this.resetButtonLoading(button, 'Stop');
    }
}

export async function restartServer(serverId) {
    const button = document.querySelector(`[data-server-id="${serverId}"] .server-restart-btn`);
    
    try {
        // Set button to loading state
        this.setButtonLoading(button, 'Restarting...');
        
        await window.go.main.App.RestartContainer(serverId);
        await this.refreshServersWithoutLoading(); // Refresh without showing loading state
    } catch (error) {
        console.error('Failed to restart server:', error);
        this.showErrorModal('Restart Server Failed', `Failed to restart server: ${error.message || error}`);
    } finally {
        // Reset button state (will be updated by refresh)
        this.resetButtonLoading(button, 'Restart');
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
        // Double-check that we're still on the servers page before updating UI
        const currentHash = window.location.hash.slice(1) || 'dashboard';
        if (currentHash !== 'servers') {
            // Stop refresh and don't update UI if we're no longer on the servers page
            this.stopResourceUsageRefresh();
            return;
        }
        
        mainContent.innerHTML = this.render();
        this.attachEventListenersAfterRender();
        
        // Only start refresh if we have servers to monitor
        if (this.servers && this.servers.length > 0) {
            this.startResourceUsageRefresh();
        } else {
            this.stopResourceUsageRefresh();
        }
    }
}

export async function refreshResourceUsage() {
    if (!this.servers || this.servers.length === 0) return;
    
    // Check if we're still on the servers page to prevent race conditions
    const currentHash = window.location.hash.slice(1) || 'dashboard';
    if (currentHash !== 'servers') {
        // Stop the refresh interval if we're no longer on the servers page
        this.stopResourceUsageRefresh();
        return;
    }
    
    // Prevent overlapping calls to avoid Wails callback registration issues
    if (this.refreshing) {
        return;
    }
    
    this.refreshing = true;
    
    try {
        // Get updated container information
        const updatedContainers = await window.go.main.App.GetManagedContainers();
        
        // Update all server data for each server without full re-render
        this.servers.forEach(server => {
            const updatedContainer = updatedContainers.find(c => 
                c.id === server.id || c.id.startsWith(server.id) || server.id.startsWith(c.id)
            );
            
            if (updatedContainer) {
                // Update server data in memory
                server.cpu = updatedContainer.cpu;
                server.memory = updatedContainer.memory;
                server.status = updatedContainer.status;
                server.uptime = updatedContainer.uptime;
                server.display_name = updatedContainer.display_name;
                server.name = updatedContainer.name;
                server.version = updatedContainer.version;
                server.port = updatedContainer.port;
                
                // Update the DOM elements directly to prevent flickering
                this.updateServerResourceDisplay(server.id, updatedContainer);
            }
        });
    } catch (error) {
        console.error('Failed to refresh server data:', error);
    } finally {
        this.refreshing = false;
    }
}

export function updateServerResourceDisplay(serverId, containerData) {
    const serverCard = document.querySelector(`[data-server-id="${serverId}"]`);
    if (!serverCard) return;

    // Update server name/display name using specific data attribute
    const nameElement = serverCard.querySelector('[data-element="server-name"]');
    if (nameElement && (containerData.display_name !== undefined || containerData.name !== undefined)) {
        const newName = containerData.display_name || containerData.name;
        if (nameElement.textContent !== newName) {
            nameElement.textContent = newName;
        }
    }

    // Update status badge using specific data attribute
    const statusBadge = serverCard.querySelector('[data-element="status-badge"]');
    if (statusBadge && containerData.status) {
        const newStatusText = containerData.status.toUpperCase();
        const newStatusClasses = getStatusBadgeColor(containerData.status);
        
        if (statusBadge.textContent !== newStatusText) {
            statusBadge.textContent = newStatusText;
            statusBadge.className = `px-2 py-1 text-xs font-medium ${newStatusClasses} rounded-full`;
            statusBadge.setAttribute('data-element', 'status-badge'); // Preserve the data attribute
        }
    }

    // Update version info using specific data attribute
    const versionElement = serverCard.querySelector('[data-element="version-info"]');
    if (versionElement && containerData.version !== undefined) {
        const versionText = `Version: ${containerData.version}`;
        if (versionElement.textContent !== versionText) {
            versionElement.textContent = versionText;
        }
    }
    
    // Update port info using specific data attribute
    const portElement = serverCard.querySelector('[data-element="port-info"]');
    if (portElement && containerData.port !== undefined) {
        const portText = `Port: ${containerData.port}`;
        if (portElement.textContent !== portText) {
            portElement.textContent = portText;
        }
    }
    
    // Update uptime info using specific data attribute
    const uptimeElement = serverCard.querySelector('[data-element="uptime-info"]');
    if (uptimeElement && containerData.uptime !== undefined) {
        const uptimeText = `Uptime: ${containerData.uptime}`;
        if (uptimeElement.textContent !== uptimeText) {
            uptimeElement.textContent = uptimeText;
        }
    }

    // Update server icon colors using specific data attribute
    const iconContainer = serverCard.querySelector('[data-element="server-icon"]');
    if (iconContainer && containerData.status) {
        const newBgClass = getStatusBgColor(containerData.status);
        
        // Only update if the background color class has changed
        if (!iconContainer.classList.contains(newBgClass)) {
            // Remove existing background color classes
            iconContainer.classList.remove('bg-green-100', 'bg-gray-100', 'bg-blue-100', 'bg-yellow-100', 'bg-red-100');
            iconContainer.classList.add(newBgClass);
        }
        
        const iconSvg = serverCard.querySelector('[data-element="server-icon-svg"]');
        if (iconSvg) {
            const newTextClass = getStatusTextColor(containerData.status);
            
            if (!iconSvg.classList.contains(newTextClass)) {
                // Remove existing text color classes
                iconSvg.classList.remove('text-green-700', 'text-gray-700', 'text-blue-700', 'text-yellow-700', 'text-red-700');
                iconSvg.classList.add(newTextClass);
            }
        }
    }

    // Update action buttons using specific data attribute
    const actionButtonsElement = serverCard.querySelector('[data-element="action-buttons"]');
    if (actionButtonsElement && containerData.status) {
        const newButtonsHTML = renderServerActionButtons(containerData);
        
        // Check if we need to update the buttons by comparing button types
        const currentStartBtn = actionButtonsElement.querySelector('.server-start-btn');
        const currentStopBtn = actionButtonsElement.querySelector('.server-stop-btn'); 
        const currentRestartBtn = actionButtonsElement.querySelector('.server-restart-btn');
        const currentDebugBtn = actionButtonsElement.querySelector('.server-debug-btn');
        
        const needsStart = containerData.status === 'stopped' || containerData.status === 'exited' || containerData.status === 'dead' || containerData.status === 'created';
        const needsStop = containerData.status === 'running' || containerData.status === 'restarting';
        const needsRestart = containerData.status === 'running';
        const needsDebug = containerData.status === 'restarting' || (containerData.status !== 'running' && containerData.status !== 'stopped' && containerData.status !== 'exited' && containerData.status !== 'dead' && containerData.status !== 'created');
        
        const hasCorrectButtons = (
            (needsStart && currentStartBtn && !currentStopBtn && !currentRestartBtn) ||
            (needsStop && needsRestart && currentStopBtn && currentRestartBtn && !currentStartBtn) ||
            (needsStop && needsDebug && currentStopBtn && currentDebugBtn && !currentStartBtn && !currentRestartBtn) ||
            (needsDebug && !needsStop && currentDebugBtn && !currentStartBtn && !currentStopBtn && !currentRestartBtn)
        );
        
        if (!hasCorrectButtons) {
            // Update only the action buttons, not the whole container
            actionButtonsElement.innerHTML = newButtonsHTML;
        }
    }

    // Update CPU usage using specific data attribute
    const cpuElement = serverCard.querySelector('[data-element="cpu-usage"]');
    if (cpuElement && containerData.cpu !== undefined) {
        const newCpuValue = containerData.cpu || 'N/A';
        if (cpuElement.textContent !== newCpuValue) {
            cpuElement.textContent = newCpuValue;
        }
    }
    
    // Update memory usage using specific data attribute
    const memoryElement = serverCard.querySelector('[data-element="memory-usage"]');
    if (memoryElement && containerData.memory !== undefined) {
        const newMemoryValue = containerData.memory || 'N/A';
        if (memoryElement.textContent !== newMemoryValue) {
            memoryElement.textContent = newMemoryValue;
        }
    }
    
    // Update status text using specific data attribute
    const statusElement = serverCard.querySelector('[data-element="status-text"]');
    if (statusElement && containerData.status !== undefined) {
        const newStatusValue = containerData.status || 'unknown';
        if (statusElement.textContent !== newStatusValue) {
            statusElement.textContent = newStatusValue;
        }
    }
    
    // Update status indicator dot using specific data attribute
    const statusDot = serverCard.querySelector('[data-element="status-dot"]');
    if (statusDot && containerData.status !== undefined) {
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
    // Clear any existing interval to prevent multiple intervals
    this.stopResourceUsageRefresh();
    
    // Start new interval for complete server data refresh every 2 seconds
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

export function setButtonLoading(button, loadingText) {
    if (!button) return;
    
    // Store original state
    button.dataset.originalText = button.textContent;
    button.dataset.originalClasses = button.className;
    
    // Set loading state
    button.disabled = true;
    button.textContent = loadingText;
    button.className = button.className.replace(/hover:[^ ]*/g, ''); // Remove hover states
    
    // Add spinner
    button.innerHTML = `
        <svg class="w-3 h-3 mr-1 inline animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        ${loadingText}
    `;
}

export function resetButtonLoading(button, originalText) {
    if (!button) return;
    
    // Restore original state
    button.disabled = false;
    button.textContent = button.dataset.originalText || originalText;
    
    if (button.dataset.originalClasses) {
        button.className = button.dataset.originalClasses;
    }
    
    // Clean up
    delete button.dataset.originalText;
    delete button.dataset.originalClasses;
}