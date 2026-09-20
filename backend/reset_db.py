import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database.config import engine, Base
from app.models import *

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)
print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("Database reset successfully.")
