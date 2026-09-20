import React, { useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';

const TENDER_DOC_OPTIONS = [
  { value: 'oem_auth', label: 'OEM Authorization (MAF)' },
  { value: 'startup_nsic', label: 'Startup India / NSIC Recognition' },
  { value: 'digilocker', label: 'DigiLocker Certificate' },
  { value: 'udyam', label: 'Udyam / MSME Certificate (Supplementary)' },
  { value: 'gst', label: 'GST Registration (Supplementary)' },
  { value: 'pan_it', label: 'PAN / IT Return (Supplementary)' },
  { value: 'mii', label: 'Make in India Local Content Declaration' },
  { value: 'epfo_esic', label: 'EPFO / ESIC Challan' },
];

export default function UploadModal({
  isOpen,
  onClose,
  bidderId,
  initialCategory = 'oem_auth',
  onUploadSuccess,
}) {
  const [category, setCategory] = useState(initialCategory);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !bidderId) return;
    setUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', category);

      const res = await fetch(`/api/bidders/${bidderId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Document upload failed.');
      }

      setFile(null);
      onClose();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#CBD5E1] rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2 text-[#000080]">
            <Upload className="w-4 h-4" />
            <h3 className="font-headline font-bold text-sm text-[#0F172A]">
              Upload Tender Document
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] p-1 rounded transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-[#FDE8E8] border border-[#FCA5A5] text-[#D32F2F] text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-[#334155] mb-1">
              Document Classification
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#FF9933]"
            >
              {TENDER_DOC_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#334155] mb-1">
              Select Document (Text-Based PDF)
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2 text-xs text-[#475569] file:mr-2.5 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#000080] file:text-white hover:file:bg-[#000066] cursor-pointer"
            />
            <p className="text-[11px] text-[#64748B] mt-1">
              Must contain a selectable digital text layer per tender requirements.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 py-2 rounded-lg font-bold btn-saffron disabled:opacity-50 transition cursor-pointer shadow-xs"
            >
              {uploading ? 'Processing Document...' : 'Upload & Cross-Check'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
