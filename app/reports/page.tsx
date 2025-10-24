'use client';

import { useState, useEffect } from 'react';

interface ReportData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    paidOrders: number;
    unpaidOrders: number;
  };
  byDate: Record<string, { total: number; count: number }>;
  byCategory: Record<string, { total: number; count: number }>;
  byPaymentType: Record<string, { total: number; count: number }>;
  byPaymentMethod: Record<string, { total: number; count: number }>;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, selectedYear]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let url = '/api/reports';
      if (selectedMonth && selectedYear) {
        url += `?month=${selectedMonth}&year=${selectedYear}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setSelectedMonth('');
    setSelectedYear('');
  };

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading reports...</div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Failed to load report data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 fixed-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <img
              src="/vine-church-logo.svg"
              alt="Vine Church Logo"
              className="w-12 h-12"
            />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Sales Reports</h1>
              <p className="text-gray-600">View order analytics and insights</p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Filter by Month</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Months</option>
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Year</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            {(selectedMonth || selectedYear) && (
              <div>
                <button
                  onClick={handleClearFilter}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>
          {selectedMonth && selectedYear && (
            <div className="mt-4 text-sm text-gray-600">
              Showing results for {monthOptions[parseInt(selectedMonth) - 1]?.label} {selectedYear}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-green-600">
              ${reportData.summary.totalRevenue.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Total Orders</div>
            <div className="text-3xl font-bold text-blue-600">
              {reportData.summary.totalOrders}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Paid Orders</div>
            <div className="text-3xl font-bold text-green-600">
              {reportData.summary.paidOrders}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Unpaid Orders</div>
            <div className="text-3xl font-bold text-red-600">
              {reportData.summary.unpaidOrders}
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Orders by Date */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Orders by Date</h2>
            {Object.keys(reportData.byDate).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No data available</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(reportData.byDate)
                  .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                  .map(([date, data]) => (
                    <div key={date} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <div className="font-medium text-gray-900">{date}</div>
                        <div className="text-sm text-gray-600">{data.count} orders</div>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        ${data.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Orders by Category */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Sales by Category</h2>
            {Object.keys(reportData.byCategory).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No data available</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(reportData.byCategory)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([category, data]) => (
                    <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <div className="font-medium text-gray-900">{category}</div>
                        <div className="text-sm text-gray-600">{data.count} items sold</div>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        ${data.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Orders by Payment Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Orders by Payment Status</h2>
            <div className="space-y-3">
              {Object.entries(reportData.byPaymentType).map(([status, data]) => (
                <div key={status} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div>
                    <div className="font-medium text-gray-900">{status}</div>
                    <div className="text-sm text-gray-600">{data.count} orders</div>
                  </div>
                  <div className={`text-lg font-bold ${status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                    ${data.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orders by Payment Method */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Sales by Payment Method</h2>
            {Object.keys(reportData.byPaymentMethod).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No paid orders yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(reportData.byPaymentMethod)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([method, data]) => (
                    <div key={method} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <div className="font-medium text-gray-900">{method}</div>
                        <div className="text-sm text-gray-600">{data.count} orders</div>
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        ${data.total.toFixed(2)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
