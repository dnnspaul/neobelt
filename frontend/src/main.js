import './style.css';
import router from './router.js';
import { Sidebar } from './components/Sidebar.js';
import { Dashboard } from './pages/Dashboard.js';
import { Servers } from './pages/Servers.js';
import { Registry } from './pages/Registry.js';
import { Settings } from './pages/Settings.js';
import { Help } from './pages/Help.js';
import DockerStatusModal from './components/DockerStatusModal.js';
import { EventsOn } from '../wailsjs/runtime/runtime.js';
import { GetAppConfig } from '../wailsjs/go/main/App.js';

class App {
    constructor() {
        this.sidebar = new Sidebar();
        this.pages = {
            dashboard: new Dashboard(),
            servers: new Servers(),
            registry: new Registry(),
            settings: new Settings(),
            help: new Help()
        };
        
        this.currentPage = null;
        this.init();
    }

    async init() {
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
        router.addRoute('help', () => this.showPage('help'));
    }

    setupDockerStatusListener() {
        // Listen for Docker status updates from the backend
        EventsOn('docker_status_update', (data) => {
            console.log('Docker status update:', data);
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
            const validRoutes = ['dashboard', 'servers', 'registry', 'settings', 'help'];
            if (validRoutes.includes(startupPage)) {
                router.setDefaultRoute(startupPage);
            } else {
                console.warn(`Invalid startup page '${startupPage}', using dashboard`);
                router.setDefaultRoute('dashboard');
            }
        } catch (error) {
            console.error('Failed to load startup page setting:', error);
            // Fallback to dashboard if config loading fails
            router.setDefaultRoute('dashboard');
        }
    }

    render() {
        const appElement = document.querySelector('#app');
        
        if (!appElement) {
            console.error('App: #app element not found in DOM');
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
        console.error('Error initializing Neobelt application:', error);
    }
}

// Handle both cases - if DOM is already loaded and if it's still loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM is already loaded
    initApp();
}
