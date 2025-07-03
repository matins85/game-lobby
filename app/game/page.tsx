"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Progress,
  Tag,
  Alert,
  Typography,
  Space,
  Row,
  Col,
  Modal,
  Avatar,
} from "antd";
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  TrophyOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useGameSessionStore } from "@/hooks/useGameSessionStore";
import { useUserStatsStore } from "@/hooks/useUserStatsStore";
import { useUserStore } from "../../hooks/useUserStore";
import { getGameWebSocket } from "@/lib/ws";

const { Title, Text } = Typography;

interface User {
  username: string;
  wins: number;
  gamesPlayed: number;
}

export default function GamePage() {
  const router = useRouter();
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultDelayActive, setResultDelayActive] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { session, loading, error, connect, disconnect } = useGameSessionStore();
  const { stats, fetchStats } = useUserStatsStore();
  const [resultModal, setResultModal] = useState<{
    show: boolean;
    winningNumber?: number;
    winners?: string[];
    totalPlayers?: number;
    isWinner?: boolean;
  }>({ show: false });
  const token = useUserStore((s) => s.token);
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      setCurrentUser(user);
      if (!user) {
        router.push("/auth");
        return;
      }
      if (token) {
        connect(token);
      }
    }
    return () => {
      disconnect();
      // Remove WebSocket message listener on unmount
      const ws = getGameWebSocket();
      ws.setOnMessage(() => {});
    };
  }, [router, token]);

  // Listen for WebSocket responses
  useEffect(() => {
    const ws = getGameWebSocket();
    ws.setOnMessage((msg) => {
      if (msg.type === 'session_update' || msg.type === 'session_info') {
        
      } else if (msg.type === 'select_number_result') {
        setShowResult(true);
        setResultDelayActive(true);
        setTimeout(() => {
          setShowResult(false);
          setResultDelayActive(false);
        }, 5000);
      } else if (msg.type === "session_ended") {
        setShowResult(true);
        setResultData({
          winningNumber: msg.winning_number,
          winners: msg.winners,
          participations: msg.participations,
        });
      }
    });
    return () => {
      ws.setOnMessage(() => {});
    };
  }, []);

  const myParticipation = useMemo(() => {
    if (!session || !currentUser) return null;
    return (session.participations ?? []).find((p) => p.username === currentUser.username) || null;
  }, [session, currentUser]);

  // Show result modal when session ends and user made a selection
  useEffect(() => {
    if (
      session &&
      session.winning_number !== null &&
      selectedNumber !== null
    ) {
      setShowResult(true);
      setResultDelayActive(true);
      setSelectedNumber(null);
      if (currentUser) fetchStats(currentUser.user_id || currentUser.id);
      setTimeout(() => {
        setShowResult(false);
        setResultDelayActive(false);
      }, 5000);
    }
  }, [session?.winning_number]);

  if (!currentUser) return null;
  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Connecting to game server...</div>;
  if (error) return <div style={{ padding: 40, textAlign: "center", color: "red" }}>{error}</div>;
  if (!session) return <div style={{ padding: 40, textAlign: "center" }}>No active game session.</div>;

  const timeLeft = session.time_remaining;
  const progressPercentage = session.time_remaining ? ((session.time_remaining / 20) * 100) : 0;
  const numbers = Array.from({ length: 10 }, (_, i) => i + 1);
  const isSubmitted = !!myParticipation?.selected_number;
  const isSessionEnded = session.winning_number !== null;

  const handleNumberSelect = (number: number) => {
    if (isSubmitted || isSessionEnded || timeLeft <= 0) return;
    setSelectedNumber(number);
    const ws = getGameWebSocket();
    ws.selectNumber(number);
  };

  const goHome = () => {
    disconnect();
    router.push("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={goHome}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
            }}
          >
            Back to Lobby
          </Button>
          <Tag
            color={timeLeft > 10 ? "blue" : "red"}
            style={{
              fontSize: "18px",
              padding: "8px 16px",
              fontWeight: "bold",
            }}
          >
            {timeLeft}s
          </Tag>
        </div>

        {/* Game Result Modal */}
        <Modal
          open={showResult}
          footer={null}
          closable={false}
          centered
          width={400}
        >
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            {(() => {
              const userParticipation = resultData?.participations?.find(
                (p: any) => p.user__username === currentUser?.username
              );
              return (
                <>
                  <Avatar
                    size={64}
                    icon={userParticipation?.is_winner ? <TrophyOutlined /> : <CloseOutlined />}
                    style={{
                      backgroundColor: userParticipation?.is_winner ? "#52c41a" : "#ff4d4f",
                      marginBottom: "16px",
                    }}
                  />
                  <Title
                    level={3}
                    style={{
                      color: userParticipation?.is_winner ? "#52c41a" : "#ff4d4f",
                      margin: "0 0 8px 0",
                    }}
                  >
                    {userParticipation?.is_winner
                      ? "Congratulations!"
                      : "Better Luck Next Time!"}
                  </Title>
                  <Text type="secondary" style={{ display: "block", marginBottom: "24px" }}>
                    The winning number was <strong>{resultData?.winningNumber}</strong>
                    <br />
                    You picked <strong>{userParticipation?.selected_number ?? "—"}</strong>
                  </Text>
                </>
              );
            })()}

            {/* Winners List */}
            <div style={{ marginBottom: "16px" }}>
              <Text type="secondary">Winners:</Text>
              {resultData?.winners && resultData.winners.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {resultData.winners.map((w: string) => (
                    <li key={w}>
                      <span role="img" aria-label="winner">🏆</span> {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <Text type="secondary">No winners this round.</Text>
              )}
            </div>

            <div style={{ marginBottom: "24px" }}>
              <Text type="secondary">Your Stats:</Text>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "24px",
                  marginTop: "8px",
                }}
              >
                <span>
                  Wins: <strong>{stats?.wins ?? 0}</strong>
                </span>
                <span>
                  Games: <strong>{stats?.games_played ?? 0}</strong>
                </span>
                <span>
                  Rate: <strong>{stats?.win_rate ?? 0}%</strong>
                </span>
              </div>
            </div>

            <Button type="primary" onClick={goHome} size="large" block>
              Return to Lobby
            </Button>
          </div>
        </Modal>

        {/* Game Progress */}
        <Card
          title={
            <Space>
              <PlayCircleOutlined />
              <span>Game in Progress</span>
            </Space>
          }
          style={{ marginBottom: "32px" }}
        >
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: "16px" }}
          >
            Pick your lucky number from 1 to 10
          </Text>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text>Time Remaining</Text>
              <Text strong>{timeLeft} seconds</Text>
            </div>
            <Progress
              percent={progressPercentage}
              status={timeLeft > 10 ? "active" : "exception"}
              strokeColor={timeLeft > 10 ? "#1890ff" : "#ff4d4f"}
            />
          </Space>
        </Card>

        {/* Number Selection */}
        <Card title="Choose Your Number">
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: "24px" }}
          >
            {selectedNumber !== null
              ? `You selected ${selectedNumber}. Wait for the results!`
              : "Click on a number to make your selection"}
          </Text>

          {selectedNumber === null &&
          !isSessionEnded &&
          timeLeft > 0 &&
          !resultDelayActive ? (
            <Row gutter={[12, 12]}>
              {numbers.map((number) => (
                <Col key={number} span={4}>
                  <Button
                    style={{ width: "100%" }}
                    type={selectedNumber === number ? "primary" : "default"}
                    onClick={() => handleNumberSelect(number)}
                    disabled={resultDelayActive}
                  >
                    {number}
                  </Button>
                </Col>
              ))}
            </Row>
          ) : selectedNumber !== null ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Space direction="vertical" size="large">
                <Avatar
                  size={64}
                  style={{
                    backgroundColor: "#1890ff",
                    fontSize: "24px",
                    fontWeight: "bold",
                  }}
                >
                  {selectedNumber}
                </Avatar>
                <Text>Your number is locked in!</Text>
                <Text type="secondary">
                  Results will be shown when the timer ends.
                </Text>
              </Space>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Alert
                message="Time's up! Results are being calculated..."
                type="info"
                showIcon
              />
            </div>
          )}
        </Card>

        {/* Instructions */}
        <Card title="How It Works" size="small" style={{ marginTop: "24px" }}>
          <div style={{ color: "#666" }}>
            <div>• Select a number from 1 to 10</div>
            <div>• Wait for the session timer to end</div>
            <div>• A random winning number will be drawn</div>
            <div>• Win if your number matches the winning number!</div>
          </div>
        </Card>

        {/* Session Result Modal (for late participation) */}
        <Modal
          open={resultModal.show}
          footer={null}
          closable={false}
          centered
          width={400}
        >
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Title
              level={3}
              style={{ color: resultModal.isWinner ? "#52c41a" : "#ff4d4f" }}
            >
              {resultModal.isWinner
                ? "Congratulations!"
                : "Better Luck Next Time!"}
            </Title>
            <Text type="secondary">
              Winning number: <b>{resultModal.winningNumber}</b>
              <br />
              Total players: <b>{resultModal.totalPlayers}</b>
            </Text>
            <div style={{ margin: "16px 0" }}>
              <Text type="secondary">Winners:</Text>
              {resultModal.winners && resultModal.winners.length > 0 ? (
                <ul>
                  {resultModal.winners.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : (
                <Text type="secondary">No winners this round.</Text>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}