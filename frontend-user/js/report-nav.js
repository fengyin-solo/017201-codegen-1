/* ========================================
   报告目录导航
   - 点击定位区块 / 滚动自动高亮
   - 区块未渲染或缺失时禁用并给出说明
   - 刷新或再次进入时恢复当前位置对应导航项
   - 窄屏收为文档流内可展开入口（不遮挡速赢行动清单）
   ======================================== */

class ReportNav {
    constructor() {
        this.navEl = null;
        this.listEl = null;
        this.toggleEl = null;
        this.toggleCurrentEl = null;
        this.sidebarEl = null;
        this.sidebarToggleEl = null;

        // 导航项定义：summary 为诊断摘要侧栏，其余为页面区块
        this.items = [
            {
                id: 'summary',
                label: '诊断摘要',
                icon: '🔍',
                kind: 'sidebar'
            },
            {
                id: 'overview',
                label: '概览卡片',
                icon: '📊',
                kind: 'section',
                sectionId: 'statsSection'
            },
            {
                id: 'charts',
                label: '图表分析',
                icon: '📈',
                kind: 'section',
                sectionId: 'chartsSection'
            },
            {
                id: 'matrix',
                label: '战略矩阵',
                icon: '📋',
                kind: 'section',
                sectionId: 'matrixSection'
            },
            {
                id: 'quickwins',
                label: '速赢行动清单',
                icon: '⚡',
                kind: 'section',
                sectionId: 'quickwinsSection'
            }
        ];

        this.states = {};          // id -> 'ready' | 'loading' | 'missing'
        this.activeId = null;
        this.storageKey = 'reportNavActive';
        this.restoreTimer = null;
        this.checkTimer = null;
        this.scrollRaf = null;
        this.observer = null;
        this.sidebarObserver = null;
    }

    init() {
        this.navEl = document.getElementById('reportNav');
        this.sidebarEl = document.getElementById('diagnosticSidebar');
        this.sidebarToggleEl = document.getElementById('sidebarToggle');
        if (!this.navEl) return;

        this.render();
        this.bindEvents();
        this.observeDom();

        // 初次检测 + 多次兜底（数据/图表可能稍后渲染完成）
        this.refreshStates();
        [300, 800, 1600, 2600].forEach(delay => {
            setTimeout(() => this.refreshStates(), delay);
        });
        window.addEventListener('load', () => {
            this.refreshStates();
            this.updateActiveFromScroll();
        });

        this.restoreActive();
    }

    /* ---------- 渲染 ---------- */

