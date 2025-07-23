import Modal from '../components/Modal.js';

export class Settings {
    constructor() {
        this.settings = {
            general: {
                autoStart: true,
                minimizeToTray: false,
                checkUpdates: true,
                enableNotifications: true,
                startupPage: 'dashboard'
            },
            claude: {
                autoDetect: true,
                configPath: '~/Library/Application Support/Claude/config.json',
                autoReload: true,
                backupConfig: true
            },
            servers: {
                autoStart: false,
                defaultPort: 8000,
                maxMemory: 512,
                restartOnFailure: true,
                logLevel: 'info'
            },
            security: {
                requireConfirmation: true,
                allowRemoteServers: false,
                verifySignatures: true,
                sandboxServers: true
            },
            advanced: {
                debugMode: false,
                logRetention: 30,
                customRegistries: []
            }
        };
    }

    render() {
        return `
            <div class="h-full flex flex-col overflow-hidden">
                <!-- Header -->
                <div class="bg-white border-b border-gray-200 flex-shrink-0">
                    <div class="pl-6 pr-0 py-4">
                        <div class="flex items-center justify-between">
                            <div class="flex-1 min-w-0">
                                <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
                                <p class="text-gray-600">Configure Neobelt preferences</p>
                            </div>
                            <div class="flex space-x-3 ml-6 pr-6">
                                <button id="reset-settings-btn" class="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500">
                                    Reset to Defaults
                                </button>
                                <button id="save-settings-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-1 min-h-0">
                    <!-- Settings Navigation -->
                    <div class="w-64 bg-white border-r border-gray-200 overflow-y-auto">
                        <nav class="p-4 space-y-1">
                            <a href="#" class="settings-nav-link block px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md" data-section="general">
                                <div class="flex items-center">
                                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    General
                                </div>
                            </a>
                            
                            <a href="#" class="settings-nav-link block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md" data-section="claude">
                                <div class="flex items-center">
                                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                                    </svg>
                                    Claude Integration
                                </div>
                            </a>
                            
                            <a href="#" class="settings-nav-link block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md" data-section="servers">
                                <div class="flex items-center">
                                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"></path>
                                    </svg>
                                    Server Defaults
                                </div>
                            </a>
                            
                            <a href="#" class="settings-nav-link block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md" data-section="security">
                                <div class="flex items-center">
                                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                    </svg>
                                    Security
                                </div>
                            </a>
                            
                            <a href="#" class="settings-nav-link block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md" data-section="advanced">
                                <div class="flex items-center">
                                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
                                    </svg>
                                    Advanced
                                </div>
                            </a>
                        </nav>
                    </div>

                    <!-- Settings Content -->
                    <div class="flex-1 overflow-y-auto p-6">
                        <!-- General Settings -->
                        <div id="general-settings" class="settings-section">
                            <div class="space-y-6">
                                <div>
                                    <h2 class="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
                                </div>

                                <!-- Startup Settings -->
                                <div class="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 class="text-md font-medium text-gray-900 mb-4">Startup</h3>
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Auto-start Neobelt</label>
                                                <p class="text-sm text-gray-500">Launch Neobelt when your computer starts</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" class="sr-only peer" ${this.settings.general.autoStart ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Minimize to system tray</label>
                                                <p class="text-sm text-gray-500">Keep Neobelt running in the background</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" class="sr-only peer" ${this.settings.general.minimizeToTray ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Default startup page</label>
                                            <div class="relative">
                                                <select class="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer">
                                                    <option value="dashboard" ${this.settings.general.startupPage === 'dashboard' ? 'selected' : ''}>Dashboard</option>
                                                    <option value="servers" ${this.settings.general.startupPage === 'servers' ? 'selected' : ''}>Servers</option>
                                                    <option value="registry" ${this.settings.general.startupPage === 'registry' ? 'selected' : ''}>Registry</option>
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

                                <!-- Update Settings -->
                                <div class="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 class="text-md font-medium text-gray-900 mb-4">Updates & Notifications</h3>
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Check for updates automatically</label>
                                                <p class="text-sm text-gray-500">Get notified when new versions are available</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" class="sr-only peer" ${this.settings.general.checkUpdates ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Enable notifications</label>
                                                <p class="text-sm text-gray-500">Show system notifications for server events</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" class="sr-only peer" ${this.settings.general.enableNotifications ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div class="pt-4 border-t border-gray-200">
                                            <button id="check-updates-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                                Check for Updates Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Claude Integration Settings -->
                        <div id="claude-settings" class="settings-section hidden">
                            <div class="space-y-6">
                                <div>
                                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Claude Desktop Integration</h2>
                                </div>

                                <!-- Detection Settings -->
                                <div class="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 class="text-md font-medium text-gray-900 mb-4">Detection</h3>
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Auto-detect Claude Desktop</label>
                                                <p class="text-sm text-gray-500">Automatically find Claude Desktop installation</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" class="sr-only peer" ${this.settings.claude.autoDetect ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Configuration file path</label>
                                            <div class="flex space-x-2">
                                                <input type="text" value="${this.settings.claude.configPath}" class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500">
                                                <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                                    Browse
                                                </button>
                                            </div>
                                        </div>

                                        <div class="pt-4 border-t border-gray-200">
                                            <div class="flex space-x-3">
                                                <button id="detect-claude-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                                    Detect Claude Desktop
                                                </button>
                                                <button id="test-connection-btn" class="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-300 rounded-md hover:bg-primary-100">
                                                    Test Connection
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Configuration Management -->
                                <div class="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 class="text-md font-medium text-gray-900 mb-4">Configuration Management</h3>
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Auto-reload configuration</label>
                                                <p class="text-sm text-gray-500">Automatically reload Claude when config changes</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" class="sr-only peer" ${this.settings.claude.autoReload ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Backup configuration</label>
                                                <p class="text-sm text-gray-500">Create backups before making changes</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" class="sr-only peer" ${this.settings.claude.backupConfig ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div class="pt-4 border-t border-gray-200">
                                            <div class="flex space-x-3">
                                                <button id="backup-config-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                                    Create Backup
                                                </button>
                                                <button id="restore-config-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                                    Restore Backup
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Server Settings -->
                        <div id="servers-settings" class="settings-section hidden">
                            <div class="space-y-6">
                                <div>
                                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Server Defaults</h2>
                                </div>

                                <!-- Default Behavior -->
                                <div class="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 class="text-md font-medium text-gray-900 mb-4">Default Behavior</h3>
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Auto-start new servers</label>
                                                <p class="text-sm text-gray-500">Start servers immediately after installation</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" class="sr-only peer" ${this.settings.servers.autoStart ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Restart on failure</label>
                                                <p class="text-sm text-gray-500">Automatically restart failed servers</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" class="sr-only peer" ${this.settings.servers.restartOnFailure ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <!-- Resource Limits -->
                                <div class="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 class="text-md font-medium text-gray-900 mb-4">Resource Limits</h3>
                                    <div class="grid grid-cols-2 gap-6">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Default port range start</label>
                                            <input type="number" value="${this.settings.servers.defaultPort}" min="1024" max="65535" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Maximum memory per server (MB)</label>
                                            <input type="number" value="${this.settings.servers.maxMemory}" min="64" max="2048" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500">
                                        </div>
                                    </div>
                                </div>

                                <!-- Logging -->
                                <div class="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 class="text-md font-medium text-gray-900 mb-4">Logging</h3>
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Log level</label>
                                            <div class="relative">
                                                <select class="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer">
                                                    <option value="debug" ${this.settings.servers.logLevel === 'debug' ? 'selected' : ''}>Debug</option>
                                                    <option value="info" ${this.settings.servers.logLevel === 'info' ? 'selected' : ''}>Info</option>
                                                    <option value="warn" ${this.settings.servers.logLevel === 'warn' ? 'selected' : ''}>Warning</option>
                                                    <option value="error" ${this.settings.servers.logLevel === 'error' ? 'selected' : ''}>Error</option>
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

                        <!-- Security Settings -->
                        <div id="security-settings" class="settings-section hidden">
                            <div class="space-y-6">
                                <div>
                                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>
                                </div>

                                <!-- Installation Security -->
                                <div class="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 class="text-md font-medium text-gray-900 mb-4">Installation Security</h3>
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Require confirmation for installations</label>
                                                <p class="text-sm text-gray-500">Show confirmation dialog before installing servers</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" class="sr-only peer" ${this.settings.security.requireConfirmation ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Verify package signatures</label>
                                                <p class="text-sm text-gray-500">Check cryptographic signatures of server packages</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" class="sr-only peer" ${this.settings.security.verifySignatures ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <!-- Runtime Security -->
                                <div class="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 class="text-md font-medium text-gray-900 mb-4">Runtime Security</h3>
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Allow remote servers</label>
                                                <p class="text-sm text-gray-500">Allow servers to listen on non-localhost addresses</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" class="sr-only peer" ${this.settings.security.allowRemoteServers ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Sandbox servers</label>
                                                <p class="text-sm text-gray-500">Run servers in isolated environments</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" class="sr-only peer" ${this.settings.security.sandboxServers ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Advanced Settings -->
                        <div id="advanced-settings" class="settings-section hidden">
                            <div class="space-y-6">
                                <div>
                                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h2>
                                </div>

                                <!-- Debug Settings -->
                                <div class="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 class="text-md font-medium text-gray-900 mb-4">Debug & Logging</h3>
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Enable debug mode</label>
                                                <p class="text-sm text-gray-500">Show additional debugging information</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" class="sr-only peer" ${this.settings.advanced.debugMode ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Log retention (days)</label>
                                            <input type="number" value="${this.settings.advanced.logRetention}" min="1" max="365" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500">
                                        </div>

                                        <div class="pt-4 border-t border-gray-200">
                                            <div class="flex space-x-3">
                                                <button id="open-logs-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                                    Open Log Directory
                                                </button>
                                                <button id="clear-logs-btn" class="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100">
                                                    Clear All Logs
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Export/Import -->
                                <div class="bg-white border border-gray-200 rounded-lg p-6">
                                    <h3 class="text-md font-medium text-gray-900 mb-4">Configuration Export/Import</h3>
                                    <div class="space-y-4">
                                        <p class="text-sm text-gray-600">Export your settings and server configurations to back up or share with other devices.</p>
                                        
                                        <div class="flex space-x-3">
                                            <button id="export-config-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                                Export Configuration
                                            </button>
                                            <button id="import-config-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                                Import Configuration
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Header buttons
        const saveBtn = document.getElementById('save-settings-btn');
        const resetBtn = document.getElementById('reset-settings-btn');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
        }

        // Navigation
        const navLinks = document.querySelectorAll('.settings-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
                
                // Update active nav
                navLinks.forEach(l => {
                    l.classList.remove('text-primary-700', 'bg-primary-50');
                    l.classList.add('text-gray-600', 'hover:text-gray-900', 'hover:bg-gray-50');
                });
                link.classList.remove('text-gray-600', 'hover:text-gray-900', 'hover:bg-gray-50');
                link.classList.add('text-primary-700', 'bg-primary-50');
            });
        });

        // Action buttons
        this.attachActionButtons();
    }

    attachActionButtons() {
        // General settings buttons
        document.getElementById('check-updates-btn')?.addEventListener('click', () => {
            this.checkForUpdates();
        });

        // Claude settings buttons
        document.getElementById('detect-claude-btn')?.addEventListener('click', () => {
            this.detectClaude();
        });

        document.getElementById('test-connection-btn')?.addEventListener('click', () => {
            this.testClaudeConnection();
        });

        document.getElementById('backup-config-btn')?.addEventListener('click', () => {
            this.backupConfig();
        });

        document.getElementById('restore-config-btn')?.addEventListener('click', () => {
            this.restoreConfig();
        });

        // Advanced settings buttons
        document.getElementById('open-logs-btn')?.addEventListener('click', () => {
            this.openLogsDirectory();
        });

        document.getElementById('clear-logs-btn')?.addEventListener('click', () => {
            this.clearLogs();
        });

        document.getElementById('export-config-btn')?.addEventListener('click', () => {
            this.exportConfiguration();
        });

        document.getElementById('import-config-btn')?.addEventListener('click', () => {
            this.importConfiguration();
        });
    }

    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.settings-section');
        sections.forEach(section => section.classList.add('hidden'));

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-settings`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
    }

