class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = '';
        this.init();
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRouteChange());
        this.handleRouteChange();
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    navigate(path) {
        window.location.hash = path;
    }

    handleRouteChange() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        this.currentRoute = hash;
        
        if (this.routes[hash]) {
            this.routes[hash]();
        } else {
            this.navigate('dashboard');
        }
    }

    getCurrentRoute() {
        return this.currentRoute;
    }
}

export default new Router();