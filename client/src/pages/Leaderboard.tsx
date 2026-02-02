import { useEffect, useState, useMemo, useCallback } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Medal, Award, Calendar, Globe, CalendarDays } from "lucide-react";
import { Loader2 } from "lucide-react";

type LeaderboardTab = "global" | "weekly" | "monthly";

interface ProfileEntry {
  id: string;
  username: string | null;
  total_points: number;
}

interface LeaderboardEntry extends ProfileEntry {
  points: number;
  rank: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfileEntry[]>([]);
  const [weeklyPoints, setWeeklyPoints] = useState<Record<string, number>>({});
  const [monthlyPoints, setMonthlyPoints] = useState<Record<string, number>>({});
  const [profileMap, setProfileMap] = useState<Record<string, { username: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("global");
  const [currentUserEntry, setCurrentUserEntry] = useState<{ points: number; rank: number } | null>(null);
  const [tabsLoaded, setTabsLoaded] = useState<Set<LeaderboardTab>>(new Set(["global"]));

  // Fetch global leaderboard (top 50) and current user's position if outside top 50
  const fetchGlobalLeaderboard = useCallback(async () => {
    try {
      const profileMapLocal: Record<string, { username: string | null }> = {};

      // Fetch top 50 profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, total_points")
        .order("total_points", { ascending: false })
        .limit(50);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      } else if (profilesData) {
        setProfiles(profilesData);
        profilesData.forEach((p) => {
          profileMapLocal[p.id] = { username: p.username };
        });
      }

      // Check if current user is in top 50, if not fetch their position
      if (user) {
        const userInTop50 = profilesData?.some((p) => p.id === user.id);
        
        if (!userInTop50) {
          // Get user's profile to find their rank
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("id, username, total_points")
            .eq("id", user.id)
            .single();

          if (userProfile) {
          profileMapLocal[userProfile.id] = { username: userProfile.username };
          
          // Count how many users have more points than current user
          const { count } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .gt("total_points", userProfile.total_points);

          const userRank = (count || 0) + 1;
          setCurrentUserEntry({ points: userProfile.total_points, rank: userRank });
        }
        } else {
          // User is in top 50, clear currentUserEntry
          setCurrentUserEntry(null);
        }
      }

      setProfileMap(profileMapLocal);
    } catch (error) {
      console.error("Error fetching global leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch weekly leaderboard
  const fetchWeeklyLeaderboard = useCallback(async () => {
    if (tabsLoaded.has("weekly")) return; // Already loaded
    
    setTabLoading(true);
    try {
      const { data: weeklyData, error: weeklyError } = await supabase.rpc("get_weekly_leaderboard");

      if (weeklyError) {
        console.error("Error fetching weekly leaderboard:", weeklyError);
      } else if (weeklyData) {
        const weeklyMap: Record<string, number> = {};
        const userIds = new Set<string>();
        
        (weeklyData as { user_id: string; weekly_points: number }[]).forEach((entry) => {
          weeklyMap[entry.user_id] = entry.weekly_points;
          userIds.add(entry.user_id);
        });
        setWeeklyPoints(weeklyMap);

        // Fetch usernames for users not in profileMap
        const missingUserIds = Array.from(userIds).filter((id) => !profileMap[id]);
        if (missingUserIds.length > 0) {
          const { data: missingProfiles } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", missingUserIds);

          if (missingProfiles) {
            setProfileMap((prev) => {
              const updated = { ...prev };
              missingProfiles.forEach((p) => {
                updated[p.id] = { username: p.username };
              });
              return updated;
            });
          }
        }
      }
      setTabsLoaded((prev) => new Set(prev).add("weekly"));
    } catch (error) {
      console.error("Error fetching weekly leaderboard:", error);
    } finally {
      setTabLoading(false);
    }
  }, [profileMap, tabsLoaded]);

  // Fetch monthly leaderboard
  const fetchMonthlyLeaderboard = useCallback(async () => {
    if (tabsLoaded.has("monthly")) return; // Already loaded
    
    setTabLoading(true);
    try {
      const { data: monthlyData, error: monthlyError } = await supabase.rpc("get_monthly_leaderboard");

      if (monthlyError) {
        console.error("Error fetching monthly leaderboard:", monthlyError);
      } else if (monthlyData) {
        const monthlyMap: Record<string, number> = {};
        const userIds = new Set<string>();
        
        (monthlyData as { user_id: string; monthly_points: number }[]).forEach((entry) => {
          monthlyMap[entry.user_id] = entry.monthly_points;
          userIds.add(entry.user_id);
        });
        setMonthlyPoints(monthlyMap);

        // Fetch usernames for users not in profileMap
        const missingUserIds = Array.from(userIds).filter((id) => !profileMap[id]);
        if (missingUserIds.length > 0) {
          const { data: missingProfiles } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", missingUserIds);

          if (missingProfiles) {
            setProfileMap((prev) => {
              const updated = { ...prev };
              missingProfiles.forEach((p) => {
                updated[p.id] = { username: p.username };
              });
              return updated;
            });
          }
        }
      }
      setTabsLoaded((prev) => new Set(prev).add("monthly"));
    } catch (error) {
      console.error("Error fetching monthly leaderboard:", error);
    } finally {
      setTabLoading(false);
    }
  }, [profileMap, tabsLoaded]);

  // Initial load - only fetch global
  useEffect(() => {
    fetchGlobalLeaderboard();

    // Only subscribe to realtime updates if user is authenticated
    if (user) {
      const channel = supabase
        .channel("leaderboard")
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
          fetchGlobalLeaderboard();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "quiz_submissions" }, () => {
          fetchGlobalLeaderboard();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchGlobalLeaderboard]);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === "weekly" && !tabsLoaded.has("weekly")) {
      fetchWeeklyLeaderboard();
    } else if (activeTab === "monthly" && !tabsLoaded.has("monthly")) {
      fetchMonthlyLeaderboard();
    }
  }, [activeTab, tabsLoaded, fetchWeeklyLeaderboard, fetchMonthlyLeaderboard]);


  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-accent" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center font-mono text-muted-foreground">{rank}</span>;
  };

  const getMonthName = () => {
    const now = new Date();
    const monthNames = [
      "იანვარი",
      "თებერვალი",
      "მარტი",
      "აპრილი",
      "მაისი",
      "ივნისი",
      "ივლისი",
      "აგვისტო",
      "სექტემბერი",
      "ოქტომბერი",
      "ნოემბერი",
      "დეკემბერი",
    ];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  };

  const displayedEntries: LeaderboardEntry[] = useMemo(() => {
    let entriesWithPoints: { id: string; username: string | null; points: number }[] = [];
    let currentUserOutsideTop50: { id: string; username: string | null; points: number; rank: number } | null = null;

    if (activeTab === "global") {
      // Global: Use top 50 profiles by total_points (already fetched and sorted)
      entriesWithPoints = profiles.map((p) => ({
        id: p.id,
        username: p.username,
        points: p.total_points,
      }));

      // If current user is outside top 50, add them at the end
      if (user && currentUserEntry && !profiles.some((p) => p.id === user.id)) {
        currentUserOutsideTop50 = {
          id: user.id,
          username: profileMap[user.id]?.username || null,
          points: currentUserEntry.points,
          rank: currentUserEntry.rank,
        };
      }
    } else if (activeTab === "weekly") {
      // Weekly: Get top 50 users from weekly leaderboard RPC
      const weeklyEntries = (Object.entries(weeklyPoints) as [string, number][])
        .map(([userId, points]) => ({
          id: userId,
          username: profileMap[userId]?.username || null,
          points: points,
        }))
        .sort((a, b) => b.points - a.points || a.id.localeCompare(b.id));
      
      const top50 = weeklyEntries.slice(0, 50);
      entriesWithPoints = top50;

      // Check if current user is outside top 50
      if (user) {
        const userEntry = weeklyEntries.find((e) => e.id === user.id);
        if (userEntry && !top50.some((e) => e.id === user.id)) {
          const userRank = weeklyEntries.findIndex((e) => e.id === user.id) + 1;
          currentUserOutsideTop50 = {
            id: user.id,
            username: userEntry.username,
            points: userEntry.points,
            rank: userRank,
          };
        }
      }
    } else {
      // Monthly: Get top 50 users from monthly leaderboard RPC
      const monthlyEntries = (Object.entries(monthlyPoints) as [string, number][])
        .map(([userId, points]) => ({
          id: userId,
          username: profileMap[userId]?.username || null,
          points: points,
        }))
        .sort((a, b) => b.points - a.points || a.id.localeCompare(b.id));
      
      const top50 = monthlyEntries.slice(0, 50);
      entriesWithPoints = top50;

      // Check if current user is outside top 50
      if (user) {
        const userEntry = monthlyEntries.find((e) => e.id === user.id);
        if (userEntry && !top50.some((e) => e.id === user.id)) {
          const userRank = monthlyEntries.findIndex((e) => e.id === user.id) + 1;
          currentUserOutsideTop50 = {
            id: user.id,
            username: userEntry.username,
            points: userEntry.points,
            rank: userRank,
          };
        }
      }
    }

    // Map to LeaderboardEntry with rank
    const entries = entriesWithPoints.map((entry, i) => ({ ...entry, total_points: 0, rank: i + 1 }));

    // Add current user at the end if they're outside top 50
    if (currentUserOutsideTop50) {
      entries.push({
        id: currentUserOutsideTop50.id,
        username: currentUserOutsideTop50.username,
        points: currentUserOutsideTop50.points,
        total_points: 0,
        rank: currentUserOutsideTop50.rank,
      });
    }

    return entries;
  }, [profiles, weeklyPoints, monthlyPoints, profileMap, activeTab, user, currentUserEntry]);

  const currentUserRank = useMemo(() => {
    if (!user) return null;
    const entry = displayedEntries.find((e) => e.id === user.id);
    return entry?.rank || null;
  }, [displayedEntries, user]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as LeaderboardTab);
  };

