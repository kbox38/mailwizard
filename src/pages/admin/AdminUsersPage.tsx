import { useEffect, useRef, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { platformAdmin, PlatformUser } from '../../lib/platformAdmin';
import { AccountPlan, effectivePlan } from '../../lib/platformAccess';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const planNames = { none: 'No active plan', pro: 'Pro', pro_plus: 'Pro Plus' };
export const AdminUsersPage = () => {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<PlatformUser | null>(null);
  const [mode, setMode] = useState<'plan' | 'suspend'>('plan');
  const [plan, setPlan] = useState<AccountPlan | 'billing'>('pro');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    platformAdmin.users(appliedSearch,planFilter,page).then(data => {
      if (active) { setUsers(data.users); setTotal(data.total); setPages(data.total_pages); }
    }).catch(failure => { if (active) setError(failure.message || 'Unable to load users.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [appliedSearch,planFilter,page,revision]);
  useEffect(() => { if (selected) dialog.current?.showModal(); else dialog.current?.close(); }, [selected]);
  const open = (user: PlatformUser, action: 'plan' | 'suspend') => { setMode(action); setPlan(effectivePlan(user)==='none'?'pro':effectivePlan(user)); setReason(''); setError(''); setSelected(user); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || saving) return;
    setSaving(true);
    try {
      if (mode==='plan') await platformAdmin.setPlan(selected.id,plan,reason);
      else await platformAdmin.setSuspended(selected.id,!selected.account_suspended,reason);
      toast.success('Account updated.'); setSelected(null); setRevision(value=>value+1);
    } catch (failure) { toast.error(failure instanceof Error?failure.message:'Unable to update account.'); }
    finally { setSaving(false); }
  };
  return <div className="p-4 sm:p-8">
    <div className="mb-8"><h1 className="text-3xl font-serif font-bold mb-2">User Management</h1><p className="text-gray-600">See who uses the platform and manage subscription access</p></div>
    <form className="card mb-6 flex flex-wrap items-end gap-4" onSubmit={event=>{event.preventDefault();setAppliedSearch(search.trim());setPage(1);}}>
      <div className="flex-1 min-w-48"><label htmlFor="admin-search" className="text-sm font-semibold block mb-2">Search users</label><input id="admin-search" className="input-base w-full" placeholder="Name or email" value={search} onChange={event=>setSearch(event.target.value)} maxLength={200} /></div>
      <div><label htmlFor="admin-plan-filter" className="text-sm font-semibold block mb-2">Plan</label><select id="admin-plan-filter" className="input-base" value={planFilter} onChange={event=>{setPlanFilter(event.target.value);setPage(1);}}><option value="all">All plans</option><option value="pro">Pro</option><option value="pro_plus">Pro Plus</option><option value="none">No active plan</option></select></div>
      <Button type="submit" variant="secondary"><Search size={16} className="mr-2" />Search</Button>
    </form>
    {error && <p role="alert" className="card mb-4 text-red-700">{error} <button className="underline" onClick={()=>setRevision(value=>value+1)}>Try again</button></p>}
    <div className="card overflow-x-auto" aria-busy={loading}>
      <p className="text-sm text-gray-600 mb-4">{loading?'Loading users...':`${total} accounts`}</p>
      <table className="w-full text-sm text-left"><thead className="border-b border-gray-200 text-gray-600"><tr>{['Account','Plan and access','Activity','Actions'].map(label=><th key={label} scope="col" className="pb-3 pr-5 font-semibold">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">{users.map(user=><tr key={user.id}>
          <td className="py-4 pr-5"><p className="font-semibold">{user.full_name || user.email}</p><p className="text-gray-600">{user.email}</p><p className="text-xs text-gray-500 mt-1">{user.is_admin?'Administrator · ':''}{user.email_verified?'Email verified':'Awaiting verification'}</p></td>
          <td className="py-4 pr-5"><p className="font-semibold">{planNames[effectivePlan(user)]}</p><p className={user.has_access?'text-green-700':'text-gray-500'}>{user.account_suspended?'Suspended':user.has_access?'Access active':'Access restricted'}</p><p className="text-xs text-gray-500 mt-1">{user.admin_plan_override!==null?'Admin override':`Billing: ${user.subscription_status}`}</p></td>
          <td className="py-4 pr-5"><p>{user.contacts.toLocaleString()} contacts · {user.campaigns} campaigns</p><p className="text-xs text-gray-500 mt-1">Last sign-in: {user.last_sign_in_at?new Date(user.last_sign_in_at).toLocaleDateString():'Never'}</p></td>
          <td className="py-4"><div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={()=>open(user,'plan')}>Manage plan</Button><Button variant="tertiary" size="sm" onClick={()=>open(user,'suspend')}>{user.account_suspended?'Restore':'Suspend'}</Button></div></td>
        </tr>)}</tbody></table>
      {!loading && users.length===0 && <div className="text-center py-12 text-gray-600"><Users size={32} className="mx-auto mb-3" />No users match your search.</div>}
      <div className="mt-6 flex justify-between items-center gap-4"><Button variant="secondary" size="sm" disabled={page<=1||loading} onClick={()=>setPage(value=>value-1)}>Previous</Button><span className="text-sm text-gray-600">Page {page} of {pages}</span><Button variant="secondary" size="sm" disabled={page>=pages||loading} onClick={()=>setPage(value=>value+1)}>Next</Button></div>
    </div>
    <dialog ref={dialog} aria-labelledby="admin-action-title" className="rounded-xl p-0 w-full max-w-md backdrop:bg-black/40" onCancel={event=>{if(saving)event.preventDefault();else setSelected(null);}} onClose={()=>{if(!saving)setSelected(null);}}>
      <form onSubmit={save} className="p-6 space-y-4">
        <h2 id="admin-action-title" className="text-xl font-serif font-bold">{mode==='plan'?'Manage Plan':selected?.account_suspended?'Restore Account':'Suspend Account'}</h2><p className="text-sm text-gray-600 break-all">{selected?.email}</p>
        {mode==='plan' && <><label className="block text-sm font-semibold" htmlFor="admin-plan-choice">Access plan</label><select id="admin-plan-choice" className="input-base w-full" value={plan} disabled={saving} onChange={event=>setPlan(event.target.value as AccountPlan|'billing')}><option value="pro">Grant Pro</option><option value="pro_plus">Grant Pro Plus</option><option value="none">Remove platform access</option><option value="billing">Use billing subscription</option></select><p className="text-xs text-gray-600">Admin grants override subscription access. Changing access does not create or cancel Stripe billing.</p></>}
        {mode==='suspend' && <p className="text-sm text-gray-600">{selected?.account_suspended?'Restore this account’s access according to its plan.':'Block platform access and revoke the account’s sessions.'}</p>}
        <label htmlFor="admin-action-reason" className="block text-sm font-semibold">Reason</label><textarea id="admin-action-reason" className="input-base w-full" rows={3} minLength={3} maxLength={500} required disabled={saving} value={reason} onChange={event=>setReason(event.target.value)} placeholder="Recorded in the admin activity log" />
        <div className="flex justify-end gap-3"><Button type="button" variant="secondary" disabled={saving} onClick={()=>setSelected(null)}>Cancel</Button><Button type="submit" disabled={saving||reason.trim().length<3} loading={saving}>Save changes</Button></div>
      </form>
    </dialog>
  </div>;
};
