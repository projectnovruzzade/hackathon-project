import random
import uuid
from datetime import timedelta

from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import (
    Announcement,
    AnnouncementRead,
    Event,
    Judge,
    JudgeEventAssignment,
    JudgePermission,
    Participant,
    ParticipantSkill,
    ScoreEntry,
    SupportTicket,
    Team,
    TeamMember,
    User,
)
from app.utils.time import utcnow

SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"]
TRACK_TO_SKILLS = {
    "Computer Science": [("Python", "backend"), ("Algorithms", "other"), ("Git", "devops")],
    "Full Stack": [("React", "frontend"), ("TypeScript", "frontend"), ("Node.js", "backend")],
    "Cyber Security": [("Kali Linux", "security"), ("OWASP", "security"), ("Wireshark", "security")],
    "Machine Learning": [("PyTorch", "ml"), ("TensorFlow", "ml"), ("Pandas", "backend")],
}


def _uid() -> str:
    return str(uuid.uuid4())


def _random_avatar(rnd: random.Random):
    return rnd.choice(["violet", "indigo", "emerald", "amber", "rose", "cyan"])


def _create_user(name: str, email: str, role: str, avatar_color: str):
    return User(
        id=_uid(),
        name=name,
        email=email.lower().strip(),
        password_hash=generate_password_hash("password"),
        role=role,
        avatar_color=avatar_color,
    )


def _add_skills(participant_id: str, track: str, rnd: random.Random, source: str = "manual"):
    for skill_name, category in TRACK_TO_SKILLS[track]:
        db.session.add(
            ParticipantSkill(
                participant_id=participant_id,
                name=skill_name,
                category=category,
                level=rnd.choice(SKILL_LEVELS),
                source=source,
            )
        )


