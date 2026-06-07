from langchain_core.documents import Document
from openai import AsyncOpenAI

SYSTEM_PROMPT = """You are a helpful and precise technical assistant. 
Answer the user's query ONLY using the provided documents. 
If the answer is not contained in the documents, 
say "I cannot answer this based on the provided context." 
Do not use outside knowledge.

Constraints:
1. Always answer in the exact same language as the user's query.
2. Format your answer using Markdown (bullet points, bold text)
for optimal readability.
3. If applicable, cite the name of the file or source you used 
to formulate your answer."""


class AIService:
    def __init__(self, openai_api_key: str):
        self.client = AsyncOpenAI(api_key=openai_api_key)

    async def generate_response(self, query: str, documents: list[Document]) -> str:
        context = "\n\n".join([doc.page_content for doc in documents])

        rewritten_query = await self._rewrite_query(query)

        user_prompt = f"""Context:\n{context}\n\nQuestion: {rewritten_query}"""

        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=1000,
        )
        return response.choices[0].message.content.strip()

    async def _rewrite_query(self, query: str) -> str:
        prompt = """You are an expert in Information Retrieval. 
        Your role is to transform the user's conversational 
        question into an optimized query for strict vector search.

        Mandatory Rules:
        1. Remove all stop words, polite phrases, and conversational noise 
        (e.g., "explain in detail", "what is", "can you tell me").
        2. Extract and keep ONLY the key concepts, entities, acronyms, 
        and technical jargon.
        3. STRICTLY maintain the original language of the user's query. 
        Do not translate the keywords.
        4. Do NOT answer the question. Return ONLY the reformulated query, 
        without any explanation, introduction, or final punctuation."""

        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": query},
            ],
            temperature=0.2,
            max_tokens=1000,
        )
        print(f"Rewritten query: {response.choices[0].message.content.strip()}")
        return response.choices[0].message.content.strip()
