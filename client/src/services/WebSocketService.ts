/**
 * WebSocket service for real-time game communication
 */

export interface WebSocketMessage {
  type: string
  data?: any
  [key: string]: any
}

export type MessageHandler = (message: WebSocketMessage) => void

export class WebSocketService {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageHandlers: Map<string, MessageHandler[]> = new Map()
  private isConnected = false

  constructor(url: string) {
    this.url = url
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.isConnected = true
          this.reconnectAttempts = 0
          this.emit('connected', {})
          resolve()
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected', event)
          this.isConnected = false
          this.emit('disconnected', {})

          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`)
            setTimeout(() => {
              this.connect()
            }, this.reconnectDelay * this.reconnectAttempts)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.emit('error', { error })
          reject(error)
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage
            this.handleMessage(message)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }
      } catch (error) {
        console.error('Error creating WebSocket:', error)
        reject(error)
      }
    })
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type)
    if (handlers) {
      handlers.forEach((handler) => handler(message))
    }

    // Also emit to wildcard handlers
    const wildcardHandlers = this.messageHandlers.get('*')
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(message))
    }
  }

  public on(messageType: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, [])
    }
    this.messageHandlers.get(messageType)!.push(handler)
  }

  public off(messageType: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(messageType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  public send(message: WebSocketMessage) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  private emit(type: string, data: any) {
    this.handleMessage({ type, data })
  }

  public disconnect() {
    if (this.ws) {
      this.maxReconnectAttempts = 0 // Prevent reconnection
      this.ws.close()
      this.ws = null
    }
  }

  public getConnectionState(): boolean {
    return this.isConnected
  }

  // Convenience methods for common game messages
  public sendUnitCommand(unitIds: string[], command: string, target?: any) {
    this.send({
      type: 'unit_command',
      data: {
        unitIds,
        command,
        target,
        timestamp: Date.now(),
      },
    })
  }

  public sendBuildCommand(buildingType: string, position: any) {
    this.send({
      type: 'build_command',
      data: {
        buildingType,
        position,
        timestamp: Date.now(),
      },
    })
  }

  public sendChatMessage(message: string) {
    this.send({
      type: 'chat_message',
      data: {
        message,
        timestamp: Date.now(),
      },
    })
  }

  public requestGameState() {
    this.send({
      type: 'request_game_state',
      data: {
        timestamp: Date.now(),
      },
    })
  }
}

// Singleton instance for game WebSocket
let gameWebSocket: WebSocketService | null = null

export function getGameWebSocket(gameId: string): WebSocketService {
  if (!gameWebSocket) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = import.meta.env.VITE_WS_HOST || window.location.host
    const wsUrl = `${wsProtocol}//${wsHost}/ws/game/${gameId}/`
    gameWebSocket = new WebSocketService(wsUrl)
  }
  return gameWebSocket
}

export function disconnectGameWebSocket() {
  if (gameWebSocket) {
    gameWebSocket.disconnect()
    gameWebSocket = null
  }
}
