import { useId, useState, type FormEvent } from "react";
import type { NewReservation, Room } from "../domain/types";
import { errorMessage } from "./errorMessage";

interface ReservationFormProps {
  rooms: Room[];
  onCreate: (reservation: NewReservation) => void;
}

type Feedback = { kind: "success" | "error"; text: string };

export function ReservationForm({ rooms, onCreate }: ReservationFormProps) {
  const roomSelectId = useId();
  const [roomId, setRoomId] = useState("");
  const [owner, setOwner] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      onCreate({ roomId, owner, date, start, end });
      setOwner("");
      setStart("");
      setEnd("");
      setFeedback({ kind: "success", text: "Reserva criada com sucesso." });
    } catch (e) {
      setFeedback({ kind: "error", text: errorMessage(e) });
    }
  }

  return (
    <section className="card" aria-labelledby="reservation-form-title">
      <h2 id="reservation-form-title">Nova reserva</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor={roomSelectId}>Escolha a sala</label>
          <select
            id={roomSelectId}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          >
            <option value="">Selecione uma sala</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} ({room.capacity} lugares)
              </option>
            ))}
          </select>
        </div>
        <label>
          Responsável
          <input value={owner} onChange={(e) => setOwner(e.target.value)} />
        </label>
        <label>
          Data da reserva
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <div className="row">
          <label>
            Início
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            Término
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
        {feedback?.kind === "error" && (
          <p role="alert" className="error">
            {feedback.text}
          </p>
        )}
        {feedback?.kind === "success" && (
          <p role="status" className="success">
            {feedback.text}
          </p>
        )}
        <button type="submit">Reservar</button>
      </form>
    </section>
  );
}
