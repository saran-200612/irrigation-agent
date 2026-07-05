import os
import sys

# Ensure backend root is in search path for local chromadb imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import chromadb
from chromadb.utils import embedding_functions

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_store")

class AgronomyRetriever:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=CHROMA_DIR)
        self.ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        self.collection = self.client.get_or_create_collection(
            name="agronomy_knowledge",
            embedding_function=self.ef
        )

    def retrieve(self, crop: str, growth_stage: str, question: str = "", k: int = 3) -> list[str]:
        # Formulate query combining metadata parameters and search query
        query_text = f"Crop: {crop} | Growth Stage: {growth_stage}"
        if question:
            query_text += f" | Question: {question}"

        print(f"RAG retrieving top {k} matching chunks for query: '{query_text}'")
        try:
            results = self.collection.query(
                query_texts=[query_text],
                n_results=k
            )
            # Extracted list of matching documents
            documents = results.get("documents", [[]])[0]
            return documents
        except Exception as e:
            print(f"Error querying ChromaDB: {e}")
            return []

# Singleton instance
retriever = AgronomyRetriever()
