/* ========================================
   UI 组件渲染
   ======================================== */

class ComponentRenderer {
    constructor() {
        this.typewriterText = '基于2026年"拉新"战略核心，诊断当前会员体系成熟度，识别关键断层，规划升级路径...';
        this.charIndex = 0;
    }

    // 打字机效果
    startTypewriter() {
        const el = document.getElementById('typewriter');
        if (!el) return;

        const type = () => {
            if (this.charIndex < this.typewriterText.length) {
                el.textContent = this.typewriterText.substring(0, this.charIndex + 1);
                this.charIndex++;
                setTimeout(type, 45);
            }
        };
        type();
    }

    // 渲染页内诊断摘要区块
    renderSummary() {
        const container = document.getElementById('summaryGrid');
        if (!container) return;

        const d = diagnosticSummary;
        let html = '<div class="summary-positions">';
        html += `
            <div class="sidebar-position-card is-current summary-position-card">
                <div class="sidebar-position-header">
                    <div class="sidebar-position-label" style="color: ${d.currentPosition.color}">${d.currentPosition.label}</div>
                    <div class="sidebar-position-subtitle">${d.currentPosition.subtitle}</div>
                </div>
                <div class="sidebar-score-bar">
                    <div class="sidebar-score-fill is-red" style="width: ${d.currentPosition.score}%"></div>
                </div>
                <div class="sidebar-position-desc">${d.currentPosition.description}</div>
            </div>
            <div class="sidebar-position-card is-target summary-position-card">
                <div class="sidebar-position-header">
                    <div class="sidebar-position-label" style="color: ${d.targetPosition.color}">${d.targetPosition.label}</div>
                    <div class="sidebar-position-subtitle">${d.targetPosition.subtitle}</div>
                </div>
                <div class="sidebar-score-bar">
                    <div class="sidebar-score-fill is-green" style="width: ${d.targetPosition.score}%"></div>
                </div>
                <div class="sidebar-gap-badge">⚠️ ${d.targetPosition.gap}</div>
            </div>
        `;
        html += '</div>';

        html += '<div class="summary-arrow" aria-hidden="true">⬇ 跨越断层路径 ⬇</div>';
        html += '<div class="summary-gaps">';
        const gapTargets = ['charts', 'matrix', 'quickwins'];
        d.keyGaps.forEach((gap, i) => {
            const sevClass = gap.severity === 'critical' ? 'is-critical' : 'is-high';
            html += `
                <div class="sidebar-gap-card ${sevClass}" data-nav-target="${gapTargets[i] || gapTargets[0]}">
                    <div class="sidebar-gap-header">
                        <span class="sidebar-gap-icon">${gap.icon}</span>
                        <span class="sidebar-gap-title">${gap.title}</span>
                        <span class="sidebar-gap-severity ${sevClass}">${gap.severity === 'critical' ? '严重' : '高'}</span>
                    </div>
                    <div class="sidebar-gap-metric">
                        <span class="sidebar-gap-metric-value">${gap.metric}</span>
                        <span class="sidebar-gap-metric-label">${gap.metricLabel}</span>
                    </div>
                    <div class="sidebar-gap-desc">${gap.description}</div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;

        // 分数条入场动画
        requestAnimationFrame(() => {
            container.querySelectorAll('.sidebar-score-fill').forEach(el => {
                const w = el.style.width;
                el.style.width = '0%';
                requestAnimationFrame(() => { el.style.width = w; });
            });
        });

        // 点击断层卡片，通过目录导航统一跳转（会先校验区块是否就绪）
        container.querySelectorAll('.sidebar-gap-card[data-nav-target]').forEach(card => {
            card.addEventListener('click', () => {
                window.reportNavigator.navigateTo(card.dataset.navTarget);
            });
        });
    }

    // 渲染统计卡片
    renderStats() {
        const container = document.getElementById('statsGrid');
        if (!container) return;

        container.innerHTML = statsData.map((stat, index) => `
            <div class="glass-card stat-card fade-in delay-${index + 1}" data-index="${index}">
                <span class="stat-icon">${stat.icon}</span>
                <div class="stat-value">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
                ${stat.trend ? `<div class="stat-trend">${stat.trend}</div>` : ''}
            </div>
        `).join('');

        // 添加点击事件
        container.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = card.dataset.index;
                const stat = statsData[index];
                window.toast.info(stat.label, `当前值: ${stat.value}`);
            });
        });
    }

    // 渲染矩阵表格
    renderMatrix() {
        const table = document.getElementById('matrixTable');
        if (!table) return;

        let html = '<thead><tr><th>运营维度</th>';
        
        matrixData.phases.forEach(p => {
            html += `
                <th>
                    <div style="font-weight: 700;">${p.name}</div>
                    <div style="font-size: 12px; color: var(--neon-cyan); margin-top: 6px; opacity: 0.9;">
                        焦点: ${p.subtitle}
                    </div>
                </th>
            `;
        });
        html += '</tr></thead><tbody>';

        matrixData.dimensions.forEach((dim, dimIndex) => {
            html += `<tr class="fade-in delay-${Math.min(dimIndex + 1, 5)}">`;
            html += `
                <td class="dimension-cell">
                    <span class="dimension-icon">${dim.icon}</span>
                    ${dim.name}
                </td>
            `;

            matrixData.phases.forEach(phase => {
                const cell = matrixData.cells[dim.key][phase.key];
                let cellClass = '';
                let tag = '';

                if (cell.current) {
                    cellClass = 'cell-current';
                    tag = '<span class="status-tag tag-current">📍 当前位置</span>';
                }
                if (cell.target) {
                    cellClass = 'cell-target';
                    tag = '<span class="status-tag tag-target">🎯 改进目标</span>';
                }

                html += `<td class="${cellClass}"><div class="cell-content">${tag}<div class="sop-list">`;
                cell.sop.forEach(s => {
                    html += `<div class="sop-item">${s}</div>`;
                });
                html += '</div>';

                if (cell.tools && (cell.tools.international.length || cell.tools.domestic.length)) {
                    html += '<div class="tools-section"><div class="tools-label">🔧 推荐工具</div>';
                    cell.tools.international.forEach(t => {
                        html += `<span class="tool-tag international" data-tool="${t}">${t}</span>`;
                    });
                    cell.tools.domestic.forEach(t => {
                        html += `<span class="tool-tag domestic" data-tool="${t}">${t}</span>`;
                    });
                    html += '</div>';
                }
                html += '</div></td>';
            });
            html += '</tr>';
        });

        html += '</tbody>';
        table.innerHTML = html;

        // 添加工具标签点击事件
        table.querySelectorAll('.tool-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const toolName = tag.dataset.tool;
                const isInternational = tag.classList.contains('international');
                window.toast.info(
                    '工具推荐',
                    `${toolName} - ${isInternational ? '国际工具' : '国内工具'}`,
                    3000
                );
            });
        });
    }

    // 渲染速赢行动清单
    renderQuickWins() {
        const grid = document.getElementById('quickwinsGrid');
        if (!grid) return;

        grid.innerHTML = quickWins.map((qw, i) => `
            <div class="glass-card quickwin-card fade-in delay-${i + 1}" data-index="${i}">
                <div class="quickwin-number">${i + 1}</div>
                <div class="quickwin-header">
                    <div class="quickwin-icon">${qw.icon}</div>
                    <div>
                        <div class="quickwin-title">${qw.title}</div>
                        <div class="quickwin-timeline">⏱️ ${qw.timeline}</div>
                    </div>
                </div>
                <div class="quickwin-desc">${qw.desc}</div>
                <div class="quickwin-kpi">
                    ${qw.kpis.map(k => `
                        <div class="kpi-item">
                            <div class="kpi-value">${k.value}</div>
                            <div class="kpi-label">${k.label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // 添加点击事件
        grid.querySelectorAll('.quickwin-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = card.dataset.index;
                const qw = quickWins[index];
                window.toast.success(
                    qw.title,
                    `执行周期: ${qw.timeline}`,
                    4000
                );
            });
        });
    }

    // 创建粒子效果
    createParticles() {
        const container = document.querySelector('.particles');
        if (!container) return;

        const colors = ['#a855f7', '#ec4899', '#06b6d4', '#10b981'];
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 15}s`;
            particle.style.animationDuration = `${15 + Math.random() * 10}s`;
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.width = `${2 + Math.random() * 4}px`;
            particle.style.height = particle.style.width;
            container.appendChild(particle);
        }
    }

    initSidebar() {
        const sidebar = document.getElementById('diagnosticSidebar');
        const toggle = document.getElementById('sidebarToggle');
        const close = document.getElementById('sidebarClose');
        const body = document.getElementById('sidebarBody');
        if (!sidebar || !toggle || !close || !body) return;

        toggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            toggle.style.opacity = '0';
            toggle.style.pointerEvents = 'none';
        });

        close.addEventListener('click', () => {
            sidebar.classList.remove('open');
            toggle.style.opacity = '1';
            toggle.style.pointerEvents = 'auto';
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                toggle.style.opacity = '1';
                toggle.style.pointerEvents = 'auto';
            }
        });

        this.renderSidebarContent(body);

        body.querySelectorAll('.sidebar-gap-card').forEach((card, i) => {
            card.addEventListener('click', () => {
                sidebar.classList.remove('open');
                toggle.style.opacity = '1';
                toggle.style.pointerEvents = 'auto';
                const targets = ['charts', 'matrix', 'quickwins'];
                window.reportNavigator.navigateTo(targets[i] || targets[0]);
            });
        });
    }

