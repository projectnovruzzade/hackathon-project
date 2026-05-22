import { useState } from 'react';
import { PerformanceLineChart, ScoreBarsChart, SkillDistributionDonut } from '@/components/charts';
import { Button, Card } from '@/components/ui';
import { useEventStore } from '@/store/useEventStore';

export const AdminReportsPage = () => {
  const events = useEventStore((state) => state.events);
  const [eventId, setEventId] = useState<string>('all');

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap gap-2">
          <input type="date" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          <input type="date" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
          <select
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
          >
            <option value="all">All Events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold text-slate-100">1. Team Performance Report</h3>
        <div className="space-y-2 text-sm text-slate-300">
          <div className="rounded-xl bg-white/5 p-3">Binary Wolves | Baku Tech | Avg 84 | Rank 1 | Chemistry 86</div>
          <div className="rounded-xl bg-white/5 p-3">Stack Overflow | CTF Spring | Avg 77 | Rank 2 | Chemistry 74</div>
        </div>
        <div className="mt-4">
          <ScoreBarsChart
            data={[
              { name: 'Baku', technical: 81, presentation: 75, innovation: 79, teamwork: 83 },
              { name: 'CTF', technical: 78, presentation: 70, innovation: 74, teamwork: 76 }
            ]}
          />
        </div>
        <Button className="mt-3" variant="secondary">Export CSV</Button>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold text-slate-100">2. Participant Skills Report</h3>
        <div className="grid gap-4 xl:grid-cols-2">
          <SkillDistributionDonut
            data={[
              { name: 'frontend', value: 32 },
              { name: 'backend', value: 28 },
              { name: 'ml', value: 14 },
              { name: 'security', value: 12 },
              { name: 'devops', value: 13 },
              { name: 'design', value: 20 }
            ]}
          />
          <ScoreBarsChart
            data={[
              { name: '0-1y', technical: 45, presentation: 55, innovation: 52, teamwork: 58 },
              { name: '1-3y', technical: 62, presentation: 66, innovation: 64, teamwork: 69 },
              { name: '3-5y', technical: 77, presentation: 74, innovation: 72, teamwork: 78 },
              { name: '5+y', technical: 84, presentation: 80, innovation: 82, teamwork: 85 }
            ]}
          />
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold text-slate-100">3. Judge Activity Report</h3>
        <div className="space-y-2 text-sm text-slate-300">
          <div className="rounded-xl bg-white/5 p-3">Dr. Aydin - completion 96% - avg score 78</div>
          <div className="rounded-xl bg-white/5 p-3">Naila Ibrahimli - completion 88% - avg score 73</div>
          <div className="rounded-xl bg-white/5 p-3">Score bias note: Judge 2 tends to score technical above cohort mean by +5.</div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold text-slate-100">4. Event Summary Report</h3>
        <PerformanceLineChart
          data={[
            { name: 'Baku 2024', score: 68 },
            { name: 'CTF Spring', score: 74 },
            { name: 'AI Sprint', score: 81 },
            { name: 'Buildathon', score: 0 }
          ]}
        />
      </Card>
    </div>
  );
};
