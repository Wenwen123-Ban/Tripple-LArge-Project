"""Central API blueprint registrations and route index helpers."""

from flask import Blueprint, current_app, jsonify

api_urls_bp = Blueprint('api_urls', __name__)


@api_urls_bp.get('/api/health')
def health_check():
    return jsonify({'status': 'ok'})


@api_urls_bp.get('/api/routes')
def route_index():
    routes = []
    for rule in current_app.url_map.iter_rules():
        if str(rule.rule).startswith('/api/'):
            routes.append({
                'rule': str(rule.rule),
                'endpoint': rule.endpoint,
                'methods': sorted(method for method in rule.methods if method not in {'HEAD', 'OPTIONS'}),
            })
    return jsonify(sorted(routes, key=lambda item: (item['rule'], item['endpoint'])))
