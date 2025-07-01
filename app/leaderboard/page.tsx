"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";

interface User {
  username: string;
  wins: number;
  gamesPlayed: number;
  winRate: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [topPlayers, setTopPlayers] = useState<User[]>([]);

  const users = useMemo(() => {
    return JSON.parse(localStorage.getItem("users") || "{}")
  }, []);

  // Convert to array and calculate win rates
  const userArray = useMemo(() => Object.values(users).map((user: any) => ({
    ...user,
    winRate: user.gamesPlayed > 0 ? (user.wins / user.gamesPlayed) * 100 : 0,
  })), [users]);

  // Sort by wins (primary) and win rate (secondary)
  const sortedUsers = useMemo(() => {
    return userArray.sort((a: User, b: User) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return b.winRate - a.winRate;
    });
  }, [userArray]);

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth");
      return;
    }
    setCurrentUser(JSON.parse(userData));

    // Load leaderboard data
    setTopPlayers(sortedUsers.slice(0, 10));
  }, [router, sortedUsers]);

  // Memoize currentUserRank
  const currentUserRank = useMemo(() =>
    topPlayers.findIndex((player) => player.username === currentUser?.username) + 1,
  [topPlayers, currentUser]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">
            #{rank}
          </span>
        );
    }
  };

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

  if (!currentUser) return null;

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
                    {currentUser.wins} wins • {currentUser.gamesPlayed} games •{" "}
                    {currentUser.gamesPlayed > 0
                      ? Math.round(
                          (currentUser.wins / currentUser.gamesPlayed) * 100
                        )
                      : 0}
                    % win rate
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

        {/* Top 10 Players */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Players</CardTitle>
            <CardDescription>Players with the most wins</CardDescription>
          </CardHeader>
          <CardContent>
            {topPlayers.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  No players yet. Be the first to play!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topPlayers.map((player, index) => {
                  const rank = index + 1;
                  const isCurrentUser =
                    player.username === currentUser.username;

                  return (
                    <div
                      key={player.username}
                      className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-4 md:gap-0 ${
                        isCurrentUser
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
                        <div className="flex items-center justify-center w-8">
                          {getRankIcon(rank)}
                        </div>
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="font-bold text-gray-600">
                            {player.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="text-center md:text-left">
                          <p
                            className={`font-semibold text-base md:text-lg ${
                              isCurrentUser ? "text-blue-600" : "text-gray-900"
                            }`}
                          >
                            {player.username}
                            {isCurrentUser && (
                              <span className="text-sm text-blue-500 ml-2">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {player.gamesPlayed} games played
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-row md:flex-col items-center justify-between gap-4 md:gap-0 text-right w-full md:w-auto">
                        <div>
                          <p className="font-bold text-lg">{player.wins}</p>
                          <p className="text-xs text-gray-500">wins</p>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {Math.round(player.winRate)}%
                          </p>
                          <p className="text-xs text-gray-500">rate</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {topPlayers.length}
              </p>
              <p className="text-sm text-gray-600">Total Players</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {topPlayers.reduce(
                  (sum, player) => sum + player.gamesPlayed,
                  0
                )}
              </p>
              <p className="text-sm text-gray-600">Games Played</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {topPlayers.length > 0
                  ? Math.round(
                      topPlayers.reduce(
                        (sum, player) => sum + player.winRate,
                        0
                      ) / topPlayers.length
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
