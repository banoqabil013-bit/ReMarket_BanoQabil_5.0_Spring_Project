import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Plus,
  User,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Heart,
  Bell,
  MessageSquare,
  Tag,
  Sparkles,
} from "lucide-react";
import { isTokenValid, isAdmin } from "../../utils/auth";
import { getLiveLocation, getCachedCity } from "../../utils/location";
import { POPULAR_CITIES, PROVINCE_CITIES } from "../../utils/cities";
import { ENDPOINTS } from "../../api/endpoints";
import useApiQuery from "../../hooks/useApiQuery";
import api from "../../api/axios";

const SEARCH_CATEGORIES = [
  "Mobiles",
  "Vehicles",
  "Property for Sale",
  "Property for Rent",
  "Electronics & Appliances",
  "Bikes & Motorcycles",
  "Business & Agriculture",
  "Services",
  "Jobs",
  "Animals & Pets",
  "Furniture & Decor",
  "Fashion & Beauty",
  "Books & Sports",
  "Kids & Baby",
];

const Navbar = ({ onSearch, onCityChange, searchValue = "", cityValue = "All Cities" }) => {
  const navigate = useNavigate();
  const isLoggedIn = isTokenValid();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [localCity, setLocalCity] = useState(cityValue);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedCity, setDetectedCity] = useState(getCachedCity());

  const searchContainerRef = useRef(null);
  const notifContainerRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notifications query (polls unread count every 8 seconds)
  const { data: unreadData, refetch: refetchUnread } = useApiQuery(
    ["unread-notifications"],
    ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
    { enabled: isLoggedIn, refetchInterval: 8000 }
  );

  const unreadCount = unreadData?.count || 0;

  const { data: notifData, refetch: refetchNotifs } = useApiQuery(
    ["notifications"],
    ENDPOINTS.NOTIFICATIONS.GET_ALL,
    { enabled: isLoggedIn && notifOpen }
  );

  const notifications = notifData?.notifications || [];

  const handleMarkAllRead = async () => {
    try {
      await api.patch(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      refetchUnread();
      refetchNotifs();
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    setNotifOpen(false);
    if (!notif.isRead) {
      try {
        await api.patch(ENDPOINTS.NOTIFICATIONS.MARK_READ(notif._id));
        refetchUnread();
      } catch (err) {
        console.error("Mark read error:", err);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

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
      console.error("Failed to detect live location in Navbar:", err);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
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

  // Autocomplete matching items
  const queryClean = localSearch.trim().toLowerCase();
  const matchingCategories = queryClean
    ? SEARCH_CATEGORIES.filter((cat) => cat.toLowerCase().includes(queryClean)).slice(0, 3)
    : [];
  const matchingCities = queryClean
    ? POPULAR_CITIES.filter((city) => city.toLowerCase().includes(queryClean)).slice(0, 3)
    : [];

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

        {/* Search bar & Autocomplete container — hidden on mobile */}
        <div ref={searchContainerRef} className="relative hidden flex-1 md:block">
          <form
            onSubmit={handleSearch}
            className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-200"
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
                className="max-w-[155px] appearance-none bg-transparent py-3 pl-2 pr-7 text-sm font-semibold text-slate-700 outline-none cursor-pointer truncate"
              >
                <option value="All Cities">All Cities</option>
                <option value="__DETECT__">📍 {isDetecting ? "Detecting..." : "Detect Location"}</option>

                <optgroup label="⭐ Popular Cities">
                  {POPULAR_CITIES.map((c) => (
                    <option key={`pop-${c}`} value={c}>{c}</option>
                  ))}
                </optgroup>

                {Object.entries(PROVINCE_CITIES).map(([province, cities]) => (
                  <optgroup key={province} label={`📍 ${province}`}>
                    {cities.map((c) => (
                      <option key={`${province}-${c}`} value={c}>{c}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Search input */}
            <input
              type="text"
              value={localSearch}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Search cars, mobiles, laptops, property..."
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

          {/* ── Search Autocomplete Dropdown ── */}
          {showSuggestions && queryClean.length >= 1 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              {/* Query match */}
              <button
                type="button"
                onClick={() => {
                  setShowSuggestions(false);
                  navigate(`/ads?q=${encodeURIComponent(localSearch)}&city=${encodeURIComponent(localCity)}`);
                }}
                className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm font-semibold text-violet-700 hover:bg-violet-50/60"
              >
                <Search size={15} className="text-violet-600" />
                <span>Search for "{localSearch}" in {localCity}</span>
              </button>

              {/* Category Suggestions */}
              {matchingCategories.length > 0 && (
                <div className="border-b border-slate-100 p-2">
                  <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Categories
                  </p>
                  {matchingCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setShowSuggestions(false);
                        navigate(`/ads?category=${encodeURIComponent(cat)}`);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-violet-700"
                    >
                      <Tag size={13} className="text-slate-400" />
                      <span>{cat}</span>
                      <span className="ml-auto text-[10px] text-slate-400">in Categories</span>
                    </button>
                  ))}
                </div>
              )}

              {/* City Suggestions */}
              {matchingCities.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Locations
                  </p>
                  {matchingCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setLocalCity(city);
                        setShowSuggestions(false);
                        navigate(`/ads?city=${encodeURIComponent(city)}`);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-violet-700"
                    >
                      <MapPin size={13} className="text-slate-400" />
                      <span>{city}</span>
                      <span className="ml-auto text-[10px] text-slate-400">in Pakistan</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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
            <>
              {/* In-App Chat Messages Icon */}
              <Link
                to="/messages"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-violet-300 hover:bg-slate-50"
                title="Chat Messages"
              >
                <MessageSquare size={18} />
              </Link>

              {/* Notifications Bell Dropdown */}
              <div ref={notifContainerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-violet-300 hover:bg-slate-50"
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-sm">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl sm:w-96">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Notifications
                      </h4>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-xs font-semibold text-violet-600 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          <Bell size={24} className="mx-auto mb-2 opacity-40" />
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n._id}
                            type="button"
                            onClick={() => handleNotificationClick(n)}
                            className={`flex w-full items-start gap-3 p-3.5 text-left text-xs transition ${
                              n.isRead
                                ? "bg-white text-slate-600 hover:bg-slate-50"
                                : "bg-violet-50/50 text-slate-900 font-semibold hover:bg-violet-50"
                            }`}
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
                              🔔
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800">{n.title}</p>
                              <p className="line-clamp-2 text-slate-500 font-normal mt-0.5">
                                {n.message}
                              </p>
                              <span className="mt-1 block text-[10px] text-slate-400">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {!n.isRead && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-violet-600 mt-1.5" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Logged-in user menu */}
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
                  <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl z-50">
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
                    <Link
                      to="/messages"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <MessageSquare size={16} className="text-violet-500" />
                      Messages / Chat
                    </Link>
                    <Link
                      to="/favorites"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <Heart size={16} className="text-rose-500" />
                      Saved Ads / Favorites
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
            </>
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

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile search dropdown */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <div className="mb-2">
            <div className="relative">
              <select
                value={localCity}
                onChange={(e) => {
                  setLocalCity(e.target.value);
                  if (onCityChange) onCityChange(e.target.value);
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none"
              >
                <option value="All Cities">🇵🇰 All Pakistan (All Cities)</option>
                <optgroup label="⭐ Popular Cities">
                  {POPULAR_CITIES.map((c) => (
                    <option key={`mob-pop-${c}`} value={c}>{c}</option>
                  ))}
                </optgroup>
                {Object.entries(PROVINCE_CITIES).map(([province, cities]) => (
                  <optgroup key={`mob-${province}`} label={`📍 ${province}`}>
                    {cities.map((c) => (
                      <option key={`mob-${province}-${c}`} value={c}>{c}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
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
