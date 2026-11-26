import { useState, type FormEvent } from "react";
import type { AvailabilityQuery } from "../domain/reservationSystem";
import type { Room } from "../domain/types";
import { errorMessage } from "./errorMessage";

interface AvailabilitySearchProps {
  onSearch: (query: AvailabilityQuery) => Room[];
  version?: number;
}

export function AvailabilitySearch({ onSearch, version = 0 }: AvailabilitySearchProps) {
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [search, setSearch] = useState<{ version: number; results: Room[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const results = search?.version === version ? search.results : null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setSearch({
        version,
        results: onSearch({ date, start, end, minCapacity: Number(minCapacity) || 0 }),
      });
      setError(null);
    } catch (e) {
      setSearch(null);
      setError(errorMessage(e));
    }
  }

  return (
    <section className="card" aria-labelledby="availability-title">
      <h2 id="availability-title">Salas disponíveis</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Data da busca
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setSearch(null); }}
          />
        </label>
        <div className="row">
          <label>
            Disponível a partir de
            <input
              type="time"
              value={start}
              onChange={(e) => { setStart(e.target.value); setSearch(null); }}
            />
          </label>
          <label>
            Disponível até
            <input
              type="time"
              value={end}
              onChange={(e) => { setEnd(e.target.value); setSearch(null); }}
            />
          </label>
        </div>
        <label>
          Lugares necessários
          <input
            type="number"
            min={0}
            value={minCapacity}
            onChange={(e) => { setMinCapacity(e.target.value); setSearch(null); }}
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button type="submit">Buscar salas</button>
      </form>

      {results !== null &&
        (results.length === 0 ? (
          <p className="empty">Nenhuma sala disponível nesse horário.</p>
        ) : (
          <ul aria-label="Salas disponíveis encontradas" className="results">
            {results.map((room) => (
              <li key={room.id}>
                {room.name} — {room.capacity} lugares
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
