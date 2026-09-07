"""Developer mode seed service for populating sample folders, subfolders, sets, and cards."""

import logging
from typing import Any

from app.models.flashcard import CardFace, DocumentReference, FlashcardCreate
from app.models.folder import FolderCreate
from app.models.set import SetCreate
from app.repositories.base import IFlashcardRepository, IFolderRepository, ISetRepository
from app.services.flashcard_service import FlashcardService
from app.services.folder_service import FolderService
from app.services.set_service import SetService

logger = logging.getLogger(__name__)

# Complete seed specification containing hierarchical folders, sets, and flashcards
DEV_SEED_DATA: list[dict[str, Any]] = [
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
                                            "1. **Optimal Substructure**: An optimal solution to the problem contains within it optimal solutions to subproblems.\n"
                                            "2. **Overlapping Subproblems**: A recursive solution revisits the same subproblems repeatedly rather than generating new subproblems."
                                        ),
                                        "source_doc": {
                                            "document_id": "doc_algo_intro",
                                            "document_name": "Introduction_to_Algorithms_CLRS.pdf",
                                            "page_number": 378,
                                        },
                                    },
                                    {
                                        "front": "Compare Top-Down (Memoization) vs Bottom-Up (Tabulation).",
                                        "back": (
                                            "- **Top-Down (Memoization)**: Natural recursion augmented with a lookup cache (hash map or array). Subproblems are computed on-demand.\n"
                                            "- **Bottom-Up (Tabulation)**: Iterative evaluation starting from base cases up to the target state. Avoids recursion stack overhead."
                                        ),
                                        "source_doc": {
                                            "document_id": "doc_algo_intro",
                                            "document_name": "Introduction_to_Algorithms_CLRS.pdf",
                                            "page_number": 382,
                                        },
                                    },
                                    {
                                        "front": "State the standard recurrence relation for the 0/1 Knapsack problem.",
                                        "back": (
                                            "For item $i$ with weight $w_i$ and value $v_i$, and knapsack capacity $W$:\n\n"
                                            "$$DP[i][w] = \\max(DP[i-1][w],\\ DP[i-1][w - w_i] + v_i) \\quad \\text{if } w_i \\le w$$\n"
                                            "Otherwise: $DP[i][w] = DP[i-1][w]$."
                                        ),
                                    },
                                    {
                                        "front": "What is the time and space complexity of the Longest Common Subsequence (LCS) of two strings of lengths $m$ and $n$?",
                                        "back": (
                                            "- **Time Complexity**: $O(m \\times n)$\n"
                                            "- **Standard Space**: $O(m \\times n)$\n"
                                            "- **Space-Optimized**: $O(\\min(m, n))$ using two rolling rows."
                                        ),
                                    },
                                    {
                                        "front": "What is the Matrix Chain Multiplication objective?",
                                        "back": (
                                            "Find the optimal parenthesization of a product of matrices $\\mathbf{A}_1 \\mathbf{A}_2 \\dots \\mathbf{A}_n$ "
                                            "to minimize scalar multiplications, solvable in $O(n^3)$ time using DP."
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
                        "description": (
                            "Structural properties, search invariants, rotation mechanics, "
                            "and asymptotic complexities of BSTs, AVL trees, and Red-Black trees."
                        ),
                        "tags": ["data-structures", "trees", "cs", "binary-search"],
                        "cards": [
                            {
                                "front": "What is the fundamental Binary Search Tree (BST) invariant?",
                                "back": (
                                    "For every node $x$ in the tree:\n"
                                    "- All keys in the left subtree of $x$ are strictly less than $x.\\text{key}$ ($k_L < k_x$).\n"
                                    "- All keys in the right subtree of $x$ are strictly greater than $x.\\text{key}$ ($k_R > k_x$)."
                                ),
                                "source_doc": {
                                    "document_id": "doc_algo_intro",
                                    "document_name": "Introduction_to_Algorithms_CLRS.pdf",
                                    "page_number": 287,
                                },
                            },
                            {
                                "front": "What are the three depth-first tree traversals and their visit orders?",
                                "back": (
                                    "1. **Pre-order**: Node $\\rightarrow$ Left $\\rightarrow$ Right\n"
                                    "2. **In-order**: Left $\\rightarrow$ Node $\\rightarrow$ Right (Yields sorted order in a BST)\n"
                                    "3. **Post-order**: Left $\\rightarrow$ Right $\\rightarrow$ Node (Ideal for tree deletion or bottom-up evaluations)"
                                ),
                            },
                            {
                                "front": "What is the AVL tree balance factor invariant?",
                                "back": (
                                    "The balance factor $BF = \\text{height}(\\text{left}) - \\text{height}(\\text{right})$ "
                                    "must be in $\\{-1, 0, +1\\}$ for every node. If $|BF| > 1$, rotations are triggered."
                                ),
                                "source_doc": {
                                    "document_id": "doc_algo_intro",
                                    "document_name": "Introduction_to_Algorithms_CLRS.pdf",
                                    "page_number": 321,
                                },
                            },
                            {
                                "front": "When is a Left-Right (LR) Double Rotation required in an AVL tree?",
                                "back": (
                                    "When a node is inserted into the **right** subtree of the **left** child of an unbalanced ancestor ($BF = +2$ on ancestor, $BF = -1$ on left child).\n\n"
                                    "First perform a **Left Rotation** on the child, followed by a **Right Rotation** on the ancestor."
                                ),
                            },
                            {
                                "front": "Compare worst-case lookup time: Unbalanced BST vs Balanced BST.",
                                "back": (
                                    "- **Unbalanced BST**: Degenerates to a linked list with $O(n)$ search time.\n"
                                    "- **Balanced BST (AVL / Red-Black)**: Guaranteed height $h \\le c \\log_2(n)$, yielding strictly $O(\\log n)$ search time."
                                ),
                            },
                            {
                                "front": "What is the maximum number of nodes in a binary tree of height $h$?",
                                "back": (
                                    "The maximum number of nodes is $2^{h+1} - 1$ (where a single root node has height $h = 0$)."
                                ),
                            },
                        ],
                    },
                    {
                        "name": "Graph Algorithms & Shortest Paths",
                        "description": (
                            "Breadth-First Search, Depth-First Search, topological sorting, "
                            "Dijkstra's algorithm, and Bellman-Ford comparisons."
                        ),
                        "tags": ["graphs", "algorithms", "bfs", "dfs", "cs"],
                        "cards": [
                            {
                                "front": "What is the time complexity of Breadth-First Search (BFS) on graph $G = (V, E)$?",
                                "back": (
                                    "$$O(|V| + |E|)$$\n\n"
                                    "Every vertex is enqueued at most once, and every edge is traversed once (or twice in undirected graphs) using an adjacency list representation."
                                ),
                            },
                            {
                                "front": "When can Dijkstra's Algorithm fail to produce the shortest path?",
                                "back": (
                                    "Dijkstra assumes that adding an edge always increases or maintains path distance. "
                                    "It **fails on graphs with negative edge weights**. In such cases, use the **Bellman-Ford algorithm** ($O(|V| \\cdot |E|)$)."
                                ),
                                "source_doc": {
                                    "document_id": "doc_algo_intro",
                                    "document_name": "Introduction_to_Algorithms_CLRS.pdf",
                                    "page_number": 658,
                                },
                            },
                            {
                                "front": "What condition must a graph satisfy to possess a Topological Ordering?",
                                "back": (
                                    "The graph must be a **Directed Acyclic Graph (DAG)**. "
                                    "If a cycle exists, no topological ordering is possible."
                                ),
                            },
                            {
                                "front": "What is the difference between Prim's and Kruskal's algorithms for Minimum Spanning Trees (MST)?",
                                "back": (
                                    "- **Prim's Algorithm**: Grows a single tree starting from an arbitrary root by picking the cheapest frontier edge ($O(|E| \\log |V|)$).\n"
                                    "- **Kruskal's Algorithm**: Sorts all edges globally by weight and adds them if they don't form a cycle using a Disjoint Set Union (DSU) structure ($O(|E| \\log |E|)$)."
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
                        "description": (
                            "React 19 fundamentals, hooks, concurrency, server components, "
                            "and performance optimization techniques."
                        ),
                        "tags": ["react", "frontend", "typescript", "architecture"],
                        "cards": [
                            {
                                "front": "What is the primary distinction between `useMemo` and `useCallback`?",
                                "back": (
                                    "- `useMemo(() => computeValue(a, b), [a, b])` caches the **computed result** of a function call between re-renders.\n"
                                    "- `useCallback(fn, deps)` caches the **function instance itself**, preventing unnecessary re-renders of memoized child components (`React.memo`)."
                                ),
                            },
                            {
                                "front": "What problem does `useTransition` solve in React concurrency?",
                                "back": (
                                    "`useTransition` allows marking non-urgent state updates as transitions. "
                                    "This lets urgent updates (like typing in an input field) interrupt non-urgent renders (like filtering a heavy data table), maintaining 60 FPS responsiveness."
                                ),
                            },
                            {
                                "front": "Why should keys in React lists never be array indices when the list is mutable?",
                                "back": (
                                    "Using array indices causes React's reconciliation diff algorithm to incorrectly match DOM nodes when items are inserted, deleted, or reordered. "
                                    "This leads to state retention bugs in uncontrolled inputs and unnecessary DOM re-creation."
                                ),
                            },
                            {
                                "front": "What are React Server Components (RSC) and their key advantage?",
                                "back": (
                                    "Components that execute exclusively on the server at build time or request time. "
                                    "Their code and dependencies are not included in the client JavaScript bundle, significantly reducing bundle size and speeding up Time-to-Interactive (TTI)."
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
                        "description": (
                            "Systemic and pulmonary blood circulation pathways, cardiac electrical "
                            "conduction, cardiac output determinants, and blood pressure regulation."
                        ),
                        "tags": ["medicine", "anatomy", "cardiology", "physiology"],
                        "cards": [
                            {
                                "front": "Trace the path of deoxygenated blood entering the heart to systemic circulation.",
                                "back": (
                                    "1. Superior/Inferior Vena Cava $\\rightarrow$ **Right Atrium**\n"
                                    "2. Tricuspid Valve $\\rightarrow$ **Right Ventricle**\n"
                                    "3. Pulmonary Valve $\\rightarrow$ Pulmonary Arteries $\\rightarrow$ Lungs (oxygenation)\n"
                                    "4. Pulmonary Veins $\\rightarrow$ **Left Atrium**\n"
                                    "5. Bicuspid (Mitral) Valve $\\rightarrow$ **Left Ventricle**\n"
                                    "6. Aortic Valve $\\rightarrow$ **Aorta** $\\rightarrow$ Systemic Arterial System"
                                ),
                                "source_doc": {
                                    "document_id": "doc_med_physiology",
                                    "document_name": "Guyton_and_Hall_Medical_Physiology.pdf",
                                    "page_number": 114,
                                },
                            },
                            {
                                "front": "What is the intrinsic pacemaker of the heart and its normal firing rate?",
                                "back": (
                                    "The **Sinoatrial (SA) Node**, located in the right atrial wall near the SVC entrance. "
                                    "Its natural automaticity generates impulses at **60-100 beats per minute**."
                                ),
                                "source_doc": {
                                    "document_id": "doc_med_physiology",
                                    "document_name": "Guyton_and_Hall_Medical_Physiology.pdf",
                                    "page_number": 122,
                                },
                            },
                            {
                                "front": "State the formula for Cardiac Output (CO) and Mean Arterial Pressure (MAP).",
                                "back": (
                                    "- **Cardiac Output**: $CO = \\text{Heart Rate (HR)} \\times \\text{Stroke Volume (SV)}$ (typically $\\approx 5\\text{ L/min}$ at rest)\n"
                                    "- **Mean Arterial Pressure**: $MAP = \\text{Diastolic BP} + \\frac{1}{3}(\\text{Systolic BP} - \\text{Diastolic BP})$"
                                ),
                            },
                            {
                                "front": "What does the Frank-Starling Law of the heart describe?",
                                "back": (
                                    "The stroke volume of the heart increases in response to an increase in the volume of blood in the ventricles before contraction (end-diastolic volume / preload). "
                                    "Greater myocardial stretch produces stronger cross-bridge contraction."
                                ),
                            },
                            {
                                "front": "What physiological event corresponds to the first heart sound (S1, 'lub')?",
                                "back": (
                                    "Closure of the **Atrioventricular valves** (Mitral and Tricuspid) at the onset of ventricular systole."
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
                        "description": (
                            "Glycolysis, the citric acid cycle, pyruvate oxidation, "
                            "and chemiosmotic oxidative phosphorylation."
                        ),
                        "tags": ["biochemistry", "metabolism", "biology", "atp"],
                        "cards": [
                            {
                                "front": "What is the net yield of ATP and NADH per glucose molecule in Glycolysis?",
                                "back": (
                                    "- **Net ATP**: $2\\text{ ATP}$ (4 produced via substrate-level phosphorylation minus 2 invested)\n"
                                    "- **NADH**: $2\\text{ NADH}$\n"
                                    "- **Pyruvate**: $2\\text{ molecules}$"
                                ),
                            },
                            {
                                "front": "What enzyme catalyzes the committed, rate-limiting step of Glycolysis?",
                                "back": (
                                    "**Phosphofructokinase-1 (PFK-1)**, which phosphorylates Fructose-6-phosphate to Fructose-1,6-bisphosphate. "
                                    "It is allosterically inhibited by high ATP and citrate, and stimulated by AMP and Fructose-2,6-bisphosphate."
                                ),
                            },
                            {
                                "front": "What is the driving force that powers ATP Synthase in the electron transport chain?",
                                "back": (
                                    "The **Proton-Motive Force (PMF)** generated by the electrochemical proton gradient across the inner mitochondrial membrane, "
                                    "pumped by Complexes I, III, and IV."
                                ),
                            },
                            {
                                "front": "Under aerobic conditions, what is the approximate theoretical yield of ATP per glucose?",
                                "back": (
                                    "Approximately **30 to 32 ATP** per molecule of fully oxidized glucose."
                                ),
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
                        "description": (
                            "Essential vocabulary, practical idioms, questions, and polite phrases "
                            "for everyday conversational fluency."
                        ),
                        "tags": ["spanish", "languages", "beginner", "conversation"],
                        "cards": [
                            {
                                "front": "¿Cómo se dice 'Could you help me, please?' en español?",
                                "back": "**¿Podría ayudarme, por favor?** (Formal)\no **¿Me puedes ayudar, por favor?** (Informal)",
                            },
                            {
                                "front": "What is the key difference between the verbs 'Ser' and 'Estar'?",
                                "back": (
                                    "- **Ser**: Used for permanent or intrinsic characteristics, identity, nationality, time, and origin (DOCTOR: Description, Occupation, Characteristic, Time, Origin, Relation).\n"
                                    "- **Estar**: Used for temporary states, locations, conditions, and emotions (PLACE: Position, Location, Action, Condition, Emotion)."
                                ),
                            },
                            {
                                "front": "¿Qué significa la expresión 'Por si acaso'?",
                                "back": "**Just in case**.\n\n*Ejemplo*: Lleva un paraguas por si acaso llueve. (Take an umbrella just in case it rains.)",
                            },
                            {
                                "front": "Translate to Spanish: 'I would like to make a reservation for two people.'",
                                "back": "**Me gustaría hacer una reserva para dos personas.**",
                            },
                            {
                                "front": "¿Qué significa 'Vale la pena'?",
                                "back": "**It's worth it** / **It is worthwhile**.\n\n*Ejemplo*: El museo está lejos, pero vale la pena visitarlo.",
                            },
                        ],
                    }
                ],
            }
        ],
    },
]

# Standalone sets placed directly in the root workspace library (no parent folder)
ROOT_SEED_SETS: list[dict[str, Any]] = [
    {
        "name": "Mental Models & Cognitive Biases",
        "description": (
            "Essential frameworks for clearer thinking, rational decision-making, "
            "and identifying psychological reasoning traps."
        ),
        "tags": ["psychology", "productivity", "decision-making", "philosophy"],
        "cards": [
            {
                "front": "What is Confirmation Bias and how can it be counteracted?",
                "back": (
                    "The tendency to search for, interpret, favor, and recall information in a way that confirms preexisting beliefs or hypotheses.\n\n"
                    "**Countermeasure**: Actively seek out disconfirming evidence and formulate 'falsifiable' hypotheses."
                ),
            },
            {
                "front": "Explain First Principles Thinking (Reasoning from First Principles).",
                "back": (
                    "Breaking a complex problem down to its most fundamental truths that cannot be deduced any further, and building a reasoned conclusion up from there, "
                    "rather than reasoning by analogy (copying what others have done)."
                ),
            },
            {
                "front": "What is the Sunk Cost Fallacy?",
                "back": (
                    "Continuing an endeavor or investment simply because one has already invested resources (time, money, effort) into it, "
                    "even when the future expected return does not justify further expenditure."
                ),
            },
            {
                "front": "Define the Pareto Principle (80/20 Rule).",
                "back": (
                    "For many outcomes, roughly **80% of consequences come from 20% of causes** (e.g., 80% of revenue from 20% of clients, 80% of software bugs from 20% of modules)."
                ),
            },
        ],
    },
    {
        "name": "LaTeX & Markdown Formatting Playground",
        "description": (
            "Interactive reference cards testing LaTeX mathematical equations, "
            "code blocks, tables, and typography formatting."
        ),
        "tags": ["cheatsheet", "markdown", "latex", "math"],
        "cards": [
            {
                "front": "Pythagorean Theorem & Quadratic Formula",
                "back": (
                    "**Pythagorean Theorem**:\n"
                    "$$a^2 + b^2 = c^2$$\n\n"
                    "**Quadratic Formula**:\n"
                    "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\n"
                    "Where $a, b, c \\in \\mathbb{R}$ and $a \\neq 0$."
                ),
            },
            {
                "front": "Euler's Identity & Gaussian Integral",
                "back": (
                    "**Euler's Identity** (connecting five fundamental constants):\n"
                    "$$e^{i\\pi} + 1 = 0$$\n\n"
                    "**Gaussian Integral**:\n"
                    "$$\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}$$"
                ),
            },
            {
                "front": "Markdown Typography & Code Syntax Test",
                "back": (
                    "Here is a demonstration of Markdown formatting features:\n\n"
                    "- **Bold text**, *italicized text*, and `inline code`\n"
                    "- Nested list item 1\n"
                    "- Nested list item 2\n\n"
                    "```python\ndef fibonacci(n: int) -> int:\n    return n if n <= 1 else fibonacci(n - 1) + fibonacci(n - 2)\n```"
                ),
            },
        ],
    },
]


class SeedService:
    """Service to populate realistic demo folders, subfolders, sets, and cards for local development."""

    def __init__(
        self,
        folder_service: FolderService,
        set_service: SetService,
        flashcard_service: FlashcardService,
        folder_repo: IFolderRepository,
        set_repo: ISetRepository,
        flashcard_repo: IFlashcardRepository,
    ) -> None:
        self.folder_service = folder_service
        self.set_service = set_service
        self.flashcard_service = flashcard_service
        self.folder_repo = folder_repo
        self.set_repo = set_repo
        self.flashcard_repo = flashcard_repo

    async def clear_user_data(self, user_id: str) -> dict[str, int]:
        """Remove all existing folders, sets, and flashcards for the given user."""
        # Find all user sets
        user_sets = await self.set_repo.list_by_user(user_id)
        set_ids = [s.id for s in user_sets]

        # Delete all flashcards in those sets
        deleted_cards = 0
        if set_ids:
            deleted_cards = await self.flashcard_repo.delete_by_set_ids(set_ids)

        # Delete sets
        deleted_sets = 0
        for s_id in set_ids:
            if await self.set_repo.delete(s_id, user_id):
                deleted_sets += 1

        # Delete all folders
        user_folders = await self.folder_repo.list_all_user_folders(user_id)
        folder_ids = [f.id for f in user_folders]
        deleted_folders = 0
        if folder_ids:
            deleted_folders = await self.folder_repo.delete_bulk(folder_ids, user_id)

        logger.info(
            "Cleared user data for %s: %d folders, %d sets, %d cards deleted",
            user_id,
            deleted_folders,
            deleted_sets,
            deleted_cards,
        )
        return {
            "deleted_folders": deleted_folders,
            "deleted_sets": deleted_sets,
            "deleted_cards": deleted_cards,
        }

    async def _create_cards_for_set(
        self, set_id: str, card_specs: list[dict[str, Any]], user_id: str
    ) -> int:
        """Create flashcards for a specific set."""
        card_creates: list[FlashcardCreate] = []
        for idx, card_spec in enumerate(card_specs):
            doc_ref = None
            if "source_doc" in card_spec:
                doc_ref = DocumentReference(
                    document_id=card_spec["source_doc"]["document_id"],
                    document_name=card_spec["source_doc"]["document_name"],
                    page_number=card_spec["source_doc"]["page_number"],
                )

            card_creates.append(
                FlashcardCreate(
                    front=CardFace(text=card_spec["front"]),
                    back=CardFace(text=card_spec["back"]),
                    order_index=idx,
                    source_reference=doc_ref,
                )
            )

        from app.models.flashcard import FlashcardBulkCreate

        created = await self.flashcard_service.create_cards_bulk(
            set_id=set_id,
            data=FlashcardBulkCreate(cards=card_creates),
            user_id=user_id,
        )
        return len(created)

    async def _populate_folder_node(
        self,
        node: dict[str, Any],
        parent_id: str | None,
        user_id: str,
        stats: dict[str, int],
    ) -> None:
        """Recursively create folders, child subfolders, and contained sets."""
        folder = await self.folder_service.create_folder(
            FolderCreate(name=node["folder_name"], parent_id=parent_id),
            user_id=user_id,
        )
        stats["folders_created"] += 1

        # Create sets in this folder
        for set_spec in node.get("sets", []):
            set_obj = await self.set_service.create_set(
                SetCreate(
                    name=set_spec["name"],
                    description=set_spec.get("description"),
                    folder_id=folder.id,
                    tags=set_spec.get("tags", []),
                ),
                user_id=user_id,
            )
            stats["sets_created"] += 1

            cards_count = await self._create_cards_for_set(
                set_obj.id, set_spec.get("cards", []), user_id
            )
            stats["cards_created"] += cards_count

        # Recursively process subfolders
        for subfolder_node in node.get("subfolders", []):
            await self._populate_folder_node(
                node=subfolder_node,
                parent_id=folder.id,
                user_id=user_id,
                stats=stats,
            )

    async def seed_user_data(
        self, user_id: str, clear_existing: bool = True
    ) -> dict[str, int]:
        """Populate hierarchical folders, sets, and rich flashcards for user."""
        stats = {
            "folders_created": 0,
            "sets_created": 0,
            "cards_created": 0,
        }

        if clear_existing:
            await self.clear_user_data(user_id)

        # 1. Create root-level standalone sets
        for root_set_spec in ROOT_SEED_SETS:
            root_set = await self.set_service.create_set(
                SetCreate(
                    name=root_set_spec["name"],
                    description=root_set_spec.get("description"),
                    folder_id=None,
                    tags=root_set_spec.get("tags", []),
                ),
                user_id=user_id,
            )
            stats["sets_created"] += 1

            cards_count = await self._create_cards_for_set(
                root_set.id, root_set_spec.get("cards", []), user_id
            )
            stats["cards_created"] += cards_count

        # 2. Create hierarchical folder trees and nested sets
        for folder_tree_spec in DEV_SEED_DATA:
            await self._populate_folder_node(
                node=folder_tree_spec,
                parent_id=None,
                user_id=user_id,
                stats=stats,
            )

        logger.info(
            "Seeded developer environment for %s: %d folders, %d sets, %d cards",
            user_id,
            stats["folders_created"],
            stats["sets_created"],
            stats["cards_created"],
        )
        return stats
