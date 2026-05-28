import { useState, useEffect } from 'react';
import {
  Activity,
  Database,
  Layers,
  Server,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { adminApiService, SystemHealth, SystemMetrics, ActivityLog } from '../../lib/adminApi';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export const AdminSystemPage = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'health' | 'metrics' | 'logs'>('health');

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [healthData, metricsData, logsData] = await Promise.all([
        adminApiService.getSystemHealth(),
        adminApiService.getSystemMetrics(),
        adminApiService.getActivityLogs({ page: 1, pageSize: 20 }),
      ]);
      setHealth(healthData);
      setMetrics(metricsData);
      setLogs(logsData.logs);
    } catch (error) {
      console.error('Error fetching system data:', error);
      toast.error('Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  if (loading || !health || !metrics) {
    return (
      <div className="p-8">
        <div className="text-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading system data...</p>
        </div>
      </div>
    );
  }

  const isHealthy = health.status === 'healthy';

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">System Monitoring</h1>
          <p className="text-gray-600">Real-time system health and performance metrics</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          onClick={handleRefresh}
          loading={refreshing}
          disabled={refreshing}
        >
          Refresh
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'health'
                ? 'border-gold text-gold'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            System Health
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'metrics'
                ? 'border-gold text-gold'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            Metrics
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-gold text-gold'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            Activity Logs
          </button>
        </div>
      </div>

      {activeTab === 'health' && (
        <>
          <div className="card mb-6">
            <div className="flex items-center gap-4">
              {isHealthy ? (
                <CheckCircle size={48} className="text-green-600" />
              ) : (
                <AlertCircle size={48} className="text-red-600" />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-serif font-bold mb-1">
                  {isHealthy ? 'All Systems Operational' : 'System Issues Detected'}
                </h2>
                <p className="text-gray-600">
                  Last checked: {new Date(health.timestamp).toLocaleString()}
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-full font-semibold ${
                  isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {health.status.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-3 rounded-lg ${
                    health.services.database.status === 'healthy'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  <Database size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">Database</h3>
                  <p className="text-sm text-gray-600">{health.services.database.status}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Latency</span>
                <span className="font-semibold">{health.services.database.latency}ms</span>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-3 rounded-lg ${
                    health.services.redis.status === 'healthy'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  <Server size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">Redis Cache</h3>
                  <p className="text-sm text-gray-600">{health.services.redis.status}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Latency</span>
                <span className="font-semibold">{health.services.redis.latency}ms</span>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-3 rounded-lg ${
                    health.services.queue.status === 'healthy'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  <Layers size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">Queue System</h3>
                  <p className="text-sm text-gray-600">{health.services.queue.status}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Latency</span>
                <span className="font-semibold">{health.services.queue.latency}ms</span>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'metrics' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <h2 className="text-xl font-serif font-bold mb-4">Redis Metrics</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Memory Usage</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Used</p>
                      <p className="text-lg font-serif font-bold">{metrics.redis.memory.used}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Peak</p>
                      <p className="text-lg font-serif font-bold">{metrics.redis.memory.peak}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Usage</p>
                      <p className="text-lg font-serif font-bold">{metrics.redis.memory.percentage}%</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2">Connection Stats</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Clients</p>
                      <p className="text-lg font-serif font-bold">
                        {metrics.redis.stats.connected_clients}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Commands</p>
                      <p className="text-lg font-serif font-bold">
                        {metrics.redis.stats.total_commands.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Ops/sec</p>
                      <p className="text-lg font-serif font-bold">
                        {metrics.redis.stats.ops_per_sec.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-serif font-bold mb-4">Database Metrics</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Connections</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Active</p>
                      <p className="text-lg font-serif font-bold text-green-600">
                        {metrics.database.connections.active}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Idle</p>
                      <p className="text-lg font-serif font-bold">
                        {metrics.database.connections.idle}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Total</p>
                      <p className="text-lg font-serif font-bold">
                        {metrics.database.connections.total}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gold/10 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Database Size</p>
                  <p className="text-2xl font-serif font-bold text-gold">{metrics.database.size}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-serif font-bold mb-4">Queue Status</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold">Queue Name</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Waiting</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Active</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Completed</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.queues.map((queue) => (
                    <tr key={queue.name} className="border-b border-gray-100">
                      <td className="py-4 px-4 font-medium">{queue.name}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold">
                          {queue.waiting.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-3 py-1 bg-gold/20 text-gold rounded-full text-sm font-semibold">
                          {queue.active.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          {queue.completed.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                          {queue.failed.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'logs' && (
        <div className="card">
          <h2 className="text-xl font-serif font-bold mb-4">Recent Admin Activity</h2>
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="p-2 bg-white rounded-lg">
                  <Activity size={20} className="text-gold" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{log.adminEmail}</span>
                    <span className="text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">{log.actionType}</span>
                    {log.resourceType && (
                      <>
                        {' '}
                        on <span className="font-medium">{log.resourceType}</span>
                      </>
                    )}
                  </p>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="text-xs text-gray-500 bg-white p-2 rounded border border-gray-200">
                      {JSON.stringify(log.details, null, 2)}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">IP: {log.ipAddress}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
