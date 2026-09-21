/* ========================================
   应用主入口
   ======================================== */

class App {
    constructor() {
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;

        // 初始化组件
        window.componentRenderer.init();

        // 初始化图表
        window.chartManager.initFunnelChart('funnelChart');
        window.chartManager.initRadarChart('radarChart');

        // 图表 canvas 插入后，刷新目录就绪状态并按当前滚动位置恢复高亮
        window.reportNavigator.refresh();
        window.reportNavigator.restorePosition();

        // 字体/资源加载完成后布局可能变化，再次校准高亮项
        window.addEventListener('load', () => {
            window.reportNavigator.refresh();
        });

        // 监听窗口大小变化
        window.addEventListener('resize', this.handleResize.bind(this));

        // 监听滚动
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

        console.log('🚀 Dashboard initialized successfully');
    }

    handleResize() {
        // 防抖处理
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            window.chartManager.resize();
        }, 250);
    }

    handleScroll() {
        // 可以添加滚动相关的动画效果
        const scrollY = window.scrollY;
        const header = document.querySelector('.header');
        
        if (header) {
            const opacity = Math.max(0.5, 1 - scrollY / 500);
            header.style.opacity = opacity;
        }
    }

    // 刷新数据
    refresh() {
        window.toast.info('刷新中', '正在重新加载数据...');

        // 数据重渲期间，目录项先回到“加载中”，防止跳到空白区块
        window.reportNavigator.markLoading();

        setTimeout(() => {
            window.componentRenderer.renderSummary();
            window.componentRenderer.renderStats();
            window.componentRenderer.renderMatrix();
            window.componentRenderer.renderQuickWins();
            window.chartManager.resize();

            window.reportNavigator.refresh();
            window.toast.success('刷新完成', '数据已更新');
        }, 1000);
    }

    // 导出报告
    exportReport() {
        window.toast.info('导出报告', '正在生成PDF报告...');
        
        setTimeout(() => {
            window.toast.success('导出成功', '报告已保存到下载目录');
        }, 2000);
    }
}

// 创建应用实例
const app = new App();

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 暴露全局方法
window.app = app;
