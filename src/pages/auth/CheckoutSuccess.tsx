import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

export const CheckoutSuccess=()=>{
  const navigate=useNavigate();
  const [params]=useSearchParams();
  const {refreshProfile}=useAuth();
  const [status,setStatus]=useState<'checking'|'active'|'pending'|'error'>('checking');
  const [message,setMessage]=useState('Confirming your subscription...');
  const [attempt,setAttempt]=useState(0);
  const sessionId=params.get('session_id');
  useEffect(()=>{
    let cancelled=false;
    let timer:ReturnType<typeof setTimeout>|undefined;
    if(!sessionId){setStatus('error');setMessage('No checkout session was provided. Open Account & Billing to check your subscription.');return;}
    setStatus('checking');
    const check=async(remaining:number)=>{
      try{
        const {data,error}=await supabase.rpc('has_platform_access');
        if(error)throw error;
        if(cancelled)return;
        if(data===true){await refreshProfile();if(cancelled)return;localStorage.removeItem('pending_plan');setStatus('active');setMessage('Your subscription is active. Welcome to Email Wizard.');return;}
        if(remaining>0){timer=setTimeout(()=>{void check(remaining-1);},1500);}
        else{setStatus('pending');setMessage('Your subscription has not been confirmed yet. If you completed payment, please check again shortly.');}
      }catch{if(!cancelled){setStatus('error');setMessage('We could not confirm your subscription. Please check Account & Billing.');}}
    };
    void check(7);
    return()=>{cancelled=true;if(timer)clearTimeout(timer);};
  },[sessionId,attempt]);
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4"><div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
    {status==='checking'?<Loader2 className="animate-spin mx-auto mb-4 text-gold" size={48}/>:status==='active'?<CheckCircle className="mx-auto mb-4 text-green-600" size={64}/>:<Clock className="mx-auto mb-4 text-gold" size={64}/>}
    <h1 className="text-2xl font-serif font-bold mb-3">{status==='active'?'Subscription Confirmed':status==='checking'?'Confirming Your Subscription':'Subscription Confirmation'}</h1>
    <p className="text-gray-600 mb-6" role="status">{message}</p>
    {status==='active'?<Button fullWidth onClick={()=>navigate('/app/dashboard')}>Go to Dashboard</Button>:status!=='checking'&&<div className="space-y-3"><Button fullWidth onClick={()=>setAttempt(value=>value+1)}>Check Again</Button><Button fullWidth variant="secondary" onClick={()=>navigate('/app/settings?tab=billing')}>Account & Billing</Button></div>}
  </div></div>;
};
