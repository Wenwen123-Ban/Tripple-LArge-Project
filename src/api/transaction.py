"""Transaction API blueprint and compatibility exports."""

from flask import Blueprint

from src.api.transactions import (
    borrow_book,
    cancel_reservation,
    force_return,
    get_book_effective_status,
    get_book_history,
    get_manage_transactions,
    notify_borrower,
    reserve_book,
    return_book,
)

transaction_bp = Blueprint('transaction_api', __name__)
transaction_bp.add_url_rule('/api/transactions/reserve', 'reserve_book', reserve_book, methods=['POST'])
transaction_bp.add_url_rule('/api/transaction/reserve', 'reserve_book_singular', reserve_book, methods=['POST'])
transaction_bp.add_url_rule('/api/transactions/borrow', 'borrow_book', borrow_book, methods=['POST'])
transaction_bp.add_url_rule('/api/transactions/return', 'return_book', return_book, methods=['POST'])
transaction_bp.add_url_rule('/api/transactions/force-return', 'force_return', force_return, methods=['POST'])
transaction_bp.add_url_rule('/api/transactions/cancel', 'cancel_reservation', cancel_reservation, methods=['POST'])
transaction_bp.add_url_rule('/api/transactions/manage', 'get_manage_transactions', get_manage_transactions, methods=['GET'])
transaction_bp.add_url_rule('/api/transactions/notify-borrower', 'notify_borrower', notify_borrower, methods=['POST'])
transaction_bp.add_url_rule('/api/books/history', 'get_book_history', get_book_history, methods=['GET'])

__all__ = [
    'borrow_book',
    'cancel_reservation',
    'force_return',
    'get_book_effective_status',
    'get_book_history',
    'get_manage_transactions',
    'notify_borrower',
    'reserve_book',
    'return_book',
    'transaction_bp',
]
