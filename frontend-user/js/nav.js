/* ========================================
   报告目录导航
   - 区块就绪状态：ready（可跳转）/ loading（渲染中）/ missing（数据缺失）
   - 滚动联动高亮当前区块（scroll-spy）
   - 刷新 / 再次进入时恢复到当前位置对应的导航项
   - 窄屏收进可展开入口
   ======================================== */

class ReportNavigator {
    constructor() {
        this.navEl = null;
        this.listEl = null;
        this.toggleEl = null;
        this.currentEl = null;

        // 区块定义：id 与 index.html 中的 section 一一对应
        this.sections = [
            {
                id: 'summary',
                selector: '#section-summary',
                icon: '🔍',
                label: '诊断摘要',
                hasData: () => typeof diagnosticSummary !== 'undefined' && !!diagnosticSummary.currentPosition,
                isRendered: (el) => !!el.querySelector('.summary-position-card')
            },
            {
                id: 'stats',
                selector: '#section-stats',
                icon: '📇',
                label: '概览卡片',
                hasData: () => typeof statsData !== 'undefined' && Array.isArray(statsData) && statsData.length > 0,
                isRendered: (el) => el.querySelectorAll('#statsGrid .stat-card').length > 0
            },
            {
                id: 'charts',
                selector: '#section-charts',
                icon: '📊',
                label: '图表分析',
                hasData: () => typeof funnelData !== 'undefined' && funnelData.length
                    && typeof radarData !== 'undefined' && radarData.indicators,
                isRendered: (el) => !!el.querySelector('canvas, .chart-unavailable')
            },
            {
                id: 'matrix',
                selector: '#section-matrix',
                icon: '📋',
                label: '战略矩阵',
                hasData: () => typeof matrixData !== 'undefined' && matrixData.dimensions && matrixData.dimensions.length,
                isRendered: (el) => el.querySelectorAll('#matrixTable tbody tr').length > 0
            },
            {
                id: 'quickwins',
                selector: '#section-quickwins',
                icon: '⚡',
                label: '速赢行动清单',
                hasData: () => typeof quickWins !== 'undefined' && Array.isArray(quickWins) && quickWins.length > 0,
                isRendered: (el) => el.querySelectorAll('#quickwinsGrid .quickwin-card').length > 0
            }
        ];

        this.STORAGE_KEY = 'report-nav-active';
        this.activeId = null;
        this.statuses = {};        // id -> 'loading' | 'ready' | 'missing'
        this.ticking = false;
        this.restoreGen = 0;      // 恢复任务的代次，旧任务自动失效
        // 程序触发跳转后，屏蔽紧随其后的第一次 scroll-spy：
        // 该事件可能仍基于旧滚动位置，会把目标导航项与位置记忆覆盖掉。
        // 下一次滚动事件（此时 scrollY 已反映目标位置）恢复正常联动。
        this.skipNextSpy = false;

        this._onScroll = this._onScroll.bind(this);
    }

    init() {
        this.navEl = document.getElementById('reportNav');
        this.listEl = document.getElementById('reportNavList');
        this.toggleEl = document.getElementById('reportNavToggle');
        this.currentEl = this.toggleEl.querySelector('.report-nav-toggle-current');
        if (!this.navEl || !this.listEl || !this.toggleEl) return;

        // 初始统一为“加载中”，避免跳到尚未渲染的空白区块
        this.sections.forEach(s => { this.statuses[s.id] = 'loading'; });
        this._renderList();
        this._bindToggle();
        this._bindOutsideClose();

        // 观察各区块内容变化，自动刷新就绪状态
        this._observeSections();

        // 数据 / 渲染可能晚于脚本，轮询兜底 + 超时判定缺失
        this._pollStatus();

        window.addEventListener('scroll', this._onScroll, { passive: true });
        window.addEventListener('resize', this._onScroll, { passive: true });
    }

    /* ---------- 状态判定 ---------- */

    _computeStatus(section) {
        const el = document.querySelector(section.selector);
        if (!el) return 'missing';
        if (!section.hasData()) return 'missing';
        if (section.isRendered(el)) return 'ready';
        return 'loading';
    }

