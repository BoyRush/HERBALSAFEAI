from chroma.herbal_store import search_herbal

def retrieve_relevant_herbs(query, k=5):
    return search_herbal(query, n_results=k)

def build_herbs(result):
    herbs = []
    if isinstance(result, dict) and result.get("documents") and result["documents"][0]:
        for i in range(len(result["documents"][0])):
            herbs.append({
                "id": result["ids"][0][i],
                "name": result["metadatas"][0][i].get("name"),
                "indikasi": result["metadatas"][0][i].get("indikasi"),
                "kontraindikasi": result["metadatas"][0][i].get("kontraindikasi", ""),
                "deskripsi": result["documents"][0][i]
            })
    return herbs
