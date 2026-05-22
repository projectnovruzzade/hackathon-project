import { useState } from 'react';
import { Badge, Button, Card, Modal } from '@/components/ui';
import { useEventStore } from '@/store/useEventStore';
import type { EventType, HackathonEvent } from '@/types';

const eventTypes: EventType[] = ['hackathon', 'ctf', 'ideasprint', 'buildathon'];

export const AdminEventsPage = () => {
  const events = useEventStore((state) => state.events);
  const addEvent = useEventStore((state) => state.addEvent);
  const updateEvent = useEventStore((state) => state.updateEvent);
  const [open, setOpen] = useState(false);

  const [draft, setDraft] = useState<Partial<HackathonEvent>>({
    name: '',
    description: '',
    type: 'hackathon',
    location: '',
    prize: '',
    teamCount: 0,
    participantCount: 0,
    status: 'upcoming',
    coverColor: 'from-cyan-600 to-teal-500'
  });

  const createEvent = () => {
    if (!draft.name || !draft.startDate || !draft.endDate || !draft.registrationDeadline || !draft.type || !draft.location) {
      return;
    }

    addEvent({
      id: `e-${Date.now()}`,
      name: draft.name,
      type: draft.type,
      description: draft.description ?? '',
      startDate: draft.startDate,
      endDate: draft.endDate,
      location: draft.location,
      status: draft.status ?? 'upcoming',
      teamCount: draft.teamCount ?? 0,
      participantCount: draft.participantCount ?? 0,
      prize: draft.prize,
      registrationDeadline: draft.registrationDeadline,
      coverColor: draft.coverColor ?? 'from-cyan-600 to-teal-500'
    });

    setOpen(false);
    setDraft({
      name: '',
      description: '',
      type: 'hackathon',
      location: '',
      prize: '',
      teamCount: 0,
      participantCount: 0,
      status: 'upcoming',
      coverColor: 'from-cyan-600 to-teal-500'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Events</h3>
            <p className="text-sm text-slate-400">Calendar-style management and status controls.</p>
          </div>
          <Button onClick={() => setOpen(true)}>Create Event</Button>
        </div>
      </Card>

      <div className="space-y-3">
        {events.map((event) => (
          <Card key={event.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-100">{event.name}</p>
                <p className="text-sm text-slate-400">{event.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge color="cyan">{event.type}</Badge>
                  <Badge color={event.status === 'completed' ? 'emerald' : event.status === 'ongoing' ? 'amber' : 'slate'}>
                    {event.status}
                  </Badge>
                  <Badge color="slate">{event.location}</Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => updateEvent(event.id, { status: 'upcoming' })}>Close Registration</Button>
                <Button variant="secondary" onClick={() => updateEvent(event.id, { status: 'ongoing' })}>Start Event</Button>
                <Button variant="danger" onClick={() => updateEvent(event.id, { status: 'completed' })}>End Event</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Event">
        <div className="space-y-3">
          <input
            value={draft.name ?? ''}
            onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Event name"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
          />

          <select
            value={draft.type}
            onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value as EventType }))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
          >
            {eventTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <textarea
            value={draft.description ?? ''}
            onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Description"
            className="h-24 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="date"
              onChange={(event) => setDraft((prev) => ({ ...prev, startDate: new Date(event.target.value) }))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            />
            <input
              type="date"
              onChange={(event) => setDraft((prev) => ({ ...prev, endDate: new Date(event.target.value) }))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            />
            <input
              type="date"
              onChange={(event) => setDraft((prev) => ({ ...prev, registrationDeadline: new Date(event.target.value) }))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            />
            <input
              value={draft.location ?? ''}
              onChange={(event) => setDraft((prev) => ({ ...prev, location: event.target.value }))}
              placeholder="Location"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            />
          </div>

          <input
            value={draft.prize ?? ''}
            onChange={(event) => setDraft((prev) => ({ ...prev, prize: event.target.value }))}
            placeholder="Prize"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
          />

          <div className="grid gap-2 sm:grid-cols-3">
            <input type="number" placeholder="Max team size" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
            <input type="number" placeholder="Max participants" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
            <select className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <option>Manual</option>
              <option>AI-Assisted</option>
              <option>Open registration</option>
            </select>
          </div>

          <Button className="w-full" onClick={createEvent}>Create</Button>
        </div>
      </Modal>
    </div>
  );
};
