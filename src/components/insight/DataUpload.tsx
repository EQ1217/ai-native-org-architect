import { useRef, useState } from 'react';
import { Icon } from '../icons';
import { getIndustryProfile } from '../../data/industryProfiles';
import type { DataUploadType, IndustryKey, UploadedDataSummary } from '../../types/diagnostic';

interface DataUploadProps {
  industry: IndustryKey | '';
  onUploaded: (summary: UploadedDataSummary) => void;
}

type UploadStatus = 'idle' | 'parsing' | 'done';

function buildDropzoneLabel(format: string): string {
  if (format.includes('Word') || format.includes('PDF')) {
    return `点击或拖拽导入 ${format} 业务文档`;
  }

  if (format.includes('Excel') || format.includes('CSV')) {
    return `点击或拖拽导入 ${format} 表格文件`;
  }

  return `点击或拖拽导入 ${format} 文件`;
}

function parseCSV(text: string): { headers: string[]; rows: Array<Record<string, string>> } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map((item) => item.trim());
  };

  const headers = parseLine(lines[0]);
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function buildSummary(
  fileName: string,
  dataType: string,
  headers: string[],
  rows: Array<Record<string, string>>,
): UploadedDataSummary {
  const sampleRows = rows.slice(0, 5);

  const numericColumns: Array<{ name: string; min?: number; max?: number; avg?: number }> = [];

  headers.forEach((header) => {
    const values = rows
      .map((row) => parseFloat(row[header] ?? ''))
      .filter((val) => !isNaN(val) && isFinite(val));

    if (values.length > 0 && values.length >= rows.length * 0.5) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      numericColumns.push({ name: header, min, max, avg: Math.round(avg * 100) / 100 });
    }
  });

  const textPreview =
    rows.length > 0
      ? Object.values(rows[0])
          .filter((val) => val && val.length > 2)
          .slice(0, 3)
          .join(' · ')
      : '';

  return {
    fileName,
    dataType,
    rowCount: rows.length,
    columnCount: headers.length,
    columns: headers,
    sampleRows,
    allRows: rows,
    numericColumns,
    textPreview,
  };
}

function buildMockDataSummary(): UploadedDataSummary {
  const headers = [
    '需求ID',
    '需求名称',
    '负责人',
    '优先级',
    '工时预估(人天)',
    '实际工时(人天)',
    '代码行数',
    'Bug数量',
    '状态',
  ];
  const rows: Array<Record<string, string>> = [
    { '需求ID': 'REQ-001', '需求名称': '用户登录模块重构', '负责人': '张三', '优先级': 'P0', '工时预估(人天)': '5', '实际工时(人天)': '7', '代码行数': '1200', 'Bug数量': '3', '状态': '已上线' },
    { '需求ID': 'REQ-002', '需求名称': '数据看板性能优化', '负责人': '李四', '优先级': 'P1', '工时预估(人天)': '8', '实际工时(人天)': '12', '代码行数': '3500', 'Bug数量': '8', '状态': '已上线' },
    { '需求ID': 'REQ-003', '需求名称': '支付流程升级', '负责人': '王五', '优先级': 'P0', '工时预估(人天)': '10', '实际工时(人天)': '15', '代码行数': '5000', 'Bug数量': '12', '状态': '测试中' },
    { '需求ID': 'REQ-004', '需求名称': '用户画像标签体系', '负责人': '赵六', '优先级': 'P2', '工时预估(人天)': '15', '实际工时(人天)': '22', '代码行数': '8000', 'Bug数量': '15', '状态': '开发中' },
    { '需求ID': 'REQ-005', '需求名称': '智能推荐算法V2', '负责人': '孙七', '优先级': 'P1', '工时预估(人天)': '20', '实际工时(人天)': '28', '代码行数': '12000', 'Bug数量': '20', '状态': '开发中' },
    { '需求ID': 'REQ-006', '需求名称': '消息推送系统', '负责人': '周八', '优先级': 'P2', '工时预估(人天)': '6', '实际工时(人天)': '8', '代码行数': '2100', 'Bug数量': '5', '状态': '已上线' },
    { '需求ID': 'REQ-007', '需求名称': '订单管理后台', '负责人': '吴九', '优先级': 'P1', '工时预估(人天)': '12', '实际工时(人天)': '18', '代码行数': '6500', 'Bug数量': '10', '状态': '测试中' },
    { '需求ID': 'REQ-008', '需求名称': '客服工单系统', '负责人': '郑十', '优先级': 'P3', '工时预估(人天)': '8', '实际工时(人天)': '10', '代码行数': '2800', 'Bug数量': '4', '状态': '已上线' },
    { '需求ID': 'REQ-009', '需求名称': '首页改版', '负责人': '张三', '优先级': 'P1', '工时预估(人天)': '25', '实际工时(人天)': '28', '代码行数': '9000', 'Bug数量': '18', '状态': '已上线' },
    { '需求ID': 'REQ-010', '需求名称': '搜索功能优化', '负责人': '李四', '优先级': 'P2', '工时预估(人天)': '7', '实际工时(人天)': '9', '代码行数': '2500', 'Bug数量': '7', '状态': '已上线' },
    { '需求ID': 'REQ-011', '需求名称': 'A/B测试平台', '负责人': '王五', '优先级': 'P1', '工时预估(人天)': '18', '实际工时(人天)': '22', '代码行数': '10000', 'Bug数量': '14', '状态': '测试中' },
  ];
  return buildSummary('研发需求数据(模拟).csv', '研发流程数据', headers, rows);
}

