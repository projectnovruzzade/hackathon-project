from flask import request


def get_pagination_params(default_page=1, default_per_page=20, max_per_page=100):
    page = request.args.get("page", default_page, type=int)
    per_page = request.args.get("perPage", default_per_page, type=int)
    if page < 1:
        page = 1
    if per_page < 1:
        per_page = default_per_page
    per_page = min(per_page, max_per_page)
    return page, per_page


def meta_from_paginated(paginated):
    return {
        "page": paginated.page,
        "perPage": paginated.per_page,
        "total": paginated.total,
        "pages": paginated.pages,
        "hasNext": paginated.has_next,
        "hasPrev": paginated.has_prev,
    }

