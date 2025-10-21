export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Vine Church Cafeteria
          </h1>
          <p className="text-xl text-gray-600">
            Cafeteria Management System
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <a
            href="/items"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="text-4xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              Items Management
            </h2>
            <p className="text-gray-600">
              Register and manage cafeteria items with categories and prices
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
              Orders Management
            </h2>
            <p className="text-gray-600">
              Create orders, track total costs, and manage payment status
            </p>
            <div className="mt-4 text-purple-600 font-medium group-hover:translate-x-2 transition-transform inline-block">
              Manage Orders →
            </div>
          </a>
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Quick Setup Guide</h3>
          <ol className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              <span>Create a <code className="bg-gray-100 px-2 py-1 rounded text-sm">.env</code> file based on <code className="bg-gray-100 px-2 py-1 rounded text-sm">.env.example</code></span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>Add your Supabase credentials to the <code className="bg-gray-100 px-2 py-1 rounded text-sm">.env</code> file</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>Run the database setup script (see README.md)</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              <span>Start managing your cafeteria!</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
