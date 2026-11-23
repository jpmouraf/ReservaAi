import type { Repository } from "../domain/repository";
import type { Reservation, Room } from "../domain/types";

export const STORAGE_KEYS = {
  rooms: "reservaai:rooms",
  reservations: "reservaai:reservations",
} as const;

export class LocalStorageRepository implements Repository {
  private readonly storage: Storage;

  constructor(storage: Storage = window.localStorage) {
    this.storage = storage;
  }

  getRooms(): Room[] {
    return this.read<Room>(STORAGE_KEYS.rooms);
  }

  saveRooms(rooms: Room[]): void {
    this.storage.setItem(STORAGE_KEYS.rooms, JSON.stringify(rooms));
  }

  getReservations(): Reservation[] {
    return this.read<Reservation>(STORAGE_KEYS.reservations);
  }

  saveReservations(reservations: Reservation[]): void {
    this.storage.setItem(
      STORAGE_KEYS.reservations,
      JSON.stringify(reservations),
    );
  }

  private read<T>(key: string): T[] {
    const raw = this.storage.getItem(key);
    if (raw === null) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
}