    _pollStatus() {
        // 首次立即校准；之后每 200ms 检查，最多等待 8 秒（图表初始化较慢）。
        // 注意：仅在状态真正变化时才重算高亮，避免定时轮询在恢复定位期间
        // 把页首对应的区块写回 sessionStorage 而覆盖用户上次位置。
        let elapsed = 0;
        this._refreshStatuses();

        const timer = setInterval(() => {
            elapsed += 200;
            this._refreshStatuses();

            const anyPending = this.sections.some(s => this.statuses[s.id] === 'loading');
            if (!anyPending || elapsed >= 8000) {
                clearInterval(timer);
            }
        }, 200);
    }

    _observeSections() {
        if (!('MutationObserver' in window)) return;
        const observer = new MutationObserver(() => {
            this._refreshStatuses();
        });
        this.sections.forEach(s => {
            const el = document.querySelector(s.selector);
            if (el) {
                observer.observe(el, { childList: true, subtree: true });
            }
        });
    }

    _refreshStatuses() {
        let changed = false;
        const pausing = Date.now() < (this.readyPausedUntil || 0);
        this.sections.forEach(s => {
            let next = this._computeStatus(s);
            // 数据重渲保护期内：即使 DOM 已出现也保持“加载中”，不放行跳转
            if (pausing && this.statuses[s.id] === 'loading') next = 'loading';
            if (this.statuses[s.id] !== next) {
                this.statuses[s.id] = next;
                this._updateItem(s);
                changed = true;
            }
        });
        if (changed) this._updateActive();
    }

    // 数据重渲前调用：所有区块先回到“加载中”，并在 pauseMs 内维持该状态，
    // 期间 MutationObserver / 轮询不得提前放行，避免用户跳到半空白区块
    markLoading(pauseMs = 1200) {
        this.readyPausedUntil = Date.now() + pauseMs;
        this.sections.forEach(s => {
            this.statuses[s.id] = 'loading';
            this._updateItem(s);
        });
    }

    // 供外部（如手动刷新数据后）调用
    refresh() {
        this.readyPausedUntil = 0;
        this._refreshStatuses();
    }

    /* ---------- 列表渲染 ---------- */

    _renderList() {
        this.listEl.innerHTML = '';
        this.sections.forEach((s, index) => {
            const li = document.createElement('li');
            li.className = 'report-nav-item';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'report-nav-link';
            btn.dataset.target = s.id;
            btn.setAttribute('aria-current', 'false');

            btn.innerHTML = `
                <span class="report-nav-index">0${index + 1}</span>
                <span class="report-nav-icon">${s.icon}</span>
                <span class="report-nav-label">${s.label}</span>
                <span class="report-nav-status" aria-hidden="true"></span>
            `;

            btn.addEventListener('click', () => this._handleClick(s.id));
            li.appendChild(btn);
            this.listEl.appendChild(li);
            this._updateItem(s);
        });

        const hint = document.createElement('li');
        hint.className = 'report-nav-hint';
        hint.setAttribute('aria-hidden', 'true');
        hint.textContent = '🟢 可跳转 · 🟡 加载中 · 🔴 区块缺失';
        this.listEl.appendChild(hint);
    }

    _updateItem(section) {
        const btn = this.listEl.querySelector(`.report-nav-link[data-target="${section.id}"]`);
        if (!btn) return;
        const status = this.statuses[section.id] || 'loading';

        btn.classList.toggle('is-loading', status === 'loading');
        btn.classList.toggle('is-missing', status === 'missing');
        btn.setAttribute('aria-disabled', status === 'ready' ? 'false' : 'true');

        let title;
        if (status === 'loading') {
            title = `「${section.label}」数据正在加载中，暂时无法跳转`;
        } else if (status === 'missing') {
            title = `「${section.label}」区块缺失或暂无数据，无法跳转`;
        } else {
            title = `定位到${section.label}`;
        }
        btn.title = title;
        btn.setAttribute('aria-label', title);
    }

    /* ---------- 点击跳转 ---------- */

