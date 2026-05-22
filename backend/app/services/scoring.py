from collections import defaultdict

from app.models import JudgePermission, ScoreEntry

CRITERIA = ["technical", "presentation", "innovation", "teamwork"]
TARGET_MAX_PER_CRITERION = 25.0


def _judge_permission_map(judge_ids: list[str]):
    rows = JudgePermission.query.filter(JudgePermission.judge_id.in_(judge_ids)).all()
    result = defaultdict(dict)
    for row in rows:
        result[row.judge_id][row.criterion] = row.max_points
    return result


def aggregate_scores_for_team_event(team_id: str, event_id: str):
    entries = ScoreEntry.query.filter_by(team_id=team_id, event_id=event_id).all()
    if not entries:
        return {
            "technical": 0.0,
            "presentation": 0.0,
            "innovation": 0.0,
            "teamwork": 0.0,
            "total": 0.0,
            "judgeCount": 0,
        }

    judge_ids = list({e.judge_id for e in entries})
    permission_map = _judge_permission_map(judge_ids)

    criterion_values = {c: [] for c in CRITERIA}
    normalized_rows = []

    for e in entries:
        judge_perms = permission_map.get(e.judge_id, {})
        normalized_row = {
            "scoreEntryId": e.id,
            "judgeId": e.judge_id,
            "raw": {},
            "normalized": {},
        }
        for c in CRITERIA:
            raw_val = getattr(e, c)
            normalized_row["raw"][c] = raw_val

            if c not in judge_perms or raw_val is None:
                normalized_row["normalized"][c] = None
                continue

            max_points = judge_perms[c]
            if max_points <= 0:
                normalized_row["normalized"][c] = None
                continue

            normalized = (float(raw_val) / float(max_points)) * TARGET_MAX_PER_CRITERION
            criterion_values[c].append(normalized)
            normalized_row["normalized"][c] = round(normalized, 2)

        normalized_rows.append(normalized_row)

    aggregated = {}
    total = 0.0
    for c in CRITERIA:
        avg = sum(criterion_values[c]) / len(criterion_values[c]) if criterion_values[c] else 0.0
        aggregated[c] = round(avg, 2)
        total += avg

    aggregated["total"] = round(total, 2)
    aggregated["judgeCount"] = len(entries)
    aggregated["rows"] = normalized_rows
    return aggregated

