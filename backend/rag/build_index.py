import os
import sys

# Ensure backend root is in search path for local chromadb imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import re
import chromadb
from chromadb.utils import embedding_functions

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB_DIR = os.path.join(BASE_DIR, "rag", "knowledge_base")
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_store")

def chunk_markdown(file_path: str) -> list[dict]:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Split by markdown headers
    # Matches \n# or \n## followed by space and heading text
    sections = re.split(r'\n(#+ .*)\n', content)
    chunks = []
    
    file_name = os.path.basename(file_path)
    
    intro = sections[0].strip()
    if intro:
        chunks.append({
            "text": f"Source: {file_name}\n\n{intro}",
            "metadata": {"source": file_name, "section": "Introduction"}
        })
        
    for i in range(1, len(sections), 2):
        heading = sections[i].strip()
        body = sections[i+1].strip() if i+1 < len(sections) else ""
        if body:
            full_text = f"Source: {file_name} - Section: {heading}\n\n{body}"
            chunks.append({
                "text": full_text,
                "metadata": {"source": file_name, "section": heading}
            })
            
    return chunks

def build_index():
    print("Initializing ChromaDB persistent client...")
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    
    # Define embedding function
    # Chroma's default sentence-transformers model is 'all-MiniLM-L6-v2'
    print("Loading embedding model (all-MiniLM-L6-v2)...")
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    # Get or create collection
    collection = client.get_or_create_collection(
        name="agronomy_knowledge",
        embedding_function=ef
    )
    
    # Clear existing documents to avoid duplicate issues on rebuild
    print("Clearing existing documents in collection...")
    try:
        results = collection.get()
        if results and results["ids"]:
            collection.delete(ids=results["ids"])
            print(f"Deleted {len(results['ids'])} existing chunks.")
    except Exception as e:
        print(f"No existing documents or error during clearing: {e}")
        
    # Read files and populate
    all_chunks = []
    for file in os.listdir(KB_DIR):
        if file.endswith(".md"):
            file_path = os.path.join(KB_DIR, file)
            print(f"Processing knowledge base file: {file}...")
            chunks = chunk_markdown(file_path)
            all_chunks.extend(chunks)
            
    if not all_chunks:
        print("No chunks found to index!")
        return

    # Upsert into ChromaDB
    ids = [f"chunk_{i}" for i in range(len(all_chunks))]
    documents = [c["text"] for c in all_chunks]
    metadatas = [c["metadata"] for c in all_chunks]
    
    print(f"Indexing {len(documents)} chunks into ChromaDB...")
    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )
    print("Indexing complete! Vector store populated.")

if __name__ == "__main__":
    build_index()
