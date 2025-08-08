import Modal from '../components/Modal.js';

export class Settings {
    constructor() {
        this.settings = {
            general: {
                autoStart: true,
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
                restartOnFailure: true
            },
            remoteAccess: {
                remoteServer: 'remote.neobelt.io',
                username: '',
                privateKey: '',
                publicKey: '',
                keyGenerated: false
            },
            advanced: {
                debugMode: false,
                logRetention: 30
            }
        };
        this.originalSettings = null;
    }

    async loadSettings() {
        try {
            // Load general app settings
            const appConfig = await window.go.main.App.GetAppConfig();
            this.settings.general = {
                autoStart: appConfig.auto_start || false,
                startupPage: appConfig.startup_page || 'dashboard'
            };

            // Load server defaults
            const serverDefaults = await window.go.main.App.GetServerDefaults();
            this.settings.servers = {
                autoStart: serverDefaults.auto_start || false,
                defaultPort: serverDefaults.default_port || 8000,
                maxMemory: serverDefaults.max_memory_mb || 512,
                restartOnFailure: serverDefaults.restart_on_failure !== undefined ? serverDefaults.restart_on_failure : true
            };
            
            // Load remote access settings
            const remoteAccess = await window.go.main.App.GetRemoteAccess();
            this.settings.remoteAccess = {
                remoteServer: remoteAccess.remote_server || 'remote.neobelt.io',
                username: remoteAccess.username || '',
                privateKey: remoteAccess.private_key || '',
                publicKey: remoteAccess.public_key || '',
                keyGenerated: remoteAccess.key_generated || false
            };
            
            this.originalSettings = JSON.parse(JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    updateUI() {
        // Update general settings fields
        const generalAutoStartField = document.getElementById('generalAutoStart');
        const generalStartupPageField = document.getElementById('generalStartupPage');

        if (generalAutoStartField) generalAutoStartField.checked = this.settings.general.autoStart;
        if (generalStartupPageField) generalStartupPageField.value = this.settings.general.startupPage;

        // Update server settings fields
        const autoStartField = document.getElementById('autoStart');
        const defaultPortField = document.getElementById('defaultPort');
        const maxMemoryField = document.getElementById('maxMemory');
        const restartOnFailureField = document.getElementById('restartOnFailure');

        if (autoStartField) autoStartField.checked = this.settings.servers.autoStart;
        if (defaultPortField) defaultPortField.value = this.settings.servers.defaultPort;
        if (maxMemoryField) maxMemoryField.value = this.settings.servers.maxMemory;
        if (restartOnFailureField) restartOnFailureField.checked = this.settings.servers.restartOnFailure;
        
        // Update remote access fields
        const remoteServerField = document.getElementById('remoteServer');
        const remoteUsernameField = document.getElementById('remoteUsername');
        const privateKeyField = document.getElementById('privateKeyDisplay');
        const publicKeyField = document.getElementById('publicKeyDisplay');

        if (remoteServerField) remoteServerField.value = this.settings.remoteAccess.remoteServer;
        if (remoteUsernameField) remoteUsernameField.value = this.settings.remoteAccess.username;
        if (privateKeyField) privateKeyField.value = this.settings.remoteAccess.privateKey ? '••••••••••••••••••••' : '';
        if (publicKeyField) publicKeyField.value = this.settings.remoteAccess.publicKey;
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
                            
                            <a href="#" class="settings-nav-link block px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md" data-section="remote-access">
                                <div class="flex items-center">
                                    <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                                    </svg>
                                    Remote Access
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
                                                <input id="generalAutoStart" type="checkbox" class="sr-only peer" ${this.settings.general.autoStart ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Default startup page</label>
                                            <div class="relative">
                                                <select id="generalStartupPage" class="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer">
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
                                                <input id="autoStart" type="checkbox" class="sr-only peer" ${this.settings.servers.autoStart ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                        </div>

                                        <div class="flex items-center justify-between">
                                            <div>
                                                <label class="text-sm font-medium text-gray-700">Restart on failure</label>
                                                <p class="text-sm text-gray-500">Automatically restart failed servers</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input id="restartOnFailure" type="checkbox" class="sr-only peer" ${this.settings.servers.restartOnFailure ? 'checked' : ''}>
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
                                            <input id="defaultPort" type="number" value="${this.settings.servers.defaultPort}" min="1024" max="65535" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Maximum memory per server (MB)</label>
                                            <input id="maxMemory" type="number" value="${this.settings.servers.maxMemory}" min="64" max="2048" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500">
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <!-- Remote Access Settings -->
                        <div id="remote-access-settings" class="settings-section hidden">
                            ${this.renderRemoteAccessContent()}
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
        // Load settings and update UI
        this.loadSettings().then(() => {
            this.updateUI();
        });

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

        // Remote Access buttons
        document.getElementById('generate-ssh-keys-btn')?.addEventListener('click', () => {
            this.generateSSHKeys();
        });

        document.getElementById('copy-public-key-btn')?.addEventListener('click', () => {
            this.copyPublicKey();
        });

        document.getElementById('test-remote-connection-btn')?.addEventListener('click', () => {
            this.testRemoteConnection();
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

    async saveSettings() {
        console.log('Saving settings...');
        
        try {
            // Collect General app values from the form
            const generalAutoStart = document.getElementById('generalAutoStart')?.checked || false;
            const startupPage = document.getElementById('generalStartupPage')?.value || 'dashboard';

            const appConfig = {
                version: "1.0.0", // Keep current version
                theme: "light", // Keep default theme for now
                auto_refresh: true, // Keep default
                refresh_interval: 5, // Keep default
                check_for_updates: true, // Keep default
                startup_page: startupPage,
                auto_start: generalAutoStart
            };

            // Collect Server Defaults values from the form
            const autoStart = document.getElementById('autoStart')?.checked || false;
            const defaultPort = parseInt(document.getElementById('defaultPort')?.value) || 8000;
            const maxMemory = parseInt(document.getElementById('maxMemory')?.value) || 512;
            const restartOnFailure = document.getElementById('restartOnFailure')?.checked !== false;

            const serverDefaults = {
                auto_start: autoStart,
                default_port: defaultPort,
                max_memory_mb: maxMemory,
                restart_on_failure: restartOnFailure
            };

            // Collect Remote Access values from the form
            const remoteServer = document.getElementById('remoteServer')?.value || 'remote.neobelt.io';
            const remoteUsername = document.getElementById('remoteUsername')?.value || '';

            const remoteAccessConfig = {
                remote_server: remoteServer,
                username: remoteUsername,
                private_key: this.settings.remoteAccess.privateKey,
                public_key: this.settings.remoteAccess.publicKey,
                key_generated: this.settings.remoteAccess.keyGenerated
            };

            // Save to backend
            await window.go.main.App.UpdateAppConfig(appConfig);
            await window.go.main.App.UpdateServerDefaults(serverDefaults);
            await window.go.main.App.UpdateRemoteAccess(remoteAccessConfig);

            // Update local settings
            this.settings.general = {
                autoStart: generalAutoStart,
                startupPage: startupPage
            };

            this.settings.servers = {
                autoStart,
                defaultPort,
                maxMemory,
                restartOnFailure
            };
            
            this.settings.remoteAccess = {
                remoteServer,
                username: remoteUsername,
                privateKey: this.settings.remoteAccess.privateKey,
                publicKey: this.settings.remoteAccess.publicKey,
                keyGenerated: this.settings.remoteAccess.keyGenerated
            };

            const content = `
                <div class="text-center space-y-4">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">Settings Saved</h3>
                    <p class="text-gray-600">Your server defaults have been saved successfully.</p>
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                        <p class="text-sm text-blue-800">
                            <strong>Note:</strong> Running containers will be automatically recreated to apply the new settings 
                            (memory limits, restart policies, and port changes). This may cause a brief interruption in service.
                        </p>
                    </div>
                </div>
            `;

            Modal.show(content, {
                title: 'Settings Saved',
                size: 'md'
            });
        } catch (error) {
            console.error('Failed to save settings:', error);
            
            const content = `
                <div class="text-center space-y-4">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">Save Failed</h3>
                    <p class="text-gray-600">Failed to save settings: ${error.message || 'Unknown error'}</p>
                </div>
            `;

            Modal.show(content, {
                title: 'Error',
                size: 'sm'
            });
        }
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
                    <h3 class="text-lg font-semibold text-gray-900">Reset Server Defaults</h3>
                    <p class="text-gray-600">This will reset server default settings to their initial values. This action cannot be undone.</p>
                </div>

                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div class="flex">
                        <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <div class="ml-3">
                            <h4 class="text-sm font-medium text-yellow-800">Warning</h4>
                            <p class="mt-1 text-sm text-yellow-700">Server default settings will be reset to: Auto-start off, Port 8000, Memory 512MB, Restart on failure enabled.</p>
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
            document.getElementById('confirm-reset')?.addEventListener('click', async () => {
                Modal.hide();
                try {
                    // Reset to default values
                    const defaultAppConfig = {
                        version: "1.0.0",
                        theme: "light",
                        auto_refresh: true,
                        refresh_interval: 5,
                        check_for_updates: true,
                        startup_page: "dashboard",
                        auto_start: false
                    };

                    const defaultServerDefaults = {
                        auto_start: false,
                        default_port: 8000,
                        max_memory_mb: 512,
                        restart_on_failure: true
                    };

                    const defaultRemoteAccess = {
                        remote_server: 'remote.neobelt.io',
                        username: '',
                        private_key: '',
                        public_key: '',
                        key_generated: false
                    };

                    await window.go.main.App.UpdateAppConfig(defaultAppConfig);
                    await window.go.main.App.UpdateServerDefaults(defaultServerDefaults);
                    await window.go.main.App.UpdateRemoteAccess(defaultRemoteAccess);
                    
                    // Update the UI - General settings
                    document.getElementById('generalAutoStart').checked = false;
                    document.getElementById('generalStartupPage').value = 'dashboard';
                    
                    // Update the UI - Server settings
                    document.getElementById('autoStart').checked = false;
                    document.getElementById('defaultPort').value = '8000';
                    document.getElementById('maxMemory').value = '512';
                    document.getElementById('restartOnFailure').checked = true;
                    
                    // Reset Remote Access settings
                    document.getElementById('remoteServer').value = 'remote.neobelt.io';
                    document.getElementById('remoteUsername').value = '';
                    const privateKeyField = document.getElementById('privateKeyDisplay');
                    const publicKeyField = document.getElementById('publicKeyDisplay');
                    if (privateKeyField) privateKeyField.value = '';
                    if (publicKeyField) publicKeyField.value = '';

                    // Update local settings
                    this.settings.general = {
                        autoStart: false,
                        startupPage: 'dashboard'
                    };

                    this.settings.servers = {
                        autoStart: false,
                        defaultPort: 8000,
                        maxMemory: 512,
                        restartOnFailure: true
                    };
                    
                    this.settings.remoteAccess = {
                        remoteServer: 'remote.neobelt.io',
                        username: '',
                        privateKey: '',
                        publicKey: '',
                        keyGenerated: false
                    };

                    const successContent = `
                        <div class="text-center space-y-4">
                            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900">Settings Reset</h3>
                            <p class="text-gray-600">Server default settings have been reset to their initial values.</p>
                        </div>
                    `;

                    Modal.show(successContent, {
                        title: 'Reset Complete',
                        size: 'sm'
                    });
                } catch (error) {
                    console.error('Failed to reset settings:', error);
                    
                    const errorContent = `
                        <div class="text-center space-y-4">
                            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900">Reset Failed</h3>
                            <p class="text-gray-600">Failed to reset settings: ${error.message || 'Unknown error'}</p>
                        </div>
                    `;

                    Modal.show(errorContent, {
                        title: 'Error',
                        size: 'sm'
                    });
                }
            });
        }, 100);
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

    async generateSSHKeys() {
        console.log('Generating SSH keys...');
        
        const generateBtn = document.getElementById('generate-ssh-keys-btn');
        const originalText = generateBtn ? generateBtn.textContent : '';
        
        try {
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Generating...';
            }
            
            const keyPair = await window.go.main.App.GenerateSSHKeys();
            
            // Update local settings
            this.settings.remoteAccess.privateKey = keyPair.private_key;
            this.settings.remoteAccess.publicKey = keyPair.public_key;
            this.settings.remoteAccess.keyGenerated = true;
            
            const content = `
                <div class="text-center space-y-4">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">SSH Keys Generated</h3>
                    <p class="text-gray-600">Your SSH key pair has been generated successfully.</p>
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                        <p class="text-sm text-blue-800">
                            <strong>Note:</strong> Copy your public key and add it to your remote server's authorized_keys file to enable authentication.
                        </p>
                    </div>
                </div>
            `;

            Modal.show(content, {
                title: 'SSH Keys Generated',
                size: 'md'
            });
            
            // Set the onClose callback to update the UI when modal is manually closed
            Modal.onClose = () => {
                this.updateRemoteAccessUI();
                Modal.onClose = null; // Clear the callback after use
            };
            
        } catch (error) {
            console.error('Failed to generate SSH keys:', error);
            
            const content = `
                <div class="text-center space-y-4">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">Generation Failed</h3>
                    <p class="text-gray-600">Failed to generate SSH keys: ${error.message || 'Unknown error'}</p>
                </div>
            `;

            Modal.show(content, {
                title: 'Error',
                size: 'sm'
            });
        } finally {
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = originalText;
            }
        }
    }

    async copyPublicKey() {
        const publicKeyField = document.getElementById('publicKeyDisplay');
        if (!publicKeyField || !publicKeyField.value) {
            return;
        }
        
        try {
            await navigator.clipboard.writeText(publicKeyField.value.trim());
            
            const copyBtn = document.getElementById('copy-public-key-btn');
            const originalContent = copyBtn?.innerHTML;
            
            if (copyBtn) {
                copyBtn.innerHTML = `
                    <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                `;
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalContent;
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to copy public key:', error);
        }
    }

    testRemoteConnection() {
        console.log('Testing remote connection...');
        
        const content = `
            <div class="text-center space-y-4">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Connection Test</h3>
                <p class="text-gray-600">Remote connection testing will be implemented in a future update.</p>
            </div>
        `;

        Modal.show(content, {
            title: 'Coming Soon',
            size: 'sm'
        });
    }

    renderRemoteAccessContent() {
        return `
            <div class="space-y-6">
                <div>
                    <h2 class="text-lg font-semibold text-gray-900 mb-4">Remote Access</h2>
                </div>

                <!-- Remote Server Configuration -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 class="text-md font-medium text-gray-900 mb-4">Remote Server</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Remote Server</label>
                            <input id="remoteServer" type="text" value="${this.settings.remoteAccess.remoteServer}" placeholder="remote.neobelt.io" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
                            <input id="remoteUsername" type="text" value="${this.settings.remoteAccess.username}" placeholder="Enter username" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500">
                        </div>
                    </div>
                </div>

                <!-- Authentication -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 class="text-md font-medium text-gray-900 mb-4">Authentication</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Private Authentication Key</label>
                            <div class="flex space-x-3">
                                <input id="privateKeyDisplay" type="password" value="${this.settings.remoteAccess.privateKey ? '••••••••••••••••••••' : ''}" readonly class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                                ${this.settings.remoteAccess.keyGenerated ? 
                                    `<button id="generate-ssh-keys-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                        Roll Key
                                    </button>` :
                                    `<button id="generate-ssh-keys-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700">
                                        Generate
                                    </button>`
                                }
                            </div>
                            ${this.settings.remoteAccess.keyGenerated ? 
                                `<div class="mt-2 flex items-center text-sm text-green-600">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    SSH key pair generated successfully
                                </div>` : ''
                            }
                        </div>
                        
                        ${this.settings.remoteAccess.keyGenerated ? 
                            `<div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Public Key</label>
                                <div class="flex space-x-2">
                                    <textarea id="publicKeyDisplay" readonly class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 font-mono text-xs h-20 resize-none">${this.settings.remoteAccess.publicKey}</textarea>
                                    <button id="copy-public-key-btn" class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 self-start">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                        </svg>
                                    </button>
                                </div>
                                <p class="mt-2 text-sm text-gray-500">Copy this public key to your remote server's authorized_keys file</p>
                            </div>` : ''
                        }
                    </div>
                </div>

                <!-- Connection Status -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 class="text-md font-medium text-gray-900 mb-4">Connection</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <label class="text-sm font-medium text-gray-700">Connection Status</label>
                                <p class="text-sm text-gray-500">Test connection to remote server</p>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">Not Connected</span>
                                <button id="test-remote-connection-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                    Test Connection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateRemoteAccessUI() {
        // Re-render the remote access section with updated data
        const remoteAccessSection = document.getElementById('remote-access-settings');
        if (!remoteAccessSection) return;

        // Update the section content using the shared render method
        remoteAccessSection.innerHTML = this.renderRemoteAccessContent();

        // Re-attach event listeners for the new buttons
        this.attachRemoteAccessEventListeners();

        // Ensure the remote access section stays visible and nav stays active
        this.showSection('remote-access');
        
        // Update navigation to show Remote Access as active
        const navLinks = document.querySelectorAll('.settings-nav-link');
        navLinks.forEach(l => {
            l.classList.remove('text-primary-700', 'bg-primary-50');
            l.classList.add('text-gray-600', 'hover:text-gray-900', 'hover:bg-gray-50');
        });
        
        const remoteAccessNavLink = document.querySelector('.settings-nav-link[data-section="remote-access"]');
        if (remoteAccessNavLink) {
            remoteAccessNavLink.classList.remove('text-gray-600', 'hover:text-gray-900', 'hover:bg-gray-50');
            remoteAccessNavLink.classList.add('text-primary-700', 'bg-primary-50');
        }
    }

    attachRemoteAccessEventListeners() {
        // Re-attach event listeners specifically for remote access buttons
        document.getElementById('generate-ssh-keys-btn')?.addEventListener('click', () => {
            this.generateSSHKeys();
        });

        document.getElementById('copy-public-key-btn')?.addEventListener('click', () => {
            this.copyPublicKey();
        });

        document.getElementById('test-remote-connection-btn')?.addEventListener('click', () => {
            this.testRemoteConnection();
        });
    }
}