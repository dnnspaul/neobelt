import Modal from './Modal.js';
import { CheckDockerStatus, StartDockerDesktop, OpenDockerDesktopDownloadURL } from '../../wailsjs/go/main/App.js';
import { logger } from '../utils/logger.js';

export class DockerStatusModal {
    constructor() {
        this.modal = Modal;
        this.isShowing = false;
        this.currentStatus = null;
    }

    show(eventType, status) {
        // Prevent multiple modals from showing
        if (this.isShowing) {
            return;
        }

        // Check if there's already another modal open - don't override user modals
        const existingModalOverlay = document.getElementById('modal-overlay');
        if (existingModalOverlay) {
            logger.debug('Another modal is already open, skipping Docker status modal to preserve user modal');
            return;
        }

        this.isShowing = true;
        this.currentStatus = status;

        let content, title, options;

        switch (eventType) {
            case 'docker_not_installed':
                ({ content, title, options } = this.getNotInstalledContent());
                break;
            case 'docker_not_running':
                ({ content, title, options } = this.getNotRunningContent());
                break;
            case 'docker_running':
                // Docker is running - hide modal if showing
                this.hide();
                return;
            default:
                logger.warning('Unknown Docker status event type:', eventType);
                this.isShowing = false;
                return;
        }

        // Customize modal options
        options.closeButton = false; // Prevent closing until Docker is ready
        options.backdrop = true;     // Show dark overlay like other modals
        options.closable = false;    // Prevent closing via backdrop click or escape key

        this.modal.onClose = () => {
            this.isShowing = false;
        };

        this.modal.show(content, {
            title,
            size: 'md',
            ...options
        });

        this.attachModalEventListeners();
    }

    hide() {
        if (this.isShowing) {
            this.isShowing = false;
            this.modal.hide();
        }
    }

    getNotInstalledContent() {
        return {
            title: 'Docker Desktop Required',
            content: `
                <div class="text-center">
                    <div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Docker Desktop Not Found</h3>
                    <p class="text-sm text-gray-600 mb-6">
                        Neobelt requires Docker Desktop to manage MCP servers. Docker Desktop is not installed on your system.
                    </p>
                    <div class="flex flex-col space-y-3">
                        <button id="download-docker" class="inline-flex justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Download Docker Desktop
                        </button>
                        <button id="check-again" class="inline-flex justify-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                            Check Again
                        </button>
                    </div>
                </div>
            `,
            options: {}
        };
    }

    getNotRunningContent() {
        return {
            title: 'Start Docker Desktop',
            content: `
                <div class="text-center">
                    <div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-4">
                        <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Docker Desktop Required</h3>
                    <p class="text-sm text-gray-600 mb-6">
                        Docker Desktop is installed but not currently running. Would you like Neobelt to start Docker Desktop for you?
                    </p>
                    <div class="flex flex-col space-y-3">
                        <button id="start-docker" class="inline-flex justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Yes, Start Docker Desktop
                        </button>
                        <button id="check-again" class="inline-flex justify-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                            I'll Start It Manually
                        </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-4">
                        Neobelt will continue checking Docker status every 15 seconds.
                    </p>
                </div>
            `,
            options: {}
        };
    }

    attachModalEventListeners() {
        const downloadBtn = document.getElementById('download-docker');
        const startBtn = document.getElementById('start-docker');
        const checkBtn = document.getElementById('check-again');

        if (downloadBtn) {
            downloadBtn.addEventListener('click', this.handleDownloadDocker.bind(this));
        }

        if (startBtn) {
            startBtn.addEventListener('click', this.handleStartDocker.bind(this));
        }

        if (checkBtn) {
            checkBtn.addEventListener('click', this.handleCheckAgain.bind(this));
        }
    }

    async handleDownloadDocker() {
        try {
            await OpenDockerDesktopDownloadURL();
        } catch (error) {
            logger.error('Failed to open Docker Desktop download page:', error);
        }
    }

    async handleStartDocker() {
        const startBtn = document.getElementById('start-docker');
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.textContent = 'Starting Docker Desktop...';
        }

        try {
            await StartDockerDesktop();
            // Update button to show success and give Docker time to start
            if (startBtn) {
                startBtn.textContent = 'Starting... Please wait';
            }
            // Give Docker a moment to start before checking again
            setTimeout(() => {
                this.handleCheckAgain();
            }, 5000);
        } catch (error) {
            logger.error('Failed to start Docker Desktop:', error);
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.textContent = 'Yes, Start Docker Desktop';
                // Show error message
                const errorMsg = document.createElement('p');
                errorMsg.className = 'text-xs text-red-600 mt-2';
                errorMsg.textContent = 'Failed to start Docker Desktop. Please start it manually.';
                startBtn.parentElement.appendChild(errorMsg);
            }
        }
    }

    async handleCheckAgain() {
        const checkBtn = document.getElementById('check-again');
        if (checkBtn) {
            checkBtn.disabled = true;
            checkBtn.textContent = 'Checking...';
        }

        try {
            const status = await CheckDockerStatus();
            
            if (status.is_running) {
                // Docker is now running - hide the modal
                this.hide();
                return;
            }

            // Docker still not ready - update the modal
            if (!status.is_docker_desktop_installed) {
                this.show('docker_not_installed', status);
            } else if (!status.is_running) {
                this.show('docker_not_running', status);
            }
        } catch (error) {
            logger.error('Failed to check Docker status:', error);
        } finally {
            if (checkBtn) {
                checkBtn.disabled = false;
                checkBtn.textContent = 'Check Again';
            }
        }
    }
}

// Export singleton instance
export default new DockerStatusModal();