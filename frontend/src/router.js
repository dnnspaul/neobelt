class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = '';
        this.initialized = false;
        this.defaultRoute = 'dashboard'; // Will be updated from app settings
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
        const hash = window.location.hash.slice(1) || this.defaultRoute;
        
        if (this.routes[hash]) {
            this.currentRoute = hash;
            this.routes[hash]();
        } else if (hash !== this.defaultRoute) {
            // Route doesn't exist and we're not already trying default route, redirect to default
            this.currentRoute = this.defaultRoute;
            window.location.hash = this.defaultRoute;
        } else {
            // We're trying to go to default route but no route handler exists yet
            // This can happen during initialization - set route and try again after a short delay
            this.currentRoute = this.defaultRoute;
            if (this.routes[this.defaultRoute]) {
                this.routes[this.defaultRoute]();
            }
        }
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    setDefaultRoute(route) {
        this.defaultRoute = route;
    }
}

export default new Router();