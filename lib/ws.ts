const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/game/";

let wsInstance: GameWebSocket | null = null;

export function getGameWebSocket(token?: string | null): GameWebSocket {
  let resolvedToken = token;
  if (typeof window !== 'undefined' && !resolvedToken) {
    resolvedToken = localStorage.getItem('authToken');
  }
  if (!wsInstance) {
    wsInstance = new GameWebSocket(resolvedToken || null);
  } else if (resolvedToken && wsInstance && wsInstance.token !== resolvedToken) {
    wsInstance.close();
    wsInstance = new GameWebSocket(resolvedToken);
  }
  return wsInstance;
}

export class GameWebSocket {
  public token: string | null = null;
  private ws: WebSocket | null = null;
  private reconnectTimeout: any = null;
  private heartbeatInterval: any = null;
  private onMessage: ((msg: any) => void) | null = null;
  private onError: ((err: any) => void) | null = null;
  private onOpen: (() => void) | null = null;
  private onClose: (() => void) | null = null;
  private connected: boolean = false;
  private connectionListeners: Array<(connected: boolean) => void> = [];

  constructor(token: string | null) {
    this.token = token;
    this.connect();
  }

  connect() {
    if (this.ws) {
      console.log('[GameWebSocket] Closing previous WebSocket before opening new one');
      this.ws.close();
    }
    const url = this.token ? `${WS_URL}?token=${encodeURIComponent(this.token)}` : WS_URL;
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      this.connected = true;
      this.notifyConnectionListeners(true);
      this.startHeartbeat();
      this.onOpen && this.onOpen();
      console.log('[GameWebSocket] WebSocket connection opened');
    };
    this.ws.onmessage = (event) => this.handleMessage(event);
    this.ws.onerror = (event) => {
      this.onError && this.onError({ message: "WebSocket error", event });
      console.error('[GameWebSocket] WebSocket error', event);
    };
    this.ws.onclose = () => {
      this.connected = false;
      this.notifyConnectionListeners(false);
      this.stopHeartbeat();
      this.onClose && this.onClose();
      console.log('[GameWebSocket] WebSocket connection closed');
      // Reconnect after delay
      this.reconnectTimeout = setTimeout(() => this.connect(), 2000);
    };
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: "trigger_game_session_manager" });
    }, 1000);
  }

  endSessionAndCreateNew(sessionId: string) {
    this.send({ type: "trigger_end_session", session_id: sessionId });
  }

  updateUserStats(sessionId: string, winningNumber: number) {
    this.send({ type: "trigger_update_user_stats", session_id: sessionId, winning_number: winningNumber });
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('[GameWebSocket] WebSocket not open, cannot send:', data);
    }
  }

  setOnMessage(cb: (msg: any) => void) {
    this.onMessage = cb;
  }
  setOnError(cb: (err: any) => void) {
    this.onError = cb;
  }
  setOnOpen(cb: () => void) {
    this.onOpen = cb;
  }
  setOnClose(cb: () => void) {
    this.onClose = cb;
  }
  close() {
    this.stopHeartbeat();
    if (this.ws) {
      console.log('[GameWebSocket] Closing WebSocket connection');
      this.ws.close();
    }
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "session_ended") {
        // Wait 5 seconds, then trigger a new game session
        setTimeout(() => {
          this.send({ type: "trigger_game_session_manager" });
        }, 5000);
      }
      if (["end_session_and_create_new_result", "update_user_stats_result", "game_session_manager_result"].includes(data.type)) {
        this.onMessage && this.onMessage(data);
      } else if (data.type === "error") {
        this.onError && this.onError(data);
      } else {
        this.onMessage && this.onMessage(data);
      }
    } catch (e) {
      this.onError && this.onError({ message: "Invalid message format" });
    }
  }

  selectNumber(number: number) {
    console.log('selectNumber called', { number });
    this.send({ type: 'select_number', number, request_details: true });
  }

  isConnected() {
    return this.connected;
  }

  onConnectionChange(listener: (connected: boolean) => void) {
    this.connectionListeners.push(listener);
    // Immediately notify with current state
    listener(this.connected);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
    };
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(listener => listener(connected));
  }
} 