    renderSidebarContent(container) {
        const d = diagnosticSummary;
        let html = '';

        html += '<div class="sidebar-section">';
        html += '<div class="sidebar-section-title">📍 当前位置</div>';
        html += `
            <div class="sidebar-position-card is-current">
                <div class="sidebar-position-header">
                    <div class="sidebar-position-label" style="color: ${d.currentPosition.color}">${d.currentPosition.label}</div>
                    <div class="sidebar-position-subtitle">${d.currentPosition.subtitle}</div>
                </div>
                <div class="sidebar-score-bar">
                    <div class="sidebar-score-fill is-red" style="width: ${d.currentPosition.score}%"></div>
                </div>
                <div class="sidebar-position-desc">${d.currentPosition.description}</div>
            </div>
        `;
        html += '</div>';

        html += '<div class="sidebar-section">';
        html += '<div class="sidebar-section-title">🎯 改进目标</div>';
        html += `
            <div class="sidebar-position-card is-target">
                <div class="sidebar-position-header">
                    <div class="sidebar-position-label" style="color: ${d.targetPosition.color}">${d.targetPosition.label}</div>
                    <div class="sidebar-position-subtitle">${d.targetPosition.subtitle}</div>
                </div>
                <div class="sidebar-score-bar">
                    <div class="sidebar-score-fill is-green" style="width: ${d.targetPosition.score}%"></div>
                </div>
                <div class="sidebar-gap-badge">⚠️ ${d.targetPosition.gap}</div>
            </div>
        `;
        html += '</div>';

        html += '<div class="sidebar-section">';
        html += '<div class="sidebar-section-title">🔴 关键断层</div>';
        d.keyGaps.forEach(gap => {
            const sevClass = gap.severity === 'critical' ? 'is-critical' : 'is-high';
            html += `
                <div class="sidebar-gap-card ${sevClass}" data-gap-id="${gap.id}">
                    <div class="sidebar-gap-header">
                        <span class="sidebar-gap-icon">${gap.icon}</span>
                        <span class="sidebar-gap-title">${gap.title}</span>
                        <span class="sidebar-gap-severity ${sevClass}">${gap.severity === 'critical' ? '严重' : '高'}</span>
                    </div>
                    <div class="sidebar-gap-metric">
                        <span class="sidebar-gap-metric-value">${gap.metric}</span>
                        <span class="sidebar-gap-metric-label">${gap.metricLabel}</span>
                    </div>
                    <div class="sidebar-gap-desc">${gap.description}</div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;

        requestAnimationFrame(() => {
            container.querySelectorAll('.sidebar-score-fill').forEach(el => {
                const w = el.style.width;
                el.style.width = '0%';
                requestAnimationFrame(() => { el.style.width = w; });
            });
        });
    }

    // 初始化所有组件
    init() {
        // 先初始化报告目录导航（导航项在区块就绪前显示“加载中”）
        window.reportNavigator.init();

        this.createParticles();
        this.startTypewriter();
        this.renderSummary();
        this.renderStats();
        this.renderMatrix();
        this.renderQuickWins();
        this.initSidebar();

        // 显示欢迎提示
        setTimeout(() => {
            window.toast.success(
                '欢迎使用诊断驾驶舱',
                '数据已加载完成，点击各模块查看详情',
                5000
            );
        }, 1000);
    }
}

// 创建全局实例
window.componentRenderer = new ComponentRenderer();
