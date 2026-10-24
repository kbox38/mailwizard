import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
export const CheckoutCancel=()=>{
  const navigate=useNavigate();
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4"><div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
    <XCircle className="mx-auto mb-4 text-yellow-500" size={64}/><h1 className="text-2xl font-serif font-bold mb-2">Payment Cancelled</h1>
    <p className="text-gray-600 mb-6">Your checkout was not completed. Choose a subscription when you’re ready to use Email Wizard.</p>
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left"><p className="text-sm text-gray-700">Pro starts at $29/month. Pro Plus is $99/month. Platform access begins after your subscription is confirmed.</p></div>
    <div className="space-y-3"><Button fullWidth onClick={()=>navigate('/subscribe')}>Choose a Plan<ArrowRight size={18}/></Button><Button variant="secondary" fullWidth onClick={()=>navigate('/app/settings?tab=billing')}>Account & Billing</Button></div>
  </div></div>;
};
