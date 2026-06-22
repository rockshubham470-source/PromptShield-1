import { Notification } from '../types/notification'

class WebSocketService {
  private callbacks: Array<(notification: Notification) => void> = []

  connect() {
    console.log('Notifications disabled')
  }

  disconnect() {
    this.callbacks = []
  }

  subscribe(callback: (notification: Notification) => void) {
    this.callbacks.push(callback)

    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback)
    }
  }

  emit(notification: Notification) {
    this.callbacks.forEach(cb => cb(notification))
  }
}

export const websocketService = new WebSocketService()