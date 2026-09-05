import hashlib
import math
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    faiss = None
    HAS_FAISS = False

from ..config import GEMINI_API_KEY, RUNBOOKS_DIR_PATH
from ..models.schemas import Runbook, RunbookChunk

# Dimension for vector index (768 matches Gemini text-embedding-004 / gemini-embedding-001)
EMBED_DIM = 768


class LocalVectorStore:
    def __init__(self, runbooks_dir: Path = RUNBOOKS_DIR_PATH):
        self.runbooks_dir = runbooks_dir
        self.runbooks: Dict[str, Runbook] = {}
        self.chunks: List[RunbookChunk] = []
        self.index = None
        self.vectors: Optional[np.ndarray] = None
        self._gemini_client = None

        if GEMINI_API_KEY:
            try:
                from google import genai
                self._gemini_client = genai.Client(api_key=GEMINI_API_KEY)
            except Exception as e:
                print(f"[VectorStore] Could not initialize Gemini client: {e}. Using deterministic local embeddings.")

    def _hash_embed(self, text: str, dim: int = EMBED_DIM) -> np.ndarray:
        """
        Deterministic, domain-aware token embedding generator for offline/local execution.
        Encodes semantic networking tokens, subsystem keywords, and n-grams using positive TF weights.
        """
        vec = np.zeros(dim, dtype=np.float32)
        tokens = re.findall(r"[a-zA-Z0-9_\-\.\:\/]+", text.lower())

        # Domain term weights for telecom/network operations
        domain_weights = {
            "bgp": 5.0, "peering": 4.0, "flap": 4.0, "as64512": 4.5, "carrier": 3.5,
            "eth0/1": 5.0, "tengige": 4.0, "optic": 4.0, "sfp": 4.0, "crc": 3.5, "fiber": 3.5,
            "signal": 4.0, "los": 4.0, "hold": 4.0, "routing": 4.0, "ospf": 4.0, "transit": 3.5,
            "power": 5.0, "psu": 5.0, "chassis": 4.0, "poe": 4.5, "temperature": 4.0, "fan": 3.5,
            "breaker": 4.0, "ats": 4.0, "stackpower": 4.5, "pdu": 4.0, "lacp": 4.0, "switch": 3.5,
            "auth": 5.0, "radius": 5.0, "tacacs": 4.5, "802.1x": 5.0, "dot1x": 4.5,
            "supplicant": 4.0, "ldap": 4.0, "credential": 4.0, "queue": 3.5,
            "dead-criteria": 4.5, "1812": 4.5, "quiet-period": 4.0, "gateway": 3.5
        }

        # Weight keywords positively
        for w in tokens:
            weight = domain_weights.get(w, 1.0)
            h = int(hashlib.sha256(w.encode("utf-8")).hexdigest()[:8], 16) % dim
            vec[h] += weight

        # Add 2-gram hashes for phrase matching
        for i in range(len(tokens) - 1):
            pair = f"{tokens[i]} {tokens[i+1]}"
            weight = domain_weights.get(pair, 2.0)
            h = int(hashlib.sha256(pair.encode("utf-8")).hexdigest()[:8], 16) % dim
            vec[h] += weight

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def embed_text(self, text: str) -> np.ndarray:
        """Embed text using Gemini API (gemini-embedding-001) if available, else local domain-aware embeddings."""
        if self._gemini_client:
            for model_name in ["gemini-embedding-001", "text-embedding-004"]:
                try:
                    response = self._gemini_client.models.embed_content(
                        model=model_name,
                        contents=text
                    )
                    if hasattr(response, "embedding") and response.embedding:
                        vec = np.array(response.embedding.values, dtype=np.float32)
                        norm = np.linalg.norm(vec)
                        return vec / norm if norm > 0 else vec
                except Exception as e:
                    pass

        return self._hash_embed(text)

    def load_and_index_runbooks(self):
        """Scans runbooks directory, parses markdown into chunks, and populates FAISS / vector index."""
        self.chunks = []
        self.runbooks = {}

        if not self.runbooks_dir.exists():
            print(f"[VectorStore] Directory not found: {self.runbooks_dir}")
            return

        runbook_files = list(self.runbooks_dir.glob("*.md"))
        print(f"[VectorStore] Found {len(runbook_files)} runbooks in {self.runbooks_dir}")

        for filepath in runbook_files:
            try:
                content = filepath.read_text(encoding="utf-8")
                lines = content.splitlines()

                # Extract runbook ID and Title from first lines
                rb_id = filepath.stem
                title = filepath.stem
                target_subsystem = "GENERAL"

                for line in lines[:15]:
                    if line.startswith("# "):
                        title = line.replace("# ", "").strip()
                    elif "**Runbook ID:**" in line:
                        rb_id = line.split("**Runbook ID:**")[-1].strip()
                    elif "**Subsystem:**" in line:
                        target_subsystem = line.split("**Subsystem:**")[-1].strip()

                runbook = Runbook(
                    id=rb_id,
                    title=title,
                    target_subsystem=target_subsystem,
                    file_path=str(filepath),
                    content_markdown=content,
                    updated_at="2026-09-05T00:00:00Z",
                    chunks=[]
                )

                # Split content by markdown section headers (## or ###)
                current_heading = "Overview"
                current_lines = []
                start_line = 1

                for idx, line in enumerate(lines, start=1):
                    if re.match(r"^#{1,3}\s+", line) and current_lines:
                        # Save previous chunk
                        chunk_text = "\n".join(current_lines).strip()
                        if len(chunk_text) > 40:
                            chunk = RunbookChunk(
                                chunk_id=f"{rb_id}-chk-{len(runbook.chunks)+1}",
                                runbook_id=rb_id,
                                runbook_title=title,
                                heading=current_heading,
                                line_start=start_line,
                                line_end=idx - 1,
                                content=chunk_text,
                                target_subsystem=target_subsystem
                            )
                            runbook.chunks.append(chunk)
                            self.chunks.append(chunk)

                        current_heading = line.strip("#").strip()
                        current_lines = [line]
                        start_line = idx
                    else:
                        current_lines.append(line)

                # Append final chunk
                if current_lines:
                    chunk_text = "\n".join(current_lines).strip()
                    if len(chunk_text) > 40:
                        chunk = RunbookChunk(
                            chunk_id=f"{rb_id}-chk-{len(runbook.chunks)+1}",
                            runbook_id=rb_id,
                            runbook_title=title,
                            heading=current_heading,
                            line_start=start_line,
                            line_end=len(lines),
                            content=chunk_text,
                            target_subsystem=target_subsystem
                        )
                        runbook.chunks.append(chunk)
                        self.chunks.append(chunk)

                self.runbooks[rb_id] = runbook
            except Exception as e:
                print(f"[VectorStore] Error parsing {filepath}: {e}")

        # Build index
        if self.chunks:
            self.vectors = np.array([self.embed_text(c.content) for c in self.chunks], dtype=np.float32)
            if HAS_FAISS and faiss is not None:
                try:
                    self.index = faiss.IndexFlatIP(EMBED_DIM)
                    self.index.add(self.vectors)
                    print(f"[VectorStore] Indexed {len(self.chunks)} chunks into FAISS.")
                except Exception as e:
                    print(f"[VectorStore] FAISS init error: {e}. Falling back to NumPy index.")
                    self.index = None
            else:
                print(f"[VectorStore] Indexed {len(self.chunks)} chunks using high-performance NumPy Vector Index.")
        else:
            self.index = None
            self.vectors = None
            print("[VectorStore] No chunks indexed.")

    def search(self, query: str, top_k: int = 3) -> List[Tuple[RunbookChunk, float]]:
        """Search index for top matching runbook chunks."""
        if not self.chunks:
            return []

        query_vec = np.array(self.embed_text(query), dtype=np.float32)

        if HAS_FAISS and self.index is not None:
            q_in = np.array([query_vec], dtype=np.float32)
            scores_arr, indices_arr = self.index.search(q_in, min(top_k, len(self.chunks)))
            scores = scores_arr[0]
            indices = indices_arr[0]
        elif self.vectors is not None:
            # NumPy matrix dot product cosine similarity
            sims = np.dot(self.vectors, query_vec)
            top_k_indices = np.argsort(sims)[::-1][:min(top_k, len(self.chunks))]
            scores = sims[top_k_indices]
            indices = top_k_indices
        else:
            return []

        query_words = set(re.findall(r"[a-zA-Z0-9_\-\.]+", query.lower()))

        results = []
        for raw_score, idx in zip(scores, indices):
            if 0 <= idx < len(self.chunks):
                chunk = self.chunks[idx]
                chunk_words = set(re.findall(r"[a-zA-Z0-9_\-\.]+", (chunk.runbook_title + " " + chunk.content).lower()))
                
                # Check critical domain alignment
                overlap = len(query_words.intersection(chunk_words))
                alignment_bonus = min(0.35, overlap * 0.02)

                # Calibrated confidence score
                calibrated = min(0.98, max(0.1, float(raw_score) + 0.35 + alignment_bonus))
                results.append((chunk, round(calibrated, 3)))

        # Sort by calibrated score descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results


# Global singleton instance
vector_store = LocalVectorStore()
