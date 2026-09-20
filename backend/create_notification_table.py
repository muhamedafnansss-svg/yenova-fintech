import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database.config import engine
from app.models.notification import Notification

print("Creating Notification table...")
Notification.__table__.create(bind=engine, checkfirst=True)
print("Done.")
