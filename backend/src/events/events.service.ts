import { Injectable } from '@nestjs/common';
import { Observable, Subject, finalize, interval, map, merge } from 'rxjs';

export interface ScheduleChangedEvent {
  type: 'schedule.changed';
  ownerId: string;
  dates: string[];
}

export interface SseMessage {
  type: string;
  data: unknown;
}

@Injectable()
export class EventsService {
  private readonly streams = new Map<string, Set<Subject<SseMessage>>>();

  /** One observable per open connection; heartbeat keeps proxies from closing it. */
  stream(userId: string): Observable<SseMessage> {
    const subject = new Subject<SseMessage>();
    const set = this.streams.get(userId) ?? new Set();
    set.add(subject);
    this.streams.set(userId, set);

    const heartbeat = interval(25000).pipe(map(() => ({ type: 'ping', data: {} })));
    return merge(subject, heartbeat).pipe(
      finalize(() => {
        set.delete(subject);
        if (set.size === 0) this.streams.delete(userId);
      }),
    );
  }

  emit(userId: string, event: ScheduleChangedEvent) {
    this.streams.get(userId)?.forEach((s) => s.next({ type: event.type, data: event }));
  }
}
