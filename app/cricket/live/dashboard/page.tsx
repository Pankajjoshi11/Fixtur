import { headers } from "next/headers";

export default function DashboardPage() {
  const heads = headers();
  const userEmail = heads.get("x-user-email");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Welcome to your dashboard
        </h2>
        <p className="text-center text-gray-600">
          You are logged in as {userEmail}
        </p>
      </div>
    </div>
  );
}
