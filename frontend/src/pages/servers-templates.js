import { getStatusBgColor, getStatusTextColor, getStatusBadgeColor } from './servers-helpers.js';

export function renderMainTemplate(servers, loading) {
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
                            <button id="refresh-servers-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500" ${loading ? 'disabled' : ''}>
                                <svg class="w-4 h-4 mr-2 inline ${loading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                ${loading ? 'Loading...' : 'Refresh'}
                            </button>
                            <button id="manage-installed-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                </svg>
                                Manage Images
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
                    ${servers.length === 0 && loading ? renderLoadingState() : ''}
                    ${servers.length === 0 && !loading ? renderEmptyState() : ''}
                    ${servers.map(server => renderServerCard(server)).join('')}
                </div>
            </div>
        </div>
    `;
}

export function renderServerCard(server) {
    return `
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" data-server-id="${server.id}">
            <div class="p-6">
                <div class="flex items-start justify-between">
                    <div class="flex items-start space-x-4">
                        <div class="w-12 h-12 ${getStatusBgColor(server.status)} rounded-lg flex items-center justify-center" data-element="server-icon">
                            <svg class="w-6 h-6 ${getStatusTextColor(server.status)}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-element="server-icon-svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"></path>
                            </svg>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center space-x-2">
                                <h3 class="text-lg font-semibold text-gray-900" data-element="server-name">${server.display_name || server.name}</h3>
                                <span class="px-2 py-1 text-xs font-medium ${getStatusBadgeColor(server.status)} rounded-full" data-element="status-badge">${server.status.toUpperCase()}</span>
                            </div>
                            <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500" data-element="server-info">
                                <span data-element="version-info">Version: ${server.version}</span>
                                <span data-element="port-info">Port: ${server.port}</span>
                                <span data-element="uptime-info">Uptime: ${server.uptime}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-2" data-element="action-buttons-container">
                        <div data-element="action-buttons">${renderServerActionButtons(server)}</div>
                        
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
                            <span class="text-gray-600">CPU: <span class="font-medium text-gray-900" data-element="cpu-usage">${server.cpu}</span></span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span class="text-gray-600">Memory: <span class="font-medium text-gray-900" data-element="memory-usage">${server.memory}</span></span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 ${server.status === 'running' ? 'bg-green-500' : 'bg-gray-400'} rounded-full" data-element="status-dot"></div>
                            <span class="text-gray-600">Status: <span class="font-medium text-gray-900" data-element="status-text">${server.status}</span></span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;
}

export function renderServerActionButtons(server) {
    if (server.status === 'running') {
        return `
            <button class="server-stop-btn px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200" data-server-id="${server.id}">
                Stop
            </button>
            <button class="server-restart-btn px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded hover:bg-yellow-200" data-server-id="${server.id}">
                Restart
            </button>
        `;
    } else if (server.status === 'stopped' || server.status === 'exited' || server.status === 'dead' || server.status === 'created') {
        return `
            <button class="server-start-btn px-3 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded hover:bg-green-200" data-server-id="${server.id}">
                Start
            </button>
        `;
    } else if (server.status === 'restarting') {
        return `
            <button class="server-stop-btn px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200" data-server-id="${server.id}">
                Stop
            </button>
            <button class="server-debug-btn px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded hover:bg-yellow-200" data-server-id="${server.id}">
                Debug
            </button>
        `;
    } else {
        return `
            <button class="server-debug-btn px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200" data-server-id="${server.id}">
                Debug
            </button>
        `;
    }
}

export function renderLoadingState() {
    return `
        <div class="flex items-center justify-center py-12">
            <div class="text-center">
                <svg class="animate-spin h-8 w-8 text-primary-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="text-gray-600 mt-2">Loading servers...</p>
            </div>
        </div>
    `;
}

export function renderEmptyState() {
    return `
        <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No servers</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by adding your first server.</p>
            <div class="mt-6">
                <button id="add-server-empty-state" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Add Server
                </button>
            </div>
        </div>
    `;
}

export function renderErrorModal(title, message) {
    return `
        <div class="space-y-4">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex">
                    <svg class="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div class="ml-3">
                        <p class="text-sm text-red-800">${message}</p>
                    </div>
                </div>
            </div>
            <div class="flex justify-end">
                <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onclick="Modal.hide()">
                    Close
                </button>
            </div>
        </div>
    `;
}

export function renderSuccessModal(title, message) {
    return `
        <div class="space-y-4">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex">
                    <svg class="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <div class="ml-3">
                        <p class="text-sm text-green-800">${message}</p>
                    </div>
                </div>
            </div>
            <div class="flex justify-end">
                <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onclick="Modal.hide()">
                    Close
                </button>
            </div>
        </div>
    `;
}