'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/app/components/ProtectedRoute';

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
  itemsByDate: Record<string, Record<string, { quantity: number; revenue: number }>>;
}

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsPageContent />
    </ProtectedRoute>
  );
}

function ReportsPageContent() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  // Set current month and year as default
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(currentDate.getFullYear().toString());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  useEffect(() => {
    fetchReportData();
    // Clear selected dates when filters change so we can set new defaults
    setSelectedDates([]);
  }, [selectedMonth, selectedYear]);

  // Set the most recent date when reportData is loaded (default selection)
  useEffect(() => {
    if (reportData && reportData.itemsByDate && Object.keys(reportData.itemsByDate).length > 0 && selectedDates.length === 0) {
      const dates = Object.keys(reportData.itemsByDate);
      const mostRecentDate = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
      setSelectedDates([mostRecentDate]);
    }
  }, [reportData, selectedDates.length]);

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

  // Helper function to handle multi-select dropdown change
  const handleDateSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions);
    const values = options.map(option => option.value);
    setSelectedDates(values);
  };

  // Helper function to get day from date string
  const getDayFromDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 0; // Return 0 for invalid dates
    }
    return date.getDate();
  };

  // Helper function to get month and year for display
  const getMonthYearDisplay = () => {
    if (!reportData || !reportData.itemsByDate || Object.keys(reportData.itemsByDate).length === 0) {
      return '';
    }
    // Get first date to extract month and year
    const firstDate = Object.keys(reportData.itemsByDate)[0];
    const date = new Date(firstDate);
    if (isNaN(date.getTime())) {
      return ''; // Return empty string for invalid dates
    }
    const monthIndex = date.getMonth(); // Returns 0-11
    const monthName = monthOptions.find(m => parseInt(m.value) === monthIndex + 1)?.label || '';
    const year = date.getFullYear();
    return `${monthName} ${year}`;
  };

  // Calculate aggregated items across selected dates (memoized for performance)
  const aggregatedItems = useMemo(() => {
    if (!reportData || !reportData.itemsByDate) return {};

    const aggregated: Record<string, { quantity: number; revenue: number }> = {};

    // Filter to only include dates that exist in current reportData
    const validDateSet = new Set(Object.keys(reportData.itemsByDate));
    const validDates = selectedDates.filter(date => validDateSet.has(date));

    validDates.forEach(date => {
      const dateItems = reportData.itemsByDate[date];
      Object.entries(dateItems).forEach(([itemName, data]) => {
        if (!aggregated[itemName]) {
          aggregated[itemName] = { quantity: 0, revenue: 0 };
        }
        aggregated[itemName].quantity += data.quantity;
        aggregated[itemName].revenue += data.revenue;
      });
    });

    return aggregated;
  }, [selectedDates, reportData]);

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

        {/* Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Items Sold by Date */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Items Sold by Date</h2>

          {Object.keys(reportData.itemsByDate).length === 0 ? (
            <p className="text-gray-500 text-center py-4">No data available</p>
          ) : (
            <div>
              {/* Date selector - multi-select dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select dates to view items sold
                </label>
                <select
                  multiple
                  value={selectedDates}
                  onChange={handleDateSelectionChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  size={1}
                >
                  {Object.keys(reportData.itemsByDate)
                    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                    .map((date) => (
                      <option key={date} value={date}>
                        Day {getDayFromDate(date)}
                      </option>
                    ))}
                </select>

                {selectedDates.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>

              {/* Items breakdown for selected dates */}
              {selectedDates.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    {selectedDates.length === 1
                      ? `Items sold on Day ${getDayFromDate(selectedDates[0])} - ${getMonthYearDisplay()}`
                      : `Items sold across ${selectedDates.length} selected dates - ${getMonthYearDisplay()}`}
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(aggregatedItems)
                      .sort((a, b) => b[1].revenue - a[1].revenue)
                      .map(([itemName, data]) => (
                        <div
                          key={itemName}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <div>
                            <div className="font-medium text-gray-900">{itemName}</div>
                            <div className="text-sm text-gray-600">
                              Quantity sold: {data.quantity}
                            </div>
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            ${data.revenue.toFixed(2)}
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">
                        {selectedDates.length === 1
                          ? `Total for Day ${getDayFromDate(selectedDates[0])}:`
                          : `Total for selected dates:`}
                      </span>
                      <span className="text-xl font-bold text-blue-600">
                        ${Object.values(aggregatedItems)
                          .reduce((sum, item) => sum + item.revenue, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

          {/* Orders by Category */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              Sales by Category
              {selectedMonth && selectedYear && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  - {monthOptions[parseInt(selectedMonth) - 1]?.label} {selectedYear}
                </span>
              )}
            </h2>
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
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              Orders by Payment Status
              {selectedMonth && selectedYear && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  - {monthOptions[parseInt(selectedMonth) - 1]?.label} {selectedYear}
                </span>
              )}
            </h2>
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
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              Sales by Payment Method
              {selectedMonth && selectedYear && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  - {monthOptions[parseInt(selectedMonth) - 1]?.label} {selectedYear}
                </span>
              )}
            </h2>
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
