import os
import json
import uuid
import logging
from datetime import datetime
from pathlib import Path
from google.cloud import firestore
from google.auth.exceptions import DefaultCredentialsError

logger = logging.getLogger("smarthire.firestore")

class FirestoreService:
    def __init__(self):
        self.collection_name = os.getenv("FIRESTORE_COLLECTION", "screenings")
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.client = None
        self.local_mode = True
        self.mock_db_path = Path(__file__).parent.parent / ".storage" / "firestore_mock.json"

        # Ensure directory exists
        self.mock_db_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.mock_db_path.exists():
            with open(self.mock_db_path, "w") as f:
                json.dump([], f)

        if self.project_id:
            try:
                # Try initializing real Firestore
                self.client = firestore.Client(project=self.project_id)
                # Quick access test
                # Try listing collection or getting a count (can be lazy)
                self.local_mode = False
                logger.info(f"Firestore Client initialized successfully for project '{self.project_id}' and collection '{self.collection_name}'.")
            except (DefaultCredentialsError, Exception) as e:
                logger.warning(
                    f"Failed to initialize Firestore client due to credentials or connection: {e}. "
                    "Falling back to Local JSON database mode."
                )
                self.local_mode = True
        else:
            logger.info("GOOGLE_CLOUD_PROJECT not set. Operating in Local JSON database mode.")

    def _read_mock_db(self) -> list:
        try:
            with open(self.mock_db_path, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_mock_db(self, data: list):
        try:
            with open(self.mock_db_path, "w") as f:
                json.dump(data, f, default=str)
        except Exception as e:
            logger.error(f"Failed to write to mock Firestore database: {e}")

    async def save_screening(self, data: dict) -> str:
        """
        Saves a resume screening result. Returns the document ID.
        """
        doc_id = str(uuid.uuid4())
        # Ensure timestamp is set and serialized properly
        if "timestamp" not in data:
            data["timestamp"] = datetime.utcnow()
        
        # Make a copy for database writes
        db_data = data.copy()

        if not self.local_mode and self.client:
            try:
                # Convert datetime to Firestore timestamp representation
                # Firestore client handles datetime directly
                doc_ref = self.client.collection(self.collection_name).document(doc_id)
                doc_ref.set(db_data)
                logger.info(f"Screening record saved to Firestore: {doc_id}")
                return doc_id
            except Exception as e:
                logger.error(f"Firestore save failed: {e}. Saving to mock database.")
                # fall through to mock mode

        # Mock Database Mode
        # Format datetime as string for JSON serialization
        if isinstance(db_data.get("timestamp"), datetime):
            db_data["timestamp"] = db_data["timestamp"].isoformat()
        db_data["id"] = doc_id

        records = self._read_mock_db()
        records.append(db_data)
        # Sort by timestamp descending
        records.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        self._write_mock_db(records)

        logger.info(f"Screening record saved to local mock DB: {doc_id}")
        return doc_id

    async def get_screenings(self, page: int = 1, limit: int = 10) -> tuple[int, list[dict]]:
        """
        Gets a page of screening history items.
        Returns a tuple of (total_count, items).
        """
        offset = (page - 1) * limit

        if not self.local_mode and self.client:
            try:
                collection_ref = self.client.collection(self.collection_name)
                
                # Fetch count
                # query.count() aggregation available in newer library versions
                try:
                    count_query = collection_ref.count()
                    total = count_query.get()[0][0].value
                except Exception:
                    # Fallback count method
                    docs = collection_ref.select([]).get()
                    total = len(docs)

                # Fetch paginated results ordered by timestamp descending
                query = collection_ref.order_by("timestamp", direction=firestore.Query.DESCENDING).limit(limit).offset(offset)
                docs = query.get()
                
                items = []
                for doc in docs:
                    doc_dict = doc.to_dict()
                    doc_dict["id"] = doc.id
                    # Ensure timestamp datetime object is properly formatted
                    if "timestamp" in doc_dict and doc_dict["timestamp"]:
                        # Firestore returns google.api_core.datetime_helpers.DatetimeWithNanoseconds
                        # which is a subclass of datetime, so it can be handled easily
                        pass
                    items.append(doc_dict)
                
                return total, items
            except Exception as e:
                logger.error(f"Firestore read failed: {e}. Falling back to mock database read.")
                # fall through to mock mode

        # Mock Database Mode
        records = self._read_mock_db()
        total = len(records)
        paginated_records = records[offset : offset + limit]

        # Convert back ISO datetime strings to datetime objects if needed,
        # but let the schemas handle string-to-datetime parsing.
        # Pydantic is very flexible with ISO strings for datetime fields.
        return total, paginated_records

# Singleton instance
firestore_service = FirestoreService()
