export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8 fixed-colors">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img
              src="/vine-church-logo.svg"
              alt="Vine Church Logo"
              className="w-24 h-24"
            />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Vine Church Orders Management
          </h1>
          <p className="text-xl text-slate-700">
            Manage orders efficiently for Vine Church
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <a
            href="/items"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="text-4xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
              Items Management
            </h2>
            <p className="text-slate-700">
              Register and manage items with categories and prices
            </p>
            <div className="mt-4 text-blue-600 font-medium group-hover:translate-x-2 transition-transform inline-block">
              Manage Items →
            </div>
          </a>

          <a
            href="/orders"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="text-4xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
              Orders Management
            </h2>
            <p className="text-slate-700">
              Create orders, track total costs, and manage payment status
            </p>
            <div className="mt-4 text-purple-600 font-medium group-hover:translate-x-2 transition-transform inline-block">
              Manage Orders →
            </div>
          </a>

          <a
            href="/reports"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-green-600 transition-colors">
              Sales Reports
            </h2>
            <p className="text-slate-700">
              View analytics by date, category, and payment type
            </p>
            <div className="mt-4 text-green-600 font-medium group-hover:translate-x-2 transition-transform inline-block">
              View Reports →
            </div>
          </a>
        </div>

      </div>
    </div>
  );
}
