export class Modal {
    constructor() {
        this.isOpen = false;
        this.onClose = null;
        this.eventListeners = [];
    }

    show(content, options = {}) {
        // Close any existing modal first
        this.hide();

        const {
            title = 'Modal',
            size = 'md',
            closeButton = true,
            backdrop = true,
            closable = true
        } = options;

        this.isOpen = true;
        this.closable = closable;
        
        const modalHTML = `
            <div id="modal-overlay" class="fixed inset-0 z-50 flex items-center justify-center">
                ${backdrop ? '<div data-backdrop="true" class="fixed inset-0 bg-black/50 transition-opacity"></div>' : ''}
                <div class="relative bg-white rounded-lg shadow-xl max-h-screen overflow-hidden ${this.getSizeClasses(size)}">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-6 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                        ${closeButton ? `
                            <button id="modal-close" class="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                    
                    <!-- Content -->
                    <div class="p-6 overflow-y-auto max-h-96">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.classList.add('overflow-hidden');

        this.attachEventListeners();
    }

    hide() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.remove();
            document.body.classList.remove('overflow-hidden');
            this.isOpen = false;
            
            // Clean up event listeners
            this.eventListeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
            this.eventListeners = [];
            
            if (this.onClose) {
                this.onClose();
            }
        }
    }

    attachEventListeners() {
        const closeBtn = document.getElementById('modal-close');
        const overlay = document.getElementById('modal-overlay');

        // Close button
        if (closeBtn) {
            const clickHandler = () => this.hide();
            closeBtn.addEventListener('click', clickHandler);
            this.eventListeners.push({ element: closeBtn, event: 'click', handler: clickHandler });
        }

        // Background overlay click (only if closable)
        if (overlay && this.closable) {
            const clickHandler = (e) => {
                if (e.target === overlay || e.target.hasAttribute('data-backdrop')) {
                    this.hide();
                }
            };
            overlay.addEventListener('click', clickHandler);
            this.eventListeners.push({ element: overlay, event: 'click', handler: clickHandler });
        }

        // Escape key (only if closable)
        if (this.closable) {
            const escapeHandler = (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.hide();
                }
            };
            document.addEventListener('keydown', escapeHandler);
            this.eventListeners.push({ element: document, event: 'keydown', handler: escapeHandler });
        }

        // Auto-detect and handle Cancel/Close buttons in content
        if (overlay) {
            const cancelBtns = overlay.querySelectorAll('button');
            cancelBtns.forEach(btn => {
                const btnText = btn.textContent.trim().toLowerCase();
                if (btnText === 'cancel' || btnText === 'close') {
                    const clickHandler = () => this.hide();
                    btn.addEventListener('click', clickHandler);
                    this.eventListeners.push({ element: btn, event: 'click', handler: clickHandler });
                }
            });
        }
    }

    getSizeClasses(size) {
        const sizes = {
            sm: 'w-full max-w-md',
            md: 'w-full max-w-lg',
            lg: 'w-full max-w-2xl',
            xl: 'w-full max-w-4xl',
            full: 'w-full max-w-6xl'
        };
        return sizes[size] || sizes.md;
    }
}

export default new Modal();