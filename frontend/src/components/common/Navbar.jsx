import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Plus, User, LayoutDashboard, LogOut, ChevronDown, Menu, X } from "lucide-react";
import { isTokenValid, isAdmin } from "../../utils/auth";
import { getLiveLocation, getCachedCity } from "../../utils/location";

const BASE_CITIES = [
  "All Cities", "Karachi", "Lahore", "Islamabad", "Rawalpindi",
  "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot",
];

const Navbar = ({ onSearch, onCityChange, searchValue = "", cityValue = "All Cities" }) => {
  const navigate = useNavigate();
  const isLoggedIn = isTokenValid();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [localCity, setLocalCity] = useState(cityValue);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedCity, setDetectedCity] = useState(getCachedCity());

  const citiesList = [
    ...BASE_CITIES,
    ...(detectedCity && !BASE_CITIES.includes(detectedCity) ? [detectedCity] : []),
  ];

  const handleUseCurrentLocation = async () => {
    setIsDetecting(true);
    try {
      const res = await getLiveLocation();
      if (res.success && res.city) {
        setDetectedCity(res.city);
        setLocalCity(res.city);
        if (onCityChange) onCityChange(res.city);
      }
    } catch (err) {
      console.error("Failed to detect live location:", err);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(localSearch, localCity);
    } else {
      navigate(`/ads?q=${encodeURIComponent(localSearch)}&city=${encodeURIComponent(localCity)}`);
    }
  };

  const handleSell = () => {
    if (isLoggedIn) {
      navigate("/ads/create");
    } else {
      navigate("/login");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Top bar */}
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-1.5 text-center text-xs text-slate-500">
        🇵🇰 Pakistan's #1 Free Classifieds — Buy & Sell Everything
      </div>

      {/* Main nav */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="mr-2 shrink-0 text-2xl font-extrabold tracking-tight text-violet-700"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Re<span className="text-indigo-400">Market</span>
        </Link>

        {/* Search bar — hidden on mobile */}
        <form
          onSubmit={handleSearch}
          className="hidden flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-200 md:flex"
        >
          {/* City selector */}
          <div className="relative flex items-center border-r border-slate-200">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isDetecting}
              title="Click to detect current location"
              className="pl-3 text-violet-500 hover:text-violet-700 disabled:opacity-50"
            >
              <MapPin size={15} className={isDetecting ? "animate-bounce" : ""} />
            </button>
            <select
              value={localCity}
              onChange={(e) => {
                if (e.target.value === "__DETECT__") {
                  handleUseCurrentLocation();
                  return;
                }
                setLocalCity(e.target.value);
                if (onCityChange) onCityChange(e.target.value);
              }}
              className="appearance-none bg-transparent py-3 pl-2 pr-7 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="__DETECT__">📍 {isDetecting ? "Detecting..." : "Detect Location"}</option>
              {citiesList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Search input */}
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search cars, phones, furniture..."
            className="flex-1 bg-transparent py-3 pl-4 pr-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />

          <button
            type="submit"
            className="m-1.5 flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            <Search size={15} />
            Search
          </button>
        </form>

        {/* Right actions */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Sell button */}
          <button
            onClick={handleSell}
            className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 px-4 py-2 text-sm font-extrabold text-slate-950 shadow-sm transition duration-200 hover:scale-105 hover:shadow-md hover:brightness-105 active:scale-95"
          >
            <Plus size={17} strokeWidth={2.5} />
            <span>Sell</span>
          </button>

          {isLoggedIn ? (
            /* Logged-in user menu */
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:bg-slate-50"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className="hidden sm:inline">{user?.name?.split(" ")[0] || "Account"}</span>
                <ChevronDown size={14} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">{user?.name || "User"}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email || ""}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <LayoutDashboard size={16} className="text-violet-500" />
                    My Dashboard
                  </Link>
                  <Link
                    to="/my-ads"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <User size={16} className="text-violet-500" />
                    My Ads
                  </Link>
                  {isAdmin() && (
                    <Link
                      to="/admin/ads"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <LayoutDashboard size={16} className="text-violet-500" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm text-red-500 transition hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Guest buttons */
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="hidden rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 sm:inline-block"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <div className="mb-2.5 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isDetecting}
              className="flex items-center gap-1.5 font-semibold text-violet-600 active:scale-95 disabled:opacity-50"
            >
              <MapPin size={13} className={isDetecting ? "animate-bounce" : ""} />
              {isDetecting ? "Detecting location..." : detectedCity ? `📍 In ${detectedCity} (Tap to refresh)` : "📍 Detect My Location"}
            </button>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{localCity}</span>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search ads..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Go
            </button>
          </form>
          {!isLoggedIn && (
            <div className="mt-3 flex gap-2">
              <Link to="/login" className="flex-1 rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700">Login</Link>
              <Link to="/signup" className="flex-1 rounded-xl bg-slate-900 py-2.5 text-center text-sm font-semibold text-white">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
