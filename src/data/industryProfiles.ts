import type {
  IndustryCase,
  IndustryKey,
  IndustryProfile,
  QuestionnaireAnswer,
  TeamSize,
} from '../types/diagnostic';

export const defaultAnswers: QuestionnaireAnswer = {
  industry: '',
  teamType: '',
  teamSize: '',
  coreNodeId: '',
  flowGraph: { nodes: [], edges: [] },
  currentAiUsage: [],
};

export const TEAM_SIZE_OPTIONS: { value: TeamSize; label: string }[] = [
  { value: '1-10', label: '1-10 人' },
  { value: '11-30', label: '11-30 人' },
  { value: '31-100', label: '31-100 人' },
  { value: '100+', label: '100 人以上' },
];

const contentMarketingCases: IndustryCase[] = [
  {
    id: 'content-marketing-growth-01',
    industry: 'content-marketing',
    title: '消费品牌新媒体团队从散点提效走向流程级协同',
    teamType: '品牌内容增长团队',
    summary:
      '把热点研究、内容生产和发布审核拆成可接管节点后，团队从偶尔用 AI 写文案升级为周更节奏稳定的流水线。',
    painPoints: [
      '热点跟进依赖个人经验，选题命中率波动大',
      '文案、脚本和封面需求反复返工',
      '审核链路跨市场、品牌和法务，多人同步成本高',
    ],
    recommendedMechanisms: ['agent', 'knowledge', 'skill', 'workflow', 'human_gate'],
    outcome: '两个月内周产能提升 40%，审核等待时间缩短 35%，复盘结论沉淀为可复用知识库。',
  },
  {
    id: 'content-marketing-editorial-02',
    industry: 'content-marketing',
    title: '教育产品内容团队建立复盘闭环',
    teamType: '课程内容与社媒运营团队',
    summary:
      '围绕选题表现、评论反馈和转化数据建立复盘 loop，让内容团队不再靠主观感觉决定下周选题。',
    painPoints: [
      '内容表现复盘滞后，数据回流到策划会效率低',
      '同类选题重复试错，缺少结构化案例库',
    ],
    recommendedMechanisms: ['loop', 'evaluator', 'knowledge'],
    outcome: '季度内复用型选题模板覆盖 60% 常规内容，复盘会议时长减半。',
  },
];

const ecommerceCases: IndustryCase[] = [
  {
    id: 'ecommerce-ops-01',
    industry: 'ecommerce-ops',
    title: '美妆店铺用 AI 重做详情页与投放素材流水线',
    teamType: '店铺运营团队',
    summary:
      '详情页文案和投放素材从人工逐个写改为模板化批量生成，人工只做合规与卖点把关。',
    painPoints: [
      '详情页制作卡在文案，上新速度跟不上',
      '投放素材需求量大，设计师排队',
      '评价和差评处理靠人工逐条翻',
    ],
    recommendedMechanisms: ['skill', 'workflow', 'evaluator', 'human_gate'],
    outcome: '单品详情页制作从 2 天压到 4 小时，投放素材周产出翻倍，差评响应时效提升 50%。',
  },
];

const customerServiceCases: IndustryCase[] = [
  {
    id: 'customer-service-01',
    industry: 'customer-service',
    title: 'SaaS 客服团队构建意图识别 + 知识检索双层接管',
    teamType: '在线客服团队',
    summary:
      '把工单意图识别和知识检索交给 agent，人工聚焦复杂方案和情绪安抚，首响和解决率同时提升。',
    painPoints: [
      '重复问题占比高，人工首响慢',
      '知识库分散在多个文档，检索靠经验',
      '复杂工单和简单工单混在一起排队',
    ],
    recommendedMechanisms: ['agent', 'knowledge', 'routing', 'human_gate'],
    outcome: '首响时效从 15 分钟降到 2 分钟，一次性解决率提升 28%，人工专注处理复杂工单占比升至 40%。',
  },
];

const rdCases: IndustryCase[] = [
  {
    id: 'r-and-d-01',
    industry: 'r-and-d',
    title: '中型研发团队用 AI 闭环改造代码评审与测试',
    teamType: '产品研发团队',
    summary:
      '代码评审和单测生成交给 AI 预处理，人工只评审风险点和架构决策，评审等待和回归周期同步缩短。',
    painPoints: [
      '代码评审排队，PR 积压',
      '单测覆盖靠催，回归周期长',
      '故障复盘结论不沉淀，同类问题重复出现',
    ],
    recommendedMechanisms: ['skill', 'evaluator', 'loop', 'human_gate'],
    outcome: 'PR 平均评审等待从 3 天降到 8 小时，单测覆盖率从 45% 升到 78%，同类故障复现率下降 30%。',
  },
];

