import type { Room } from '../domain/types'
import { RESOURCE_LABELS } from './labels'

interface RoomListProps {
  rooms: Room[]
}

export function RoomList({ rooms }: RoomListProps) {
  return (
    <section className="card" aria-labelledby="room-list-title">
      <h2 id="room-list-title">Salas</h2>
      {rooms.length === 0 ? (
        <p className="empty">Nenhuma sala cadastrada.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Capacidade</th>
              <th>Recursos</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td>{room.name}</td>
                <td>{room.capacity}</td>
                <td>{room.resources.map((r) => RESOURCE_LABELS[r]).join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
