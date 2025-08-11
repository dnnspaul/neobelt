import './style.css';
import router from './router.js';
import { Sidebar } from './components/Sidebar.js';
import { Dashboard } from './pages/Dashboard.js';
import { Servers } from './pages/Servers.js';
import { Registry } from './pages/Registry.js';
import { Settings } from './pages/Settings.js';
import DockerStatusModal from './components/DockerStatusModal.js';
import { EventsOn } from '../wailsjs/runtime/runtime.js';
import { GetAppConfig } from '../wailsjs/go/main/App.js';
import { initLogger, logger } from './utils/logger.js';
import * as AppModule from '../wailsjs/go/main/App.js';

class App {
    constructor() {
        this.sidebar = new Sidebar();
        this.pages = {
            dashboard: new Dashboard(),
            servers: new Servers(),
            registry: new Registry(),
            settings: new Settings()
        };
        
        this.currentPage = null;
        this.init();
    }

    async init() {
        // Initialize centralized logging
        initLogger(AppModule);
        this.setupRoutes();
        this.setupDockerStatusListener();
        await this.loadStartupPage();
        this.render();
        // Initialize router after routes are set up
        router.init();
    }

    setupRoutes() {
        router.addRoute('dashboard', () => this.showPage('dashboard'));
        router.addRoute('servers', () => this.showPage('servers'));
        router.addRoute('registry', () => this.showPage('registry'));
        router.addRoute('settings', () => this.showPage('settings'));
    }

    setupDockerStatusListener() {
        // Listen for Docker status updates from the backend
        EventsOn('docker_status_update', (data) => {
            logger.debug('Docker status update:', JSON.stringify(data));
            if (data && data.type && data.status) {
                DockerStatusModal.show(data.type, data.status);
            }
        });
    }

    async loadStartupPage() {
        try {
            const appConfig = await GetAppConfig();
            const startupPage = appConfig.startup_page || 'dashboard';
            
            // Validate that the startup page is a valid route
            const validRoutes = ['dashboard', 'servers', 'registry', 'settings'];
            if (validRoutes.includes(startupPage)) {
                router.setDefaultRoute(startupPage);
            } else {
                logger.warning(`Invalid startup page '${startupPage}', using dashboard`);
                router.setDefaultRoute('dashboard');
            }
        } catch (error) {
            logger.error('Failed to load startup page setting:', error);
            // Fallback to dashboard if config loading fails
            router.setDefaultRoute('dashboard');
        }
    }

    render() {
        const appElement = document.querySelector('#app');
        
        if (!appElement) {
            logger.error('App: #app element not found in DOM');
            return;
        }
        
        appElement.innerHTML = `
            ${this.sidebar.render()}
            <main id="main-content" class="flex-1 overflow-hidden bg-gray-50">
                <!-- Page content will be inserted here -->
            </main>
        `;

        // Initialize sidebar event listeners
        this.sidebar.attachEventListeners();
    }

    showPage(pageName) {
        const mainContent = document.getElementById('main-content');
        const page = this.pages[pageName];
        
        if (!mainContent || !page) {
            return;
        }
        
        // Cleanup previous page if it has a cleanup method
        if (this.currentPage && this.pages[this.currentPage] && this.pages[this.currentPage].cleanup) {
            this.pages[this.currentPage].cleanup();
        }
        
        mainContent.innerHTML = page.render();
        
        // Make the page instance accessible globally for modal callbacks
        if (pageName === 'servers') {
            mainContent.classList.add('servers-instance');
            window.serversInstance = page;
        } else {
            mainContent.classList.remove('servers-instance');
        }
        
        // Attach page-specific event listeners
        if (page.attachEventListeners) {
            page.attachEventListeners();
        }
        
        // Update sidebar navigation state
        this.sidebar.updateActiveNav();
        
        this.currentPage = pageName;
    }
}

// Initialize the application
async function initApp() {
    try {
        new App();
    } catch (error) {
        logger.error('Error initializing Neobelt application:', error);
    }
}

// Handle both cases - if DOM is already loaded and if it's still loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM is already loaded
    initApp();
}
