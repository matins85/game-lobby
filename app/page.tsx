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
import { useEffect, useState } from "react";

interface GameSession {
  id: string;
  isActive: boolean;
  timeLeft: number;
  players: string[];
  winningNumber?: number;
}

interface User {
  username: string;
  wins: number;
  gamesPlayed: number;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/auth");
      return;
    }
    setUser(JSON.parse(userData));

    // Initialize or get current game session
    initializeGameSession();
  }, [router]);

  useEffect(() => {
    if (!gameSession?.isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGameSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameSession?.isActive]);

  const initializeGameSession = () => {
    const savedSession = localStorage.getItem("currentGameSession");
    if (savedSession) {
      const session = JSON.parse(savedSession);
      const now = Date.now();
      const elapsed = Math.floor((now - session.startTime) / 1000);
      const remaining = Math.max(0, 20 - elapsed);

      if (remaining > 0) {
        setGameSession(session);
        setTimeLeft(remaining);
        setIsJoined(session.players.includes(user?.username));
      } else {
        startNewSession();
      }
    } else {
      startNewSession();
    }
  };

  const startNewSession = () => {
    const newSession: GameSession = {
      id: `session_${Date.now()}`,
      isActive: true,
      timeLeft: 20,
      players: [],
    };

    const sessionWithTime = {
      ...newSession,
      startTime: Date.now(),
    };

    localStorage.setItem("currentGameSession", JSON.stringify(sessionWithTime));
    setGameSession(newSession);
    setTimeLeft(20);
    setIsJoined(false);
  };

  const endGameSession = () => {
    if (!gameSession) return;

    const winningNumber = Math.floor(Math.random() * 10) + 1;
    const updatedSession = {
      ...gameSession,
      isActive: false,
      winningNumber,
    };

    setGameSession(updatedSession);

    // Save completed session to history
    const gameHistory = JSON.parse(localStorage.getItem("gameHistory") || "[]");
    gameHistory.push(updatedSession);
    localStorage.setItem("gameHistory", JSON.stringify(gameHistory));

    // Start new session after 3 seconds
    setTimeout(() => {
      startNewSession();
    }, 3000);
  };

  const joinSession = () => {
    if (!gameSession?.isActive || !user) return;

    const updatedSession = {
      ...gameSession,
      players: [...gameSession.players, user.username],
    };

    setGameSession(updatedSession);
    setIsJoined(true);

    // Update localStorage
    const sessionData = JSON.parse(
      localStorage.getItem("currentGameSession") || "{}"
    );
    sessionData.players = updatedSession.players;
    localStorage.setItem("currentGameSession", JSON.stringify(sessionData));

    // Navigate to game page
    router.push("/game");
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    router.push("/auth");
  };

  if (!user) return null;

  const progressPercentage = ((20 - timeLeft) / 20) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="text-3xl font-bold text-gray-900">Game Lobby</div>
            <p className="text-gray-600 mt-2">Welcome back, {user.username}!</p>
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
              <span className="text-xl font-bold">{user.wins}</span>
            </div>
            <div className="flex-1 flex flex-col items-center md:items-start border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:px-4">
              <Play className="h-6 w-6 text-blue-500 mb-1" />
              <span className="text-xs text-gray-500">Games Played</span>
              <span className="text-xl font-bold">{user.gamesPlayed}</span>
            </div>
            <div className="flex-1 flex flex-col items-center md:items-start md:pl-4">
              <Users className="h-6 w-6 text-green-500 mb-1" />
              <span className="text-xs text-gray-500">Win Rate</span>
              <span className="text-xl font-bold">
                {user.gamesPlayed > 0
                  ? Math.round((user.wins / user.gamesPlayed) * 100)
                  : 0}
                %
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
            {gameSession?.isActive ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time Remaining</span>
                  <Badge variant={timeLeft > 10 ? "default" : "destructive"}>
                    {timeLeft}s
                  </Badge>
                </div>
                <Progress
                  value={progressPercentage}
                  className="w-full"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Players joined: {gameSession.players.length}
                  </span>
                  {!isJoined ? (
                    <Button
                      onClick={joinSession}
                      disabled={timeLeft < 1}
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
                  {gameSession?.winningNumber ? (
                    <>
                      Last session ended. Winning number was{" "}
                      <Badge variant="secondary" className="text-lg">
                        {gameSession.winningNumber}!
                      </Badge>
                    </>
                  ) : (
                    "Preparing next session..."
                  )}
                </p>

                <p className="text-sm text-gray-500">
                  New session starting soon...
                </p>
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
