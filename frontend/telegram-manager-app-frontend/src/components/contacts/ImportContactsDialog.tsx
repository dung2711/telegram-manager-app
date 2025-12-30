// src/components/contacts/ImportContactsDialog.tsx
'use client';

import { useState } from 'react';
import { ContactToImport } from '@/types';
import { Upload, X, CheckCircle, XCircle } from 'lucide-react';
import { parseFile, getMemberStats, exportFailedMembers } from '@/utils/memberFileParser';
import { ParsedMember } from '@/types';
import { useSettings } from '@/context/SettingsContext';
import { toast } from '@/utils/toastHelper';


interface ImportContactsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contacts: ContactToImport[]) => Promise<any>;
}

export function ImportContactsDialog({
  isOpen,
  onClose,
  onImport,
}: ImportContactsDialogProps) {
  const { settings } = useSettings();
  const [step, setStep] = useState<'upload' | 'preview' | 'processing'>('upload');
  const [parsedContacts, setParsedContacts] = useState<ParsedMember[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const countryCode = settings.defaultCountryCode.replace('+', '');
      const members = await parseFile(file, countryCode, settings.phoneValidationStrict);
      setParsedContacts(members);
      setStep('preview');
      toast.success(`Parsed ${members.length} contacts`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse file');
    }
  };

  const handleConfirmImport = async () => {
    const validContacts = parsedContacts
      .filter(c => c.isValid)
      .map(c => ({
        phone_number: c.phoneNumber,
        first_name: c.name || c.phoneNumber,
        last_name: '',
      }));

    if (validContacts.length === 0) {
      toast.error('No valid contacts to import');
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      const result = await onImport(validContacts);
      
      const actualImported = result?.imported ?? 0;
      const requested = validContacts.length;

      if (actualImported === requested) {
        toast.success(`Successfully imported all ${actualImported} contacts!`);
      } else if (actualImported > 0) {
        toast.warning(`Partial success: Imported ${actualImported} / ${requested} contacts. (Others are not on Telegram)`);
      } else {
        toast.error(`No Telegram accounts found for these ${requested} numbers.`);
      }

      handleClose();
    } catch (error: any) {
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setParsedContacts([]);
    setStep('upload');
    onClose();
  };

  const stats = getMemberStats(parsedContacts);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Import Contacts</h2>
          <button onClick={handleClose} disabled={isProcessing} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="contact-file-upload"
                />
                <label htmlFor="contact-file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-700">
                    Drop CSV or TXT file here
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    or click to browse
                  </p>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">File Format:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li><strong>CSV:</strong> Name,PhoneNumber</li>
                  <li><strong>TXT:</strong> One phone number per line</li>
                  <li>Phone: 10-15 digits, auto-normalized to {settings.defaultCountryCode}</li>
                  <li>Default country code: {settings.defaultCountryCode}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-900">{stats.valid}</div>
                  <div className="text-sm text-green-600">Valid</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-900">{stats.invalid}</div>
                  <div className="text-sm text-red-600">Invalid</div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedContacts.slice(0, 50).map((contact, idx) => (
                      <tr key={idx} className={contact.isValid ? '' : 'bg-red-50'}>
                        <td className="px-4 py-3 text-sm text-gray-900">{contact.name || '-'}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">
                          {contact.phoneNumber}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {contact.isValid ? (
                            <span className="inline-flex items-center text-green-700">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-700">
                              <XCircle className="w-4 h-4 mr-1" />
                              {contact.validationError}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {stats.invalid > 0 && (
                <button
                  onClick={() => exportFailedMembers(parsedContacts)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Export Invalid Entries
                </button>
              )}
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
              <p className="text-lg font-medium text-gray-900">Importing contacts...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Back
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={stats.valid === 0 || isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Import {stats.valid} Contacts
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}