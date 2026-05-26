import os
import uuid
import chromadb
from chromadb.utils import embedding_functions
EMBEDDING_MODEL = "intfloat/multilingual-e5-large"
persist_directory = os.path.join(os.path.dirname(__file__), "chroma_db")
os.makedirs(persist_directory, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=persist_directory)
sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=EMBEDDING_MODEL)
collection = chroma_client.get_or_create_collection(
    name="herbal_collection",
    embedding_function=sentence_transformer_ef,
    metadata={"hnsw:space": "cosine"} # Use cosine distance
)

def add_herbal(record_id, nama, indikasi, kontraindikasi, deskripsi, doctor_id):
    doc_id = str(uuid.uuid4())
    text_content = f"Nama: {nama}. Indikasi: {indikasi}. Kontraindikasi: {kontraindikasi}. Deskripsi: {deskripsi}"
    
    collection.add(
        documents=[text_content],
        metadatas=[{
            "record_id": record_id,
            "nama": nama,
            "indikasi": indikasi,
            "kontraindikasi": kontraindikasi,
            "doctor_id": doctor_id
        }],
        ids=[doc_id]
    )
    return doc_id

def update_herbal(record_id, nama, indikasi, kontraindikasi, deskripsi, doctor_id):
    delete_herbal_by_record_id(record_id)
    return add_herbal(record_id, nama, indikasi, kontraindikasi, deskripsi, doctor_id)

def delete_herbal_by_record_id(record_id):
    collection.delete(
        where={"record_id": record_id}
    )

def search_herbal(query_text, n_results=5, threshold=0.6):
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results
    )
    
    relevant_herbs = []
    if not results['ids'] or not results['ids'][0]:
        return relevant_herbs
        
    for i in range(len(results['ids'][0])):
        distance = results['distances'][0][i]
        if distance <= threshold:
            metadata = results['metadatas'][0][i]
            relevant_herbs.append({
                "id": results['ids'][0][i],
                "record_id": metadata["record_id"],
                "nama": metadata["nama"],
                "indikasi": metadata["indikasi"],
                "kontraindikasi": metadata["kontraindikasi"],
                "distance": distance
            })
            
    return relevant_herbs
