import { SectionHeader } from '../layout/SectionHeader';

interface ConsultingCTAProps {
  onUploadMoreData: () => void;
  onBookExpertDiagnosis?: () => void;
  uploadStatus?: string;
  diagnosisStatus?: string;
}

export function ConsultingCTA({
  onUploadMoreData,
  onBookExpertDiagnosis,
  uploadStatus,
  diagnosisStatus,
}: ConsultingCTAProps) {
  return (
    <section className="dashboard-section consulting-cta-card">
      <SectionHeader
        title="下一步行动"
        description="诊断已缩小问题范围，下一步补充组织上下文或进入专家咨询。"
        eyebrow="Next Step"
      />

      <div className="consulting-cta-layout">
        <article className="consulting-cta-copy">
          <h3>从诊断走向真实组织改造</h3>
          <p>
            诊断已指出优先节点和 90 天推进顺序。补充岗位分工、协作方式和业务样本后，
            建议可从标准路径升级为组织定制版。
          </p>
          <ul>
            <li>补充岗位职责、工具栈和审批链路，生成更细的协作重排建议。</li>
            <li>带真实样本进专家诊断，判断 Human Gate 和风险边界。</li>
          </ul>
        </article>

        <div className="consulting-cta-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onUploadMoreData}
          >
            补充更多组织数据
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={onBookExpertDiagnosis}
          >
            预约专家诊断
          </button>
          {uploadStatus ? <p className="consulting-cta-status">{uploadStatus}</p> : null}
          {diagnosisStatus ? <p className="consulting-cta-status">{diagnosisStatus}</p> : null}
          <p className="consulting-cta-note">
            推荐顺序：先补充组织上下文，再进一次 90 分钟专家诊断，确认试点范围和负责人。
          </p>
        </div>
      </div>
    </section>
  );
}