    // 供侧栏 / 摘要断层卡片等外部入口调用的统一跳转（带就绪校验）
    navigateTo(id) {
        const section = this.sections.find(s => s.id === id);
        if (!section) return;

        const status = this.statuses[id];
        if (status === 'loading') {
            window.toast.info('区块加载中', `「${section.label}」数据尚未渲染完成，请稍候`, 3000);
            return;
        }
        if (status === 'missing') {
            window.toast.warning('无法跳转', `「${section.label}」区块缺失或暂无数据`, 3500);
            return;
        }

        this._scrollToSection(id, true);
        this._flashSection(section.selector);
    }

    _flashSection(selector) {
        const el = document.querySelector(selector);
        if (!el) return;
        el.style.transition = 'box-shadow 0.5s ease';
        el.style.boxShadow = '0 0 40px rgba(168, 85, 247, 0.35)';
        setTimeout(() => { el.style.boxShadow = ''; }, 1800);
    }

    _handleClick(id) {
        const section = this.sections.find(s => s.id === id);
        if (!section) return;

        const status = this.statuses[id];
        if (status === 'loading') {
            window.toast.info('区块加载中', `「${section.label}」数据尚未渲染完成，请稍候，暂时无法跳转`, 3000);
            return;
        }
        if (status === 'missing') {
            window.toast.warning('无法跳转', `「${section.label}」区块缺失或暂无数据，没有可定位的内容`, 3500);
            return;
        }

        this._scrollToSection(id, true);
        this._closeMobile();
    }

    _scrollToSection(id, updateHash) {
        const el = document.querySelector(this.sections.find(s => s.id === id).selector);
        if (!el) return;

        // 立即给出视觉反馈，滚动期间不误高亮到中间区块
        this._setActive(id);
        this.skipNextSpy = true;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

        if (updateHash) {
            try {
                history.replaceState(null, '', `#${el.id}`);
            } catch (e) { /* 忽略历史记录异常 */ }
        }
    }

    /* ---------- 滚动联动高亮（scroll-spy） ---------- */

    _onScroll() {
        if (this.ticking) return;
        this.ticking = true;
        requestAnimationFrame(() => {
            this.ticking = false;
            if (this.skipNextSpy) {
                this.skipNextSpy = false;
                return; // 跳过程序跳转后携带旧位置的第一次滚动事件
            }
            this._updateActive();
            this.navEl.classList.toggle('is-scrolled', window.scrollY > 120);
        });
    }

    _updateActive() {
        if (!this.listEl) return;

        // 仅在“已就绪”的区块中计算
        const ready = this.sections.filter(s => this.statuses[s.id] === 'ready');
        if (!ready.length) return;

        // 判定线：吸顶导航下方约 1/3 视口处，保证短区块也能被高亮到
        const probeY = window.scrollY + Math.min(180, window.innerHeight * 0.32);
        let current = null;

        for (const s of ready) {
            const el = document.querySelector(s.selector);
            if (!el) continue;
            const top = el.offsetTop;
            const bottom = top + el.offsetHeight;
            if (probeY >= top && probeY < bottom) {
                current = s.id;
                break;
            }
        }

        // 判定线落在区块间隙（如标题间距）时，取判定线上方最近的区块；
        // 页首（头部区域）则高亮第一个已就绪区块
        if (!current) {
            const passed = ready
                .map(s => ({ id: s.id, top: document.querySelector(s.selector).offsetTop }))
                .filter(item => item.top <= probeY);
            current = passed.length
                ? passed[passed.length - 1].id
                : ready[0].id;
        }

        // 已滚动到底部时，强制高亮最后一个就绪区块
        // （需已离开页首，避免短文档在 scrollY=0 时被误判为“到底”）
        const doc = document.documentElement;
        if (window.scrollY > 0 && window.scrollY + window.innerHeight >= doc.scrollHeight - 4) {
            current = ready[ready.length - 1].id;
        }

        if (current) this._setActive(current);
    }

    _setActive(id) {
        if (this.activeId === id) return;
        this.activeId = id;

        this.listEl.querySelectorAll('.report-nav-link').forEach(btn => {
            const isActive = btn.dataset.target === id;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-current', isActive ? 'true' : 'false');
        });

        const section = this.sections.find(s => s.id === id);
        if (section && this.currentEl) {
            this.currentEl.textContent = section.label;
        }

        // 恢复位置：记录当前所在区块，刷新 / 再次进入时可还原
        try {
            sessionStorage.setItem(this.STORAGE_KEY, id);
        } catch (e) { /* 隐私模式下忽略 */ }
    }

