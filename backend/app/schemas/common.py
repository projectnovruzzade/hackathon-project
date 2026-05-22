from marshmallow import Schema, ValidationError, fields, validate


class ParticipantCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    avatarColor = fields.Str(load_default="violet")
    experience = fields.Int(load_default=0, validate=validate.Range(min=0, max=50))
    bio = fields.Str(load_default=None, allow_none=True)
    github = fields.Str(load_default=None, allow_none=True)
    linkedin = fields.Str(load_default=None, allow_none=True)
    university = fields.Str(load_default=None, allow_none=True)
    graduationYear = fields.Int(load_default=None, allow_none=True)


class EventCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=180))
    type = fields.Str(required=True, validate=validate.OneOf(["hackathon", "ctf", "ideasprint", "buildathon"]))
    description = fields.Str(required=True, validate=validate.Length(min=10))
    startDate = fields.DateTime(required=True)
    endDate = fields.DateTime(required=True)
    registrationDeadline = fields.DateTime(required=True)
    location = fields.Str(required=True, validate=validate.Length(min=2, max=180))
    status = fields.Str(load_default="upcoming")
    prize = fields.Str(load_default=None, allow_none=True)
    coverColor = fields.Str(load_default=None, allow_none=True)
    maxTeamSize = fields.Int(load_default=None, allow_none=True)
    maxParticipants = fields.Int(load_default=None, allow_none=True)
    teamBuildingMethod = fields.Str(load_default=None, allow_none=True)


class SkillCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=120))
    level = fields.Str(required=True, validate=validate.OneOf(["beginner", "intermediate", "advanced", "expert"]))
    category = fields.Str(
        required=True,
        validate=validate.OneOf(["frontend", "backend", "ml", "security", "devops", "design", "mobile", "other"]),
    )
    source = fields.Str(load_default="manual")


def load_or_raise(schema: Schema, payload: dict):
    try:
        return schema.load(payload)
    except ValidationError as exc:
        raise ValueError(exc.messages) from exc

