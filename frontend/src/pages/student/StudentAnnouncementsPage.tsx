import { useMemo, useState } from 'react';
import { Badge, Button, Card } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { useAnnouncementStore } from '@/store/useAnnouncementStore';
import { useParticipantStore } from '@/store/useParticipantStore';

const typeColor: Record<string, 'rose' | 'violet' | 'emerald' | 'slate'> = {
  urgent: 'rose',
  event: 'violet',
  result: 'emerald',
  general: 'slate'
};

export const StudentAnnouncementsPage = () => {
  const participant = useParticipantStore((state) => state.participants[0]);
  const { announcements, markAsRead } = useAnnouncementStore();
  const [selectedId, setSelectedId] = useState(announcements[0]?.id ?? '');

  const sorted = useMemo(
    () =>
      [...announcements].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      }),
    [announcements]
  );

  const selected = sorted.find((item) => item.id === selectedId) ?? sorted[0];

  const openAnnouncement = (id: string) => {
    setSelectedId(id);
    markAsRead(id, participant.id);
  };

  const markAllRead = () => {
    sorted.forEach((announcement) => markAsRead(announcement.id, participant.id));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Announcements</h3>
          <Button variant="ghost" onClick={markAllRead}>Mark all read</Button>
        </div>
        <div className="space-y-2">
          {sorted.map((announcement) => {
            const unread = !announcement.readBy.includes(participant.id);
            return (
              <button
                key={announcement.id}
                type="button"
                onClick={() => openAnnouncement(announcement.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selected?.id === announcement.id
                    ? 'border-violet-400/40 bg-violet-500/10'
                    : unread
                      ? 'border-violet-300/35 bg-white/5'
                      : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  {announcement.pinned && <span>??</span>}
                  <p className="font-medium text-slate-100">{announcement.title}</p>
                </div>
                <p className="text-xs text-slate-400">{announcement.content.slice(0, 88)}...</p>
              </button>
            );
          })}
        </div>
      </Card>

      {selected && (
        <Card className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-100">{selected.title}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Badge color={typeColor[selected.type] ?? 'slate'}>{selected.type}</Badge>
            <span>{formatDate(selected.createdAt)}</span>
            <span>Author: {selected.authorId}</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">{selected.content}</p>
        </Card>
      )}
    </div>
  );
};
