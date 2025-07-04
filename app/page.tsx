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
import { Progress } from "@/components/ui/progress";
import { Clock, LogOut, Play, Trophy, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useUserStatsStore } from "@/hooks/useUserStatsStore";
import { useGameSessionStore } from "@/hooks/useGameSessionStore";

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { stats, loading: statsLoading, error: statsError, fetchStats } = useUserStatsStore();
  const { session, loading: sessionLoading, error: sessionError, connect, disconnect } = useGameSessionStore();
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      setCurrentUser(user);
      if (!user) {
        router.push("/auth");
        return;
      }
      fetchStats(user.user_id || user.id);
      connect(user.token || user.access || user.access_token);
    }
    return () => disconnect();
  }, [router]);

  // Check if user is joined in the current session
  useEffect(() => {
    if (!session || !currentUser) {
      setIsJoined(false);
      return;
    }
    setIsJoined((session.players ?? []).includes(currentUser.username));
  }, [session, currentUser]);

  const joinSession = () => {
    if (!session || !currentUser) return;
    if (isJoined) return;

    setIsJoined(true);
    router.push("/game");
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    router.push("/auth");
  };

  if (!currentUser) return null;

  const progressPercentage = session && session.time_remaining ? ((20 - session.time_remaining) / 20) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="text-3xl font-bold text-gray-900">Game Lobby</div>
            <p className="text-gray-600 mt-2">Welcome back, {currentUser.username}!</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* User Stats */}
        <Card className="mb-8">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-2 md:p-4 gap-4">
            <div className="flex-1 flex flex-col items-center md:items-start border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-4">
              <Trophy className="h-6 w-6 text-yellow-500 mb-1" />
              <span className="text-xs text-gray-500">Wins</span>
              <span className="text-xl font-bold">{stats?.wins ?? 0}</span>
            </div>
            <div className="flex-1 flex flex-col items-center md:items-start border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:px-4">
              <Play className="h-6 w-6 text-blue-500 mb-1" />
              <span className="text-xs text-gray-500">Games Played</span>
              <span className="text-xl font-bold">{stats?.games_played ?? 0}</span>
            </div>
            <div className="flex-1 flex flex-col items-center md:items-start md:pl-4">
              <Users className="h-6 w-6 text-green-500 mb-1" />
              <span className="text-xs text-gray-500">Win Rate</span>
              <span className="text-xl font-bold">
                {stats && stats.games_played && stats.games_played > 0 && stats.win_rate != null ? Math.round(stats.win_rate) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Game Session */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Current Game Session</span>
            </CardTitle>
            <CardDescription>
              Pick a number from 1-10 and try to match the winning number!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionLoading ? (
              <div className="text-center py-8">Loading session...</div>
            ) : sessionError ? (
              <div className="text-center py-8 text-red-500">{sessionError}</div>
            ) : session && session.is_active ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time Remaining</span>
                  <Badge variant={session.time_remaining > 10 ? "default" : "destructive"}>
                    {session.time_remaining}s
                  </Badge>
                </div>
                <Progress
                  value={progressPercentage}
                  className="w-full"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Players joined: {(session.players || []).length}
                  </span>
                  {!isJoined ? (
                    <Button
                      onClick={joinSession}
                      disabled={session.time_remaining < 1}
                      variant="default"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Join Game
                    </Button>
                  ) : (
                    <Badge variant="secondary">You're in!</Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  {session && session.winning_number ? (
                    <>
                      Last session ended. Winning number was{" "}
                      <Badge variant="secondary" className="text-lg">
                        {session.winning_number}
                      </Badge>
                    </>
                  ) : (
                    "No active session."
                  )}
                </p>
                <Button onClick={() => router.push("/game")}>Go to Game</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => router.push("/leaderboard")}
              >
                <Trophy className="h-4 w-4 mr-2" />
                View Leaderboard
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => router.push("/history")}
              >
                <Clock className="h-4 w-4 mr-2" />
                Game History
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Play</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Join an active game session</li>
                <li>2. Pick a number from 1-10</li>
                <li>3. Wait for the session to end</li>
                <li>4. Win if your number matches!</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
