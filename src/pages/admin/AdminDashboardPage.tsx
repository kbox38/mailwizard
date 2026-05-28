import { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Mail,
  TrendingUp,
  TrendingDown,
  Crown,
  Activity,
  AlertCircle
} from 'lucide-react';
import { adminApiService, DashboardMetrics } from '../../lib/adminApi';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export const AdminDashboardPage = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await adminApiService.getDashboardMetrics(timeRange);
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="p-8">
        <div className="text-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Organizations',
      value: metrics.organizations.total.toLocaleString(),
      change: `+${metrics.organizations.new_today} today`,
      trend: 'up',
      icon: Users,
      color: 'text-gold',
    },
    {
      label: 'Monthly Recurring Revenue',
      value: `$${metrics.revenue.mrr.toLocaleString()}`,
      change: `${metrics.revenue.growth_30d > 0 ? '+' : ''}${metrics.revenue.growth_30d.toFixed(1)}%`,
      trend: metrics.revenue.growth_30d > 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      label: 'Emails Sent (30d)',
      value: metrics.emails.sent_30d.toLocaleString(),
      change: `${metrics.emails.sent_today.toLocaleString()} today`,
      trend: 'up',
      icon: Mail,
      color: 'text-purple',
    },
    {
      label: 'Avg Deliverability',
      value: `${(100 - metrics.deliverability.bounce_rate - metrics.deliverability.complaint_rate).toFixed(1)}%`,
      change: `${metrics.deliverability.avg_open_rate.toFixed(1)}% open rate`,
      trend: 'up',
      icon: Activity,
      color: 'text-gold',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">Platform Overview</h1>
          <p className="text-gray-600">Real-time metrics and system health</p>
        </div>
        <div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-base w-auto"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 bg-gray-50 rounded-lg ${stat.color}`}>
                  <Icon size={24} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <TrendIcon size={16} />
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-serif font-bold">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-serif font-bold mb-6">Organizations by Plan</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="font-medium">Free Plan</span>
              </div>
              <span className="text-2xl font-serif font-bold">
                {metrics.organizations.by_plan.free.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gold/10 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gold" />
                <span className="font-medium">Pro Plan</span>
              </div>
              <span className="text-2xl font-serif font-bold text-gold">
                {metrics.organizations.by_plan.pro.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple/10 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple" />
                <span className="font-medium">Pro Plus Plan</span>
              </div>
              <span className="text-2xl font-serif font-bold text-purple">
                {metrics.organizations.by_plan.pro_plus.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-semibold">
                {(
                  ((metrics.organizations.by_plan.pro + metrics.organizations.by_plan.pro_plus) /
                    metrics.organizations.total) *
                  100
                ).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-serif font-bold mb-6">System Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="font-medium">All Systems Operational</span>
              </div>
              <Activity size={20} className="text-green-600" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Bounce Rate</p>
                <p className="text-xl font-serif font-bold">
                  {metrics.deliverability.bounce_rate.toFixed(2)}%
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Complaint Rate</p>
                <p className="text-xl font-serif font-bold">
                  {metrics.deliverability.complaint_rate.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="p-4 bg-gold/10 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Average Open Rate</p>
              <p className="text-2xl font-serif font-bold text-gold">
                {metrics.deliverability.avg_open_rate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-serif font-bold mb-4">Revenue Snapshot</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-serif font-bold text-green-600">
                ${metrics.revenue.total_today.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">30-Day Growth</p>
              <p className={`text-xl font-semibold ${metrics.revenue.growth_30d > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.revenue.growth_30d > 0 ? '+' : ''}{metrics.revenue.growth_30d.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-serif font-bold mb-4">Email Activity</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-2xl font-serif font-bold">
                {metrics.emails.sent_today.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg per Org</p>
              <p className="text-xl font-semibold">
                {metrics.emails.avg_per_org.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-serif font-bold mb-4">Active Organizations</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Last 30 Days</p>
              <p className="text-2xl font-serif font-bold text-purple">
                {metrics.organizations.active_30d.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Activity Rate</p>
              <p className="text-xl font-semibold">
                {((metrics.organizations.active_30d / metrics.organizations.total) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
