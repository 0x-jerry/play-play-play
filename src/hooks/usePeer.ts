import { remove } from '@0x-jerry/utils'
import { MaybeRef } from '@vueuse/core'
import Peer, { DataConnection } from 'peerjs'

export interface UsePeerOption {
  id?: MaybeRef<string>
  receive?(data: any): void
  hostId?: MaybeRef<string>
  connected?(conn: DataConnection): void
}

export function usePeer(opt?: UsePeerOption) {
  const ctx = reactive({
    id: '',
  })

  const conns: DataConnection[] = []

  const selfId = unref(opt?.id)
  const peer = selfId ? new Peer(selfId) : new Peer()

  peer.on('open', (id) => {
    ctx.id = id
  })

  peer.on('close', () => {
    ctx.id = ''
  })

  peer.on('connection', (conn) => {
    opt?.connected?.(conn)

    conn.on('data', (_data: any) => {
      opt?.receive?.(_data)
      if (_data?.type === 'ping') {
        conn.send({
          type: 'pong',
        })
      }
    })

    conns.push(conn)
  })

  peer.on('disconnected', (connId) => {
    remove(conns, (n) => n.connectionId === connId)
  })

  const connected = ref(false)

  watch(
    () => ctx.id,
    () => {
      if (!ctx.id) return

      connectToHost()
    },
  )

  watch(
    () => unref(opt?.hostId),
    () => {
      if (!ctx.id) return

      connectToHost()
    },
  )

  return {
    ctx,
    connected,
    peer,
    send,
  }

  function send(data: any) {
    conns.forEach((n) => n.send(data))
  }

  function connectToHost() {
    conns.forEach((item) => item.close())
    conns.splice(0)

    const id = unref(opt?.hostId)
    if (!id) return

    const conn = peer.connect(id)
    conns.push(conn)

    conn.on('open', () => {
      connected.value = true
      conn.send({
        type: 'ping',
      })
    })

    conn.on('close', () => {
      connected.value = false
      remove(conns, conn)
    })

    conn.on('data', (_data) => {
      console.log(_data)
      opt?.receive?.(_data)
    })
  }
}
