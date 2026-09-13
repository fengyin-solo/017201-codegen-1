/* ========================================
   数据配置
   ======================================== */

// 矩阵数据
const matrixData = {
    dimensions: [
        { icon: '🎯', name: '全域获客', key: 'acquisition' },
        { icon: '👑', name: '权益体系', key: 'rights' },
        { icon: '💬', name: '私域触点', key: 'touchpoints' },
        { icon: '📊', name: '数据画像', key: 'cdp' },
        { icon: '🤖', name: '自动化营销', key: 'ma' },
        { icon: '🔧', name: '工具基建', key: 'martech' }
    ],
    phases: [
        { name: '阶段1: 沉睡通讯录', subtitle: '资产留存', key: 'phase1' },
        { name: '阶段2: 社交连接体', subtitle: '活跃与复购', key: 'phase2' },
        { name: '阶段3: 智能价值网', subtitle: '预测与生态', key: 'phase3' }
    ],
    cells: {
        acquisition: {
            phase1: {
                current: true,
                sop: ['门店扫码入会（流程复杂）', '罐内码扫码（体验差）', '包裹卡引流（无追踪）'],
                tools: { international: ['Google Analytics'], domestic: ['有赞', '微盟'] }
            },
            phase2: {
                target: true,
                sop: ['企微活码分渠道追踪', '裂变拉新（老带新奖励）', '公域转私域SOP（抖音/天猫）', '门店利益分成机制'],
                tools: { international: ['HubSpot'], domestic: ['企业微信', '句子互动', '尘锋SCRM'] }
            },
            phase3: {
                sop: ['AI智能投放优化', 'LTV预测筛选高价值潜客', '全域归因分析', '智能渠道预算分配'],
                tools: { international: ['Salesforce Marketing Cloud', 'Adobe Experience Cloud'], domestic: ['神策数据', '易观方舟'] }
            }
        },
        rights: {
            phase1: {
                current: true,
                sop: ['基础积分累计', '积分兑换礼品', '无等级体系', '储值卡推销'],
                tools: { international: [], domestic: ['有赞', '微盟'] }
            },
            phase2: {
                target: true,
                sop: ['会员等级体系（银/金/钻）', '付费会员Plus设计', '成长值任务体系', '专属权益差异化'],
                tools: { international: ['Salesforce Loyalty'], domestic: ['驿氪', '有赞'] }
            },
            phase3: {
                sop: ['动态权益个性化', 'LTV驱动权益分配', '积分通证化', '生态权益互通'],
                tools: { international: ['Adobe Real-Time CDP'], domestic: ['神策数据', '易观'] }
            }
        },
        touchpoints: {
            phase1: {
                current: true,
                sop: ['短信群发（打开率<1%）', '公众号推文', '无企微私域', '无社群运营'],
                tools: { international: [], domestic: ['公众号', '短信平台'] }
            },
            phase2: {
                target: true,
                sop: ['企微1v1私聊SOP', '社群分层运营', '视频号内容矩阵', '直播带货联动', '朋友圈剧本'],
                tools: { international: ['Intercom'], domestic: ['企业微信', '句子互动', '微伴助手', '腾讯企点'] }
            },
            phase3: {
                sop: ['AI智能客服', '个性化内容推荐', '全渠道消息中心', '智能外呼'],
                tools: { international: ['Salesforce Service Cloud', 'Zendesk'], domestic: ['智齿科技', '网易七鱼'] }
            }
        },
        cdp: {
            phase1: {
                current: true,
                sop: ['手机号=会员ID', '仅交易数据', '无行为追踪', '画像模糊'],
                tools: { international: [], domestic: ['Excel', 'ERP系统'] }
            },
            phase2: {
                target: true,
                sop: ['OneID统一身份', '静态标签体系', '行为事件追踪', 'RFM分层模型'],
                tools: { international: ['Segment', 'mParticle'], domestic: ['神策数据', '易观方舟', 'GrowingIO'] }
            },
            phase3: {
                sop: ['实时CDP', '预测性标签', 'AI画像生成', '跨平台数据打通'],
                tools: { international: ['Adobe Real-Time CDP', 'Salesforce CDP'], domestic: ['神策数据', '创略科技'] }
            }
        },
        ma: {
            phase1: {
                current: true,
                sop: ['无自动化', '人工群发', '无生命周期管理', '无MOT触发'],
                tools: { international: [], domestic: ['人工操作'] }
            },
            phase2: {
                target: true,
                sop: ['关键MOT自动触达', '生日/满月复购提醒', '流失预警自动挽回', '新客培育旅程'],
                tools: { international: ['HubSpot', 'Marketo'], domestic: ['句子互动', 'Convertlab', '致趣百川'] }
            },
            phase3: {
                sop: ['AI驱动营销决策', '智能时机优化', '个性化内容生成', '全渠道编排'],
                tools: { international: ['Salesforce Marketing Cloud', 'Adobe Journey Optimizer'], domestic: ['神策智能运营', 'Convertlab'] }
            }
        },
        martech: {
            phase1: {
                current: true,
                sop: ['小程序（体验差）', '罐内码（流程繁琐）', '系统割裂', '无数据中台'],
                tools: { international: [], domestic: ['微信小程序', '第三方扫码'] }
            },
            phase2: {
                target: true,
                sop: ['企微+SCRM一体化', '小程序体验优化', '数据中台搭建', 'BI看板'],
                tools: { international: ['Salesforce'], domestic: ['企业微信', '有赞', '微盟', '神策数据'] }
            },
            phase3: {
                sop: ['全域数据湖', 'AI中台', '智能决策引擎', 'API生态'],
                tools: { international: ['Snowflake', 'Databricks'], domestic: ['阿里云数据中台', '腾讯云CDP'] }
            }
        }
    }
};

