"""One SQLAlchemy engine for the chatbot, built from the project's own Django database setting.
sqlite (default) or PostgreSQL, whichever DATABASES['default'] points to - so the chatbot and the dashboards share one database."""
from contextlib import contextmanager
from functools import lru_cache

from django.conf import settings
from sqlalchemy import create_engine
from sqlalchemy.engine import URL


@lru_cache(maxsize=1)
def get_engine():
    cfg = settings.DATABASES['default']
    if 'sqlite' in cfg['ENGINE']:
        return create_engine(f"sqlite:///{cfg['NAME']}")
    if 'postgresql' in cfg['ENGINE']:
        url = URL.create('postgresql+psycopg2', username=cfg.get('USER'), password=cfg.get('PASSWORD'),
                         host=cfg.get('HOST') or 'localhost', port=int(cfg.get('PORT') or 5432), database=cfg['NAME'])
        return create_engine(url)
    raise RuntimeError(f"Chatbot supports sqlite and PostgreSQL, not {cfg['ENGINE']}")


def dialect():
    return get_engine().dialect.name        # 'sqlite' | 'postgresql'


@contextmanager
def read_only_connection():
    """Connection for running LLM-written SQL, read-only at the database level."""
    conn = get_engine().connect()
    try:
        if dialect() == 'sqlite':
            conn.exec_driver_sql('PRAGMA query_only = ON')
        else:
            conn.exec_driver_sql('SET TRANSACTION READ ONLY')
        yield conn
    finally:
        try:
            if dialect() == 'sqlite':
                conn.exec_driver_sql('PRAGMA query_only = OFF')   # the connection goes back to the pool
        finally:
            conn.close()
