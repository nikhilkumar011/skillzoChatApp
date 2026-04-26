import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ── OUTER SHELL: only handles auth guard ──
const Dashboard = () => {
  const { _id, email, logout, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  if (authLoading || !_id) {
    return (
      <div className="min-h-screen bg-[#0b0f2a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <DashboardContent _id={_id} email={email} logout={logout} navigate={navigate} />;
};

// ── INNER CONTENT: all logic lives here, _id is guaranteed non-null ──
const DashboardContent = ({ _id, email, logout, navigate }) => {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("tech");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch("http://localhost:3000/group/all");
        const data = await res.json();
        if (!res.ok) return;
        if (Array.isArray(data)) setGroups(data);
      } catch (err) {
        console.error(err);
        setGroups([]);
      }
    };
    fetchGroups();
  }, []);

  const createGroup = async () => {
    if (!name.trim()) return;
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/group/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, adminId: _id }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setGroups((prev) => [...prev, data]);
      setName("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (group) => {
    try {
      const res = await fetch("http://localhost:3000/group/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: group._id, userId: _id }),
      });
      const data = await res.json();
      if (!res.ok) return;
      navigate(`/chat/${group._id}`, { state: { groupName: group.name } });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isMember = (group) => {
    return group.members?.some((m) =>
      typeof m === "object" ? m._id === _id : m === _id
    );
  };

  const isAdmin = (group) => {
  if (!group.admin) return false;
  return typeof group.admin === "object"
    ? group.admin._id === _id
    : group.admin === _id;
};

  const categoryColors = {
    tech:   { bg: "bg-blue-500/15",   text: "text-blue-400",   dot: "bg-blue-400"   },
    life:   { bg: "bg-green-500/15",  text: "text-green-400",  dot: "bg-green-400"  },
    gaming: { bg: "bg-pink-500/15",   text: "text-pink-400",   dot: "bg-pink-400"   },
    study:  { bg: "bg-amber-500/15",  text: "text-amber-400",  dot: "bg-amber-400"  },
    other:  { bg: "bg-violet-500/15", text: "text-violet-400", dot: "bg-violet-400" },
  };

  const filters = ["all", "tech", "life", "gaming", "study", "other"];

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "all" || g.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const myGroups    = filteredGroups.filter((g) =>  isMember(g));
  const otherGroups = filteredGroups.filter((g) => !isMember(g));
  const avatarLetter = email ? email[0].toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-[#0b0f2a] text-white">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b border-violet-900/30 bg-[#0b0f2a]/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">SkillzoChat</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#12163a] border border-violet-500/20 rounded-xl px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold">
              {avatarLetter}
            </div>
            <span className="text-sm text-violet-200 hidden sm:block max-w-[140px] truncate">{email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Total groups",  value: groups.length },
            { label: "My groups",     value: groups.filter((g) => isMember(g)).length },
            { label: "Groups I admin",value: groups.filter((g) => isAdmin(g)).length },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#12163a] border border-violet-500/15 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-violet-400/70 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── CREATE GROUP ── */}
        <div className="bg-[#12163a] border border-violet-500/20 rounded-2xl p-5 mb-8 shadow-lg">
          <h2 className="text-sm font-semibold text-violet-300/70 uppercase tracking-widest mb-4">Create a new group</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              placeholder="Group name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createGroup()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a1f4a] border border-violet-500/15 text-white placeholder-violet-500/40 outline-none focus:border-violet-500/50 transition-all text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-[#1a1f4a] border border-violet-500/15 text-white outline-none text-sm focus:border-violet-500/50 transition-all"
            >
              <option value="tech">💻 Tech</option>
              <option value="life">🌿 Life</option>
              <option value="gaming">🎮 Gaming</option>
              <option value="study">📚 Study</option>
              <option value="other">✨ Other</option>
            </select>
            <button
              onClick={createGroup}
              disabled={loading || !name.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating...
                </span>
              ) : "+ Create"}
            </button>
          </div>
        </div>

        {/* ── SEARCH + FILTERS ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#12163a] border border-violet-500/15 text-white placeholder-violet-500/40 outline-none focus:border-violet-500/40 transition-all text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  activeFilter === f
                    ? "bg-violet-600 text-white"
                    : "bg-[#12163a] border border-violet-500/15 text-violet-400/70 hover:border-violet-500/40"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── MY GROUPS ── */}
        {myGroups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-violet-300/60 uppercase tracking-widest mb-3">My groups</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {myGroups.map((g) => (
                <GroupCard key={g._id} group={g} isMember={true} isAdmin={isAdmin(g)} onJoin={joinGroup} categoryColors={categoryColors} />
              ))}
            </div>
          </div>
        )}

        {/* ── DISCOVER ── */}
        <div>
          <h2 className="text-sm font-semibold text-violet-300/60 uppercase tracking-widest mb-3">
            {myGroups.length > 0 ? "Discover" : "All groups"}
          </h2>

          {otherGroups.length === 0 && myGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-violet-400/50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <p className="text-violet-300/50 text-sm font-medium">No groups found</p>
              <p className="text-violet-400/30 text-xs">Create one above to get started</p>
            </div>
          )}

          {otherGroups.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {otherGroups.map((g) => (
                <GroupCard key={g._id} group={g} isMember={false} isAdmin={false} onJoin={joinGroup} categoryColors={categoryColors} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// ── GROUP CARD ──
const GroupCard = ({ group, isMember, isAdmin, onJoin, categoryColors }) => {
  const colors = categoryColors[group.category] || categoryColors.other;

  return (
    <div className="bg-[#12163a] border border-violet-500/15 rounded-2xl p-4 flex items-center gap-4 hover:border-violet-500/35 hover:bg-[#14194a] transition-all duration-200">
      <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
        <span className={`text-lg font-bold ${colors.text}`}>
          {group.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-white text-sm truncate">{group.name}</h3>
          {isAdmin && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 shrink-0">admin</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-xs ${colors.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            {group.category}
          </span>
          <span className="text-violet-500/40 text-xs">·</span>
          <span className="text-violet-400/50 text-xs">{group.members?.length || 0} members</span>
        </div>
      </div>

      <button
        onClick={() => onJoin(group)}
        className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
          isMember
            ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/40"
            : "bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/40"
        }`}
      >
        {isMember ? "Open →" : "Join"}
      </button>
    </div>
  );
};

export default Dashboard;