import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Heart,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Shield,
  Users,
} from "lucide-react";
import { isAdmin } from "../utils/auth";

const DashboardLayout = ({ children }) => {
  const location = useLocation();

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Ads",
      path: "/my-ads",
      icon: Package,
    },
    ...(isAdmin()
      ? [
          {
            label: "Pending Ads",
            path: "/admin/ads",
            icon: Shield,
          },
          {
            label: "Manage Users",
            path: "/admin/users",
            icon: Users,
          },
        ]
      : []),
    {
      label: "Favorites",
      path: "/favorites",
      icon: Heart,
    },
    {
      label: "Messages",
      path: "/messages",
      icon: MessageCircle,
    },
    {
      label: "Profile",
      path: "/profile",
      icon: User,
    },
    {
      label: "Settings",
      path: "/change-password",
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col p-5">
          <Link
            to="/dashboard"
            className="mb-10 px-3 text-2xl font-bold text-violet-600"
          >
            ReMarket
          </Link>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                    active
                      ? "bg-violet-100 text-violet-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-auto flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:ml-64">{children}</main>
    </div>
  );
};

export default DashboardLayout;
