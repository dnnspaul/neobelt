import Modal from '../components/Modal.js';

export class Help {
    constructor() {
        this.searchResults = [];
        this.currentSection = 'getting-started';
    }

    render() {
        return `
            <div class="h-full flex flex-col overflow-hidden">
                <!-- Header -->
                <div class="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
                    <div class="pl-6 pr-0 py-4">
                        <div class="flex items-center justify-between">
                            <div class="flex-1 min-w-0">
                                <h1 class="text-2xl font-bold text-gray-900">Help & Support</h1>
                                <p class="text-gray-600">Get help with Neobelt and MCP servers</p>
                            </div>
                            <div class="flex space-x-3 ml-6 pr-6">
                                <button id="contact-support-btn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    Contact Support
                                </button>
                                <button id="report-issue-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    Report Issue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-1 min-h-0">
                    <!-- Help Navigation -->
                    <div class="w-80 bg-white border-r border-gray-200 overflow-y-auto">
                        <!-- Search -->
                        <div class="p-4 border-b border-gray-200">
                            <div class="relative">
                                <svg class="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                                <input id="help-search" type="text" placeholder="Search help articles..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500">
                            </div>
                        </div>

                        <!-- Navigation -->
                        <nav class="p-4 space-y-6">
                            <!-- Getting Started -->
                            <div>
                                <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Getting Started</h3>
                                <ul class="space-y-2">
                                    <li>
                                        <a href="#" class="help-nav-link block text-sm text-primary-600 hover:text-primary-700" data-section="getting-started">
                                            Quick Start Guide
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="help-nav-link block text-sm text-gray-600 hover:text-gray-900" data-section="installation">
                                            Installation & Setup
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="help-nav-link block text-sm text-gray-600 hover:text-gray-900" data-section="first-server">
                                            Installing Your First Server
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <!-- Server Management -->
                            <div>
                                <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Server Management</h3>
                                <ul class="space-y-2">
                                    <li>
                                        <a href="#" class="help-nav-link block text-sm text-gray-600 hover:text-gray-900" data-section="managing-servers">
                                            Managing Servers
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="help-nav-link block text-sm text-gray-600 hover:text-gray-900" data-section="server-configuration">
                                            Server Configuration
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="help-nav-link block text-sm text-gray-600 hover:text-gray-900" data-section="troubleshooting">
                                            Troubleshooting Servers
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <!-- Claude Integration -->
                            <div>
                                <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Claude Integration</h3>
                                <ul class="space-y-2">
                                    <li>
                                        <a href="#" class="help-nav-link block text-sm text-gray-600 hover:text-gray-900" data-section="claude-setup">
                                            Claude Desktop Setup
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="help-nav-link block text-sm text-gray-600 hover:text-gray-900" data-section="mcp-protocol">
                                            Understanding MCP
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <!-- Advanced Topics -->
                            <div>
                                <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Advanced</h3>
                                <ul class="space-y-2">
                                    <li>
                                        <a href="#" class="help-nav-link block text-sm text-gray-600 hover:text-gray-900" data-section="custom-registries">
                                            Custom Registries
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="help-nav-link block text-sm text-gray-600 hover:text-gray-900" data-section="security">
                                            Security Settings
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="help-nav-link block text-sm text-gray-600 hover:text-gray-900" data-section="api-reference">
                                            API Reference
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <!-- Support -->
                            <div>
                                <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Support</h3>
                                <ul class="space-y-2">
                                    <li>
                                        <a href="#" class="help-nav-link block text-sm text-gray-600 hover:text-gray-900" data-section="faq">
                                            Frequently Asked Questions
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="help-nav-link block text-sm text-gray-600 hover:text-gray-900" data-section="known-issues">
                                            Known Issues
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" class="help-nav-link block text-sm text-gray-600 hover:text-gray-900" data-section="community">
                                            Community Resources
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </nav>
                    </div>

                    <!-- Help Content -->
                    <div class="flex-1 overflow-y-auto p-6">
                        <!-- Getting Started Content -->
                        <div id="getting-started-content" class="help-content">
                            <div class="max-w-4xl">
                                <h2 class="text-3xl font-bold text-gray-900 mb-6">Quick Start Guide</h2>
                                
                                <div class="prose prose-lg max-w-none">
                                    <p class="text-xl text-gray-600 mb-8">Welcome to Neobelt! This guide will help you get up and running with MCP servers in just a few minutes.</p>

                                    <!-- Step 1 -->
                                    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                                        <div class="flex items-start space-x-4">
                                            <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                                            <div class="flex-1">
                                                <h3 class="text-lg font-semibold text-gray-900 mb-2">Install Claude Desktop</h3>
                                                <p class="text-gray-700 mb-4">Before using Neobelt, you need Claude Desktop installed on your computer. This is required for MCP integration to work.</p>
                                                <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
                                                    <div class="flex">
                                                        <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                        </svg>
                                                        <div class="ml-3">
                                                            <p class="text-sm text-blue-700">
                                                                <strong>Tip:</strong> Neobelt can auto-detect Claude Desktop if it's installed in the default location.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Step 2 -->
                                    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                                        <div class="flex items-start space-x-4">
                                            <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                                            <div class="flex-1">
                                                <h3 class="text-lg font-semibold text-gray-900 mb-2">Browse the Registry</h3>
                                                <p class="text-gray-700 mb-4">Visit the Registry page to discover available MCP servers. You'll find official servers from Anthropic and community-contributed servers.</p>
                                                <button class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
                                                    Go to Registry
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Step 3 -->
                                    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                                        <div class="flex items-start space-x-4">
                                            <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                                            <div class="flex-1">
                                                <h3 class="text-lg font-semibold text-gray-900 mb-2">Install Your First Server</h3>
                                                <p class="text-gray-700 mb-4 selectable-text">Click "Install" on any server that interests you. Neobelt will handle the download, installation, and configuration automatically.</p>
                                                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                                                    <div class="flex">
                                                        <svg class="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                        </svg>
                                                        <div class="ml-3">
                                                            <p class="text-sm text-green-700">
                                                                <strong>Recommended:</strong> Start with the "File System Server" - it's safe, useful, and easy to understand.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Step 4 -->
                                    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                                        <div class="flex items-start space-x-4">
                                            <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">4</div>
                                            <div class="flex-1">
                                                <h3 class="text-lg font-semibold text-gray-900 mb-2">Test in Claude</h3>
                                                <p class="text-gray-700 mb-4 selectable-text">Open Claude Desktop and start a new conversation. Your installed MCP servers will be automatically available. Try asking Claude to help you with tasks related to your servers.</p>
                                                <div class="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                                                    <p class="text-gray-700 selectable-text">Example: "Can you help me list the files in my Documents folder?"</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Next Steps -->
                                    <div class="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg p-6">
                                        <h3 class="text-lg font-semibold text-gray-900 mb-4">🎉 You're all set!</h3>
                                        <p class="text-gray-700 mb-4">Here are some things you can explore next:</p>
                                        <ul class="space-y-2 text-sm text-gray-600">
                                            <li class="flex items-center">
                                                <svg class="w-4 h-4 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                Monitor your servers on the Dashboard page
                                            </li>
                                            <li class="flex items-center">
                                                <svg class="w-4 h-4 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                Customize server settings in the Servers page
                                            </li>
                                            <li class="flex items-center">
                                                <svg class="w-4 h-4 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                Install more servers from the Registry
                                            </li>
                                            <li class="flex items-center">
                                                <svg class="w-4 h-4 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                Configure preferences in Settings
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- FAQ Content -->
                        <div id="faq-content" class="help-content hidden">
                            <div class="max-w-4xl">
                                <h2 class="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>

                                <div class="space-y-6">
                                    <div class="bg-white border border-gray-200 rounded-lg">
                                        <button class="faq-toggle w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                            <div class="flex items-center justify-between">
                                                <h3 class="text-lg font-semibold text-gray-900">What is an MCP server?</h3>
                                                <svg class="w-5 h-5 text-gray-500 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </button>
                                        <div class="faq-content hidden px-6 pb-6">
                                            <p class="text-gray-700">MCP (Model Context Protocol) servers are specialized applications that extend Claude's capabilities by providing access to external tools, data sources, and services. They act as bridges between Claude and various systems like file systems, databases, APIs, and more.</p>
                                        </div>
                                    </div>

                                    <div class="bg-white border border-gray-200 rounded-lg">
                                        <button class="faq-toggle w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                            <div class="flex items-center justify-between">
                                                <h3 class="text-lg font-semibold text-gray-900">Is it safe to install MCP servers?</h3>
                                                <svg class="w-5 h-5 text-gray-500 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </button>
                                        <div class="faq-content hidden px-6 pb-6">
                                            <p class="text-gray-700">Official servers from Anthropic are thoroughly tested and safe. Community servers should be evaluated carefully. Neobelt provides security features like sandboxing and signature verification to help protect your system.</p>
                                        </div>
                                    </div>

                                    <div class="bg-white border border-gray-200 rounded-lg">
                                        <button class="faq-toggle w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                            <div class="flex items-center justify-between">
                                                <h3 class="text-lg font-semibold text-gray-900">Why isn't Claude Desktop detecting my servers?</h3>
                                                <svg class="w-5 h-5 text-gray-500 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </button>
                                        <div class="faq-content hidden px-6 pb-6">
                                            <div class="space-y-3">
                                                <p class="text-gray-700">This can happen for several reasons:</p>
                                                <ul class="list-disc pl-6 space-y-2 text-gray-700">
                                                    <li>Claude Desktop needs to be restarted after server installation</li>
                                                    <li>The configuration file path might be incorrect</li>
                                                    <li>Servers might not be running</li>
                                                    <li>Port conflicts or firewall issues</li>
                                                </ul>
                                                <p class="text-gray-700">Try using the "Test Connection" button in Settings to diagnose the issue.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="bg-white border border-gray-200 rounded-lg">
                                        <button class="faq-toggle w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                            <div class="flex items-center justify-between">
                                                <h3 class="text-lg font-semibold text-gray-900">Can I create my own MCP server?</h3>
                                                <svg class="w-5 h-5 text-gray-500 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </button>
                                        <div class="faq-content hidden px-6 pb-6">
                                            <p class="text-gray-700">Yes! You can develop custom MCP servers using the official SDK. Once created, you can add them to Neobelt using the "Manual Installation" option or by creating a custom registry.</p>
                                        </div>
                                    </div>

                                    <div class="bg-white border border-gray-200 rounded-lg">
                                        <button class="faq-toggle w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                            <div class="flex items-center justify-between">
                                                <h3 class="text-lg font-semibold text-gray-900">How do I uninstall Neobelt?</h3>
                                                <svg class="w-5 h-5 text-gray-500 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </button>
                                        <div class="faq-content hidden px-6 pb-6">
                                            <div class="space-y-3">
                                                <p class="text-gray-700">To completely remove Neobelt:</p>
                                                <ol class="list-decimal pl-6 space-y-2 text-gray-700">
                                                    <li>Stop all running servers</li>
                                                    <li>Uninstall all MCP servers</li>
                                                    <li>Remove the Neobelt application</li>
                                                    <li>Delete configuration files (optional)</li>
                                                </ol>
                                                <p class="text-gray-700">Your Claude Desktop configuration will be restored to its previous state.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Other content sections would go here... -->
                        <div id="placeholder-content" class="help-content hidden">
                            <div class="max-w-4xl">
                                <h2 class="text-3xl font-bold text-gray-900 mb-6">Help Content</h2>
                                <p class="text-gray-600">This help section is under development. Please check back later for more detailed information.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Header buttons
        const contactBtn = document.getElementById('contact-support-btn');
        const reportBtn = document.getElementById('report-issue-btn');

        if (contactBtn) {
            contactBtn.addEventListener('click', () => this.showContactSupport());
        }

        if (reportBtn) {
            reportBtn.addEventListener('click', () => this.showReportIssue());
        }

        // Search
        const searchInput = document.getElementById('help-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchHelp(e.target.value);
            });
        }

        // Navigation
        const navLinks = document.querySelectorAll('.help-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
                
                // Update active nav
                navLinks.forEach(l => {
                    l.classList.remove('text-primary-600', 'text-primary-700');
                    l.classList.add('text-gray-600', 'hover:text-gray-900');
                });
                link.classList.remove('text-gray-600', 'hover:text-gray-900');
                link.classList.add('text-primary-600');
            });
        });

        // FAQ toggles
        this.attachFAQListeners();
    }

    attachFAQListeners() {
        const faqToggles = document.querySelectorAll('.faq-toggle');
        faqToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const content = toggle.nextElementSibling;
                const icon = toggle.querySelector('svg');
                
                if (content.classList.contains('hidden')) {
                    content.classList.remove('hidden');
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    content.classList.add('hidden');
                    icon.style.transform = 'rotate(0deg)';
                }
            });
        });
    }

    showSection(sectionName) {
        // Hide all content sections
        const sections = document.querySelectorAll('.help-content');
        sections.forEach(section => section.classList.add('hidden'));

        // Show the requested section or placeholder
        const targetSection = document.getElementById(`${sectionName}-content`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        } else {
            document.getElementById('placeholder-content').classList.remove('hidden');
        }

        this.currentSection = sectionName;
    }

    searchHelp(query) {
        if (query.length < 2) {
            this.clearSearchResults();
            return;
        }

        // Simulate search results
        this.searchResults = [
            { title: 'Installing your first server', section: 'first-server' },
            { title: 'Claude Desktop integration', section: 'claude-setup' },
            { title: 'Server troubleshooting', section: 'troubleshooting' },
        ].filter(result => result.title.toLowerCase().includes(query.toLowerCase()));

        this.showSearchResults();
    }

    showSearchResults() {
        // This would show search results in the UI
        console.log('Search results:', this.searchResults);
    }

    clearSearchResults() {
        this.searchResults = [];
    }

    showContactSupport() {
        const content = `
            <div class="space-y-6">
                <div class="text-center">
                    <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">Contact Support</h3>
                    <p class="text-gray-600">Get help from our support team</p>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                        <input type="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="your@email.com">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <div class="relative">
                            <select class="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer">
                                <option>General Question</option>
                                <option>Installation Problem</option>
                                <option>Server Issues</option>
                                <option>Claude Integration</option>
                                <option>Feature Request</option>
                                <option>Other</option>
                            </select>
                            <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="Please describe your question or issue..."></textarea>
                    </div>

                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 class="font-medium text-gray-900 mb-2">System Information</h4>
                        <div class="text-sm text-gray-600 space-y-1">
                            <div class="selectable-text">Neobelt Version: 1.0.0</div>
                            <div>Platform: macOS 14.0</div>
                            <div>Claude Desktop: Detected</div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700">
                        Send Message
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Contact Support',
            size: 'lg'
        });
    }

    showReportIssue() {
        const content = `
            <div class="space-y-6">
                <div class="text-center">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900">Report an Issue</h3>
                    <p class="text-gray-600">Help us improve Neobelt by reporting bugs and issues</p>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
                        <div class="relative">
                            <select class="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer">
                                <option>Bug Report</option>
                                <option>Crash/Error</option>
                                <option>Performance Issue</option>
                                <option>UI/UX Problem</option>
                                <option>Server Installation Issue</option>
                                <option>Claude Integration Problem</option>
                            </select>
                            <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Issue Summary</label>
                        <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="Brief description of the issue">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                        <textarea rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="Please provide a detailed description of the issue, including steps to reproduce if applicable..."></textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Steps to Reproduce</label>
                        <textarea rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="1. First step
2. Second step
3. Issue occurs"></textarea>
                    </div>

                    <div class="flex items-center">
                        <input type="checkbox" id="include-logs" class="mr-2" checked>
                        <label for="include-logs" class="text-sm text-gray-700">Include system logs and configuration data</label>
                    </div>

                    <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <div class="flex">
                            <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div class="ml-3">
                                <h4 class="text-sm font-medium text-blue-800">Privacy Notice</h4>
                                <p class="mt-1 text-sm text-blue-700">No personal data or server configurations will be shared. Only technical logs and system information are included.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">
                        Submit Report
                    </button>
                </div>
            </div>
        `;

        Modal.show(content, {
            title: 'Report Issue',
            size: 'lg'
        });
    }
}