import { useEffect, useState } from 'react';
import { platformAdmin, PlatformOverview } from '../../lib/platformAdmin';
import { Button } from '../../components/ui/Button';

export const AdminSystemPage = () => {
  const [data,setData]=useState<PlatformOverview|null>(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const load=async()=>{setLoading(true);setError('');try{setData(await platformAdmin.overview());}catch(failure){setError(failure instanceof Error?failure.message:'Unable to load system activity.');}finally{setLoading(false);}};
  useEffect(()=>{void load();},[]);
  return <div className="p-4 sm:p-8">
    <div className="flex flex-wrap justify-between gap-4 mb-8"><div><h1 className="text-3xl font-serif font-bold mb-2">System & Activity</h1><p className="text-gray-600">Live database checks and administrator changes</p></div><Button variant="secondary" onClick={load} disabled={loading}>Refresh</Button></div>
    {error && <p role="alert" className="card text-red-700 mb-6">{error}</p>}
    {loading && !data && <p role="status">Loading system activity...</p>}
    {data && <><section className="card mb-8"><h2 className="text-xl font-serif font-bold mb-4">Current Status</h2><dl className="grid grid-cols-1 sm:grid-cols-3 gap-6"><div><dt className="text-sm text-gray-600">Database connection</dt><dd className="font-semibold text-green-700 mt-2">Query successful</dd></div><div><dt className="text-sm text-gray-600">Campaigns sending</dt><dd className="text-2xl font-serif font-bold mt-2">{data.sending_campaigns}</dd></div><div><dt className="text-sm text-gray-600">Campaigns scheduled</dt><dd className="text-2xl font-serif font-bold mt-2">{data.scheduled_campaigns}</dd></div></dl><p className="mt-6 text-xs text-gray-500">Checked {new Date(data.checked_at).toLocaleString()}. Provider delivery status must be checked in SendGrid or Stripe.</p></section>
    <section className="card overflow-x-auto"><h2 className="text-xl font-serif font-bold mb-5">Admin Activity Log</h2><table className="w-full text-left text-sm"><thead><tr>{['Time','Administrator','Action','Reason'].map(label=><th className="pb-3 pr-5 border-b" key={label} scope="col">{label}</th>)}</tr></thead><tbody>{data.activity.map(event=><tr key={event.id} className="border-b border-gray-100"><td className="py-4 pr-5 whitespace-nowrap">{new Date(event.created_at).toLocaleString()}</td><td className="pr-5">{event.actor_email||'Administrator'}</td><td className="pr-5">{event.action.replace(/_/g,' ')}{event.details.plan?` · ${event.details.plan}`:''}</td><td>{event.details.reason}</td></tr>)}</tbody></table>{data.activity.length===0&&<p className="py-8 text-center text-gray-600">No administrator changes recorded yet.</p>}</section></>}
  </div>;
};
