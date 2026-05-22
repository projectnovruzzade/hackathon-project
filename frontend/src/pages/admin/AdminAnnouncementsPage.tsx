import { useMemo, useState } from 'react';
import { Badge, Button, Card } from '@/components/ui';
import { useAnnouncementStore } from '@/store/useAnnouncementStore';
import type { Announcement } from '@/types';

const typeColors: Record<Announcement['type'], 'rose' | 'violet' | 'emerald' | 'slate'> = {
  urgent: 'rose',
  event: 'violet',
  result: 'emerald',
  general: 'slate'
};

export const AdminAnnouncementsPage = () => {
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncementStore();
  const [selectedId, setSelectedId] = useState(announcements[0]?.id ?? '');
  const [form, setForm] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    type: 'general',
    targetRole: 'all',
    pinned: false
  });

  const selected = useMemo(() => announcements.find((item) => item.id === selectedId), [announcements, selectedId]);

  const submit = () => {
    if (!form.title || !form.content || !form.type || !form.targetRole) return;

    if (selected && selected.id === selectedId) {
      updateAnnouncement(selectedId, {
        ...selected,
        ...form,
        expiresAt: form.expiresAt,
        pinned: Boolean(form.pinned)
      });
      return;
    }

    addAnnouncement({
      id: `a-${Date.now()}`,
      title: form.title,
      content: form.content,
      type: form.type,
      targetRole: form.targetRole,
      createdAt: new Date(),
      authorId: 'admin-1',
      pinned: Boolean(form.pinned),
      readBy: [],
      expiresAt: form.expiresAt
    });
  };

  const loadForEdit = () => {
    if (!selected) return;
    setForm(selected);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-100">Announcements List</h3>
        <div className="space-y-2">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="mb-1 flex items-center justify-between">
                <button type="button" onClick={() => setSelectedId(announcement.id)} className="text-left text-sm font-medium text-slate-100">
                  {announcement.pinned ? '?? ' : ''}{announcement.title}
                </button>
                <Badge color={typeColors[announcement.type]}>{announcement.type}</Badge>
              </div>
              <p className="text-xs text-slate-400">{announcement.content.slice(0, 100)}...</p>
              <div className="mt-2 flex gap-2">
                <Button variant="ghost" onClick={loadForEdit}>Edit</Button>
                <Button variant="danger" onClick={() => deleteAnnouncement(announcement.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-100">Create / Edit</h3>
        <div className="space-y-3">
          <input
            value={form.title ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Title"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
          />
          <textarea
            value={form.content ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            placeholder="Content"
            className="h-28 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as Announcement['type'] }))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            >
              <option value="general">General</option>
              <option value="event">Event</option>
              <option value="result">Result</option>
              <option value="urgent">Urgent</option>
            </select>
            <select
              value={form.targetRole}
              onChange={(event) => setForm((prev) => ({ ...prev, targetRole: event.target.value as Announcement['targetRole'] }))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            >
              <option value="all">All</option>
              <option value="student">Students</option>
              <option value="admin">Admins</option>
            </select>
            <input
              type="date"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, expiresAt: event.target.value ? new Date(event.target.value) : undefined }))
              }
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            />
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(form.pinned)}
                onChange={(event) => setForm((prev) => ({ ...prev, pinned: event.target.checked }))}
              />
              Pin announcement
            </label>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
            Preview: {(form.title || 'Untitled')} - {(form.content || 'No content yet')}
          </div>

          <Button className="w-full" onClick={submit}>Preview ? Send</Button>
        </div>
      </Card>
    </div>
  );
};
