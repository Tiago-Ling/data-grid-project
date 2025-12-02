import { DEMO_REGISTRY, type BaseDemo } from './demos';

class DemoManager {
    private currentDemo: BaseDemo<any> | null = null;
    private container: HTMLElement;
    private gridContainer: HTMLElement | null = null;
    private selector: HTMLSelectElement | null = null;
    private titleElement: HTMLElement | null = null;
    private descriptionElement: HTMLElement | null = null;
    private creditsElement: HTMLElement | null = null;
    private isLoading: boolean = false;

    constructor(containerId: string) {
        // Main demo container
        this.container = document.querySelector(containerId)!;
        if (!this.container) {
            throw new Error(`Container element "${containerId}" not found`);
        }

        this.setupUI();
        this.setupRouting();
        this.loadDemoFromHash();
    }

    private setupUI(): void {
        // Grid container
        this.gridContainer = document.createElement('div');
        this.gridContainer.id = 'grid-container';
        this.gridContainer.className = 'grid-container';

        this.selector = document.createElement('select');
        this.selector.id = 'demo-selector';
        this.selector.className = 'demo-selector';

        DEMO_REGISTRY.forEach(demo => {
            const info = demo.getInfo();
            const option = document.createElement('option');
            option.value = info.id;
            option.textContent = info.title;
            this.selector!.appendChild(option);
        });

        this.selector.addEventListener('change', (e) => {
            const demoId = (e.target as HTMLSelectElement).value;
            const demo = DEMO_REGISTRY.find(d => d.getInfo().id === demoId);
            if (demo) {
                this.loadDemo(demo, true);
            }
        });

        const demoBarContainer = document.createElement('div');
        demoBarContainer.id = 'demo-bar-container';
        demoBarContainer.className = 'demo-bar-container';

        this.container.appendChild(demoBarContainer);
        this.container.appendChild(this.gridContainer);

        const pageTitle = document.createElement('div');
        pageTitle.id = 'page-title';
        pageTitle.className = 'page-title';
        pageTitle.innerHTML = `<h1>Data Grid Demo</h1>`;
        demoBarContainer.appendChild(pageTitle);

        let toolbar = document.querySelector<HTMLElement>('#demo-toolbar');
        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.id = 'demo-toolbar';
            demoBarContainer.appendChild(toolbar);
        }

        const selectorGroup = document.createElement('div');
        selectorGroup.className = 'demo-selector-group';

        const label = document.createElement('label');
        label.htmlFor = 'demo-selector';
        label.textContent = 'Select Demo: ';

        selectorGroup.appendChild(label);
        selectorGroup.appendChild(this.selector);
        toolbar.appendChild(selectorGroup);

        const demoInfo = document.createElement('div');
        demoInfo.id = 'demo-info';
        demoInfo.className = 'demo-info';

        this.titleElement = document.createElement('h3');
        this.titleElement.id = 'demo-title';

        this.descriptionElement = document.createElement('p');
        this.descriptionElement.id = 'demo-description';

        this.creditsElement = document.createElement('p');
        this.creditsElement.id = 'demo-credits';
        this.creditsElement.className = 'demo-credits';

        demoInfo.appendChild(this.titleElement);
        demoInfo.appendChild(this.descriptionElement);
        demoInfo.appendChild(this.creditsElement);
        toolbar.appendChild(demoInfo);
    }

    private setDemoSelectorEnabled(enabled: boolean): void {
        if (this.selector) {
            this.selector.disabled = !enabled;
            this.selector.style.opacity = enabled ? '1' : '0.6';
            this.selector.style.cursor = enabled ? 'pointer' : 'not-allowed';
        }
    }

    private setupRouting(): void {
        window.addEventListener('hashchange', () => {
            this.loadDemoFromHash();
        });
    }

    private loadDemoFromHash(): void {
        const hash = window.location.hash.slice(1); // Remove #
        const demo = hash
            ? DEMO_REGISTRY.find(d => d.getInfo().id === hash)
            : DEMO_REGISTRY[0];

        if (demo) {
            this.loadDemo(demo, false);
        } else {
            // Invalid hash, load default and update URL
            console.warn(`Demo "${hash}" not found, loading default demo`);
            this.loadDemo(DEMO_REGISTRY[0], true);
        }
    }

    private async loadDemo(demo: BaseDemo<any>, updateHash: boolean): Promise<void> {
        if (this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.setDemoSelectorEnabled(false);

        try {
            if (this.currentDemo) {
                this.currentDemo.destroy();
                this.currentDemo = null;
            }

            if (!this.gridContainer) {
                this.gridContainer = document.createElement('div');
                this.gridContainer.id = 'grid-container';
                this.gridContainer.className = 'grid-container';
            }
            this.gridContainer.innerHTML = '';

            const info = demo.getInfo();

            if (this.titleElement) {
                this.titleElement.textContent = info.title;
            }
            if (this.descriptionElement) {
                this.descriptionElement.textContent = info.description;
            }
            if (this.selector) {
                this.selector.value = info.id;
            }

            if (this.creditsElement) {
                if (info.dataSourceCredits) {
                    this.creditsElement.innerHTML = `
                        Data source: <a href="${info.dataSourceCredits.url}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="${info.dataSourceCredits.description || ''}"
                        >${info.dataSourceCredits.name}</a>
                    `;
                    this.creditsElement.style.display = 'block';
                } else {
                    this.creditsElement.style.display = 'none';
                }
            }

            if (updateHash) {
                window.location.hash = info.id;
            }

            try {
                await demo.init(this.gridContainer);
                this.currentDemo = demo;
                console.log(`Loaded demo: ${info.title}`);
            } catch (error) {
                console.error(`Failed to load demo "${info.title}":`, error);
                if (this.gridContainer) {
                    this.gridContainer.innerHTML = `<div style="padding: 20px; color: red;">Failed to load demo: ${error}</div>`;
                }
            }
        } finally {
            this.isLoading = false;
            this.setDemoSelectorEnabled(true);
        }
    }

    destroy(): void {
        if (this.currentDemo) {
            this.currentDemo.destroy();
            this.currentDemo = null;
        }
    }
}

new DemoManager('#main-container');