    /* ---------- 恢复当前位置 ---------- */

    restorePosition() {
        const gen = ++this.restoreGen;

        // 进入恢复时立即读出记忆的区块并锁定到本次任务。
        // 注意：此刻（DOMContentLoaded）浏览器往往还未还原滚动位置，
        // scrollY 可能为 0，若此时跑 scroll-spy 会把页首区块写回存储、
        // 覆盖掉用户上次所在位置，所以必须先取数、延后判定。
        const hash = window.location.hash.replace('#', '');
        const hashSection = this.sections.find(s => {
            const el = document.querySelector(s.selector);
            return el && el.id === hash;
        });
        let entrySaved = null;
        try { entrySaved = sessionStorage.getItem(this.STORAGE_KEY); } catch (e) { /* ignore */ }

        // 浏览器在 load 时会自行处理两种定位：
        // 1) URL 锚点 → 滚到对应区块；2) 滚动位置恢复（bfcache / scroll restoration）
        // 这里把判定推迟到 load 之后：浏览器已滚（scrollY>0）只同步高亮，
        // 浏览器没能定位（区块渲染太晚）时才补一次滚动
        const land = (id) => {
            if (gen !== this.restoreGen || window.scrollY > 0) return;
            const section = this.sections.find(s => s.id === id);
            const el = section && document.querySelector(section.selector);
            if (!el) return;
            this.skipNextSpy = true;
            el.scrollIntoView({ block: 'start' });
            this._setActive(id);
        };

        const decide = () => {
            if (gen !== this.restoreGen) return;

            this._updateActive();
            if (window.scrollY > 0) return; // 浏览器已还原滚动位置，仅同步高亮

            // 优先尊重 URL 锚点
            if (hashSection) {
                if (this.statuses[hashSection.id] === 'ready') {
                    land(hashSection.id);
                } else if (this.statuses[hashSection.id] === 'loading') {
                    this._whenReady(hashSection.id, () => land(hashSection.id), 8000);
                }
                return;
            }

            // 无锚点：回到进入本次恢复时记住的区块（用锁定值，不重新读存储）
            if (!entrySaved) return;

            const savedSection = this.sections.find(s => s.id === entrySaved);
            if (!savedSection || !document.querySelector(savedSection.selector)) return;

            if (this.statuses[entrySaved] === 'ready') {
                land(entrySaved);
            } else if (this.statuses[entrySaved] === 'loading') {
                this._whenReady(entrySaved, () => land(entrySaved), 8000);
            }
        };

        if (document.readyState === 'complete') {
            setTimeout(decide, 0);
        } else {
            window.addEventListener('load', () => setTimeout(decide, 0));
        }
    }

    _whenReady(id, callback, timeoutMs) {
        // 绑定发起等待时的恢复代次：之后若再次调用 restorePosition（新代次），
        // 这个迟到的回调必须作废，不能把页面滚到旧的目标区块
        const gen = this.restoreGen;
        const start = Date.now();
        const check = () => {
            if (gen !== this.restoreGen) return;
            if (this.statuses[id] === 'ready') {
                callback();
                return;
            }
            if (this.statuses[id] === 'missing') return;
            if (Date.now() - start > timeoutMs) return;
            setTimeout(check, 200);
        };
        check();
    }

    /* ---------- 窄屏展开 / 收起 ---------- */

    _bindToggle() {
        this.toggleEl.addEventListener('click', () => {
            const open = this.navEl.classList.toggle('is-open');
            this.toggleEl.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }

    _closeMobile() {
        if (!this.navEl.classList.contains('is-open')) return;
        this.navEl.classList.remove('is-open');
        this.toggleEl.setAttribute('aria-expanded', 'false');
    }

    _bindOutsideClose() {
        document.addEventListener('click', (e) => {
            if (!this.navEl.classList.contains('is-open')) return;
            if (!this.navEl.contains(e.target)) this._closeMobile();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this._closeMobile();
        });
    }
}

// 创建全局实例（区块渲染前初始化，先呈现“加载中”状态）
window.reportNavigator = new ReportNavigator();
