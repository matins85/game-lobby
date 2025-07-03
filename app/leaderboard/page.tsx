"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLeaderboardStore } from "@/hooks/useLeaderboardStore";
import { useUserStatsStore } from "@/hooks/useUserStatsStore";
import { ArrowLeft, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function LeaderboardPage() {
  const router = useRouter();
  const { leaderboard, loading, error, fetchLeaderboard } =
    useLeaderboardStore();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    fetchStats,
  } = useUserStatsStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      setCurrentUser(user);
      setUserId(user?.user_id || user?.id || null);
    }
  }, []);

  useEffect(() => {
    if (currentUser === null) return;
    if (!currentUser) {
      router.push("/auth");
      return;
    }
    fetchLeaderboard();
    if (userId) fetchStats(userId);
  }, [currentUser, userId, router]);

  // Memoize currentUserRank
  const currentUserRank = useMemo(
    () =>
      leaderboard.find((player) => player.username === currentUser?.username)
        ?.rank ?? -1,
    [leaderboard, currentUser]
  );

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">1st</Badge>;
      case 2:
        return <Badge className="bg-gray-400 hover:bg-gray-500">2nd</Badge>;
      case 3:
        return <Badge className="bg-amber-600 hover:bg-amber-700">3rd</Badge>;
      default:
        return <Badge variant="outline">#{rank}</Badge>;
    }
  };

  if (currentUser === null) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4 sm:gap-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="mb-2 sm:mb-0 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lobby
            </Button>
            <div>
              <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 leading-tight break-words">
                Leaderboard
              </div>
              <p className="text-gray-600 text-xs xs:text-sm sm:text-base leading-snug break-words max-w-xs sm:max-w-none">
                Top players by wins
              </p>
            </div>
          </div>
          <Trophy className="h-8 w-8 text-yellow-500 mx-auto sm:mx-0" />
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        {statsError && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {statsError}
          </div>
        )}
        {/* Loading State */}
        {(loading || statsLoading) && (
          <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded">
            Loading leaderboard...
          </div>
        )}

        {/* Current User Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Ranking</CardTitle>
            <CardDescription>
              See how you stack up against other players
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-blue-600">
                    {currentUser.username[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{currentUser.username}</p>
                  <p className="text-sm text-gray-600">
                    {stats?.wins ?? 0} wins • {stats?.games_played ?? 0} games •{" "}
                    {stats?.games_played ? Math.round(stats.win_rate) : 0}% win
                    rate
                  </p>
                </div>
              </div>
              <div className="text-right">
                {currentUserRank > 0 ? (
                  <>
                    {getRankBadge(currentUserRank)}
                    <p className="text-sm text-gray-600 mt-1">
                      {currentUserRank <= 3
                        ? "Great job!"
                        : "Keep playing to climb!"}
                    </p>
                  </>
                ) : (
                  <Badge variant="outline">Not ranked</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top 10 Players Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top 10 Players</CardTitle>
            <CardDescription>
              The best players based on wins, win rate, and streaks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wins
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Games
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Win Rate
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Best Streak
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player) => (
                    <tr
                      key={player.username}
                      className={player.rank <= 3 ? "bg-yellow-50" : ""}
                    >
                      <td className="px-4 py-2 font-bold text-center">
                        {getRankBadge(player.rank)}
                      </td>
                      <td className="px-4 py-2 flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="font-bold text-blue-600">
                            {player.username[0].toUpperCase()}
                          </span>
                        </div>
                        <span>{player.username}</span>
                      </td>
                      <td className="px-4 py-2 text-center">{player.wins}</td>
                      <td className="px-4 py-2 text-center">
                        {player.games_played}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {Math.round(player.win_rate)}%
                      </td>
                      <td className="px-4 py-2 text-center">
                        {player.best_streak}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {leaderboard.length}
              </p>
              <p className="text-sm text-gray-600">Total Players</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {leaderboard.reduce(
                  (sum, player) => sum + player.games_played,
                  0
                )}
              </p>
              <p className="text-sm text-gray-600">Games Played</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {leaderboard.length > 0
                  ? Math.round(
                      leaderboard.reduce(
                        (sum, player) => sum + player.win_rate,
                        0
                      ) / leaderboard.length
                    )
                  : 0}
                %
              </p>
              <p className="text-sm text-gray-600">Avg Win Rate</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
