class DummySocket {
  connected = false

  on(..._args: any[]) {
    return this
  }

  emit(..._args: any[]) {
    return this
  }

  off(..._args: any[]) {
    return this
  }

  disconnect() {}
}

export const socket = new DummySocket()