def register_seed_commands(app):
    @app.cli.command("seed")
    def seed_database():
        rnd = random.Random(42)
        now = utcnow()

        db.session.query(AnnouncementRead).delete()
        db.session.query(Announcement).delete()
        db.session.query(ScoreEntry).delete()
        db.session.query(JudgePermission).delete()
        db.session.query(JudgeEventAssignment).delete()
        db.session.query(Judge).delete()
        db.session.query(TeamMember).delete()
        db.session.query(Team).delete()
        db.session.query(ParticipantSkill).delete()
        db.session.query(SupportTicket).delete()
        db.session.query(Participant).delete()
        db.session.query(Event).delete()
        db.session.query(User).delete()
        db.session.commit()

        admin_user = _create_user("Shamsi Bayramzadeh", "admin@teamforge.az", "admin", "cyan")
        db.session.add(admin_user)

        # Main student (used by frontend login) starts without CV and without team.
        student_user = _create_user("Novruzzada Tunar", "12730@holbertonstudents.com", "student", "violet")
        db.session.add(student_user)
        main_participant = Participant(
            id=_uid(),
            user_id=student_user.id,
            name="Novruzzada Tunar",
            email=student_user.email,
            avatar_color=student_user.avatar_color,
            experience=0,
            bio="Full stack student looking for a strong hackathon team.",
            github="",
            linkedin="",
            cv_url=None,
            cv_uploaded_at=None,
            university="Full Stack",
            graduation_year=2026,
        )
        db.session.add(main_participant)

        candidate_specs = [
            ("Aliakbar Rzazada", "12759@holbertonstudents.com", "Computer Science", 1),
            ("Amrah Karimov", "12644@holbertonstudents.com", "Full Stack", 2),
            ("Aydan Ismayilova", "12726@holbertonstudents.com", "Machine Learning", 2),
            ("Ayhan Aghayev", "12720@holbertonstudents.com", "Cyber Security", 1),
            ("Aysun Xipiyeva", "12753@holbertonstudents.com", "Full Stack", 1),
            ("Aziz Amiraslanov", "12766@holbertonstudents.com", "Computer Science", 3),
            ("Elgun Xalilzadeh", "12741@holbertonstudents.com", "Cyber Security", 2),
            ("Elnara Malikzade", "12728@holbertonstudents.com", "Machine Learning", 2),
            ("Emil Akbarov", "12724@holbertonstudents.com", "Full Stack", 1),
            ("Firudin Maniyev", "12738@holbertonstudents.com", "Computer Science", 4),
            ("Ismayil Abbasli", "12725@holbertonstudents.com", "Cyber Security", 2),
            ("Leman Huseynli", "12767@holbertonstudents.com", "Machine Learning", 1),
            ("Nihad Safarli", "12768@holbertonstudents.com", "Full Stack", 2),
            ("Rena Quliyeva", "12769@holbertonstudents.com", "Computer Science", 1),
            ("Tural Guliyev", "12770@holbertonstudents.com", "Cyber Security", 2),
            ("Zahra Mammadli", "12771@holbertonstudents.com", "Machine Learning", 3),
        ]

        candidates = []
        for idx, (name, email, track, experience) in enumerate(candidate_specs):
            user = _create_user(name, email, "student", _random_avatar(rnd))
            db.session.add(user)
            participant = Participant(
                id=_uid(),
                user_id=user.id,
                name=name,
                email=user.email,
                avatar_color=user.avatar_color,
                experience=experience,
                bio=f"{name} specializes in {track} and actively participates in collaborative projects.",
                github=f"https://github.com/holberton-{idx + 12730}",
                linkedin=f"https://linkedin.com/in/holberton-{idx + 12730}",
                cv_url=f"/uploads/cv/{idx + 12730}.pdf",
                cv_uploaded_at=now - timedelta(days=rnd.randint(5, 120)),
                university=track,
                graduation_year=2026 + (idx % 3),
            )
            db.session.add(participant)
            _add_skills(participant.id, track, rnd, source="manual")
            candidates.append(participant)

        event_specs = [
            (
                "DataDriven Solutions hackathon",
                "hackathon",
                "completed",
                "Internal",
                now - timedelta(days=75),
                now - timedelta(days=73),
            ),
            (
                "AZCON Transport hackathon",
                "hackathon",
                "upcoming",
                "Internal",
                now + timedelta(days=18),
                now + timedelta(days=20),
            ),
            (
                "A4Business AI hackathon",
                "ideasprint",
                "ongoing",
                "Internal",
                now - timedelta(days=1),
                now + timedelta(days=1),
            ),
            (
                "Pasha Hackathon Bravo",
                "hackathon",
                "upcoming",
                "External",
                now + timedelta(days=32),
                now + timedelta(days=34),
            ),
            (
                "Sanaye 4.0 Hackathon",
                "buildathon",
                "upcoming",
                "External",
                now + timedelta(days=50),
                now + timedelta(days=52),
            ),
        ]

        events = []
        for idx, (name, event_type, status, scope, start_date, end_date) in enumerate(event_specs):
            event = Event(
                id=_uid(),
                name=name,
                type=event_type,
                description=f"{name} focuses on measurable impact, team collaboration, and scalable delivery.",
                start_date=start_date,
                end_date=end_date,
                registration_deadline=start_date - timedelta(days=7),
                location=scope,
                status=status,
                prize=rnd.choice(["5000 AZN", "7000 AZN", "10000 AZN"]),
                cover_color=rnd.choice(
                    ["from-violet-500 to-indigo-600", "from-cyan-500 to-teal-600", "from-emerald-500 to-green-600"]
                ),
                max_team_size=5,
                max_participants=120,
                team_building_method="ai_assisted" if idx % 2 == 0 else "manual",
            )
            db.session.add(event)
            events.append(event)

        # Completed team for history/result sample.
        completed_event = next(event for event in events if event.name == "DataDriven Solutions hackathon")
        completed_team_members = candidates[:3]
        completed_team = Team(
            id=_uid(),
            name="DataDriven Rangers",
            captain_id=completed_team_members[0].id,
            event_id=completed_event.id,
            event_type=completed_event.type,
            status="completed",
            chemistry_score=84,
            missing_skills_csv="",
            description="Team focused on analytics for transport and business use-cases.",
            repository_url="https://github.com/teamforge/datadriven-rangers",
            project_name="InsightFlow",
        )
        db.session.add(completed_team)
        for idx, member in enumerate(completed_team_members):
            db.session.add(
                TeamMember(
                    team_id=completed_team.id,
                    participant_id=member.id,
                    role="captain" if idx == 0 else "member",
                )
            )

        # Two active teams to keep dataset realistic while still leaving unassigned candidates.
        active_event = next(event for event in events if event.name == "A4Business AI hackathon")
        active_team_a_members = candidates[3:5]
        active_team_b_members = candidates[5:7]

        active_team_a = Team(
            id=_uid(),
            name="A4 Innovators",
            captain_id=active_team_a_members[0].id,
            event_id=active_event.id,
            event_type=active_event.type,
            status="active",
            chemistry_score=76,
            missing_skills_csv="security",
            description="Building AI copilots for SMEs.",
            repository_url="https://github.com/teamforge/a4-innovators",
            project_name="A4 Copilot",
        )
        db.session.add(active_team_a)
        for idx, member in enumerate(active_team_a_members):
            db.session.add(
                TeamMember(
                    team_id=active_team_a.id,
                    participant_id=member.id,
                    role="captain" if idx == 0 else "member",
                )
            )

        active_team_b = Team(
            id=_uid(),
            name="Secure Transit",
            captain_id=active_team_b_members[0].id,
            event_id=active_event.id,
            event_type=active_event.type,
            status="active",
            chemistry_score=71,
            missing_skills_csv="frontend",
            description="Safety-first mobility solutions.",
            repository_url="https://github.com/teamforge/secure-transit",
            project_name="TransitShield",
        )
        db.session.add(active_team_b)
        for idx, member in enumerate(active_team_b_members):
            db.session.add(
                TeamMember(
                    team_id=active_team_b.id,
                    participant_id=member.id,
                    role="captain" if idx == 0 else "member",
                )
            )

        judge_specs = [
            ("Dr. Aydin Mammadov", {"technical": 25, "presentation": 25, "innovation": 25, "teamwork": 25}),
            ("Prof. Elena Petrova", {"technical": 25, "presentation": 25, "innovation": 25, "teamwork": 25}),
        ]

        judges = []
        for idx, (name, permissions) in enumerate(judge_specs):
            judge = Judge(
                id=_uid(),
                name=name,
                email=f"judge{idx + 1}@teamforge.az",
                avatar_color="cyan",
                specialization="Industry Expert",
                bio=f"{name} evaluates solution quality and team execution.",
                total_reviews=0,
            )
            db.session.add(judge)
            judges.append(judge)

            for criterion, max_points in permissions.items():
                db.session.add(
                    JudgePermission(
                        judge_id=judge.id,
                        criterion=criterion,
                        max_points=max_points,
                    )
                )

            db.session.add(JudgeEventAssignment(judge_id=judge.id, event_id=completed_event.id))

        for judge in judges:
            entry = ScoreEntry(
                judge_id=judge.id,
                team_id=completed_team.id,
                event_id=completed_event.id,
                technical=rnd.randint(16, 23),
                presentation=rnd.randint(15, 23),
                innovation=rnd.randint(14, 22),
                teamwork=rnd.randint(16, 24),
                comment="Strong communication and measurable outcomes.",
                submitted_at=now - timedelta(days=rnd.randint(55, 65)),
            )
            db.session.add(entry)
            judge.total_reviews += 1

        announcement_specs = [
            ("Urgent: Submission Window Extended", "Submission deadline is extended by 3 hours.", "urgent", "student", True),
            ("Judge Briefing at 15:00", "All judges should join the scoring sync at 15:00.", "event", "all", False),
            ("Buildathon Registration Open", "Registration is open for Buildathon Summer series.", "event", "all", False),
            ("Platform Update", "New team invitation workflow is now live.", "general", "all", False),
            ("Results Published", "DataDriven Solutions hackathon results are now available.", "result", "student", True),
        ]

        announcements = []
        for idx, (title, content, ann_type, target_role, pinned) in enumerate(announcement_specs):
            ann = Announcement(
                id=_uid(),
                title=title,
                content=content,
                type=ann_type,
                target_role=target_role,
                author_id=admin_user.id,
                pinned=pinned,
                expires_at=None if pinned else now + timedelta(days=20 + idx),
                created_at=now - timedelta(days=idx),
            )
            db.session.add(ann)
            announcements.append(ann)

        for ann in announcements:
            readers = rnd.sample(candidates, k=min(len(candidates), rnd.randint(2, 6)))
            for reader in readers:
                db.session.add(AnnouncementRead(announcement_id=ann.id, participant_id=reader.id))

        db.session.add(
            SupportTicket(
                id=_uid(),
                user_id=main_participant.id,
                subject="Team onboarding",
                message="Need guidance on forming a team after CV upload.",
                status="open",
                created_at=now - timedelta(days=2),
            )
        )

        db.session.commit()
        print("Seed complete with student/candidate/event/invitation-ready dataset.")

