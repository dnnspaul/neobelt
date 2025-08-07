import { BrowserOpenURL } from '../../wailsjs/runtime/runtime.js';

// Simple markdown renderer for basic formatting
export function renderMarkdown(text) {
    if (!text) return '';
    
    return text
        // Bold text **bold**
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic text *italic*
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Code blocks `code`
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
        // Links [text](url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:text-blue-800 underline external-link" data-url="$2">$1</a>')
        // Line breaks
        .replace(/\n/g, '<br>')
        // Headers ### Header
        .replace(/^### (.*$)/gm, '<h3 class="font-semibold text-base mt-2 mb-1">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 class="font-semibold text-lg mt-3 mb-2">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 class="font-bold text-xl mt-4 mb-3">$1</h1>');
}

export function getStatusBgColor(status) {
    switch (status) {
        case 'running':
            return 'bg-green-100';
        case 'stopped':
        case 'exited':
        case 'dead':
            return 'bg-gray-100';
        case 'created':
            return 'bg-blue-100';
        case 'restarting':
            return 'bg-yellow-100';
        case 'error':
            return 'bg-red-100';
        default:
            return 'bg-gray-100';
    }
}

export function getStatusTextColor(status) {
    switch (status) {
        case 'running':
            return 'text-green-700';
        case 'stopped':
        case 'exited':
        case 'dead':
            return 'text-gray-700';
        case 'created':
            return 'text-blue-700';
        case 'restarting':
            return 'text-yellow-700';
        case 'error':
            return 'text-red-700';
        default:
            return 'text-gray-700';
    }
}

export function getStatusBadgeColor(status) {
    switch (status) {
        case 'running':
            return 'bg-green-100 text-green-800';
        case 'stopped':
        case 'exited':
        case 'dead':
            return 'bg-gray-100 text-gray-800';
        case 'created':
            return 'bg-blue-100 text-blue-800';
        case 'restarting':
            return 'bg-yellow-100 text-yellow-800';
        case 'error':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

export function handleExternalLinks() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('external-link')) {
            e.preventDefault();
            const url = e.target.getAttribute('data-url');
            if (url) {
                BrowserOpenURL(url);
            }
        }
    });
}