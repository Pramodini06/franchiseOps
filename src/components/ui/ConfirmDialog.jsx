import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ open, title = 'Are you sure?', message, confirmText = 'Delete', onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} size="sm" title={title}
      footer={<><button className="btn-ghost" onClick={onCancel}>Cancel</button><button className="btn-danger" onClick={onConfirm}>{confirmText}</button></>}>
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"><AlertTriangle size={20} /></div>
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </Modal>
  );
}
