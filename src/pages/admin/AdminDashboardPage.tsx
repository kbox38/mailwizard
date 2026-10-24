import { useEffect, useState } from 'react';
import { Users, Mail, Crown, Activity, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { platformAdmin, PlatformOverview } from '../../lib/platformAdmin';
import { Button } from '../../components/ui/Button';

export const AdminDashboardPage = () => {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true); setError('');
    try { setOverview(await platformAdmin.overview()); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to load platform overview.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const stats = overview ? [
    { label: 'Platform accounts', value: overview.users, detail: `${overview.new_users_30d} joined in the last 30 days`, icon: Users },
    { label: 'Accounts with access', value: overview.paid_access, detail: 'Active subscriptions and admin grants', icon: Crown },
    { label: 'Emails this month', value: overview.emails_this_month, detail: `${overview.campaigns} campaigns in total`, icon: Mail },
    { label: 'Recently active accounts', value: overview.active_users_30d, detail: 'Signed in during the last 30 days', icon: Activity },
  ] : [];
  return <div className="p-4 sm:p-8">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-3xl font-serif font-bold mb-2">Platform Overview</h1><p className="text-gray-600">Accounts, usage, and subscription access</p></div>
      <Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={16} className="mr-2" />Refresh</Button>
    </div>
    {error && <div role="alert" className="card mb-6 text-red-700">{error} <button className="underline" onClick={load}>Try again</button></div>}
    {loading && !overview && <p role="status" className="py-12 text-center text-gray-600">Loading platform overview...</p>}
    {overview && <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">{stats.map(stat => <div className="card" key={stat.label}>
        <stat.icon className="text-gold mb-4" size={24} /><p className="text-sm text-gray-600">{stat.label}</p>
        <p className="text-3xl font-serif font-bold my-2">{stat.value.toLocaleString()}</p><p className="text-xs text-gray-500">{stat.detail}</p>
      </div>)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section className="card"><h2 className="text-xl font-serif font-bold mb-6">Accounts by Plan</h2>
          {([['pro','Pro'],['pro_plus','Pro Plus'],['none','No active plan']] as const).map(([plan,label]) => <div key={plan} className="flex justify-between items-center p-4 mb-3 bg-gray-50 rounded-lg"><span>{label}</span><span className="text-2xl font-serif font-bold">{overview.by_plan[plan] || 0}</span></div>)}
          <Link className="text-sm font-semibold text-purple hover:underline" to="/admin/users">Manage users and plans →</Link>
        </section>
        <section className="card"><h2 className="text-xl font-serif font-bold mb-6">Platform Activity</h2>
          <dl className="space-y-5">{[['Contacts',overview.contacts],['Scheduled campaigns',overview.scheduled_campaigns],['Campaigns sending',overview.sending_campaigns]].map(([label,value]) => <div key={String(label)} className="flex justify-between"><dt className="text-gray-600">{label}</dt><dd className="font-semibold">{Number(value).toLocaleString()}</dd></div>)}</dl>
          <p className="text-xs text-gray-500 mt-8">Updated {new Date(overview.checked_at).toLocaleString()}</p>
        </section>
      </div>
      <section className="card"><h2 className="text-xl font-serif font-bold mb-5">Recent Admin Actions</h2>
        {overview.activity.length === 0 ? <p className="text-sm text-gray-600">No administrator changes have been recorded yet.</p> : <ul className="divide-y divide-gray-100">{overview.activity.slice(0,8).map(event => <li className="py-3 flex flex-wrap justify-between gap-2" key={event.id}><div><p className="font-medium">{event.action.replace(/_/g,' ')}</p><p className="text-sm text-gray-600">{event.actor_email || 'Administrator'} · {event.details.reason}</p></div><time className="text-xs text-gray-500">{new Date(event.created_at).toLocaleString()}</time></li>)}</ul>}
      </section>
    </>}
  </div>;
};
