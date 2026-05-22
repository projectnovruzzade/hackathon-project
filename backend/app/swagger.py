from __future__ import annotations

from typing import Any


SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda _rule: False,
            "model_filter": lambda _tag: True,
        }
    ],
    "specs_route": "/apidocs/",
    "title": "Joint Holbies API Docs",
    "swagger_ui": True,
}


def build_swagger_template(app) -> dict[str, Any]:
    return {
        "swagger": "2.0",
        "info": {
            "title": "Joint Holbies Backend API",
            "version": "1.0.0",
            "description": "Generated API reference for the Joint Holbies backend.",
        },
        "basePath": "/",
        "schemes": ["http"],
        "produces": ["application/json"],
        "consumes": ["application/json"],
        "securityDefinitions": {
            "BearerAuth": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT bearer token. Format: Bearer <token>",
            }
        },
        "paths": _build_paths(app),
    }


def _build_paths(app) -> dict[str, Any]:
    paths: dict[str, Any] = {}

    for rule in sorted(app.url_map.iter_rules(), key=lambda item: item.rule):
        if _skip_rule(rule):
            continue

        path = _normalize_rule(rule.rule)
        operations = paths.setdefault(path, {})

        for method in sorted(rule.methods - {"HEAD", "OPTIONS"}):
            operations[method.lower()] = _build_operation(rule, method)

    return paths


def _skip_rule(rule) -> bool:
    if rule.rule.startswith("/apidocs") or rule.rule.startswith("/flasgger_static"):
        return True
    if rule.endpoint.startswith("flasgger"):
        return True
    return rule.endpoint == "static"


def _normalize_rule(rule: str) -> str:
    normalized = rule
    for argument in list(_iter_rule_arguments(rule)):
        normalized = normalized.replace(argument["raw"], f"{{{argument['name']}}}")
    return normalized


def _build_operation(rule, method: str) -> dict[str, Any]:
    operation = {
        "tags": [_tag_for_rule(rule.rule)],
        "summary": _summary_for_endpoint(rule.endpoint, method),
        "operationId": f"{rule.endpoint}_{method.lower()}",
        "parameters": _build_parameters(rule, method),
        "responses": _build_responses(rule.rule),
    }

    if _requires_json_body(method):
        operation["parameters"].append(
            {
                "in": "body",
                "name": "body",
                "required": False,
                "schema": {"type": "object"},
            }
        )

    if _requires_auth(rule.rule):
        operation["security"] = [{"BearerAuth": []}]

    return operation


def _build_parameters(rule, method: str) -> list[dict[str, Any]]:
    parameters = []

    for argument in _iter_rule_arguments(rule.rule):
        parameters.append(
            {
                "name": argument["name"],
                "in": "path",
                "required": True,
                "type": argument["type"],
            }
        )

    if method == "GET":
        for arg_name in _common_query_params(rule.rule):
            parameters.append(
                {
                    "name": arg_name,
                    "in": "query",
                    "required": False,
                    "type": "string",
                }
            )

    return parameters


def _build_responses(rule: str) -> dict[str, Any]:
    responses = {
        "200": {
            "description": "Successful response",
            "schema": {"type": "object"},
        }
    }

    if _requires_auth(rule):
        responses["401"] = {"description": "Authentication required"}
        responses["403"] = {"description": "Insufficient permissions"}

    return responses


def _iter_rule_arguments(rule: str) -> list[dict[str, str]]:
    arguments: list[dict[str, str]] = []
    for segment in rule.split("/"):
        if not (segment.startswith("<") and segment.endswith(">")):
            continue
        raw = segment
        inner = segment[1:-1]
        if ":" in inner:
            converter, name = inner.split(":", 1)
        else:
            converter, name = "string", inner
        arguments.append({"raw": raw, "name": name, "type": _swagger_type(converter)})
    return arguments


def _swagger_type(converter: str) -> str:
    return "integer" if converter == "int" else "string"


def _requires_json_body(method: str) -> bool:
    return method in {"POST", "PUT", "PATCH"}


def _requires_auth(rule: str) -> bool:
    return rule not in {"/", "/api/health", "/api/auth/login"}


def _tag_for_rule(rule: str) -> str:
    if rule.startswith("/api/admin/reports"):
        return "reports"
    if rule.startswith("/api/admin"):
        return "admin"
    if rule.startswith("/api/student"):
        return "student"
    if rule.startswith("/api/auth"):
        return "auth"
    if rule.startswith("/api"):
        return "system"
    return "root"


def _summary_for_endpoint(endpoint: str, method: str) -> str:
    name = endpoint.split(".")[-1].replace("_", " ").strip()
    return f"{method.title()} {name.title()}"


def _common_query_params(rule: str) -> list[str]:
    query_params_by_rule = {
        "/api/admin/participants": ["search", "university", "minExperience", "maxExperience", "skillCategory", "page", "perPage"],
        "/api/admin/teams": ["eventId", "status"],
        "/api/admin/events": ["status", "type"],
        "/api/admin/judges": ["search"],
        "/api/admin/scores": ["eventId", "teamId", "judgeId"],
        "/api/admin/announcements": ["page", "perPage"],
        "/api/admin/support-tickets": ["status", "page", "perPage"],
        "/api/admin/reports/score-aggregate": ["teamId", "eventId"],
        "/api/admin/reports/team-performance": ["eventId"],
        "/api/admin/reports/participant-skills": ["eventId"],
        "/api/student/events": ["status", "page", "perPage"],
        "/api/student/announcements": ["page", "perPage"],
        "/api/student/support-tickets": ["status", "page", "perPage"],
    }
    return query_params_by_rule.get(rule, [])
