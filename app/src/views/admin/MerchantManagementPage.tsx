import React, { useEffect, useState } from 'react';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { ConfirmModal, Modal } from '../../components/ui/Modal';
import type { Merchant } from '../../types';
import * as api from '../../api';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  active: { cls: 'bg-green-100 text-green-800 border-green-200', label: 'Active' },
  suspended: { cls: 'bg-red-100 text-red-800 border-red-200', label: 'Suspended' },
};

const APPROVAL_CONFIG = {
  approved: { cls: 'bg-green-100 text-green-800 border-green-200', label: 'Approved' },
  pending: { cls: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending Approval' },
  rejected: { cls: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' },
};

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

export default function MerchantManagementPage() {
  const { addToast } = useToastStore();
  const { impersonate } = useAuthStore();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [suspendTarget, setSuspendTarget] = useState<Merchant | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [actioningMerchant, setActioningMerchant] = useState<string | null>(null);

  // Creation form state
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [planTier, setPlanTier] = useState('Starter');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  // Edit form state
  const [editTarget, setEditTarget] = useState<Merchant | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editBusinessName, setEditBusinessName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPlanTier, setEditPlanTier] = useState('Starter');
  const [editWhatsappNumber, setEditWhatsappNumber] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editReferralBonusPoints, setEditReferralBonusPoints] = useState<number | string>(50);
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');
  const [editApprovalStatus, setEditApprovalStatus] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editOwnerPhone, setEditOwnerPhone] = useState('');
  const [editOwnerEmail, setEditOwnerEmail] = useState('');

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Merchant | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const data = await api.getAllMerchants();
      setMerchants(data);
    } catch {
      addToast('error', 'Failed to load merchants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !category.trim() || !ownerName.trim() || !ownerPhone.trim()) {
      addToast('error', 'Please fill in all required fields');
      return;
    }
    setCreateLoading(true);
    try {
      const newMerchant = await api.createMerchant({
        business_name: businessName.trim(),
        category: category.trim(),
        plan_tier: planTier,
        whatsapp_number: whatsappNumber.trim(),
        address: address.trim() || undefined,
        owner_name: ownerName.trim(),
        owner_phone: ownerPhone.trim().replace(/\s+/g, ''),
        owner_email: ownerEmail.trim() || undefined,
      });
      setMerchants(prev => [newMerchant, ...prev]);
      addToast('success', 'Merchant created successfully!');
      setCreateOpen(false);
      // Reset form
      setBusinessName('');
      setCategory('');
      setPlanTier('Starter');
      setWhatsappNumber('');
      setAddress('');
      setOwnerName('');
      setOwnerPhone('');
      setOwnerEmail('');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create merchant');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = async (m: Merchant) => {
    setEditTarget(m);
    setEditBusinessName(m.business_name || '');
    setEditCategory(m.category || '');
    setEditPlanTier(m.plan_tier || 'Starter');
    setEditWhatsappNumber(m.whatsapp_number || '');
    setEditAddress(m.address || '');
    setEditReferralBonusPoints(m.referral_bonus_points ?? 50);
    setEditStatus(m.status || 'active');
    setEditApprovalStatus(m.approval_status || 'approved');
    setEditOwnerName(m.owner_name || '');
    setEditOwnerPhone(m.owner_phone || '');
    setEditOwnerEmail(m.owner_email || '');

    // Fetch users if owner name not available on merchant record
    if (!m.owner_name && !m.owner_phone) {
      try {
        const users = await api.getMerchantUsers(m.id);
        const owner = users.find(u => u.role === 'owner') || users[0];
        if (owner) {
          setEditOwnerName(owner.name || '');
          setEditOwnerPhone(owner.phone || '');
          setEditOwnerEmail(owner.email || '');
        }
      } catch {
        // non-blocking
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!editBusinessName.trim() || !editCategory.trim() || !editWhatsappNumber.trim()) {
      addToast('error', 'Please fill in all required fields');
      return;
    }
    setEditLoading(true);
    try {
      const payload = {
        business_name: editBusinessName.trim(),
        category: editCategory.trim(),
        plan_tier: editPlanTier,
        whatsapp_number: editWhatsappNumber.trim(),
        address: editAddress.trim() || undefined,
        referral_bonus_points: Number(editReferralBonusPoints) || 0,
        status: editStatus,
        approval_status: editApprovalStatus,
        owner_name: editOwnerName.trim() || undefined,
        owner_phone: editOwnerPhone.trim().replace(/\s+/g, '') || undefined,
        owner_email: editOwnerEmail.trim() || undefined,
      };
      const updated = await api.updateMerchant(editTarget.id, payload);
      setMerchants(prev => prev.map(m => (m.id === editTarget.id ? { ...m, ...updated } : m)));
      addToast('success', `Merchant "${editBusinessName}" updated successfully!`);
      setEditTarget(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update merchant');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteMerchant = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteMerchant(deleteTarget.id);
      setMerchants(prev => prev.filter(m => m.id !== deleteTarget.id));
      addToast('success', `Merchant "${deleteTarget.business_name}" deleted permanently.`);
      setDeleteTarget(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete merchant');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSuspend = async () => {
    if (!suspendTarget) return;
    setSuspending(true);
    try {
      const newStatus = suspendTarget.status === 'active' ? 'suspended' : 'active';
      const updated = await api.updateMerchantStatus(suspendTarget.id, newStatus);
      setMerchants(m => m.map(x => x.id === updated.id ? updated : x));
      addToast('success', `${suspendTarget.business_name} status updated to ${newStatus}`);
      setSuspendTarget(null);
    } catch {
      addToast('error', 'Action failed');
    } finally {
      setSuspending(false);
    }
  };

  const handleApprove = async (mId: string) => {
    setActioningMerchant(mId);
    try {
      const updated = await api.approveMerchant(mId);
      setMerchants(m => m.map(x => x.id === mId ? updated : x));
      addToast('success', 'Merchant approved successfully');
    } catch (e: any) {
      addToast('error', e.message || 'Approval failed');
    } finally {
      setActioningMerchant(null);
    }
  };

  const handleReject = async (mId: string) => {
    setActioningMerchant(mId);
    try {
      const updated = await api.rejectMerchant(mId);
      setMerchants(m => m.map(x => x.id === mId ? updated : x));
      addToast('success', 'Merchant rejected');
    } catch (e: any) {
      addToast('error', e.message || 'Action failed');
    } finally {
      setActioningMerchant(null);
    }
  };

  const filtered = merchants.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      m.business_name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      (m.whatsapp_number && m.whatsapp_number.includes(searchQuery)) ||
      (m.owner_name && m.owner_name.toLowerCase().includes(q)) ||
      (m.owner_phone && m.owner_phone.includes(searchQuery));
    
    const approvalStatus = m.approval_status || 'approved'; // default safety
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && approvalStatus === activeTab;
  });

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-xl animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="page-header mb-0">
          <h2 className="page-title">Merchant Management</h2>
          <p className="page-subtitle">Onboard, approve, and suspend merchant accounts on the platform.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn-primary flex items-center gap-2 h-10 px-4"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Merchant
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-outline-variant/30 pb-2">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {([
            { id: 'all', label: 'All Merchants' },
            { id: 'pending', label: `Pending (${merchants.filter(m => m.approval_status === 'pending').length})` },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-label-md font-label-md rounded-lg transition-all whitespace-nowrap
                ${activeTab === t.id ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
          <input
            className="input-field pl-9 h-10 text-body-sm"
            placeholder="Search by business name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-low">
              <tr>
                {['Business Details', 'Category', 'Tier', 'Enrolled Members', 'Approval Status', 'System Status', 'Registered On', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-container rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-on-surface-variant">
                    No merchants found matching the filter criteria.
                  </td>
                </tr>
              ) : filtered.map(m => {
                const status = STATUS_CONFIG[m.status] || STATUS_CONFIG.active;
                const approval = APPROVAL_CONFIG[m.approval_status as 'approved' | 'pending' | 'rejected'] || APPROVAL_CONFIG.approved;
                const isActioning = actioningMerchant === m.id;

                return (
                  <tr key={m.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-headline-sm shrink-0">
                          {m.business_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-body-md text-on-surface">{m.business_name}</p>
                          <p className="text-label-sm text-on-surface-variant font-mono">{m.whatsapp_number}</p>
                          {m.owner_name && (
                            <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-[13px]">person</span>
                              {m.owner_name} {m.owner_phone ? `(${m.owner_phone})` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">{m.category}</td>
                    <td className="px-4 py-3">
                      <span className="text-label-sm bg-primary-container/30 text-primary border border-primary/20 px-2 py-0.5 rounded-full">{m.plan_tier}</span>
                    </td>
                    <td className="px-4 py-3 text-body-md font-semibold">{m.member_count?.toLocaleString() || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-label-sm px-2.5 py-0.5 rounded-full border ${approval.cls}`}>{approval.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-label-sm px-2.5 py-0.5 rounded-full border ${status.cls}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-label-sm text-on-surface-variant">{format(new Date(m.created_at), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {m.approval_status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApprove(m.id)}
                              disabled={isActioning}
                              className="text-xs bg-green-600 text-white hover:bg-green-700 px-2.5 py-1.5 rounded-lg transition-colors font-semibold disabled:opacity-50 flex items-center gap-1 shadow-xs"
                              title="Approve merchant"
                            >
                              <span className="material-symbols-outlined text-[15px]">check_circle</span>
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(m.id)}
                              disabled={isActioning}
                              className="text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors font-semibold disabled:opacity-50 flex items-center gap-1 shadow-xs"
                              title="Reject merchant"
                            >
                              <span className="material-symbols-outlined text-[15px]">cancel</span>
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setSuspendTarget(m)}
                              disabled={isActioning}
                              className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors font-semibold border flex items-center gap-1 shadow-xs
                                ${m.status === 'active'
                                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                  : 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200'}`}
                              title={m.status === 'active' ? 'Suspend merchant account' : 'Reactivate merchant account'}
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                {m.status === 'active' ? 'pause_circle' : 'play_circle'}
                              </span>
                              {m.status === 'active' ? 'Suspend' : 'Reactivate'}
                            </button>
                            {m.status === 'active' && (
                              <button
                                onClick={() => { impersonate(m.id, m.business_name); addToast('success', `Impersonating ${m.business_name}`); }}
                                className="text-xs bg-primary text-white hover:bg-primary-dark px-2.5 py-1.5 rounded-lg transition-colors font-semibold shadow-xs flex items-center gap-1"
                                style={{ minHeight: 'auto' }}
                                title="Login as merchant"
                              >
                                <span className="material-symbols-outlined text-[15px]">login</span>
                                Impersonate
                              </button>
                            )}
                          </>
                        )}

                        {/* Modify / Edit Merchant Option */}
                        <button
                          onClick={() => handleOpenEdit(m)}
                          disabled={isActioning}
                          className="text-xs bg-surface text-slate-700 hover:text-primary hover:bg-primary/5 border border-outline-variant/50 hover:border-primary/40 px-2.5 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1 shadow-xs"
                          title="Modify merchant details"
                        >
                          <span className="material-symbols-outlined text-[15px] text-primary">edit</span>
                          Edit
                        </button>

                        {/* Delete Merchant Option */}
                        <button
                          onClick={() => setDeleteTarget(m)}
                          disabled={isActioning}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1 shadow-xs"
                          title="Delete merchant permanently"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Confirm Modal */}
      <ConfirmModal
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={toggleSuspend}
        title={suspendTarget?.status === 'active' ? 'Suspend Merchant Account' : 'Reactivate Merchant Account'}
        isLoading={suspending}
        danger={suspendTarget?.status === 'active'}
        confirmLabel={suspendTarget?.status === 'active' ? 'Suspend' : 'Reactivate'}
        description={
          suspendTarget?.status === 'active'
            ? `Suspending "${suspendTarget?.business_name}" will block all active login sessions for their owner/staff partners and immediately disable redemptions for their customers.`
            : `Reactivating "${suspendTarget?.business_name}" will immediately restore full portal access for the merchant.`
        }
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteMerchant}
        title="Delete Merchant Account"
        isLoading={deleting}
        danger={true}
        confirmLabel="Delete Permanently"
        description={
          <div className="space-y-3">
            <p className="text-body-md text-on-surface">
              Are you sure you want to permanently delete <strong className="font-bold text-red-600">{deleteTarget?.business_name}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-800 text-xs space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-red-900 text-sm">
                <span className="material-symbols-outlined text-[18px] text-red-600">warning</span>
                Irreversible Super Admin Action
              </div>
              <p>This will permanently remove:</p>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                <li>All merchant login accounts & staff users</li>
                <li>All registered members & customer loyalty balances</li>
                <li>Offer templates, campaigns, and redemption logs</li>
                <li>Physical cards assigned to this merchant will be unassigned and returned to inventory pool</li>
              </ul>
            </div>
          </div>
        }
      />

      {/* Edit / Modify Merchant Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Modify Merchant: ${editTarget?.business_name || ''}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-xs text-on-surface-variant">
            <div>
              <span className="font-semibold text-on-surface">ID: </span>
              <span className="font-mono text-[11px]">{editTarget?.id}</span>
            </div>
            <div>
              <span className="font-semibold text-on-surface">Members: </span>
              <span className="font-bold text-primary">{editTarget?.member_count || 0}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Info */}
            <div className="space-y-3 md:col-span-2">
              <h4 className="text-body-md font-bold text-primary border-b border-outline-variant/30 pb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                Business Details
              </h4>
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Business Name *</label>
              <input
                type="text"
                required
                value={editBusinessName}
                onChange={e => setEditBusinessName(e.target.value)}
                placeholder="e.g. Glamour Salon"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Category *</label>
              <input
                type="text"
                required
                value={editCategory}
                onChange={e => setEditCategory(e.target.value)}
                placeholder="e.g. Salon, Groceries"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Plan Tier *</label>
              <select
                value={editPlanTier}
                onChange={e => setEditPlanTier(e.target.value)}
                className="input-field h-10 text-body-sm bg-surface"
              >
                <option value="Starter">Starter</option>
                <option value="Pro">Pro</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">WhatsApp Number *</label>
              <input
                type="text"
                required
                value={editWhatsappNumber}
                onChange={e => setEditWhatsappNumber(e.target.value)}
                placeholder="e.g. 919876543210"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Referral Bonus Points</label>
              <input
                type="number"
                min="0"
                value={editReferralBonusPoints}
                onChange={e => setEditReferralBonusPoints(e.target.value)}
                placeholder="50"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Address</label>
              <input
                type="text"
                value={editAddress}
                onChange={e => setEditAddress(e.target.value)}
                placeholder="Store address"
                className="input-field h-10 text-body-sm"
              />
            </div>

            {/* Status & Approvals */}
            <div className="space-y-3 md:col-span-2 mt-1">
              <h4 className="text-body-md font-bold text-primary border-b border-outline-variant/30 pb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                Status & Approval Settings
              </h4>
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Operating Status</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as any)}
                className="input-field h-10 text-body-sm bg-surface font-semibold"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Platform Approval</label>
              <select
                value={editApprovalStatus}
                onChange={e => setEditApprovalStatus(e.target.value as any)}
                className="input-field h-10 text-body-sm bg-surface font-semibold"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Owner Info */}
            <div className="space-y-3 md:col-span-2 mt-1">
              <h4 className="text-body-md font-bold text-primary border-b border-outline-variant/30 pb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">person</span>
                Owner Account Details
              </h4>
            </div>

            <div className="md:col-span-2">
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Owner Full Name</label>
              <input
                type="text"
                value={editOwnerName}
                onChange={e => setEditOwnerName(e.target.value)}
                placeholder="Owner's full name"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Owner Phone (For Login)</label>
              <input
                type="text"
                value={editOwnerPhone}
                onChange={e => setEditOwnerPhone(e.target.value)}
                placeholder="Owner's phone number"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Owner Email</label>
              <input
                type="email"
                value={editOwnerEmail}
                onChange={e => setEditOwnerEmail(e.target.value)}
                placeholder="owner@example.com"
                className="input-field h-10 text-body-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              className="btn-secondary h-10 px-4"
              disabled={editLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="btn-primary flex items-center gap-2 h-10 px-6 font-bold"
            >
              {editLoading && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add New Merchant" maxWidth="max-w-lg">
        <form onSubmit={handleCreateMerchant} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Info */}
            <div className="space-y-3 md:col-span-2">
              <h4 className="text-body-md font-bold text-primary border-b border-outline-variant/30 pb-1">Business Details</h4>
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Business Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="e.g. Glamour Salon"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Category *</label>
              <input
                type="text"
                required
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. Salon, Groceries"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Plan Tier *</label>
              <select
                value={planTier}
                onChange={e => setPlanTier(e.target.value)}
                className="input-field h-10 text-body-sm bg-surface"
              >
                <option value="Starter">Starter</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">WhatsApp Number *</label>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
                placeholder="e.g. 919876543210"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 123 Main Street"
                className="input-field h-10 text-body-sm"
              />
            </div>

            {/* Owner Info */}
            <div className="space-y-3 md:col-span-2 mt-2">
              <h4 className="text-body-md font-bold text-primary border-b border-outline-variant/30 pb-1">Owner Account Details</h4>
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Owner Name *</label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="Owner's full name"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Owner Phone * (For Login)</label>
              <input
                type="text"
                required
                value={ownerPhone}
                onChange={e => setOwnerPhone(e.target.value)}
                placeholder="Owner's phone number"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Owner Email (For Google/Email Login)</label>
              <input
                type="email"
                value={ownerEmail}
                onChange={e => setOwnerEmail(e.target.value)}
                placeholder="owner@example.com"
                className="input-field h-10 text-body-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary h-10 px-4" disabled={createLoading}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="btn-primary flex items-center gap-2 h-10 px-6 font-bold"
            >
              {createLoading && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
              Save Merchant
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
