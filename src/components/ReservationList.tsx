import { useId, useState } from "react";
import type { ReservationFilter } from "../domain/reservationSystem";
import type { Reservation, Room } from "../domain/types";
import { formatDateBR } from "./labels";

interface ReservationListProps {
  rooms: Room[];
  listReservations: (filter: ReservationFilter) => Reservation[];
  onCancel: (id: string) => void;
}

export function ReservationList({
  rooms,
  listReservations,
  onCancel,
}: ReservationListProps) {
  const roomFilterId = useId();
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState("");

  const reservations = listReservations({
    roomId: roomId || undefined,
    date: date || undefined,
  });
  const roomName = (id: string) =>
    rooms.find((r) => r.id === id)?.name ?? "Sala removida";

  return (
    <section className="card wide" aria-labelledby="reservation-list-title">
      <h2 id="reservation-list-title">Reservas</h2>
      <div className="row filters">
        <div className="field">
          <label htmlFor={roomFilterId}>Filtrar por sala</label>
          <select
            id={roomFilterId}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          >
            <option value="">Todas as salas</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
        <label>
          Filtrar por data
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      {reservations.length === 0 ? (
        <p className="empty">Nenhuma reserva encontrada.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Sala</th>
              <th>Responsável</th>
              <th>Data</th>
              <th>Horário</th>
              <th>
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id}>
                <td>{roomName(r.roomId)}</td>
                <td>{r.owner}</td>
                <td>{formatDateBR(r.date)}</td>
                <td>
                  {r.start}–{r.end}
                </td>
                <td>
                  <button
                    type="button"
                    className="danger"
                    aria-label={`Cancelar reserva de ${r.owner} em ${roomName(r.roomId)}`}
                    onClick={() => onCancel(r.id)}
                  >
                    Cancelar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