    saveSettings() {
        console.log('Saving settings...');
        
        const content = `
            <div class="text-center space-y-4">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Settings Saved</h3>
                <p class="text-gray-600">Your preferences have been saved successfully.</p>
            </div>
        `;

        Modal.show(content, {
            title: 'Settings Saved',
            size: 'sm'
        });
    }

    resetSettings() {
        const content = `
            <div class="space-y-6">
                <div class="text-center">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">Reset to Defaults</h3>
                    <p class="text-gray-600">This will reset all settings to their default values. This action cannot be undone.</p>
                </div>

                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div class="flex">
                        <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <div class="ml-3">
                            <h4 class="text-sm font-medium text-yellow-800">Warning</h4>
                            <p class="mt-1 text-sm text-yellow-700">Server configurations and Claude integration settings will be reset. Active servers will not be affected.</p>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button id="confirm-reset" class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">
                        Reset Settings
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Confirm Reset',
            size: 'md'
        });

        setTimeout(() => {
            document.getElementById('confirm-reset')?.addEventListener('click', () => {
                Modal.hide();
                console.log('Resetting settings...');
            });
        }, 100);
    }

    checkForUpdates() {
        const content = `
            <div class="text-center space-y-4">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Up to Date</h3>
                <p class="text-gray-600 selectable-text">You're running the latest version of Neobelt (v1.0.0).</p>
                <p class="text-sm text-gray-500">Last checked: Just now</p>
            </div>
        `;

        Modal.show(content, {
            title: 'Update Check',
            size: 'sm'
        });
    }

    detectClaude() {
        console.log('Detecting Claude Desktop...');
    }

    testClaudeConnection() {
        console.log('Testing Claude connection...');
    }

    backupConfig() {
        console.log('Creating backup...');
    }

    restoreConfig() {
        console.log('Restoring backup...');
    }

    openLogsDirectory() {
        console.log('Opening logs directory...');
    }

    clearLogs() {
        console.log('Clearing logs...');
    }

    exportConfiguration() {
        console.log('Exporting configuration...');
    }

    importConfiguration() {
        console.log('Importing configuration...');
    }
}