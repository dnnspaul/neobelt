import router from '../router.js';
import { GetAppVersion } from '../../wailsjs/go/app/App.js';
import { logger } from '../utils/logger.js';

export class Sidebar {
    constructor() {
        // Don't call render or attachEventListeners here
        // They will be called from main App after DOM is ready
        this.versionText = 'Neobelt DEV BUILD'; // Default value
    }

    async loadVersion() {
        try {
            const versionInfo = await GetAppVersion();
            if (versionInfo && versionInfo.version) {
                if (versionInfo.version === 'DEV BUILD') {
                    this.versionText = 'Neobelt DEV BUILD';
                } else {
                    this.versionText = `Neobelt v${versionInfo.version}`;
                }
            }
        } catch (error) {
            logger.warning('Failed to load version info:', error);
            // Keep default value
        }
    }

    render() {
        return `
            <div class="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
                <!-- Logo -->
                <div class="bg-white border-b border-gray-200 flex-shrink-0">
                    <div class="pl-6 pr-6 py-4">
                        <div class="flex items-center justify-center h-14">
                            <span class="text-3xl text-gray-900 font-bitcount">neobelt</span>
                        </div>
                    </div>
                </div>

                <!-- Navigation -->
                <nav class="flex-1 p-4 space-y-1">
                    <a href="#dashboard" class="nav-link flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50" data-route="dashboard">
                        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"></path>
                        </svg>
                        Dashboard
                    </a>
                    
                    <a href="#servers" class="nav-link flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50" data-route="servers">
                        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"></path>
                        </svg>
                        Servers
                    </a>
                    
                    <a href="#registry" class="nav-link flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50" data-route="registry">
                        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        Registry
                    </a>
                    
                    <a href="#settings" class="nav-link flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50" data-route="settings">
                        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        Settings
                    </a>
                </nav>

                <!-- Footer -->
                <div class="p-4 border-t border-gray-200">
                    <div class="text-xs text-gray-500 text-center">
                        <span class="selectable-text">${this.versionText}</span>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                const route = navLink.getAttribute('data-route');
                router.navigate(route);
            }
        });

        window.addEventListener('hashchange', () => {
            this.updateActiveNav();
        });
    }

    updateActiveNav() {
        const currentRoute = router.getCurrentRoute();
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const route = link.getAttribute('data-route');
            if (route === currentRoute) {
                // Remove inactive styles
                link.classList.remove('text-gray-600', 'hover:text-gray-900', 'hover:bg-gray-50');
                // Add active styles
                link.classList.add('bg-primary-600', 'text-white', 'shadow-sm');
            } else {
                // Remove active styles
                link.classList.remove('bg-primary-600', 'text-white', 'shadow-sm');
                // Add inactive styles
                link.classList.add('text-gray-600', 'hover:text-gray-900', 'hover:bg-gray-50');
            }
        });
    }
}