"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Card, Progress, Tag, Alert, Typography, Space, Row, Col, Modal, Avatar } from "antd"
import { ArrowLeftOutlined, PlayCircleOutlined, TrophyOutlined, CloseOutlined } from "@ant-design/icons"

const { Title, Text } = Typography

interface User {
  username: string
  wins: number
  gamesPlayed: number
}

export default function GamePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [gameResult, setGameResult] = useState<{
    winningNumber: number
    isWinner: boolean
    show: boolean
  } | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/auth")
      return
    }
    setUser(JSON.parse(userData))

    // Check if user is in an active session
    const sessionData = localStorage.getItem("currentGameSession")
    if (!sessionData) {
      router.push("/")
      return
    }

    const session = JSON.parse(sessionData)
    const now = Date.now()
    const elapsed = Math.floor((now - session.startTime) / 1000)
    const remaining = Math.max(0, 20 - elapsed)

    if (remaining <= 0) {
      router.push("/")
      return
    }

    setTimeLeft(remaining)

    // Check if user already submitted a number
    const userSubmission = localStorage.getItem(`submission_${session.id}_${JSON.parse(userData).username}`)
    if (userSubmission) {
      setSelectedNumber(Number.parseInt(userSubmission))
      setIsSubmitted(true)
    }
  }, [router])

  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleGameEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const handleNumberSelect = (number: number) => {
    if (isSubmitted || timeLeft <= 0) return

    setSelectedNumber(number)
    setIsSubmitted(true)

    // Save submission
    const sessionData = JSON.parse(localStorage.getItem("currentGameSession") || "{}")
    localStorage.setItem(`submission_${sessionData.id}_${user?.username}`, number.toString())
  }

  const handleGameEnd = () => {
    if (!user || !selectedNumber) return

    const winningNumber = Math.floor(Math.random() * 10) + 1
    const isWinner = selectedNumber === winningNumber

    // Update user stats
    const updatedUser = {
      ...user,
      gamesPlayed: user.gamesPlayed + 1,
      wins: isWinner ? user.wins + 1 : user.wins,
    }

    // Update localStorage
    localStorage.setItem("user", JSON.stringify(updatedUser))
    const users = JSON.parse(localStorage.getItem("users") || "{}")
    users[user.username] = updatedUser
    localStorage.setItem("users", JSON.stringify(users))

    setUser(updatedUser)
    setGameResult({
      winningNumber,
      isWinner,
      show: true,
    })
  }

  const goHome = () => {
    router.push("/")
  }

  if (!user) return null

  const progressPercentage = ((20 - timeLeft) / 20) * 100
  const numbers = Array.from({ length: 10 }, (_, i) => i + 1)

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={goHome}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white" }}
          >
            Back to Lobby
          </Button>
          <Tag
            color={timeLeft > 10 ? "blue" : "red"}
            style={{ fontSize: "18px", padding: "8px 16px", fontWeight: "bold" }}
          >
            {timeLeft}s
          </Tag>
        </div>

        {/* Game Result Modal */}
        <Modal open={gameResult?.show} footer={null} closable={false} centered width={400}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Avatar
              size={64}
              icon={gameResult?.isWinner ? <TrophyOutlined /> : <CloseOutlined />}
              style={{
                backgroundColor: gameResult?.isWinner ? "#52c41a" : "#ff4d4f",
                marginBottom: "16px",
              }}
            />
            <Title level={3} style={{ color: gameResult?.isWinner ? "#52c41a" : "#ff4d4f", margin: "0 0 8px 0" }}>
              {gameResult?.isWinner ? "Congratulations!" : "Better Luck Next Time!"}
            </Title>
            <Text type="secondary" style={{ display: "block", marginBottom: "24px" }}>
              The winning number was <strong>{gameResult?.winningNumber}</strong>
              <br />
              You picked <strong>{selectedNumber}</strong>
            </Text>

            <div style={{ marginBottom: "24px" }}>
              <Text type="secondary">Your Stats:</Text>
              <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "8px" }}>
                <span>
                  Wins: <strong>{user.wins}</strong>
                </span>
                <span>
                  Games: <strong>{user.gamesPlayed}</strong>
                </span>
                <span>
                  Rate: <strong>{Math.round((user.wins / user.gamesPlayed) * 100)}%</strong>
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
          <Text type="secondary" style={{ display: "block", marginBottom: "16px" }}>
            Pick your lucky number from 1 to 10
          </Text>
          <Space direction="vertical" style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
          <Text type="secondary" style={{ display: "block", marginBottom: "24px" }}>
            {isSubmitted
              ? `You selected ${selectedNumber}. Wait for the results!`
              : "Click on a number to make your selection"}
          </Text>

          {!isSubmitted && timeLeft > 0 ? (
            <Row gutter={[12, 12]}>
              {numbers.map((number) => (
                <Col span={4.8} key={number}>
                  <Button
                    type={selectedNumber === number ? "primary" : "default"}
                    size="large"
                    onClick={() => handleNumberSelect(number)}
                    style={{
                      width: "100%",
                      height: "60px",
                      fontSize: "20px",
                      fontWeight: "bold",
                      aspectRatio: "1",
                    }}
                  >
                    {number}
                  </Button>
                </Col>
              ))}
            </Row>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              {isSubmitted ? (
                <Space direction="vertical" size="large">
                  <Avatar size={64} style={{ backgroundColor: "#1890ff", fontSize: "24px", fontWeight: "bold" }}>
                    {selectedNumber}
                  </Avatar>
                  <Text>Your number is locked in!</Text>
                  <Text type="secondary">Results will be shown when the timer ends.</Text>
                </Space>
              ) : (
                <Alert message="Time's up! Results are being calculated..." type="info" showIcon />
              )}
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
      </div>
    </div>
  )
}
