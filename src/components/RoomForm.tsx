import { useState, type FormEvent } from "react";
import { RESOURCES, type NewRoom, type Resource } from "../domain/types";
import { errorMessage } from "./errorMessage";
import { RESOURCE_LABELS } from "./labels";

interface RoomFormProps {
  onCreate: (room: NewRoom) => void;
}

export function RoomForm({ onCreate }: RoomFormProps) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggleResource(resource: Resource) {
    setResources((current) =>
      current.includes(resource)
        ? current.filter((r) => r !== resource)
        : [...current, resource],
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      onCreate({ name, capacity: Number(capacity), resources });
      setName("");
      setCapacity("");
      setResources([]);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <section className="card" aria-labelledby="room-form-title">
      <h2 id="room-form-title">Cadastrar sala</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Nome da sala
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Capacidade
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </label>
        <fieldset>
          <legend>Recursos</legend>
          {RESOURCES.map((resource) => (
            <label key={resource} className="checkbox">
              <input
                type="checkbox"
                checked={resources.includes(resource)}
                onChange={() => toggleResource(resource)}
              />
              {RESOURCE_LABELS[resource]}
            </label>
          ))}
        </fieldset>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button type="submit">Cadastrar sala</button>
      </form>
    </section>
  );
}
