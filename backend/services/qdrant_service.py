"""
Qdrant vector store service.

Provides minimal helpers to ensure a collection exists and upsert documents
by embedding the content with OpenAI.
"""

import os
from typing import Any, Dict, List, Optional
from uuid import uuid4

from dotenv import load_dotenv
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

# Load environment variables in case main has not yet executed load_dotenv
load_dotenv()


class QdrantService:
    """Lightweight wrapper around Qdrant for storing embedded documents."""

    def __init__(
        self,
        default_collection: str = "documents",
        embedding_model: str = "text-embedding-3-small",
        vector_size: int = 1536,
    ):
        self.qdrant_url = os.getenv("QDRANT_URL")
        self.qdrant_key = os.getenv("QDRANT_KEY")
        if not self.qdrant_url or not self.qdrant_key:
            raise ValueError("QDRANT_URL and QDRANT_KEY must be set in environment variables")

        self.default_collection = default_collection
        self.vector_size = vector_size
        self.embedding_model = embedding_model

        self.client = QdrantClient(url=self.qdrant_url, api_key=self.qdrant_key)
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY is required to create embeddings for Qdrant")
        self.openai_client = OpenAI(api_key=openai_api_key)

    def ensure_collection(self, collection_name: Optional[str] = None) -> str:
        """Create the collection if it does not exist."""
        name = collection_name or self.default_collection
        try:
            self.client.get_collection(name)
        except Exception:
            # Create with cosine distance for embeddings
            self.client.create_collection(
                collection_name=name,
                vectors_config=qmodels.VectorParams(
                    size=self.vector_size,
                    distance=qmodels.Distance.COSINE,
                ),
            )
        return name

    def embed_text(self, content: str) -> list[float]:
        """Generate an embedding vector for the given content."""
        if not content or not content.strip():
            raise ValueError("Content must not be empty")

        response = self.openai_client.embeddings.create(
            model=self.embedding_model,
            input=content.strip(),
        )
        vector = response.data[0].embedding
        if not vector:
            raise ValueError("Failed to generate embedding for the provided content")
        return vector

    def upsert_document(
        self,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        document_id: Optional[str] = None,
        collection_name: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, str]:
        """
        Embed and upsert a document into Qdrant.

        Returns:
            Dict containing the id and collection used.
        """
        if not user_id:
            raise ValueError("user_id is required to upsert a document")

        collection = self.ensure_collection(collection_name)
        vector = self.embed_text(content)

        point_id = document_id or str(uuid4())
        payload = metadata.copy() if metadata else {}
        payload["content"] = content
        payload["user_id"] = user_id

        self.client.upsert(
            collection_name=collection,
            points=[
                qmodels.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload,
                )
            ],
        )

        return {"id": point_id, "collection": collection}

    def search(
        self,
        query: str,
        user_id: str,
        collection_name: Optional[str] = None,
        top_k: int = 5,
        score_threshold: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """Search for the most relevant documents for a given user and query."""
        if not query or not query.strip():
            raise ValueError("Query must not be empty")
        if not user_id:
            raise ValueError("user_id is required to search documents")

        collection = self.ensure_collection(collection_name)
        query_vector = self.embed_text(query)

        results = self.client.search(
            collection_name=collection,
            query_vector=query_vector,
            limit=top_k,
            with_payload=True,
            score_threshold=score_threshold,
            query_filter=qmodels.Filter(
                must=[
                    qmodels.FieldCondition(
                        key="user_id",
                        match=qmodels.MatchValue(value=user_id),
                    )
                ]
            ),
        )

        return [
            {
                "id": str(hit.id),
                "score": hit.score,
                "payload": hit.payload,
            }
            for hit in results
        ]
