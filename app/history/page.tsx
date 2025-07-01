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
import { ArrowLeft, Clock, Trophy, X, Users } from "lucide-react";

interface GameSession {
  id: string;
  isActive: boolean;
  timeLeft: number;
  players: string[];
  winningNumber?: number;
}

interface GameHistory {
  session: GameSession;
  userNumber?: number;
  isWinner?: boolean;
  timestamp: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth");
      return;
    }
    setCurrentUser(JSON.parse(userData));

    // Load game history
    loadGameHistory(JSON.parse(userData));
  }, [router]);

  const loadGameHistory = (user: any) => {
    const sessions = JSON.parse(localStorage.getItem("gameHistory") || "[]");

    // Create history entries for sessions the user participated in
    const userHistory = sessions
      .filter((session: GameSession) => session.players.includes(user.username))
      .map((session: GameSession) => {
        // Try to get user's submitted number for this session
        const userSubmission = localStorage.getItem(
          `submission_${session.id}_${user.username}`
        );
        const userNumber = userSubmission
          ? Number.parseInt(userSubmission)
          : undefined;
        const isWinner = userNumber === session.winningNumber;

        return {
          session,
          userNumber,
          isWinner,
          timestamp: Number.parseInt(session.id.split("_")[1]), // Extract timestamp from session ID
        };
      })
      .sort((a: any, b: any) => b.timestamp - a.timestamp); // Sort by most recent first

    setGameHistory(userHistory);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getResultIcon = (isWinner?: boolean) => {
    if (isWinner === undefined)
      return <Clock className="h-4 w-4 text-gray-400" />;
    return isWinner ? (
      <Trophy className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-red-500" />
    );
  };

  const getResultBadge = (isWinner?: boolean) => {
    if (isWinner === undefined)
      return <Badge variant="outline">No submission</Badge>;
    return isWinner ? (
      <Badge className="bg-green-500 hover:bg-green-600">Won</Badge>
    ) : (
      <Badge variant="destructive">Lost</Badge>
    );
  };

  const totalGames = useMemo(() => gameHistory.length, [gameHistory]);
  const wins = useMemo(() => gameHistory.filter((game) => game.isWinner).length, [gameHistory]);
  const winRate = useMemo(() => totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0, [totalGames, wins]);
  // Memoize number frequency and most picked number
  const numberFrequency = useMemo(() => {
    const counts: { [key: number]: number } = {};
    gameHistory.forEach((game) => {
      if (game.userNumber) {
        counts[game.userNumber] = (counts[game.userNumber] || 0) + 1;
      }
    });
    return counts;
  }, [gameHistory]);
  const mostPicked = useMemo(() => {
    const entries = Object.entries(numberFrequency).sort(([, a], [, b]) => (b as number) - (a as number));
    return entries[0]?.[0] || "—";
  }, [numberFrequency]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4 sm:gap-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <Button variant="outline" onClick={() => router.push("/")}
              className="mb-2 sm:mb-0 w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lobby
            </Button>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                Game History
              </div>
              <p className="text-gray-600 text-sm sm:text-base leading-snug">
                Your past game sessions
              </p>
            </div>
          </div>
          <Clock className="h-8 w-8 text-blue-500 mx-auto sm:mx-0" />
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{totalGames}</p>
              <p className="text-sm text-gray-600">Total Games</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{wins}</p>
              <p className="text-sm text-gray-600">Wins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {totalGames - wins}
              </p>
              <p className="text-sm text-gray-600">Losses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{winRate}%</p>
              <p className="text-sm text-gray-600">Win Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Game History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Games</CardTitle>
            <CardDescription>
              Your participation in past game sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gameHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No game history yet.</p>
                <p className="text-sm text-gray-500">
                  Play some games to see your history here!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {gameHistory.map((game, index) => (
                  <div
                    key={game.session.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 gap-4 md:gap-0"
                  >
                    <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full shadow-inner mb-2 md:mb-0">
                        {getResultIcon(game.isWinner)}
                      </div>
                      <div className="text-center md:text-left">
                        <p className="font-semibold text-gray-900 text-base md:text-lg">
                          Game #{totalGames - index}
                        </p>
                        <p className="text-xs text-gray-500 break-words">
                          {formatDate(game.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 md:gap-8 w-full md:w-auto">
                      <div className="text-center min-w-[70px]">
                        <p className="text-xs text-gray-500">Players</p>
                        <div className="flex items-center justify-center space-x-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold">
                            {game.session.players.length}
                          </span>
                        </div>
                      </div>

                      <div className="text-center min-w-[70px]">
                        <p className="text-xs text-gray-500">Your Pick</p>
                        <p className="font-bold text-lg">
                          {game.userNumber || "—"}
                        </p>
                      </div>

                      <div className="text-center min-w-[90px]">
                        <p className="text-xs text-gray-500">Winning #</p>
                        <p className="font-bold text-lg text-purple-600">
                          {game.session.winningNumber}
                        </p>
                      </div>

                      <div className="text-center min-w-[70px]">
                        <p className="text-xs text-gray-500">Result</p>
                        {getResultBadge(game.isWinner)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Insights */}
        {gameHistory.length > 0 && (
          <Card className="mt-8 shadow-lg rounded-xl border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">Performance Insights</CardTitle>
              <CardDescription className="text-gray-600">Analysis of your gameplay</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-white to-gray-100 rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                  <h4 className="font-semibold mb-2 text-gray-800 text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" /> Number Frequency
                  </h4>
                  <div className="space-y-3">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                      const count = gameHistory.filter(
                        (game) => game.userNumber === num
                      ).length;
                      const percentage =
                        totalGames > 0 ? (count / totalGames) * 100 : 0;
                      return (
                        <div
                          key={num}
                          className="flex items-center justify-between text-sm gap-2"
                        >
                          <span className="text-gray-700 font-medium">{num}</span>
                          <div className="flex-1 mx-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${percentage === Math.max(...Array.from({ length: 10 }, (_, i) => gameHistory.filter((game) => game.userNumber === i + 1).length / totalGames * 100)) ? 'bg-primary' : 'bg-blue-300'}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <span className="w-8 text-right font-semibold text-gray-700">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-gray-100 rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                  <h4 className="font-semibold mb-2 text-gray-800 text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" /> Recent Performance
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Last 5 games win rate:</span>
                      <span className="font-semibold text-primary">
                        {gameHistory.slice(0, 5).filter((g) => g.isWinner).length}/5
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Best streak:</span>
                      <span className="font-semibold text-green-600">
                        {(() => {
                          let maxStreak = 0;
                          let currentStreak = 0;
                          gameHistory.forEach((game) => {
                            if (game.isWinner) {
                              currentStreak++;
                              maxStreak = Math.max(maxStreak, currentStreak);
                            } else {
                              currentStreak = 0;
                            }
                          });
                          return maxStreak;
                        })()} wins
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Most picked number:</span>
                      <span className="font-semibold text-purple-600 bg-purple-50 rounded px-2">
                        {mostPicked}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
