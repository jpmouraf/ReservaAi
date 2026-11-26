import { useState } from "react";
import { AvailabilitySearch } from "./components/AvailabilitySearch";
import { ReservationForm } from "./components/ReservationForm";
import { ReservationList } from "./components/ReservationList";
import { RoomForm } from "./components/RoomForm";
import { RoomList } from "./components/RoomList";
import { ReservationSystem } from "./domain/reservationSystem";
import type { NewReservation, NewRoom } from "./domain/types";
import { LocalStorageRepository } from "./infra/localStorageRepository";

interface AppProps {
  system?: ReservationSystem;
}

function App({ system: injected }: AppProps) {
  const [system] = useState(
    () => injected ?? new ReservationSystem(new LocalStorageRepository()),
  );
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const rooms = system.listRooms();

  function createRoom(room: NewRoom) {
    system.addRoom(room);
    refresh();
  }

  function createReservation(reservation: NewReservation) {
    system.createReservation(reservation);
    refresh();
  }

  function cancelReservation(id: string) {
    system.cancelReservation(id);
    refresh();
  }

  return (
    <>
      <header className="header">
        <h1>ReservaAi</h1>
        <p>
          Reserva de salas sem conflito de horário · funcionamento das 07:00 às
          22:00
        </p>
      </header>
      <main className="grid">
        <RoomForm onCreate={createRoom} />
        <RoomList rooms={rooms} />
        <ReservationForm rooms={rooms} onCreate={createReservation} />
        <AvailabilitySearch
          version={version}
          onSearch={(query) => system.findAvailableRooms(query)}
        />
        <ReservationList
          rooms={rooms}
          listReservations={(filter) => system.listReservations(filter)}
          onCancel={cancelReservation}
        />
      </main>
    </>
  );
}

export default App;
