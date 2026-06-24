import os
import logging
from pathlib import Path
from google.cloud import storage
from google.auth.exceptions import DefaultCredentialsError

logger = logging.getLogger("smarthire.storage")

class StorageService:
    def __init__(self):
        self.bucket_name = os.getenv("CLOUD_STORAGE_BUCKET")
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.client = None
        self.local_mode = True
        self.local_dir = Path(__file__).parent.parent / ".storage"

        # Ensure local storage directory exists
        self.local_dir.mkdir(parents=True, exist_ok=True)

        if self.bucket_name:
            try:
                # Try setting up GCS Client
                self.client = storage.Client()
                # Verify bucket exists/accessible
                bucket = self.client.bucket(self.bucket_name)
                # Check accessibility or lazy check
                self.local_mode = False
                logger.info(f"GCS Storage Service initialized successfully for bucket '{self.bucket_name}'.")
            except (DefaultCredentialsError, Exception) as e:
                logger.warning(
                    f"Failed to initialize Google Cloud Storage client due to credentials or connection: {e}. "
                    "Falling back to Local Storage mode."
                )
                self.local_mode = True
        else:
            logger.info("CLOUD_STORAGE_BUCKET not set. Operating in Local Storage mode.")

    async def upload_file(self, file_content: bytes, filename: str, content_type: str) -> dict:
        """
        Uploads file to GCS if configured, otherwise saves to local .storage directory.
        Returns a dict with gcs_uri and access url.
        """
        # Clean filename to avoid directory traversal
        safe_filename = Path(filename).name
        
        if not self.local_mode and self.client:
            try:
                bucket = self.client.bucket(self.bucket_name)
                blob = bucket.blob(safe_filename)
                # Upload bytes
                blob.upload_from_string(file_content, content_type=content_type)
                
                # Make it publicly readable if required or generate a signed URL
                # For demo purposes, we will return the media link or GCS URI
                gcs_uri = f"gs://{self.bucket_name}/{safe_filename}"
                # If bucket permits public access, public URL is:
                public_url = f"https://storage.googleapis.com/{self.bucket_name}/{safe_filename}"
                
                logger.info(f"Uploaded '{safe_filename}' successfully to GCS bucket '{self.bucket_name}'.")
                return {
                    "gcs_uri": gcs_uri,
                    "url": public_url
                }
            except Exception as e:
                logger.error(f"GCS upload failed: {e}. Falling back to local save.")
                # fall through to local mode

        # Local Mode save
        local_path = self.local_dir / safe_filename
        with open(local_path, "wb") as f:
            f.write(file_content)
        
        # We serve local files via a static route `/api/uploads/{filename}` mounted on main app
        local_url = f"/api/uploads/{safe_filename}"
        logger.info(f"Saved file '{safe_filename}' locally in .storage directory.")
        
        return {
            "gcs_uri": f"gs://local-mock-bucket/{safe_filename}",
            "url": local_url
        }

# Singleton instance
storage_service = StorageService()
