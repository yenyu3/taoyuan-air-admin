import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { CloudUpload, FileText, Package } from 'lucide-react';
import Card from '../../components/Card';
import Header from '../../components/Layout/Header';
import StatusBadge from '../../components/StatusBadge';

type DataCategory = 'lidar' | 'uav';
type LidarSubType = 'point_cloud' | 'wind_field' | 'boundary_layer';
type UAVSubType = 'sensor' | 'flight_path' | 'imagery' | 'meteorological';

const lidarConfig: Record<LidarSubType, { label: string; formats: string; maxSize: string }> = {
  point_cloud:    { label: '點雲資料',  formats: '.las, .laz, .ply, .pcd, .xyz', maxSize: '500 MB' },
  wind_field:     { label: '風場資料',  formats: '.nc, .hdf5, .csv, .json',       maxSize: '100 MB' },
  boundary_layer: { label: '大氣邊界層', formats: '.nc, .csv, .json',              maxSize: '50 MB' },
};

const uavConfig: Record<UAVSubType, { label: string; formats: string; maxSize: string }> = {
  sensor:         { label: '感測器資料', formats: '.csv, .json, .xml, .txt',       maxSize: '100 MB' },
  flight_path:    { label: '飛行軌跡',  formats: '.kml, .gpx, .csv, .json',       maxSize: '10 MB' },
  imagery:        { label: '影像資料',  formats: '.jpg, .png, .tiff, .raw',        maxSize: '200 MB' },
  meteorological: { label: '氣象資料',  formats: '.csv, .json, .nc',              maxSize: '50 MB' },
};

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'failed' | 'processing';
}

const mockHistory = [
  { id: 1, name: 'lidar_20250115_001.las',  type: '點雲資料',  size: '245 MB', status: 'completed' as const,  time: '2025-01-15 10:32', user: 'admin' },
  { id: 2, name: 'uav_flight_20250115.csv', type: 'UAV 感測器', size: '12 MB',  status: 'processing' as const, time: '2025-01-15 10:15', user: 'partner01' },
  { id: 3, name: 'wind_field_20250115.nc',  type: '風場資料',  size: '88 MB',  status: 'completed' as const,  time: '2025-01-15 09:50', user: 'admin' },
  { id: 4, name: 'boundary_layer.json',     type: '大氣邊界層', size: '5 MB',   status: 'failed' as const,     time: '2025-01-15 09:20', user: 'data_mgr' },
];

export default function Upload() {
  const [category, setCategory] = useState<DataCategory>('lidar');
  const [lidarType, setLidarType] = useState<LidarSubType>('point_cloud');
  const [uavType, setUavType] = useState<UAVSubType>('sensor');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentConfig = category === 'lidar' ? lidarConfig[lidarType] : uavConfig[uavType];

  const simulateUpload = (files: File[]) => {
    const newFiles: UploadFile[] = files.map(f => ({
      id: `${Date.now()}-${f.name}`,
      file: f,
      progress: 0,
      status: 'uploading',
    }));
    setUploadFiles(prev => [...prev, ...newFiles]);

    newFiles.forEach(uf => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          clearInterval(interval);
          setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, progress: 100, status: 'completed' } : f));
        } else {
          setUploadFiles(prev => prev.map(f => f.id === uf.id ? { ...f, progress: Math.round(progress) } : f));
        }
      }, 300);
    });
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) simulateUpload(files);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) simulateUpload(files);
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div>
      <Header title="資料上傳" subtitle="光達與無人機資料上傳管理" />

      {/* Category & Sub-type */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {(['lidar', 'uav'] as DataCategory[]).map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: '10px 24px',
              borderRadius: 12,
              border: '2px solid #6abe74',
              backgroundColor: category === c ? '#6abe74' : 'transparent',
              color: category === c ? '#fff' : '#6abe74',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              {c === 'lidar' ? '光達資料 (LiDAR)' : '無人機資料 (UAV)'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {category === 'lidar'
            ? (Object.entries(lidarConfig) as [LidarSubType, typeof lidarConfig[LidarSubType]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => setLidarType(key)} style={{
                padding: '6px 16px', borderRadius: 8,
                border: '1px solid rgba(106,190,116,0.4)',
                backgroundColor: lidarType === key ? 'rgba(106,190,116,0.15)' : 'transparent',
                color: lidarType === key ? '#6abe74' : '#666',
                fontWeight: lidarType === key ? 600 : 400,
                fontSize: 13, cursor: 'pointer',
              }}>{cfg.label}</button>
            ))
            : (Object.entries(uavConfig) as [UAVSubType, typeof uavConfig[UAVSubType]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => setUavType(key)} style={{
                padding: '6px 16px', borderRadius: 8,
                border: '1px solid rgba(106,190,116,0.4)',
                backgroundColor: uavType === key ? 'rgba(106,190,116,0.15)' : 'transparent',
                color: uavType === key ? '#6abe74' : '#666',
                fontWeight: uavType === key ? 600 : 400,
                fontSize: 13, cursor: 'pointer',
              }}>{cfg.label}</button>
            ))
          }
        </div>

        <div style={{
          marginTop: 12, padding: '10px 14px',
          backgroundColor: 'rgba(106,190,116,0.06)',
          borderRadius: 10, fontSize: 12, color: '#666',
          display: 'flex', gap: 24, alignItems: 'center',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={13} color="#6abe74" />
            支援格式：<strong style={{ color: '#374151' }}>{currentConfig.formats}</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={13} color="#6abe74" />
            最大檔案：<strong style={{ color: '#374151' }}>{currentConfig.maxSize}</strong>
          </span>
        </div>
      </Card>

      {/* Drop Zone */}
      <Card style={{ marginBottom: 20 }}>
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? '#6abe74' : 'rgba(106,190,116,0.4)'}`,
            borderRadius: 16, padding: '48px 24px', textAlign: 'center',
            backgroundColor: isDragging ? 'rgba(106,190,116,0.08)' : 'rgba(106,190,116,0.03)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <CloudUpload size={40} color={isDragging ? '#6abe74' : 'rgba(106,190,116,0.5)'} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            拖拽檔案至此處上傳
          </div>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>
            或點擊選擇檔案，支援批次上傳
          </div>
          <button style={{
            padding: '8px 20px', backgroundColor: '#6abe74',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>選擇檔案</button>
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        {uploadFiles.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>上傳進度</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {uploadFiles.map(uf => (
                <div key={uf.id} style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(106,190,116,0.04)',
                  borderRadius: 12, border: '1px solid rgba(106,190,116,0.1)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{uf.file.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#999' }}>{formatSize(uf.file.size)}</span>
                      <StatusBadge status={uf.status} />
                    </div>
                  </div>
                  <div style={{ height: 6, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${uf.progress}%`,
                      backgroundColor: uf.status === 'failed' ? 'rgba(0,0,0,0.2)' : '#6abe74',
                      borderRadius: 3, transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{uf.progress}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* History */}
      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 16 }}>上傳歷史記錄</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              {['檔案名稱', '資料類型', '檔案大小', '上傳者', '上傳時間', '狀態'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: '#999', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockHistory.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <td style={{ padding: '12px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{r.name}</td>
                <td style={{ padding: '12px', fontSize: 13, color: '#666' }}>{r.type}</td>
                <td style={{ padding: '12px', fontSize: 13, color: '#666' }}>{r.size}</td>
                <td style={{ padding: '12px', fontSize: 13, color: '#666' }}>{r.user}</td>
                <td style={{ padding: '12px', fontSize: 13, color: '#666' }}>{r.time}</td>
                <td style={{ padding: '12px' }}><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
