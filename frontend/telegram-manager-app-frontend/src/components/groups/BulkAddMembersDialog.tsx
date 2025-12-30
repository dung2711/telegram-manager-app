// src/components/groups/BulkAddMembersDialog.tsx
'use client';

import { useState } from 'react';
import { ParsedMember, BulkAddMembersResult, ChatType } from '@/types';
import { parseFile, getMemberStats, exportFailedMembers } from '@/utils/memberFileParser';
import { parseManualInput, removeDuplicates } from '@/utils/manualInputParser';
import { normalizePhone } from '@/utils/phoneNormalizer';
import { useBulkAddMembers } from '@/hooks/useBulkAddMembers';
import { useContacts } from '@/hooks/useContacts';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Search, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BulkAddMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string | number;
  chatName: string;
  chatType: ChatType;
  accountID: string;
  onSuccess?: () => void;
}

export function BulkAddMembersDialog({
  isOpen,
  onClose,
  chatId,
  chatName,
  chatType,
  accountID,
  onSuccess,
}: BulkAddMembersDialogProps) {
  const [step, setStep] = useState<'input' | 'preview' | 'processing' | 'result'>('input');
  const [activeTab, setActiveTab] = useState<'manual' | 'search' | 'import'>('manual');
  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoCleanup, setAutoCleanup] = useState(true);
  const [result, setResult] = useState<BulkAddMembersResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const { isProcessing, progress, processBulkAdd } = useBulkAddMembers(accountID);
  const { contacts, isLoading: loadingContacts } = useContacts(accountID);

  if (!isOpen) return null;

  // Validation: Secret chat không cho add members
  if (chatType === 'chatTypeSecret') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-md p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Secret Chats Are 1-on-1
            </h3>
            <p className="text-gray-600 mb-6">
              Secret chats only support one-to-one conversations. You cannot add more members.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle manual input
  const handleManualInput = () => {
    if (!manualInput.trim()) {
      toast.error('Please enter phone numbers');
      return;
    }

    const members = parseManualInput(manualInput);
    const unique = removeDuplicates(members);
    
    if (unique.length !== members.length) {
      toast(`Removed ${members.length - unique.length} duplicate(s)`);
    }

    // Validation for basic group
    if (chatType === 'chatTypeBasicGroup' && unique.filter(m => m.isValid).length > 200) {
      toast.error('Basic groups support maximum 200 members');
      return;
    }
    
    setParsedMembers(unique);
    setStep('preview');
    setCurrentPage(1);
    toast.success(`Parsed ${unique.length} phone numbers`);
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const members = await parseFile(file);
      const unique = removeDuplicates(members);

      if (chatType === 'chatTypeBasicGroup' && unique.filter(m => m.isValid).length > 200) {
        toast.error('Basic groups support maximum 200 members');
        return;
      }

      setParsedMembers(unique);
      setStep('preview');
      setCurrentPage(1);
      toast.success(`Parsed ${unique.length} entries`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse file');
    }
  };

  // Handle search contacts
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.first_name?.toLowerCase().includes(searchLower) ||
      contact.last_name?.toLowerCase().includes(searchLower) ||
      contact.username?.toLowerCase().includes(searchLower) ||
      contact.phone_number?.includes(searchQuery)
    );
  });

  const handleToggleContact = (userId: number) => {
    setSelectedContacts(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectFromContacts = () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact');
      return;
    }

    if (chatType === 'chatTypeBasicGroup' && selectedContacts.length > 200) {
      toast.error('Basic groups support maximum 200 members');
      return;
    }

    const members: ParsedMember[] = selectedContacts
      .map(userId => {
        const contact = contacts.find(c => c.id === userId);
        if (!contact || !contact.phone_number) return null;

        return {
          phoneNumber: normalizePhone(contact.phone_number),
          rawPhone: contact.phone_number,
          name: `${contact.first_name} ${contact.last_name || ''}`.trim(),
          lineNumber: 0,
          isValid: true,
        } as ParsedMember;
      })
      .filter((m): m is ParsedMember => m !== null);

    setParsedMembers(members);
    setStep('preview');
    toast.success(`Selected ${members.length} contacts`);
  };

  const handleConfirmAdd = async () => {
    setStep('processing');
    
    try {
      const addResult = await processBulkAdd(chatId, chatType, parsedMembers, { autoCleanup });
      setResult(addResult);
      setStep('result');
      
      if (addResult.successful > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error('Failed to add members');
      setStep('preview');
    }
  };

  const handleClose = () => {
    setParsedMembers([]);
    setSelectedContacts([]);
    setManualInput('');
    setSearchQuery('');
    setResult(null);
    setStep('input');
    setActiveTab('manual');
    setCurrentPage(1);
    onClose();
  };

  const stats = getMemberStats(parsedMembers);
  const paginatedMembers = parsedMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(parsedMembers.length / itemsPerPage);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Add Members to "{chatName}"</h2>
            {chatType === 'chatTypeBasicGroup' && (
              <p className="text-sm text-gray-600 mt-1">Basic Group • Max 200 members</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isProcessing}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Step 1: Input */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'manual'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Manual Input
                </button>
                <button
                  onClick={() => setActiveTab('search')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'search'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Search Contacts
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'import'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Import File
                </button>
              </div>

              {/* Tab Content: Manual */}
              {activeTab === 'manual' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Phone Numbers
                    </label>
                    <textarea
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="+84912345678&#10;0987654321&#10;84123456789&#10;&#10;Or comma-separated: +84912345678, 0987654321"
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Enter one phone number per line, or comma-separated. Format: +84... or 0...
                    </p>
                  </div>
                  <button
                    onClick={handleManualInput}
                    disabled={!manualInput.trim()}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Parse Phone Numbers
                  </button>
                </div>
              )}

              {/* Tab Content: Search */}
              {activeTab === 'search' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, username, or phone..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {loadingContacts ? (
                    <div className="text-center py-8 text-gray-600">Loading contacts...</div>
                  ) : (
                    <div className="border rounded-lg max-h-96 overflow-y-auto">
                      {filteredContacts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No contacts found
                        </div>
                      ) : (
                        <div className="divide-y">
                          {filteredContacts.map(contact => (
                            <label
                              key={contact.id}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedContacts.includes(contact.id)}
                                onChange={() => handleToggleContact(contact.id)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {contact.first_name} {contact.last_name}
                                </div>
                                <div className="text-sm text-gray-600 truncate">
                                  {contact.username && `@${contact.username} • `}
                                  {contact.phone_number}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Selected: {selectedContacts.length} contacts
                    </span>
                    <button
                      onClick={handleSelectFromContacts}
                      disabled={selectedContacts.length === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Continue with Selected
                    </button>
                  </div>
                </div>
              )}

              {/* Tab Content: Import */}
              {activeTab === 'import' && (
                <div className="space-y-4">
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.files = e.dataTransfer.files;
                        handleFileUpload({ target: input } as any);
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  >
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
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
                      <li>Phone: 10-15 digits, auto-normalized to +84</li>
                    </ul>
                  </div>
                </div>
              )}
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

              {/* Warning for Basic Group */}
              {chatType === 'chatTypeBasicGroup' && stats.valid > 10 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Note:</strong> This is a Basic Group. Members will be added one by one 
                      with a 1s-2s delay between each. This may take a few minutes for {stats.valid} members.
                    </div>
                  </div>
                </div>
              )}

              {/* Auto-cleanup Option */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCleanup}
                    onChange={(e) => setAutoCleanup(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-yellow-900">
                      Auto-remove imported contacts
                    </div>
                    <div className="text-sm text-yellow-700 mt-1">
                      Contacts that are imported during this operation will be automatically 
                      removed from your contact list after being added to the group. 
                      This keeps your contacts clean.
                    </div>
                  </div>
                </label>
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Line</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedMembers.map((member, idx) => (
                      <tr key={idx} className={member.isValid ? '' : 'bg-red-50'}>
                        <td className="px-4 py-3 text-sm text-gray-600">{member.lineNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{member.name || '-'}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">
                          {member.phoneNumber}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {member.isValid ? (
                            <span className="inline-flex items-center text-green-700">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-700">
                              <XCircle className="w-4 h-4 mr-1" />
                              {member.validationError}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}

              {stats.invalid > 0 && (
                <button
                  onClick={() => exportFailedMembers(parsedMembers)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Export Invalid Entries
                </button>
              )}
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && progress && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
                <p className="text-lg font-medium text-gray-900">{progress.message}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {progress.current} / {progress.total}
                </p>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold">{result.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-900">{result.successful}</div>
                  <div className="text-sm text-green-600">Success</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-900">{result.alreadyMembers}</div>
                  <div className="text-sm text-yellow-600">Already Member</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-900">{result.failed}</div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
              </div>

              {/* Cleanup Info */}
              {result.cleanedUp && result.cleanedUp > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    🗑️ Automatically removed {result.cleanedUp} imported contact(s) from your contact list.
                  </p>
                </div>
              )}

              {/* Failed list */}
              {result.failed > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium text-gray-900">Failed Members</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs">Name</th>
                          <th className="px-4 py-2 text-left text-xs">Phone</th>
                          <th className="px-4 py-2 text-left text-xs">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.results
                          .filter(r => r.status === 'failed' || r.status === 'not_found')
                          .map((r, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-sm">{r.name || '-'}</td>
                              <td className="px-4 py-2 text-sm font-mono">{r.phoneNumber}</td>
                              <td className="px-4 py-2 text-sm text-red-600">{r.error}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('input')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Back
              </button>
              <button
                onClick={handleConfirmAdd}
                disabled={stats.valid === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Add {stats.valid} Members
              </button>
            </>
          )}

          {step === 'result' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}