const salesCases: IndustryCase[] = [
  {
    id: 'sales-sdr-01',
    industry: 'sales-sdr',
    title: 'B2B 销售团队用 AI 重做线索清洗与话术准备',
    teamType: '电话销售团队',
    summary:
      '线索评分和话术生成交给 agent，销售把时间集中在高质量线索的深度挖掘和成交。',
    painPoints: [
      '线索量大但质量参差，人工清洗耗时',
      '话术准备靠个人经验，新人上手慢',
      '通话复盘靠回忆，结论沉淀不下来',
    ],
    recommendedMechanisms: ['agent', 'skill', 'knowledge', 'loop'],
    outcome: '无效触达下降 35%，新人首单周期缩短 40%，通话复盘结论每周自动沉淀为话术库。',
  },
];

export const industryProfiles: IndustryProfile[] = [
  {
    key: 'content-marketing',
    label: '内容营销 / 新媒体',
    blurb: '选题、生产、审核、复盘的高频内容流水线',
    teamOptions: [
      { value: '新媒体增长团队', label: '新媒体增长团队' },
      { value: '品牌内容团队', label: '品牌内容团队' },
    ],
    defaultWorkflow: ['选题会', '趋势研究', '内容策划', '脚本与文案生产', '素材协同', '审核发布', '数据复盘'],
    suggestedBottlenecks: ['趋势研究', '脚本与文案生产', '审核发布'],
    inputOptions: ['选题方向', '热点趋势', '竞品素材', '品牌调性', '历史爆款数据'],
    outputOptions: ['内容成稿', '口播脚本', '封面文案', '发布排期', '复盘结论'],
    aiUsageOptions: ['爆款标题生成', '短视频口播稿改写', '选题热点监控', '封面文案生成'],
    dataUploadTypes: [
      { type: '内容生产明细', format: 'CSV / Excel', fields: ['日期', '内容标题', '所属环节', '负责人', '产出耗时', '返工次数'] },
      { type: '选题与复盘记录', format: 'CSV / Excel', fields: ['选题', '来源', '命中情况', '发布日期', '阅读 / 转化'] },
      { type: '业务背景介绍', format: 'Word / PDF', fields: ['团队职责', '当前流程说明', '核心痛点', '已有 AI 尝试'] },
    ],
    stageHints: [
      { stage: '选题', replaceAction: 'agent 汇总上周表现与热点自动出选题候选清单，替代全员开会拍脑袋', caseRef: '参考案例：消费品牌新媒体团队，选题会从 90 分钟压到 20 分钟' },
      { stage: '趋势研究', replaceAction: 'agent 抓抖音/小红书热点与竞品账号更新，替代人工每天翻 30 个账号', caseRef: '参考案例：消费品牌新媒体团队，热点研究 agent 化后选题命中率提升 40%' },
      { stage: '文案', replaceAction: 'skill 沉淀爆款模板批量出草稿，copilot 辅助人工定稿，替代从零手写', caseRef: '参考案例：教育内容团队，文案初稿产能提升 3 倍' },
      { stage: '审核', replaceAction: 'workflow 自动流转加 evaluator 预检合规，人工只在风险点拍板，替代逐级人工传', caseRef: '参考案例：消费品牌新媒体团队，审核等待缩短 35%' },
      { stage: '复盘', replaceAction: 'loop 每周自动汇总表现写入知识库，替代手动做表', caseRef: '参考案例：教育内容团队，复盘会议时长减半' },
    ],
    cases: contentMarketingCases,
  },
  {
    key: 'ecommerce-ops',
    label: '电商运营',
    blurb: '选品、详情、投放、客服的转化链路',
    teamOptions: [
      { value: '店铺运营团队', label: '店铺运营团队' },
      { value: '投放增长团队', label: '投放增长团队' },
    ],
    defaultWorkflow: ['选品定价', '商品上架', '详情页制作', '投放优化', '客服承接', '售后退换', '数据复盘'],
    suggestedBottlenecks: ['详情页制作', '投放优化', '客服承接'],
    inputOptions: ['商品信息', '卖点清单', '竞品价格', '历史评价', '投放预算'],
    outputOptions: ['详情页文案', '投放素材', '评价回复', '选品建议', '复盘数据'],
    aiUsageOptions: ['详情页文案生成', '评价分析', '投放素材批量生成', '智能客服应答'],
    dataUploadTypes: [
      { type: '详情页与素材记录', format: 'CSV / Excel', fields: ['商品', '上新日期', '详情页耗时', '素材数量', '投放花费'] },
      { type: '评价与售后', format: 'CSV / Excel', fields: ['日期', '商品', '评价内容', '情感倾向', '处理时效'] },
      { type: '业务背景介绍', format: 'Word / PDF', fields: ['店铺定位', '协作分工', '关键问题', '当前工具栈'] },
    ],
    stageHints: [
      { stage: '详情页', replaceAction: 'skill 按品类模板批量生成详情页文案，替代人工逐个写', caseRef: '参考案例：美妆店铺，详情页制作从 2 天压到 4 小时' },
      { stage: '投放', replaceAction: 'agent 监控投放数据自动调优素材组合，替代人工盯盘', caseRef: '参考案例：美妆店铺，投放素材周产出翻倍' },
      { stage: '客服', replaceAction: 'agent 意图识别加知识检索自动应答，人工接复杂单，替代全部人工首响', caseRef: '参考案例：美妆店铺，差评响应时效提升 50%' },
      { stage: '评价', replaceAction: 'skill 批量归类评价情感与痛点，替代人工逐条翻', caseRef: '参考案例：美妆店铺，评价处理效率提升 3 倍' },
      { stage: '复盘', replaceAction: 'loop 自动汇总店铺指标，替代手动拉表', caseRef: '参考案例：美妆店铺，周报自动化' },
    ],
    cases: ecommerceCases,
  },
  {
    key: 'customer-service',
    label: '客户服务',
    blurb: '工单、知识、方案、回访的服务闭环',
    teamOptions: [
      { value: '在线客服团队', label: '在线客服团队' },
      { value: '技术支持团队', label: '技术支持团队' },
    ],
    defaultWorkflow: ['工单接入', '意图识别', '知识检索', '方案生成', '人工复核', '回访归档'],
    suggestedBottlenecks: ['意图识别', '知识检索', '方案生成'],
    inputOptions: ['用户问题', '知识库文档', '历史工单', '产品手册', '情绪信号'],
    outputOptions: ['应答话术', '工单分类', '解决方案', '会话摘要', '回访记录'],
    aiUsageOptions: ['智能问答', '工单分类', '会话摘要', '知识库维护'],
    dataUploadTypes: [
      { type: '工单记录', format: 'CSV / Excel', fields: ['工单号', '接入时间', '意图分类', '处理人', '解决时长', '是否升级'] },
      { type: '知识库文档', format: 'PDF / Word', fields: ['文档标题', '所属类目', '更新日期'] },
      { type: '业务背景介绍', format: 'Word / PDF', fields: ['服务流程', '升级规则', '团队分工', '当前瓶颈'] },
    ],
    stageHints: [
      { stage: '意图识别', replaceAction: 'agent 自动分类工单意图并路由，替代人工判断分流', caseRef: '参考案例：SaaS 客服，首响从 15 分钟降到 2 分钟' },
      { stage: '知识检索', replaceAction: 'agent 从分散文档检索答案，替代客服翻多个系统', caseRef: '参考案例：SaaS 客服，一次性解决率提升 28%' },
      { stage: '方案生成', replaceAction: 'skill 按场景模板生成应答草稿，人工复核，替代从零组织话术', caseRef: '参考案例：SaaS 客服，复杂工单处理提速' },
      { stage: '复核', replaceAction: 'workflow 把简单单自动处理，人工只复核风险单', caseRef: '参考案例：SaaS 客服，人工专注复杂工单占比升至 40%' },
      { stage: '归档', replaceAction: 'loop 自动归档会话摘要入知识库，替代手动记录', caseRef: '参考案例：SaaS 客服，知识库自动沉淀' },
    ],
    cases: customerServiceCases,
  },
  {
    key: 'r-and-d',
    label: '研发团队',
    blurb: '需求、设计、编码、测试、发布的工程链路',
    teamOptions: [
      { value: '产品研发团队', label: '产品研发团队' },
      { value: '测试质量团队', label: '测试质量团队' },
    ],
    defaultWorkflow: ['需求评审', '技术设计', '编码实现', '代码评审', '测试验证', '发布上线', '故障复盘'],
    suggestedBottlenecks: ['代码评审', '测试验证', '故障复盘'],
    inputOptions: ['需求文档', '技术方案', '历史代码', '测试用例', '故障记录'],
    outputOptions: ['代码实现', '单测用例', '评审意见', '技术文档', '复盘结论'],
    aiUsageOptions: ['代码补全', '单测生成', '代码评审辅助', '文档生成'],
    dataUploadTypes: [
      { type: '代码评审记录', format: 'CSV / Excel', fields: ['PR 号', '提交日期', '评审人', '评审时长', '变更行数', '是否通过'] },
      { type: '缺陷与复盘', format: 'CSV / Excel', fields: ['缺陷号', '发现日期', '根因', '影响范围', '修复时长'] },
      { type: '业务背景介绍', format: 'Word / PDF', fields: ['团队结构', '研发流程', '发布机制', '重点问题'] },
    ],
    stageHints: [
      { stage: '代码评审', replaceAction: 'evaluator 预检风格与风险，人工只审架构决策，替代逐行人工 review', caseRef: '参考案例：中型研发团队，PR 评审等待从 3 天降到 8 小时' },
      { stage: '测试', replaceAction: 'skill 自动生成单测与回归用例，替代手写用例', caseRef: '参考案例：中型研发团队，单测覆盖从 45% 升到 78%' },
      { stage: '编码', replaceAction: 'copilot 代码补全加生成模板代码，替代重复手写', caseRef: '参考案例：中型研发团队，编码效率提升 30%' },
      { stage: '故障', replaceAction: 'loop 自动归档故障根因入知识库，替代开会回忆', caseRef: '参考案例：中型研发团队，同类故障复现率下降 30%' },
      { stage: '设计', replaceAction: 'agent 检索历史方案加生成设计草稿，替代从零调研', caseRef: '参考案例：中型研发团队，技术设计周期缩短' },
    ],
    cases: rdCases,
  },
  {
    key: 'sales-sdr',
    label: '销售 / SDR',
    blurb: '线索、话术、触达、转化的销售漏斗',
    teamOptions: [
      { value: '电话销售团队', label: '电话销售团队' },
      { value: '客户成功团队', label: '客户成功团队' },
    ],
    defaultWorkflow: ['线索清洗', '话术准备', '触达跟进', '需求挖掘', '方案报价', '成交转化', '复盘归档'],
    suggestedBottlenecks: ['线索清洗', '话术准备', '复盘归档'],
    inputOptions: ['线索信息', '客户画像', '历史通话', '产品话术库', '跟进记录'],
    outputOptions: ['线索评分', '跟进话术', '通话摘要', '跟进邮件', '复盘结论'],
    aiUsageOptions: ['线索评分', '话术生成', '通话摘要', '跟进邮件生成'],
    dataUploadTypes: [
      { type: '线索与触达记录', format: 'CSV / Excel', fields: ['线索 ID', '来源', '触达时间', '跟进人', '是否成交', '成交周期'] },
      { type: '通话与话术', format: 'CSV / Word', fields: ['日期', '客户', '通话时长', '关键节点', '结果'] },
      { type: '业务背景介绍', format: 'Word / PDF', fields: ['销售流程', '角色分工', '成交难点', '现有打法'] },
    ],
    stageHints: [
      { stage: '线索', replaceAction: 'agent 按画像自动评分分级，替代人工逐条判断', caseRef: '参考案例：B2B 销售，无效触达下降 35%' },
      { stage: '话术', replaceAction: 'skill 按场景生成话术草稿，替代个人经验组织', caseRef: '参考案例：B2B 销售，新人首单周期缩短 40%' },
      { stage: '触达', replaceAction: 'copilot 生成跟进邮件与话术，替代每次手写', caseRef: '参考案例：B2B 销售，跟进效率提升' },
      { stage: '通话', replaceAction: 'skill 自动生成通话摘要与关键节点，替代手动记录', caseRef: '参考案例：B2B 销售，通话复盘自动沉淀' },
      { stage: '复盘', replaceAction: 'loop 每周归档通话结论入话术库，替代靠记忆', caseRef: '参考案例：B2B 销售，话术库自动更新' },
    ],
    cases: salesCases,
  },
];

export const allCases: IndustryCase[] = industryProfiles.flatMap((profile) => profile.cases);

export function getIndustryProfile(key: IndustryKey | ''): IndustryProfile | undefined {
  if (!key) {
    return undefined;
  }
  return industryProfiles.find((profile) => profile.key === key);
}
