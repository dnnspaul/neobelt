import './style.css';
import router from './router.js';
import { Sidebar } from './components/Sidebar.js';
import { Dashboard } from './pages/Dashboard.js';
import { Servers } from './pages/Servers.js';
import { Registry } from './pages/Registry.js';
import { Settings } from './pages/Settings.js';
import { Help } from './pages/Help.js';

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

    init() {
        this.setupRoutes();
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
function initApp() {
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