    render() {
        this.navEl.innerHTML = `
            <button type="button" class="report-nav-toggle" id="reportNavToggle"
                    aria-expanded="false" aria-controls="reportNavList">
                <span class="rn-toggle-title"><span>🧭</span> 报告目录</span>
                <span class="rn-toggle-current" id="reportNavCurrent">报告顶部</span>
                <span class="rn-toggle-chevron" aria-hidden="true">▾</span>
            </button>
            <div class="report-nav-list" id="reportNavList" role="list"></div>
        `;

        this.listEl = this.navEl.querySelector('#reportNavList');
        this.toggleEl = this.navEl.querySelector('#reportNavToggle');
        this.toggleCurrentEl = this.navEl.querySelector('#reportNavCurrent');

        this.items.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'report-nav-item';
            btn.setAttribute('role', 'listitem');
            btn.dataset.navId = item.id;
            btn.innerHTML = `
                <span class="rn-item-icon">${item.icon}</span>
                <span class="rn-item-text">
                    <span class="rn-item-label">${item.label}</span>
                    <span class="rn-item-note"></span>
                </span>
            `;
            btn.addEventListener('click', () => this.handleItemClick(item.id));
            this.listEl.appendChild(btn);
        });

        this.toggleEl.addEventListener('click', () => {
            const open = this.navEl.classList.toggle('is-open');
            this.toggleEl.setAttribute('aria-expanded', String(open));
        });
    }

    bindEvents() {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            this.scrollRaf = requestAnimationFrame(() => {
                this.updateActiveFromScroll();
                ticking = false;
            });
        }, { passive: true });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) this.closeMobilePanel();
            this.updateActiveFromScroll();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeMobilePanel();
        });
    }

    /* ---------- 区块就绪状态检测 ---------- */

    // 检测单个导航项对应内容是否可跳转
    detectState(item) {
        if (item.kind === 'sidebar') {
            if (!this.sidebarEl) return 'missing';
            const body = document.getElementById('sidebarBody');
            if (!body) return 'missing';
            return body.querySelector('.sidebar-position-card, .sidebar-gap-card')
                ? 'ready'
                : 'loading';
        }

        const section = document.getElementById(item.sectionId);
        if (!section) return 'missing';

        switch (item.id) {
            case 'overview':
                return section.querySelector('.stat-card') ? 'ready' : 'loading';
            case 'matrix':
                return section.querySelector('.matrix-table tbody tr') ? 'ready' : 'loading';
            case 'quickwins':
                return section.querySelector('.quickwin-card') ? 'ready' : 'loading';
            case 'charts': {
                const funnel = document.getElementById('funnelChart');
                const radar = document.getElementById('radarChart');
                if (!funnel || !radar) return 'missing';
                return this.isChartReady(funnel) && this.isChartReady(radar)
                    ? 'ready'
                    : 'loading';
            }
            default:
                return 'ready';
        }
    }

    isChartReady(container) {
        // ECharts 已实例化且容器有实际尺寸
        if (window.echarts && window.echarts.getInstanceByDom
            && window.echarts.getInstanceByDom(container)) {
            return container.offsetWidth > 0 && container.offsetHeight > 0;
        }
        const canvas = container.querySelector('canvas');
        return !!canvas && canvas.width > 0 && canvas.height > 0;
    }

    refreshStates() {
        let changed = false;
        this.items.forEach(item => {
            const state = this.detectState(item);
            if (this.states[item.id] !== state) {
                this.states[item.id] = state;
                this.applyItemState(item.id, state);
                changed = true;
            }
        });

        if (changed) {
            // 内容到位后，当前高亮项可能需要重新计算
            this.updateActiveFromScroll();
        }
    }

    applyItemState(id, state) {
        const btn = this.navEl.querySelector(`[data-nav-id="${id}"]`);
        if (!btn) return;

        const item = this.items.find(i => i.id === id);
        const noteEl = btn.querySelector('.rn-item-note');

        btn.classList.remove('is-loading', 'is-missing', 'is-ready');
        btn.classList.add(`is-${state}`);

        let note = '';
        let tip = item.label;
        if (state === 'loading') {
            note = '数据加载中…';
            tip = `「${item.label}」数据尚未渲染完成，请稍候`;
            btn.setAttribute('aria-disabled', 'true');
        } else if (state === 'missing') {
            note = '区块缺失';
            tip = `「${item.label}」区块缺失，无法跳转`;
            btn.setAttribute('aria-disabled', 'true');
        } else {
            btn.removeAttribute('aria-disabled');
        }
        noteEl.textContent = note;
        btn.setAttribute('title', tip);
        btn.setAttribute('aria-label', note ? `${item.label}，${note}` : item.label);
    }

    observeDom() {
        // 监听动态渲染（含 refresh 重绘），防抖后重新检测
        const app = document.getElementById('app') || document.body;
        this.observer = new MutationObserver(() => {
            clearTimeout(this.checkTimer);
            this.checkTimer = setTimeout(() => this.refreshStates(), 150);
        });
        this.observer.observe(app, { childList: true, subtree: true });

        // 诊断摘要侧栏开合时联动高亮
        if (this.sidebarEl && 'MutationObserver' in window) {
            this.sidebarObserver = new MutationObserver(() => {
                if (this.sidebarEl.classList.contains('open')) {
                    this.setActive('summary');
                } else {
                    this.updateActiveFromScroll();
                }
            });
            this.sidebarObserver.observe(this.sidebarEl, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
    }

    /* ---------- 点击定位 ---------- */

    handleItemClick(id) {
        const state = this.states[id] || 'loading';
        const item = this.items.find(i => i.id === id);

        // 不可跳转：给出说明，绝不跳到空白位置
        if (state !== 'ready') {
            if (state === 'missing') {
                window.toast.warning('无法跳转', `「${item.label}」区块缺失，暂不可查看`);
            } else {
                window.toast.info('内容准备中', `「${item.label}」数据尚未渲染完成，请稍候`);
            }
            return;
        }

        if (item.kind === 'sidebar') {
            this.openSidebar();
            this.setActive('summary');
            return;
        }

        const target = document.getElementById(item.sectionId);
        if (!target) {
            window.toast.warning('无法跳转', `「${item.label}」区块缺失，暂不可查看`);
            return;
        }

        this.closeMobilePanel();
        this.setActive(id);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    openSidebar() {
        if (!this.sidebarEl || this.sidebarEl.classList.contains('open')) return;
        this.sidebarEl.classList.add('open');
        if (this.sidebarToggleEl) {
            this.sidebarToggleEl.style.opacity = '0';
            this.sidebarToggleEl.style.pointerEvents = 'none';
        }
    }

    closeMobilePanel() {
        if (!this.navEl) return;
        this.navEl.classList.remove('is-open');
        if (this.toggleEl) this.toggleEl.setAttribute('aria-expanded', 'false');
    }

    /* ---------- 滚动高亮 ---------- */

    isSidebarOpen() {
        return !!(this.sidebarEl && this.sidebarEl.classList.contains('open'));
    }

    updateActiveFromScroll() {
        if (!this.navEl) return;
        if (this.isSidebarOpen()) {
            this.setActive('summary');
            return;
        }

        const scrollY = window.scrollY || window.pageYOffset;
        const isMobile = window.innerWidth <= 768;
        // 区块顶部越过判定线即视为当前区块（为桌面端吸顶导航预留高度）
        const triggerLine = isMobile ? 80 : 108;
        const docHeight = document.documentElement.scrollHeight;
        const atBottom = scrollY + window.innerHeight >= docHeight - 8;

        const sections = this.items
            .filter(i => i.kind === 'section' && this.states[i.id] === 'ready')
            .map(i => ({ id: i.id, el: document.getElementById(i.sectionId) }))
            .filter(s => s.el);

        let currentId = null;
        if (atBottom && sections.length) {
            currentId = sections[sections.length - 1].id;
        } else {
            for (const sec of sections) {
                const top = sec.el.getBoundingClientRect().top;
                if (top - triggerLine <= 0) currentId = sec.id;
            }
        }

        this.setActive(currentId);
        this.updateStuckStyle();
    }

    updateStuckStyle() {
        if (window.innerWidth <= 768) {
            this.navEl.classList.remove('is-stuck');
            return;
        }
        const stuck = this.navEl.getBoundingClientRect().top <= 14;
        this.navEl.classList.toggle('is-stuck', stuck);
    }

    setActive(id) {
        if (this.activeId === id) {
            this.updateToggleCurrent(id);
            return;
        }
        this.activeId = id;

        this.navEl.querySelectorAll('.report-nav-item').forEach(btn => {
            const active = btn.dataset.navId === id;
            btn.classList.toggle('is-active', active);
            if (active) {
                btn.setAttribute('aria-current', 'true');
            } else {
                btn.removeAttribute('aria-current');
            }
        });

        this.updateToggleCurrent(id);
        this.persistActive(id);
    }

    updateToggleCurrent(id) {
        if (!this.toggleCurrentEl) return;
        if (!id) {
            this.toggleCurrentEl.textContent = '报告顶部';
            return;
        }
        const item = this.items.find(i => i.id === id);
        this.toggleCurrentEl.textContent = item ? `当前：${item.label}` : '报告顶部';
    }

    /* ---------- 刷新 / 重入恢复 ---------- */

    persistActive(id) {
        try {
            if (id) {
                sessionStorage.setItem(this.storageKey, id);
            } else {
                sessionStorage.removeItem(this.storageKey);
            }
        } catch (e) { /* sessionStorage 不可用时静默降级 */ }
    }

    readStored() {
        try {
            return sessionStorage.getItem(this.storageKey);
        } catch (e) {
            return null;
        }
    }

    restoreActive() {
        // 浏览器会在刷新后恢复滚动位置；此处以实际位置为准，
        // 区块尚未完成布局时临时回退到上次记录的导航项。
        const apply = () => {
            this.refreshStates();
            const fromScroll = this.peekActiveFromScroll();
            if (fromScroll) {
                this.setActive(fromScroll);
                return;
            }
            const stored = this.readStored();
            if (stored && this.states[stored] === 'ready') {
                this.setActive(stored);
            }
        };

        apply();
        // 字体、图片、图表渲染会改变区块位置，多校正几次
        [100, 400, 900, 1800].forEach(delay => {
            setTimeout(apply, delay);
        });
    }

    // 只计算不写状态，供恢复时使用
    peekActiveFromScroll() {
        if (this.isSidebarOpen()) return 'summary';

        const scrollY = window.scrollY || window.pageYOffset;
        if (scrollY < 40) return null;

        const isMobile = window.innerWidth <= 768;
        const triggerLine = isMobile ? 80 : 108;
        const atBottom = scrollY + window.innerHeight
            >= document.documentElement.scrollHeight - 8;

        const sections = this.items
            .filter(i => i.kind === 'section' && this.states[i.id] === 'ready')
            .map(i => ({ id: i.id, el: document.getElementById(i.sectionId) }))
            .filter(s => s.el);

        if (atBottom && sections.length) return sections[sections.length - 1].id;

        let currentId = null;
        for (const sec of sections) {
            if (sec.el.getBoundingClientRect().top - triggerLine <= 0) {
                currentId = sec.id;
            }
        }
        return currentId;
    }

    /* ---------- 数据刷新入口（供 App.refresh 调用） ---------- */

    refresh() {
        // 重绘期间内容短暂为空，先更新为加载态，渲染完成后由 observer 恢复
        this.refreshStates();
        setTimeout(() => this.refreshStates(), 300);
        setTimeout(() => this.updateActiveFromScroll(), 500);
    }
}

// 创建全局实例
window.reportNav = new ReportNav();
