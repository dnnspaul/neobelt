class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = '';
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        window.addEventListener('hashchange', () => this.handleRouteChange());
        this.handleRouteChange();
        this.initialized = true;
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    navigate(path) {
        window.location.hash = path;
    }

    handleRouteChange() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        
        if (this.routes[hash]) {
            this.currentRoute = hash;
            this.routes[hash]();
        } else if (hash !== 'dashboard') {
            // Route doesn't exist and we're not already trying dashboard, redirect to dashboard
            this.currentRoute = 'dashboard';
            window.location.hash = 'dashboard';
        } else {
            // We're trying to go to dashboard but no route handler exists yet
            // This can happen during initialization - set route and try again after a short delay
            this.currentRoute = 'dashboard';
            if (this.routes['dashboard']) {
                this.routes['dashboard']();
            }
        }
    }

    getCurrentRoute() {
        return this.currentRoute;
    }
}

export default new Router();