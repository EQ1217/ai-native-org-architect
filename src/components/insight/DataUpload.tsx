import { useRef, useState } from 'react';
import { getIndustryProfile } from '../../data/industryProfiles';
import type { DataUploadType, IndustryKey } from '../../types/diagnostic';

interface DataUploadProps {
  industry: IndustryKey | '';
  onUploaded: () => void;
}

type UploadStatus = 'idle' | 'parsing';

function buildDropzoneLabel(format: string): string {
  if (format.includes('Word') || format.includes('PDF')) {
    return `点击或拖拽导入 ${format} 业务文档`;
  }

  if (format.includes('Excel') || format.includes('CSV')) {
    return `点击或拖拽导入 ${format} 表格文件`;
  }

  return `点击或拖拽导入 ${format} 文件`;
}

export function DataUpload({ industry, onUploaded }: DataUploadProps) {
  const profile = getIndustryProfile(industry);
  const uploadTypes = profile?.dataUploadTypes ?? [];

  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [fileName, setFileName] = useState('');
  const [selectedType, setSelectedType] = useState<DataUploadType | null>(null);

  const handleFile = (file?: File) => {
    if (!file) {
      return;
    }
    setFileName(file.name);
    setStatus('parsing');
    setTimeout(() => {
      onUploaded();
    }, 2000);
  };

  const triggerPick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={`data-upload data-upload-${status}`}>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.pdf,.doc,.docx,.txt,.md"
        onChange={(event) => handleFile(event.target.files?.[0])}
        hidden
      />

      <p className="data-upload-label">选择要导入的数据类型</p>
      <p className="data-upload-caption">支持 Excel 表格、CSV，以及业务介绍文档（Word / PDF）。</p>
      <div className="data-upload-types">
        {uploadTypes.map((option) => (
          <button
            type="button"
            key={option.type}
            className={`data-type-chip${selectedType?.type === option.type ? ' data-type-chip-selected' : ''}`}
            onClick={() => setSelectedType(option)}
          >
            {option.type}
          </button>
        ))}
      </div>

      {selectedType ? (
        <div className="data-upload-format">
          <p className="data-upload-format-label">
            格式要求 · {selectedType.format}
          </p>
          <p className="data-upload-fields">
            需要字段：{selectedType.fields.join('、')}
          </p>
        </div>
      ) : null}

      {selectedType && status === 'idle' ? (
        <div
          className="data-upload-zone"
          role="button"
          tabIndex={0}
          onClick={triggerPick}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              triggerPick();
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            handleFile(event.dataTransfer.files?.[0]);
          }}
          onDragOver={(event) => event.preventDefault()}
        >
          <p className="data-upload-title">{buildDropzoneLabel(selectedType.format)}</p>
          <p className="data-upload-hint">单个文件即可；表格字段顺序不限，文档可直接写业务背景与流程说明</p>
        </div>
      ) : null}

      {status === 'parsing' ? (
        <div className="data-upload-zone data-upload-zone-parsing" aria-live="polite">
          <p className="data-upload-title">正在解析「{fileName}」…</p>
          <p className="data-upload-hint">提取字段、对齐环节与岗位</p>
          <div className="data-upload-progress" aria-hidden="true">
            <span />
          </div>
        </div>
      ) : null}
    </div>
  );
}
