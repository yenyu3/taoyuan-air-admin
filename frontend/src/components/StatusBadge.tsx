type Status = 'success' | 'error' | 'pending' | 'warning' | 'active' | 'inactive' | 'uploading' | 'completed' | 'failed' | 'processing' | 'valid' | 'invalid';

const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  success:    { label: '正常',   color: '#6abe74', bg: 'rgba(106,190,116,0.12)' },
  completed:  { label: '完成',   color: '#6abe74', bg: 'rgba(106,190,116,0.12)' },
  valid:      { label: '有效',   color: '#6abe74', bg: 'rgba(106,190,116,0.12)' },
  active:     { label: '啟用',   color: '#6abe74', bg: 'rgba(106,190,116,0.12)' },
  error:      { label: '錯誤',   color: '#888',    bg: 'rgba(0,0,0,0.06)' },
  failed:     { label: '失敗',   color: '#888',    bg: 'rgba(0,0,0,0.06)' },
  invalid:    { label: '無效',   color: '#888',    bg: 'rgba(0,0,0,0.06)' },
  inactive:   { label: '停用',   color: '#888',    bg: 'rgba(0,0,0,0.06)' },
  pending:    { label: '待處理', color: '#999',    bg: 'rgba(0,0,0,0.05)' },
  warning:    { label: '警告',   color: '#999',    bg: 'rgba(0,0,0,0.05)' },
  uploading:  { label: '上傳中', color: '#6abe74', bg: 'rgba(106,190,116,0.08)' },
  processing: { label: '處理中', color: '#374151', bg: 'rgba(55,65,81,0.08)' },
};

interface StatusBadgeProps {
  status: Status;
  customLabel?: string;
}

export default function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const cfg = statusConfig[status] ?? { label: status, color: '#666', bg: 'rgba(0,0,0,0.06)' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      color: cfg.color,
      backgroundColor: cfg.bg,
      whiteSpace: 'nowrap',
    }}>
      {customLabel ?? cfg.label}
    </span>
  );
}
