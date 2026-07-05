class SentenceTransformerEmbeddingFunction:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None

    @property
    def model(self):
        if self._model is None:
            print(f"Loading local SentenceTransformer model '{self.model_name}'...")
            from sentence_transformers import SentenceTransformer
            # Disable torch warning messages for clean terminal runs
            import warnings
            warnings.filterwarnings("ignore", category=UserWarning)
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def __call__(self, texts):
        if isinstance(texts, str):
            texts = [texts]
        embeddings = self.model.encode(texts)
        # Convert numpy floats to standard float list
        return [emb.tolist() for emb in embeddings]
