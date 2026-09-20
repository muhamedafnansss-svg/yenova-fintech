from app.database.config import engine, Base
from app.models.document import Document, OCRData

# This will create any missing tables
Base.metadata.create_all(bind=engine)
print("Documents tables created successfully!")