  const getTabLabel = () => {
    switch (activeTab) {
      case "weekly":
        return "ეს კვირა (ორშ–კვი)";
      case "monthly":
        return getMonthName();
      default:
        return "ყველა დრო";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO 
        title="რეიტინგები და ლიდერბორდი - LastFanStanding"
        description="ნახეთ LFS-ის გლობალური, ყოველთვიური და ყოველკვირეული რეიტინგები. გაიგეთ, ვინ ლიდერობს გრანდ ტურნირის ცხრილს და შეადარეთ თქვენი ქულები თქვენს მეგობრებს და საუკეთესო მოთამაშეებს"
      />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card variant="elevated">
          <CardHeader className="text-center border-b border-border pb-4">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="global" className="flex items-center gap-1 sm:gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">გლობალური</span>
                  <span className="sm:hidden">ყველა</span>
                </TabsTrigger>
                <TabsTrigger value="monthly" className="flex items-center gap-1 sm:gap-2">
                  <CalendarDays className="w-4 h-4" />
                  <span className="hidden sm:inline">თვის</span>
                  <span className="sm:hidden">თვე</span>
                </TabsTrigger>
                <TabsTrigger value="weekly" className="flex items-center gap-1 sm:gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">კვირის</span>
                  <span className="sm:hidden">კვირა</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground mt-3">{getTabLabel()}</p>
            {currentUserRank && <p className="text-sm text-muted-foreground mt-1">თქვენი ადგილი: #{currentUserRank}</p>}
          </CardHeader>
          <CardContent className="p-0">
            {(loading || tabLoading) && displayedEntries.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : displayedEntries.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">ჯერ მოთამაშეები არ არიან</p>
            ) : (
              <div className="divide-y divide-border">
                {displayedEntries.map((entry, index) => {
                  const isCurrentUser = entry.id === user?.id;
                  const isOutsideTop50 = isCurrentUser && entry.rank > 50;
                  const isLastInTop50 = index === 49 && displayedEntries.length > 50;
                  
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 transition-colors relative ${
                        isCurrentUser ? "bg-primary/10" : "hover:bg-secondary/50"
                      } ${isOutsideTop50 ? "border-t-2 border-primary/30" : ""}`}
                    >
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                        <div className="w-6 sm:w-8 flex justify-center flex-shrink-0">{getRankIcon(entry.rank)}</div>
                        <span className="font-medium text-foreground text-sm sm:text-base truncate">
                          {entry.username || "ანონიმური"}
                          {isCurrentUser && <span className="text-primary ml-1">(თქვენ)</span>}
                        </span>
                      </div>
                      <span className="font-display font-bold text-accent text-sm sm:text-base whitespace-nowrap ml-2">{entry.points.toLocaleString()} ქულა</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
