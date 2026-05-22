import { useEffect, useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import * as api from '@/lib/api';
import type { SupportTicket } from '@/types';

const faqs: Array<{ q: string; a: string }> = [
  { q: 'How do I join a team?', a: 'Upload your CV first, then use Team page options to join or invite members.' },
  { q: 'Why can I not see candidate students?', a: 'Candidate recommendations unlock only after CV upload.' },
  { q: 'Can I edit project repo link?', a: 'Yes, captain can update team project name and repository URL.' }
];

export const StudentSupportPage = () => {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(faqs[0]?.q ?? null);
  const [subject, setSubject] = useState('Technical Issue');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const rows = await api.fetchSupportTickets();
        if (active) setTickets(rows);
      } catch {
        if (active) setTickets([]);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  const submit = async () => {
    if (!message.trim()) return;
    await api.createSupportTicket(subject, message.trim());
    const rows = await api.fetchSupportTickets();
    setTickets(rows);
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-100">FAQ</h3>
          <div className="space-y-2">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-xl border border-white/10 bg-white/5">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm font-medium text-slate-200"
                  onClick={() => setExpandedFaq((prev) => (prev === item.q ? null : item.q))}
                >
                  {item.q}
                </button>
                {expandedFaq === item.q && <p className="px-3 pb-3 text-sm text-slate-400">{item.a}</p>}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-100">Support Ticket</h3>
          <div className="space-y-3">
            <select
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            >
              <option>Technical Issue</option>
              <option>Team Issue</option>
              <option>Event Question</option>
              <option>Other</option>
            </select>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe your issue"
              className="h-32 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            />
            <Button className="w-full" onClick={async () => submit()}>Submit Ticket</Button>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-100">My Tickets</h3>
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <details key={ticket.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm text-slate-200">
                <span>{ticket.subject}</span>
                <Badge
                  color={
                    ticket.status === 'open' ? 'amber' : ticket.status === 'in_progress' ? 'cyan' : 'emerald'
                  }
                >
                  {ticket.status}
                </Badge>
              </summary>
              <p className="mt-2 text-sm text-slate-400">{ticket.message}</p>
              {ticket.response && <p className="mt-2 rounded-lg bg-white/10 p-2 text-sm text-slate-300">{ticket.response}</p>}
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
};
