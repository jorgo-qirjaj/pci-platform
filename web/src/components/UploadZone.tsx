import { useRef, useState } from 'react';
import { Icon } from './ds';
import { getToken } from '../lib/api';

const SUPPORTED = ['.svs', '.ndpi', '.mrxs', '.scn', '.tiff', '.tif'];

/**
 * Drag-and-drop slide uploader. Posts to the platform API's authenticated
 * /api/slides/upload, which validates the JWT and forwards to the tile server
 * (→ S3). Uses XHR for real upload progress (no axios dep).
 */
export function UploadZone({ onUploaded }: { onUploaded?: (name: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<null | 'success' | 'error'>(null);
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!SUPPORTED.includes(ext)) {
      setStatus('error');
      setMessage(`Unsupported format: ${ext}. Allowed: ${SUPPORTED.join(', ')}`);
      setTimeout(() => setStatus(null), 4500);
      return;
    }
    upload(file);
  };

  const upload = (file: File) => {
    setUploading(true);
    setFileName(file.name);
    setProgress(0);
    setStatus(null);
    setMessage('');

    const form = new FormData();
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/slides/upload');
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded * 100) / e.total));
    };
    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setStatus('success');
        setMessage(`${file.name} uploaded`);
        onUploaded?.(file.name);
      } else {
        setStatus('error');
        try {
          // Tile-server rejections come back as { detail }; the API's own as { error }.
          const body = JSON.parse(xhr.responseText);
          setMessage(body.detail || body.error || `Upload failed (${xhr.status})`);
        } catch {
          setMessage(`Upload failed (${xhr.status})`);
        }
      }
      setTimeout(() => setStatus(null), 6000);
    };
    xhr.onerror = () => {
      setUploading(false);
      setStatus('error');
      setMessage('Upload failed — could not reach the server.');
      setTimeout(() => setStatus(null), 5000);
    };
    xhr.send(form);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => {
          if (!uploading) inputRef.current?.click();
        }}
        style={{
          border: `1px ${uploading ? 'solid' : 'dashed'} ${dragging ? 'var(--action)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '28px 16px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: dragging ? 'var(--blue-50)' : 'transparent',
          transition: 'background var(--dur-fast), border-color var(--dur-fast)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={SUPPORTED.join(',')}
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {uploading ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span className="pci-spinner" style={{ width: 14, height: 14 }} />
              <span style={{ fontSize: 12, flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fileName}
              </span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--action)' }}>{progress}%</span>
            </div>
            <div style={{ height: 4, background: 'var(--surface-sunken)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--action)', borderRadius: 999, transition: 'width var(--dur-fast)' }} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Icon name="upload" size={24} style={{ color: 'var(--action)' }} />
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Drag &amp; drop a slide here</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>or click to browse · SVS, NDPI, TIFF…</div>
          </div>
        )}
      </div>

      {status && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: status === 'success' ? 'var(--teal-100)' : 'var(--red-100)',
            color: status === 'success' ? 'var(--teal-700)' : 'var(--red-700)',
          }}
        >
          <Icon name={status === 'success' ? 'shield-check' : 'circle-alert'} size={14} />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
