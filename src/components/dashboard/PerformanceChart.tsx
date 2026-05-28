/**
 * PERFORMANCE CHART COMPONENT
 * 
 * Displays open rate and click rate analytics over time using Recharts.
 * Features dual-line chart with custom tooltip and design system styling.
 * 
 * DESIGN SYSTEM:
 * - Colors: Purple (#57377d) for open rate, Gold (#f3ba42) for click rate
 * - Typography: DM Sans font family
 * - Borders: Black with rounded corners
 * - Transitions: Smooth 200-300ms
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

/**
 * DATA INTERFACE
 * Represents metrics for a single day
 */
export interface DayMetrics {
  date: string;          // Formatted date (e.g., "Jan 15")
  fullDate: string;      // Full date for tooltip (e.g., "January 15, 2025")
  sent: number;          // Total emails sent
  opens: number;         // Total opens
  clicks: number;        // Total clicks
  openRate: number;      // Open rate percentage (0-100)
  clickRate: number;     // Click rate percentage (0-100)
}

/**
 * COMPONENT PROPS
 */
interface PerformanceChartProps {
  data: DayMetrics[];
  loading: boolean;
}

/**
 * CUSTOM TOOLTIP COMPONENT
 * 
 * Displays detailed metrics on hover with design system styling
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-black rounded-lg p-3 shadow-lg">
      <p className="font-sans text-sm font-semibold mb-2">{data.fullDate}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple"></div>
          <span className="font-sans text-sm">
            Open Rate: <span className="font-semibold">{data.openRate.toFixed(1)}%</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gold"></div>
          <span className="font-sans text-sm">
            Click Rate: <span className="font-semibold">{data.clickRate.toFixed(1)}%</span>
          </span>
        </div>
        <div className="pt-1 mt-1 border-t border-gray-200">
          <p className="font-sans text-xs text-gray-600">
            {data.sent.toLocaleString()} emails sent
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * LOADING STATE COMPONENT
 * 
 * Displays during data fetch
 */
const LoadingState = () => (
  <div className="h-64 flex items-center justify-center border border-black rounded-lg bg-gradient-to-br from-purple/5 to-gold/5">
    <div className="text-center">
      <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-gray-600 font-sans">Loading analytics...</p>
    </div>
  </div>
);

/**
 * EMPTY STATE COMPONENT
 * 
 * Displays when no data is available
 */
const EmptyState = () => (
  <div className="h-64 flex items-center justify-center border border-black rounded-lg bg-gradient-to-br from-purple/5 to-gold/5">
    <div className="text-center">
      <TrendingUp size={48} className="text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600 font-sans font-semibold mb-2">No Data Yet</p>
      <p className="text-sm text-gray-500 font-sans">
        Send your first campaign to see analytics
      </p>
    </div>
  </div>
);

/**
 * PERFORMANCE CHART COMPONENT
 * 
 * Main chart component displaying open rate and click rate over time
 */
export const PerformanceChart = ({ data, loading }: PerformanceChartProps) => {
  // LOADING STATE: Show spinner while fetching data
  if (loading) {
    return <LoadingState />;
  }

  // EMPTY STATE: Show message when no data available
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        {/* GRID: Light gray dashed lines */}
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        
        {/* X-AXIS: Dates */}
        <XAxis
          dataKey="date"
          stroke="#000000"
          style={{
            fontSize: '12px',
            fontFamily: 'DM Sans, sans-serif',
          }}
          tick={{ fill: '#000000' }}
        />
        
        {/* Y-AXIS: Percentage values */}
        <YAxis
          stroke="#000000"
          style={{
            fontSize: '12px',
            fontFamily: 'DM Sans, sans-serif',
          }}
          tick={{ fill: '#000000' }}
          tickFormatter={(value) => `${value}%`}
        />
        
        {/* TOOLTIP: Custom styled tooltip on hover */}
        <Tooltip content={<CustomTooltip />} />
        
        {/* LEGEND: Shows what each line represents */}
        <Legend
          wrapperStyle={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            paddingTop: '10px',
          }}
        />
        
        {/* OPEN RATE LINE: Purple */}
        <Line
          type="monotone"
          dataKey="openRate"
          stroke="#57377d"
          strokeWidth={2}
          name="Open Rate"
          dot={{ fill: '#57377d', r: 4 }}
          activeDot={{ r: 6 }}
        />
        
        {/* CLICK RATE LINE: Gold */}
        <Line
          type="monotone"
          dataKey="clickRate"
          stroke="#f3ba42"
          strokeWidth={2}
          name="Click Rate"
          dot={{ fill: '#f3ba42', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