// 速赢行动清单
const quickWins = [
    {
        icon: '🔗',
        title: '企微私域基建',
        timeline: '第1-4周',
        desc: '部署企业微信+SCRM系统，设计门店导购利益分成机制，解决渠道抵触问题。建立活码体系，实现渠道来源追踪。',
        kpis: [
            { value: '100%', label: '门店覆盖率' },
            { value: '50%', label: '导购激活率' }
        ]
    },
    {
        icon: '📱',
        title: '小程序体验重构',
        timeline: '第3-8周',
        desc: '简化入会流程至3步以内，优化罐内码扫码体验，增加即时奖励机制。将小程序从"积分工具"升级为"潜客蓄水池"。',
        kpis: [
            { value: '↓60%', label: '入会流失率' },
            { value: '↑3x', label: '扫码完成率' }
        ]
    },
    {
        icon: '🎬',
        title: '内容能力建设',
        timeline: '第5-12周',
        desc: '组建内部短视频团队，建立内容素材库，设计种草内容矩阵。从"枯燥医务知识"转向"场景化育儿内容"，驱动新客转化。',
        kpis: [
            { value: '30+', label: '月产内容数' },
            { value: '10%', label: '内容转化率' }
        ]
    }
];

// 统计卡片数据
const statsData = [
    { icon: '🎯', value: '拉新', label: '2026 核心战略', trend: null },
    { icon: '⚠️', value: '阶段1', label: '当前成熟度定位', trend: null },
    { icon: '🚀', value: '阶段2-3', label: '目标成熟度', trend: '+2级' },
    { icon: '🔥', value: '3个', label: '核心断层待解决', trend: null }
];

// 漏斗图数据
const funnelData = [
    { value: 100, name: '曝光触达', color: 'rgba(168, 85, 247, 0.9)' },
    { value: 45, name: '门店进店', color: 'rgba(168, 85, 247, 0.75)' },
    { value: 20, name: '扫码入会', color: 'rgba(236, 72, 153, 0.8)' },
    { value: 8, name: '首次购买', color: 'rgba(239, 68, 68, 0.85)' },
    { value: 3, name: '复购留存', color: 'rgba(239, 68, 68, 0.95)' }
];

const diagnosticSummary = {
    currentPosition: {
        label: '阶段1：沉睡通讯录',
        subtitle: '资产留存',
        score: 20,
        color: '#ef4444',
        description: '会员体系处于初始阶段，仅完成基础资产留存，六大维度均处于低位'
    },
    targetPosition: {
        label: '阶段2→3：社交连接体→智能价值网',
        subtitle: '活跃复购→预测生态',
        score: 80,
        color: '#10b981',
        gap: '+2级跨越'
    },
    keyGaps: [
        {
            id: 1,
            icon: '🔻',
            title: '获客→入会断层',
            severity: 'critical',
            metric: '100% → 20% → 8%',
            metricLabel: '曝光→入会→首购',
            description: '入会转化极低，门店导购无利益驱动机制，扫码流程复杂体验差'
        },
        {
            id: 2,
            icon: '🔄',
            title: '首购→复购断层',
            severity: 'critical',
            metric: '8% → 3%',
            metricLabel: '首购→复购留存',
            description: '无生命周期管理与MOT触达，无自动化培育旅程，流失无预警'
        },
        {
            id: 3,
            icon: '📡',
            title: '触达→自动化断层',
            severity: 'high',
            metric: '<1%',
            metricLabel: '短信打开率',
            description: '私域触点几乎空白，全靠人工群发，零自动化营销能力'
        }
    ]
};

// 雷达图数据
const radarData = {
    indicators: [
        { name: '全域获客', max: 100 },
        { name: '权益体系', max: 100 },
        { name: '私域触点', max: 100 },
        { name: '数据画像', max: 100 },
        { name: '自动化营销', max: 100 },
        { name: '工具基建', max: 100 }
    ],
    series: [
        {
            name: '佳贝艾特现状',
            value: [25, 20, 15, 20, 10, 30],
            color: '#ef4444',
            areaColor: 'rgba(239, 68, 68, 0.3)'
        },
        {
            name: '行业标杆',
            value: [85, 80, 90, 85, 80, 85],
            color: '#10b981',
            areaColor: 'rgba(16, 185, 129, 0.2)'
        }
    ]
};
