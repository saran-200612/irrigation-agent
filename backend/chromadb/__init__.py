import os
import json
import numpy as np

class Collection:
    def __init__(self, name, path, embedding_function):
        self.name = name
        self.path = path
        self.embedding_function = embedding_function
        self.file_path = os.path.join(path, f"collection_{name}.json")
        self.data = self._load()

    def _load(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading local vector store: {e}")
        return {"ids": [], "documents": [], "metadatas": [], "embeddings": []}

    def _save(self):
        os.makedirs(self.path, exist_ok=True)
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving local vector store: {e}")

    def get(self):
        return {"ids": self.data["ids"]}

    def delete(self, ids):
        indices_to_keep = [i for i, doc_id in enumerate(self.data["ids"]) if doc_id not in ids]
        self.data["ids"] = [self.data["ids"][i] for i in indices_to_keep]
        self.data["documents"] = [self.data["documents"][i] for i in indices_to_keep]
        self.data["metadatas"] = [self.data["metadatas"][i] for i in indices_to_keep]
        self.data["embeddings"] = [self.data["embeddings"][i] for i in indices_to_keep]
        self._save()

    def add(self, ids, documents, metadatas):
        embeddings = self.embedding_function(documents)
        self.data["ids"].extend(ids)
        self.data["documents"].extend(documents)
        self.data["metadatas"].extend(metadatas)
        self.data["embeddings"].extend(embeddings)
        self._save()

    def query(self, query_texts, n_results=3):
        if not self.data["embeddings"]:
            return {"documents": [[]]}
            
        query_embeddings = self.embedding_function(query_texts)
        results_docs = []
        
        for q_emb in query_embeddings:
            similarities = []
            q_vec = np.array(q_emb)
            
            for emb in self.data["embeddings"]:
                db_vec = np.array(emb)
                dot = np.dot(q_vec, db_vec)
                norm_q = np.linalg.norm(q_vec)
                norm_db = np.linalg.norm(db_vec)
                sim = dot / (norm_q * norm_db) if norm_q > 0 and norm_db > 0 else 0.0
                similarities.append(sim)
            
            # Sort by similarity descending
            sorted_indices = np.argsort(similarities)[::-1]
            top_indices = sorted_indices[:n_results]
            
            docs = [self.data["documents"][i] for i in top_indices]
            results_docs.append(docs)
            
        return {"documents": results_docs}

class PersistentClient:
    def __init__(self, path):
        self.path = path
        self.collections = {}

    def get_or_create_collection(self, name, embedding_function):
        if name not in self.collections:
            self.collections[name] = Collection(name, self.path, embedding_function)
        return self.collections[name]
