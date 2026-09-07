#!/usr/bin/env python3
"""EasyFlashcard Developer Mode Prepopulation & Seed Script.

Prepopulates the environment with hierarchical folders, subfolders, sets,
and rich flashcards (with LaTeX formulas, Markdown, and citation references).

Supports dual-mode execution:
1. Fast mode: Calls `/api/v1/dev/seed` if backend has developer endpoints enabled.
2. Standalone REST fallback: Sequentially calls `/api/v1/folders`, `/api/v1/sets`,
   and `/api/v1/sets/{id}/cards/bulk` so it works against any running backend.

Usage:
    python seed_dev_data.py [--base-url http://127.0.0.1:8000] [--user-id dev_user_123] [--clean]
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


class Colors:
    CYAN = "\033[96m" if os.name != "nt" or "WT_SESSION" in os.environ else ""
    GREEN = "\033[92m" if os.name != "nt" or "WT_SESSION" in os.environ else ""
    YELLOW = "\033[93m" if os.name != "nt" or "WT_SESSION" in os.environ else ""
    RED = "\033[91m" if os.name != "nt" or "WT_SESSION" in os.environ else ""
    BOLD = "\033[1m" if os.name != "nt" or "WT_SESSION" in os.environ else ""
    DIM = "\033[2m" if os.name != "nt" or "WT_SESSION" in os.environ else ""
    RESET = "\033[0m" if os.name != "nt" or "WT_SESSION" in os.environ else ""


SEED_TREE_DATA: list[dict[str, Any]] = [
    {
        "folder_name": "Computer Science",
        "subfolders": [
            {
                "folder_name": "Algorithms & Data Structures",
                "subfolders": [
                    {
                        "folder_name": "Advanced Optimization",
                        "sets": [
                            {
                                "name": "Dynamic Programming Fundamentals",
                                "description": (
                                    "Mastering optimal substructure, overlapping subproblems, "
                                    "memoization patterns, and tabulation tables."
                                ),
                                "tags": ["algorithms", "cs", "dp", "interview-prep"],
                                "cards": [
                                    {
                                        "front": "What are the two core prerequisites for a problem to be solvable via Dynamic Programming?",
                                        "back": (
                                            "1. **Optimal Substructure**: An optimal solution contains optimal solutions to subproblems.\n"
                                            "2. **Overlapping Subproblems**: Recursive solutions revisit identical subproblems repeatedly."
                                        ),
                                        "source_doc": {
                                            "document_id": "doc_algo_clrs",
                                            "document_name": "CLRS_Algorithms_4th_Ed.pdf",
                                            "page_number": 378,
                                        },
                                    },
                                    {
                                        "front": "Compare Top-Down (Memoization) vs Bottom-Up (Tabulation).",
                                        "back": (
                                            "- **Top-Down (Memoization)**: Natural recursion augmented with a lookup cache. Computes on-demand.\n"
                                            "- **Bottom-Up (Tabulation)**: Iterative evaluation starting from base cases up to the target state."
                                        ),
                                    },
                                    {
                                        "front": "State the standard recurrence relation for 0/1 Knapsack.",
                                        "back": (
                                            "For item $i$ with weight $w_i$ and value $v_i$, capacity $W$:\n\n"
                                            "$$DP[i][w] = \\max(DP[i-1][w],\\ DP[i-1][w - w_i] + v_i) \\quad (w_i \\le w)$$"
                                        ),
                                    },
                                    {
                                        "front": "What is the time complexity of Longest Common Subsequence (LCS)?",
                                        "back": (
                                            "- **Time**: $O(m \\times n)$\n"
                                            "- **Space**: $O(m \\times n)$ standard, or $O(\\min(m, n))$ with rolling rows."
                                        ),
                                    },
                                    {
                                        "front": "What is Matrix Chain Multiplication?",
                                        "back": (
                                            "Find optimal parenthesization of $\\mathbf{A}_1 \\dots \\mathbf{A}_n$ to minimize scalar operations in $O(n^3)$ time."
                                        ),
                                    },
                                ],
                            }
                        ],
                    }
                ],
                "sets": [
                    {
                        "name": "Binary Trees & Balanced Search Trees",
                        "description": "BST invariants, tree traversals, AVL rotations, and asymptotic bounds.",
                        "tags": ["data-structures", "trees", "cs", "binary-search"],
                        "cards": [
                            {
                                "front": "What is the fundamental Binary Search Tree (BST) invariant?",
                                "back": (
                                    "For every node $x$:\n"
                                    "- Left subtree keys: $< x.\\text{key}$\n"
                                    "- Right subtree keys: $> x.\\text{key}$"
                                ),
                                "source_doc": {
                                    "document_id": "doc_algo_clrs",
                                    "document_name": "CLRS_Algorithms_4th_Ed.pdf",
                                    "page_number": 287,
                                },
                            },
                            {
                                "front": "What are the three depth-first tree traversals and their visit orders?",
                                "back": (
                                    "1. **Pre-order**: Node $\\rightarrow$ Left $\\rightarrow$ Right\n"
                                    "2. **In-order**: Left $\\rightarrow$ Node $\\rightarrow$ Right (Sorted for BST)\n"
                                    "3. **Post-order**: Left $\\rightarrow$ Right $\\rightarrow$ Node"
                                ),
                            },
                            {
                                "front": "What is the AVL tree balance factor invariant?",
                                "back": (
                                    "$BF = \\text{height}(\\text{left}) - \\text{height}(\\text{right}) \\in \\{-1, 0, +1\\}$. "
                                    "If $|BF| > 1$, rotations rebalance the node."
                                ),
                            },
                            {
                                "front": "Compare worst-case lookup time: Unbalanced BST vs Balanced BST.",
                                "back": (
                                    "- **Unbalanced BST**: Degenerates to $O(n)$ search time.\n"
                                    "- **Balanced BST (AVL / Red-Black)**: Strictly $O(\\log n)$ search time guaranteed."
                                ),
                            },
                            {
                                "front": "Maximum number of nodes in binary tree of height $h$?",
                                "back": "The maximum count is $2^{h+1} - 1$ (with root height $h = 0$).",
                            },
                        ],
                    },
                    {
                        "name": "Graph Algorithms & Shortest Paths",
                        "description": "BFS, DFS, topological sorting, Dijkstra, and Bellman-Ford.",
                        "tags": ["graphs", "algorithms", "bfs", "dfs", "cs"],
                        "cards": [
                            {
                                "front": "What is the time complexity of Breadth-First Search (BFS)?",
                                "back": "$$O(|V| + |E|)$$ using an adjacency list representation.",
                            },
                            {
                                "front": "When does Dijkstra's Algorithm fail?",
                                "back": (
                                    "Dijkstra fails on graphs with **negative edge weights**. "
                                    "Use **Bellman-Ford** ($O(|V| \\cdot |E|)$) instead."
                                ),
                                "source_doc": {
                                    "document_id": "doc_algo_clrs",
                                    "document_name": "CLRS_Algorithms_4th_Ed.pdf",
                                    "page_number": 658,
                                },
                            },
                            {
                                "front": "What graph type allows a Topological Ordering?",
                                "back": "A **Directed Acyclic Graph (DAG)**. Cycles prevent topological orderings.",
                            },
                            {
                                "front": "Compare Prim's vs Kruskal's for Minimum Spanning Trees (MST).",
                                "back": (
                                    "- **Prim**: Grows a tree from a root via frontier edges ($O(|E| \\log |V|)$).\n"
                                    "- **Kruskal**: Sorts edges and unions components via Disjoint Set ($O(|E| \\log |E|)$)."
                                ),
                            },
                        ],
                    },
                ],
            },
            {
                "folder_name": "Web Systems & Architecture",
                "sets": [
                    {
                        "name": "Modern React & Frontend Architecture",
                        "description": "React 19 hooks, concurrency, server components, and state patterns.",
                        "tags": ["react", "frontend", "typescript", "architecture"],
                        "cards": [
                            {
                                "front": "What is the distinction between `useMemo` and `useCallback`?",
                                "back": (
                                    "- `useMemo`: Caches the **computed result** of a function call.\n"
                                    "- `useCallback`: Caches the **function instance itself**."
                                ),
                            },
                            {
                                "front": "What problem does `useTransition` solve?",
                                "back": (
                                    "Marks state updates as non-urgent transitions, keeping user input responsive at 60 FPS while heavy screens render in background."
                                ),
                            },
                            {
                                "front": "What are React Server Components (RSC)?",
                                "back": (
                                    "Components executed purely on the server. Zero client bundle impact, direct access to backend resources, and faster Time-to-Interactive."
                                ),
                            },
                        ],
                    }
                ],
            },
        ],
    },
    {
        "folder_name": "Medical & Life Sciences",
        "subfolders": [
            {
                "folder_name": "Human Anatomy & Physiology",
                "sets": [
                    {
                        "name": "Cardiovascular System & Hemodynamics",
                        "description": "Circulation routes, cardiac cycle, pacemaker conduction, and hemodynamics.",
                        "tags": ["medicine", "anatomy", "cardiology", "physiology"],
                        "cards": [
                            {
                                "front": "Trace the blood flow from right atrium to systemic circulation.",
                                "back": (
                                    "Right Atrium $\\rightarrow$ Tricuspid $\\rightarrow$ Right Ventricle $\\rightarrow$ "
                                    "Pulmonic Valve $\\rightarrow$ Lungs $\\rightarrow$ Left Atrium $\\rightarrow$ "
                                    "Bicuspid/Mitral $\\rightarrow$ Left Ventricle $\\rightarrow$ Aortic Valve $\\rightarrow$ Systemic Arteries."
                                ),
                                "source_doc": {
                                    "document_id": "doc_guyton",
                                    "document_name": "Guyton_and_Hall_Physiology.pdf",
                                    "page_number": 114,
                                },
                            },
                            {
                                "front": "What is the natural pacemaker of the heart?",
                                "back": "The **Sinoatrial (SA) Node**, naturally pacing at 60-100 bpm.",
                            },
                            {
                                "front": "What formulas define Cardiac Output (CO) and Mean Arterial Pressure (MAP)?",
                                "back": (
                                    "- $CO = \\text{Heart Rate (HR)} \\times \\text{Stroke Volume (SV)}$\n"
                                    "- $MAP = \\text{Diastolic BP} + \\frac{1}{3}(\\text{Systolic BP} - \\text{Diastolic BP})$"
                                ),
                            },
                        ],
                    }
                ],
            },
            {
                "folder_name": "Biochemistry & Genetics",
                "sets": [
                    {
                        "name": "Cellular Respiration & ATP Synthesis",
                        "description": "Glycolysis, Krebs cycle, and electron transport oxidative phosphorylation.",
                        "tags": ["biochemistry", "metabolism", "biology", "atp"],
                        "cards": [
                            {
                                "front": "What is the net yield per glucose molecule in Glycolysis?",
                                "back": "Net yield: **$2\\text{ ATP}$**, **$2\\text{ NADH}$**, and **$2\\text{ Pyruvate}$**.",
                            },
                            {
                                "front": "What enzyme catalyzes the rate-limiting step of Glycolysis?",
                                "back": "**Phosphofructokinase-1 (PFK-1)**, converting F6P to F-1,6-BP.",
                            },
                            {
                                "front": "What powers ATP Synthase in the electron transport chain?",
                                "back": "The **Proton-Motive Force (PMF)** generated by the electrochemical $H^+$ gradient across the inner mitochondrial membrane.",
                            },
                        ],
                    }
                ],
            },
        ],
    },
    {
        "folder_name": "Languages & Linguistics",
        "subfolders": [
            {
                "folder_name": "Spanish (Español)",
                "sets": [
                    {
                        "name": "Spanish Conversational Essentials",
                        "description": "Everyday phrases, idiomatic expressions, Ser vs Estar, and questions.",
                        "tags": ["spanish", "languages", "beginner", "conversation"],
                        "cards": [
                            {
                                "front": "¿Cómo se dice 'Could you help me, please?'?",
                                "back": "**¿Podría ayudarme, por favor?** (Formal) / **¿Me puedes ayudar?** (Informal)",
                            },
                            {
                                "front": "Ser vs Estar: When is each used?",
                                "back": (
                                    "- **Ser**: Inherent traits, identity, time, origin (DOCTOR).\n"
                                    "- **Estar**: Temporary states, emotions, physical location (PLACE)."
                                ),
                            },
                            {
                                "front": "¿Qué significa 'Por si acaso'?",
                                "back": "**Just in case**.\n\n*Ejemplo*: Lleva un paraguas por si acaso llueve.",
                            },
                        ],
                    }
                ],
            }
        ],
    },
]

ROOT_SETS_DATA: list[dict[str, Any]] = [
    {
        "name": "Mental Models & Cognitive Biases",
        "description": "Heuristics and reasoning frameworks for decision-making.",
        "tags": ["psychology", "productivity", "decision-making"],
        "cards": [
            {
                "front": "What is Confirmation Bias?",
                "back": "Favoring and recalling information that confirms existing beliefs while ignoring contrary evidence.",
            },
            {
                "front": "Define First Principles Thinking.",
                "back": "Boiling a problem down to foundational truths and reasoning upwards, rather than copying existing practices by analogy.",
            },
            {
                "front": "What is the Sunk Cost Fallacy?",
                "back": "Continuing an investment simply because resources have already been spent, rather than evaluating future payoff.",
            },
        ],
    },
    {
        "name": "LaTeX & Markdown Formatting Playground",
        "description": "Cheatsheet testing mathematical formulas, code blocks, and markdown elements.",
        "tags": ["cheatsheet", "markdown", "latex", "math"],
        "cards": [
            {
                "front": "Pythagorean Theorem & Quadratic Formula",
                "back": (
                    "**Pythagorean Theorem**:\n$$a^2 + b^2 = c^2$$\n\n"
                    "**Quadratic Formula**:\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$"
                ),
            },
            {
                "front": "Euler's Identity & Gaussian Integral",
                "back": (
                    "**Euler's Identity**:\n$$e^{i\\pi} + 1 = 0$$\n\n"
                    "**Gaussian Integral**:\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}$$"
                ),
            },
        ],
    },
]


def http_request(
    url: str,
    method: str = "GET",
    data: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    timeout: float = 10.0,
) -> tuple[int, Any]:
    """Execute an HTTP request and return (status_code, parsed_json_or_text)."""
    req_headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if headers:
        req_headers.update(headers)

    payload = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=payload, headers=req_headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            status_code = response.status
            raw_body = response.read().decode("utf-8")
            try:
                parsed_body = json.loads(raw_body)
            except json.JSONDecodeError:
                parsed_body = raw_body
            return status_code, parsed_body
    except urllib.error.HTTPError as e:
        raw_body = e.read().decode("utf-8")
        try:
            parsed_body = json.loads(raw_body)
        except json.JSONDecodeError:
            parsed_body = raw_body
        return e.code, parsed_body
    except urllib.error.URLError as e:
        raise ConnectionError(f"Could not connect to {url}: {e.reason}") from e


def verify_server_health(base_url: str) -> dict[str, Any]:
    """Ensure the backend server is reachable and healthy."""
    for path in ["/health", "/api/v1/health", "/api/health"]:
        try:
            status, body = http_request(f"{base_url}{path}", timeout=4.0)
            if status == 200 and isinstance(body, dict):
                return body
        except Exception:
            continue
    raise ConnectionError(f"No response from {base_url}/health or /api/v1/health")


def seed_via_dev_endpoint(base_url: str, user_id: str, clear_existing: bool) -> dict[str, Any] | None:
    """Try calling the fast developer seed endpoint."""
    clear_param = "true" if clear_existing else "false"
    for path in ["/api/v1/dev/seed", "/dev/seed"]:
        try:
            status, body = http_request(
                f"{base_url}{path}?clear_existing={clear_param}",
                method="POST",
                headers={"X-User-ID": user_id},
                timeout=15.0,
            )
            if status == 200 and isinstance(body, dict) and body.get("status") == "success":
                return body
        except Exception:
            continue
    return None


def clear_via_rest(base_url: str, user_id: str, verbose: bool = False) -> tuple[int, int]:
    """Delete all folders and sets for user using standard REST endpoints."""
    headers = {"X-User-ID": user_id}
    # 1. Delete sets
    st, sets = http_request(f"{base_url}/api/v1/sets", headers=headers)
    del_sets = 0
    if st == 200 and isinstance(sets, list):
        for s in sets:
            s_id = s.get("id")
            if s_id:
                http_request(f"{base_url}/api/v1/sets/{s_id}", method="DELETE", headers=headers)
                del_sets += 1

    # 2. Delete folders
    st, folders = http_request(f"{base_url}/api/v1/folders", headers=headers)
    del_folders = 0
    if st == 200 and isinstance(folders, list):
        for f in folders:
            f_id = f.get("id")
            if f_id:
                http_request(f"{base_url}/api/v1/folders/{f_id}", method="DELETE", headers=headers)
                del_folders += 1

    if verbose:
        print(f"    Cleaned up {del_folders} existing folders, {del_sets} existing sets.")
    return del_folders, del_sets


def create_cards_rest(base_url: str, set_id: str, card_specs: list[dict[str, Any]], headers: dict[str, str]) -> int:
    """Add batch of cards to a set via REST."""
    cards_payload = []
    for idx, c in enumerate(card_specs):
        card_obj: dict[str, Any] = {
            "front": {"text": c["front"]},
            "back": {"text": c["back"]},
            "orderIndex": idx,
        }
        if "source_doc" in c:
            card_obj["sourceReference"] = {
                "documentId": c["source_doc"]["document_id"],
                "documentName": c["source_doc"]["document_name"],
                "pageNumber": c["source_doc"]["page_number"],
            }
        cards_payload.append(card_obj)

    st, res = http_request(
        f"{base_url}/api/v1/sets/{set_id}/cards/bulk",
        method="POST",
        data={"cards": cards_payload},
        headers=headers,
    )
    if st in (200, 201) and isinstance(res, list):
        return len(res)
    return 0


def seed_via_rest(base_url: str, user_id: str, clear_existing: bool, verbose: bool = False) -> dict[str, int]:
    """Fallback: Populate entire hierarchy sequentially using standard REST endpoints."""
    headers = {"X-User-ID": user_id}
    stats = {"folders_created": 0, "sets_created": 0, "cards_created": 0}

    if clear_existing:
        clear_via_rest(base_url, user_id, verbose=verbose)

    # 1. Create root standalone sets
    for root_set in ROOT_SETS_DATA:
        st, res = http_request(
            f"{base_url}/api/v1/sets",
            method="POST",
            data={
                "name": root_set["name"],
                "description": root_set.get("description"),
                "folderId": None,
                "tags": root_set.get("tags", []),
            },
            headers=headers,
        )
        if st in (200, 201) and isinstance(res, dict):
            stats["sets_created"] += 1
            set_id = res["id"]
            c_count = create_cards_rest(base_url, set_id, root_set.get("cards", []), headers)
            stats["cards_created"] += c_count
            if verbose:
                print(f"  + Created root set: {root_set['name']} ({c_count} cards)")

    # 2. Recursive folder builder
    def build_node(node: dict[str, Any], parent_id: str | None = None, indent: str = "  ") -> None:
        st, res = http_request(
            f"{base_url}/api/v1/folders",
            method="POST",
            data={"name": node["folder_name"], "parentId": parent_id},
            headers=headers,
        )
        if st in (200, 201) and isinstance(res, dict):
            folder_id = res["id"]
            stats["folders_created"] += 1
            if verbose:
                print(f"{indent}📁 Folder: {node['folder_name']}")

            # Create sets in folder
            for s in node.get("sets", []):
                st_s, res_s = http_request(
                    f"{base_url}/api/v1/sets",
                    method="POST",
                    data={
                        "name": s["name"],
                        "description": s.get("description"),
                        "folderId": folder_id,
                        "tags": s.get("tags", []),
                    },
                    headers=headers,
                )
                if st_s in (200, 201) and isinstance(res_s, dict):
                    stats["sets_created"] += 1
                    c_count = create_cards_rest(base_url, res_s["id"], s.get("cards", []), headers)
                    stats["cards_created"] += c_count
                    if verbose:
                        print(f"{indent}  └── 📚 Set: {s['name']} ({c_count} cards)")

            # Recurse subfolders
            for sub in node.get("subfolders", []):
                build_node(sub, parent_id=folder_id, indent=indent + "    ")

    for root_folder in SEED_TREE_DATA:
        build_node(root_folder)

    return stats


def main() -> int:
    """CLI entrypoint."""
    parser = argparse.ArgumentParser(
        description="EasyFlashcard Developer Mode Prepopulation & Seed Script"
    )
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
        help="Base URL of EasyFlashcard API (default: http://127.0.0.1:8000)",
    )
    parser.add_argument(
        "--user-id",
        default="dev_user_123",
        help="User ID to populate data for (default: dev_user_123)",
    )
    parser.add_argument(
        "--clean",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Clear existing user data before seeding (default: True)",
    )
    parser.add_argument(
        "--reset-only",
        action="store_true",
        help="Only reset and clear existing data without creating sample items",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Display detailed output for each item",
    )

    args = parser.parse_args()
    base_url = args.base_url.rstrip("/")
    user_id = args.user_id.strip()

    print(f"\n{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}   EasyFlashcard - Developer Environment Prepopulator  {Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}\n")
    print(f"Target URL:    {Colors.BOLD}{base_url}{Colors.RESET}")
    print(f"Target User:   {Colors.BOLD}{user_id}{Colors.RESET}")
    print(f"Action:        {Colors.YELLOW}{'Reset Data Only' if args.reset_only else ('Clean & Seed' if args.clean else 'Append Seed Data')}{Colors.RESET}")
    print()

    # 1. Health check
    print(f"[*] Connecting to backend server...", end=" ", flush=True)
    try:
        health_info = verify_server_health(base_url)
        print(f"{Colors.GREEN}Connected!{Colors.RESET}")
        print(f"    App:     {health_info.get('app_name', 'EasyFlashcard API')} (v{health_info.get('version', '0.1.0')})")
        print(f"    Backend: {health_info.get('storage_backend', 'memory')}")
    except Exception as err:
        print(f"{Colors.RED}Failed!{Colors.RESET}")
        print(f"\n{Colors.RED}Error: Could not reach backend server at {base_url}.{Colors.RESET}")
        print(f"{Colors.DIM}Ensure the backend is running via `docker compose up` or `uv run uvicorn app.main:app --port 8000`.{Colors.RESET}")
        print(f"Details: {err}\n")
        return 1

    # 2. Reset-only flow
    if args.reset_only:
        print(f"\n[*] Resetting user data for {Colors.BOLD}{user_id}{Colors.RESET}...", end=" ", flush=True)
        del_f, del_s = clear_via_rest(base_url, user_id, verbose=args.verbose)
        print(f"{Colors.GREEN}Done!{Colors.RESET}")
        print(f"    Deleted Folders: {del_f}")
        print(f"    Deleted Sets:    {del_s}")
        return 0

    # 3. Seed flow: Try fast endpoint first, then fallback to REST
    print(f"\n[*] Prepopulating environment with folders, subfolders, sets, and flashcards...")
    seed_res = seed_via_dev_endpoint(base_url, user_id, clear_existing=args.clean)
    if seed_res:
        folders_count = seed_res.get("folders_created", 0)
        sets_count = seed_res.get("sets_created", 0)
        cards_count = seed_res.get("cards_created", 0)
    else:
        # Fallback to standard REST endpoints
        if args.verbose:
            print(f"  {Colors.DIM}(Using standard REST endpoints){Colors.RESET}")
        stats = seed_via_rest(base_url, user_id, clear_existing=args.clean, verbose=args.verbose)
        folders_count = stats["folders_created"]
        sets_count = stats["sets_created"]
        cards_count = stats["cards_created"]

    print(f"\n{Colors.GREEN}{Colors.BOLD}[OK] Environment prepopulated successfully!{Colors.RESET}\n")
    print(f"   {Colors.CYAN}[Folders & Subfolders]:{Colors.RESET} {Colors.BOLD}{folders_count}{Colors.RESET}")
    print(f"   {Colors.CYAN}[Flashcard Sets]:     {Colors.RESET} {Colors.BOLD}{sets_count}{Colors.RESET}")
    print(f"   {Colors.CYAN}[Flashcards]:         {Colors.RESET} {Colors.BOLD}{cards_count}{Colors.RESET}")

    print(f"\n{Colors.BOLD}Populated Content Summary:{Colors.RESET}")
    print(f"  +-- [Folder] {Colors.BOLD}Computer Science{Colors.RESET}")
    print(f"  |    +-- [Folder] Algorithms & Data Structures")
    print(f"  |    |    +-- [Folder] Advanced Optimization")
    print(f"  |    |    |    +-- [Set] Dynamic Programming Fundamentals (5 cards)")
    print(f"  |    |    +-- [Set] Binary Trees & Balanced Search Trees (5 cards, LaTeX)")
    print(f"  |    |    +-- [Set] Graph Algorithms & Shortest Paths (4 cards)")
    print(f"  |    +-- [Folder] Web Systems & Architecture")
    print(f"  |         +-- [Set] Modern React & Frontend Architecture (3 cards)")
    print(f"  +-- [Folder] {Colors.BOLD}Medical & Life Sciences{Colors.RESET}")
    print(f"  |    +-- [Folder] Human Anatomy & Physiology")
    print(f"  |    |    +-- [Set] Cardiovascular System & Hemodynamics (3 cards, doc citations)")
    print(f"  |    +-- [Folder] Biochemistry & Genetics")
    print(f"  |         +-- [Set] Cellular Respiration & ATP Synthesis (3 cards)")
    print(f"  +-- [Folder] {Colors.BOLD}Languages & Linguistics{Colors.RESET}")
    print(f"  |    +-- [Folder] Spanish (Español)")
    print(f"  |         +-- [Set] Spanish Conversational Essentials (3 cards)")
    print(f"  +-- [Root Set] {Colors.BOLD}Mental Models & Cognitive Biases{Colors.RESET} (3 cards)")
    print(f"  +-- [Root Set] {Colors.BOLD}LaTeX & Markdown Formatting Playground{Colors.RESET} (2 cards)")

    print(f"\n{Colors.GREEN}Ready to test in the browser at {Colors.BOLD}http://localhost:5173{Colors.RESET}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
