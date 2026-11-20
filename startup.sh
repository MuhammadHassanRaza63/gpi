#!/bin/bash
python manage.py migrate --noinput
gunicorn config.wsgi --bind=0.0.0.0:8000 --workers 2 --timeout 120
