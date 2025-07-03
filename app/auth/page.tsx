"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Form,
  Card,
  Alert,
  Typography,
  Space,
  Avatar,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Gamepad2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useUserStore } from "@/hooks/useUserStore";

const { Title, Text, Link } = Typography;

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  const setUser = useUserStore((s) => s.setUser);

  const handleSubmit = async (values: { username: string }) => {
    setError("");
    setIsLoading(true);

    const { username } = values;

    try {
      if (isLogin) {
        const data = await apiFetch<any>("login-token/", {
          method: "POST",
          data: { username },
        });
        // Extract token and user info
        const { access_token, ...user } = data;
        setUser(user, access_token);
        router.push("/");
      } else {
        await apiFetch<any>("create-user/", {
          method: "POST",
          data: { username },
        });
        // After signup, auto-login
        const data = await apiFetch<any>("login-token/", {
          method: "POST",
          data: { username },
        });
        const { access_token, ...user } = data;
        setUser(user, access_token);
        router.push("/");
      }
    } catch (err: any) {
      let message = err.message || "An error occurred. Please try again.";
      if (err.response?.data?.non_field_errors) {
        message = err.response.data.non_field_errors[0];
      } else if (err.response?.data?.username) {
        message = Array.isArray(err.response.data.username)
          ? err.response.data.username[0]
          : err.response.data.username;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    form.resetFields();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo/Header */}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Gamepad2 className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Game Lobby</h1>
          <p className="text-gray-600 mt-2">
            Join the number guessing challenge!
          </p>
        </div>

        <Card
          title={
            <Space>
              {isLogin ? <UserOutlined /> : <LockOutlined />}
              <span>{isLogin ? "Welcome Back" : "Create Account"}</span>
            </Space>
          }
        >
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: "24px" }}
          >
            {isLogin
              ? "Enter your username to continue playing"
              : "Choose a username to start your gaming journey"}
          </Text>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[
                { required: true, message: "Username is required" },
                {
                  min: 3,
                  message: "Username must be at least 3 characters long",
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </Form.Item>

            {error && (
              <Form.Item>
                <Alert message={error} type="error" showIcon />
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
              >
                {isLogin ? "Login" : "Register"}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Text type="secondary">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </Text>
            <br />
            <Link onClick={toggleMode} disabled={isLoading}>
              {isLogin ? "Create one here" : "Login here"}
            </Link>
          </div>
        </Card>

        {/* Demo Instructions */}
        <Card
          title="Demo Instructions"
          size="small"
          style={{ marginTop: "24px" }}
        >
          <div style={{ fontSize: "14px", color: "#666" }}>
            <div>• Use any username (3+ characters)</div>
            <div>• New users are automatically registered</div>
            <div>• Game sessions last 20 seconds</div>
            <div>• Pick numbers 1-10 to win!</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
