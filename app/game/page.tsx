"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

export default function GamePage() {
  const router = useRouter();
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultDelayActive, setResultDelayActive] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const currentUserRef = useRef<any>(null);
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
  const [lastSessionResult, setLastSessionResult] = useState<any>(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      setCurrentUser(user);
      if (!user) {
        router.push("/auth");
        return;
      }
      // Always get token from localStorage for WebSocket connection
      const localToken = user?.token || user?.access || user?.access_token;
      if (localToken) {
        connect(localToken);
      }
    }
    return () => {
      disconnect();
      // Remove WebSocket message listener on unmount
      const ws = getGameWebSocket();
      ws.setOnMessage(() => {});
    };
  }, [router]);

  // Listen for WebSocket responses
  useEffect(() => {
    const ws = getGameWebSocket();
    ws.setOnMessage((msg) => {
      if (msg.type === 'session_update' || msg.type === 'session_info') {
        
      } else if (msg.type === 'select_number_result') {
        setShowResult(true);
        setResultDelayActive(true);
      } else if (msg.type === "session_ended") {
        const user = currentUserRef.current;
        const userParticipation = msg.participations?.find(
          (p: any) => p.user__username === user?.username
        );
        // Store last session result for display
        setLastSessionResult({
          winningNumber: msg.winning_number,
          winners: msg.winners,
          totalParticipants: msg.participations?.length ?? 0,
        });
        if (userParticipation && userParticipation.selected_number != null) {
          setShowResult(true);
          setResultData({
            winningNumber: msg.winning_number,
            winners: msg.winners,
            participations: msg.participations,
          });
          setSelectedNumber(null);
          if (user) fetchStats(user.user_id || user.id);
        } else {
          setShowResult(false);
          setResultData(null);
        }
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
    }
  }, [session?.winning_number]);

  if (!currentUser) return null;
  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Connecting to game server...</div>;
  if (error) return <div style={{ padding: 40, textAlign: "center", color: "red" }}>{error}</div>;
  if (!session) return <div style={{ padding: 40, textAlign: "center" }}><span className="ant-spin ant-spin-spinning" style={{ fontSize: 32, color: '#1890ff' }}></span></div>;

  const timeLeft = session.time_remaining;
  const progressPercentage = session.time_remaining ? Math.round((session.time_remaining / 20) * 100) : 0;
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
              const totalParticipants = resultData?.participations?.length ?? 0;
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
                    <br />
                    Total participants: <strong>{totalParticipants}</strong>
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

            <Button type="primary" onClick={() => setShowResult(false)} size="large" block>
              Close
            </Button>
          </div>
        </Modal>

        {/* Game Progress */}
        <Card
          title={
            <Space>
              <PlayCircleOutlined />
              <span>Game in Progress</span>
              <Tag color="green" style={{ marginLeft: 8 }}>
                Players Joined: {session.player_count ?? 0}
              </Tag>
            </Space>
          }
          style={{ marginBottom: "12px" }}
        >
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: "10px" }}
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
              showInfo={false}
            />
          </Space>

          {lastSessionResult && (
            <>
              <div style={{ textAlign: 'center', marginTop: 18, marginBottom: 2 }}>
                <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: 0.5, color: '#444' }}>
                  Last Session Results
                </span>
              </div>
              <Card
                type="inner"
                title={null}
                bordered={false}
                style={{
                  marginTop: 4,
                  marginBottom: 0,
                  background: '#f6faff',
                  boxShadow: 'none',
                  borderRadius: 8,
                  padding: 0,
                  maxWidth: 320,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
                bodyStyle={{ padding: 5 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
                    <span style={{ fontSize: 18, color: '#1890ff' }}>🎯</span>
                    <span style={{ fontSize: 13, color: '#888' }}>Winning No.</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{lastSessionResult.winningNumber}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
                    <span style={{ fontSize: 18, color: '#52c41a' }}>👥</span>
                    <span style={{ fontSize: 13, color: '#888' }}>Players</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{lastSessionResult.totalParticipants}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
                    <span style={{ fontSize: 18, color: '#faad14' }}>🏆</span>
                    <span style={{ fontSize: 13, color: '#888' }}>Winners</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{lastSessionResult.winners ? lastSessionResult.winners.length : 0}</span>
                  </div>
                </div>
              </Card>
            </>
          )}
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