function parseTextFile(file: File, dataType: string): Promise<UploadedDataSummary> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.csv')) {
          const { headers, rows } = parseCSV(text);
          resolve(buildSummary(file.name, dataType, headers, rows));
        } else {
          resolve({
            fileName: file.name,
            dataType,
            rowCount: text.split(/\r?\n/).filter((l) => l.trim()).length,
            columnCount: 0,
            columns: [],
            sampleRows: [],
            allRows: [],
            numericColumns: [],
            textPreview: text.slice(0, 300),
          });
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function DataUpload({ industry, onUploaded }: DataUploadProps) {
  const profile = getIndustryProfile(industry);
  const uploadTypes = profile?.dataUploadTypes ?? [];

  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [fileName, setFileName] = useState('');
  const [selectedType, setSelectedType] = useState<DataUploadType | null>(null);

  const handleFile = async (file?: File) => {
    if (!file) {
      return;
    }
    setFileName(file.name);
    setStatus('parsing');

    try {
      const dataType = selectedType?.type ?? '业务数据';
      const summary = await parseTextFile(file, dataType);
      setStatus('done');
      setTimeout(() => {
        onUploaded(summary);
      }, 600);
    } catch {
      setStatus('idle');
    }
  };

  const triggerPick = () => {
    inputRef.current?.click();
  };

  const handleUseMockData = () => {
    const summary = buildMockDataSummary();
    setFileName(summary.fileName);
    setStatus('parsing');
    setTimeout(() => {
      setStatus('done');
      setTimeout(() => {
        onUploaded(summary);
      }, 500);
    }, 600);
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
          <p className="data-upload-hint">提取字段、统计关键指标、对齐环节与岗位</p>
          <div className="data-upload-progress" aria-hidden="true">
            <span />
          </div>
        </div>
      ) : null}

      {status === 'idle' ? (
        <div className="mock-data-section">
          <div className="mock-data-divider">
            <span>或者</span>
          </div>
          <button
            type="button"
            className="mock-data-button"
            onClick={handleUseMockData}
          >
            <Icon name="target" size={16} /> 使用模拟数据查看深度报告样例
          </button>
          <p className="mock-data-hint">内置产品研发团队示例数据，一键查看完整诊断效果</p>
        </div>
      ) : null}
    </div>
  );
}
