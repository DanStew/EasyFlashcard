"""Folder service containing business logic, materialized paths, and hierarchy operations."""

from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.models.folder import Folder, FolderCreate, FolderTreeItem, FolderUpdate
from app.models.set import FlashcardSet
from app.repositories.base import IFlashcardRepository, IFolderRepository, ISetRepository


def _sanitize_segment(name: str) -> str:
    """Sanitize folder name for path segment (replace slashes)."""
    return name.strip().replace("/", "-")


class FolderService:
    """Service layer for folder management and hierarchy calculations."""

    def __init__(
        self,
        folder_repo: IFolderRepository,
        set_repo: ISetRepository,
        flashcard_repo: IFlashcardRepository,
    ) -> None:
        self.folder_repo = folder_repo
        self.set_repo = set_repo
        self.flashcard_repo = flashcard_repo

    def _enrich_folder_stats(
        self,
        folders: list[Folder],
        all_user_folders: list[Folder],
        all_user_sets: list[FlashcardSet],
    ) -> list[Folder]:
        """Compute direct subfolder_count, set_count, and preview_items for folders."""
        subfolder_map: dict[str, list[str]] = {}
        for f in all_user_folders:
            if f.parent_id:
                subfolder_map.setdefault(f.parent_id, []).append(f.name)

        set_map: dict[str, list[str]] = {}
        for s in all_user_sets:
            if s.folder_id:
                set_map.setdefault(s.folder_id, []).append(s.name)

        for folder in folders:
            children_folders = subfolder_map.get(folder.id, [])
            children_sets = set_map.get(folder.id, [])
            folder.subfolder_count = len(children_folders)
            folder.set_count = len(children_sets)
            folder.preview_items = (children_folders + children_sets)[:3]

        return folders

    async def create_folder(self, data: FolderCreate, user_id: str) -> Folder:
        """Create a new folder and compute its materialized path."""
        parent_path = "/"
        if data.parent_id:
            parent = await self.folder_repo.get_by_id(data.parent_id, user_id)
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Parent folder with ID '{data.parent_id}' not found.",
                )
            parent_path = parent.path

        cleaned_name = data.name.strip()
        computed_path = f"{parent_path}{_sanitize_segment(cleaned_name)}/"

        new_folder = Folder(
            user_id=user_id,
            parent_id=data.parent_id,
            name=cleaned_name,
            path=computed_path,
        )
        return await self.folder_repo.create(new_folder)

    async def get_folder(self, folder_id: str, user_id: str) -> Folder:
        """Fetch a specific folder by ID with enriched counts and preview."""
        folder = await self.folder_repo.get_by_id(folder_id, user_id)
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Folder with ID '{folder_id}' not found.",
            )
        all_folders = await self.folder_repo.list_all_user_folders(user_id)
        all_sets = await self.set_repo.list_by_user(user_id)
        self._enrich_folder_stats([folder], all_folders, all_sets)
        return folder

    async def list_folders(
        self,
        user_id: str,
        parent_id: str | None = None,
        root_only: bool = False,
        search: str | None = None,
    ) -> list[Folder]:
        """List folders for a user, optionally filtered by direct parent, root-level, or search query."""
        all_folders = await self.folder_repo.list_all_user_folders(user_id)
        all_sets = await self.set_repo.list_by_user(user_id)

        if search and search.strip():
            query_lower = search.strip().lower()
            filtered = [
                f for f in all_folders
                if query_lower in f.name.lower() or query_lower in f.path.lower()
            ]
        elif root_only or parent_id == "root":
            filtered = [f for f in all_folders if f.parent_id is None]
        elif parent_id is not None:
            filtered = [f for f in all_folders if f.parent_id == parent_id]
        else:
            filtered = all_folders

        return self._enrich_folder_stats(filtered, all_folders, all_sets)

    async def get_folder_tree(self, user_id: str) -> list[FolderTreeItem]:
        """Construct the complete hierarchical tree of folders for a user."""
        all_folders = await self.folder_repo.list_all_user_folders(user_id)
        all_sets = await self.set_repo.list_by_user(user_id)

        # Count sets per folder
        set_counts: dict[str, int] = {}
        for s in all_sets:
            if s.folder_id:
                set_counts[s.folder_id] = set_counts.get(s.folder_id, 0) + 1

        # Build lookup maps
        items_map: dict[str, FolderTreeItem] = {}
        for f in all_folders:
            items_map[f.id] = FolderTreeItem(
                id=f.id,
                user_id=f.user_id,
                parent_id=f.parent_id,
                name=f.name,
                path=f.path,
                created_at=f.created_at,
                updated_at=f.updated_at,
                subfolders=[],
                set_count=set_counts.get(f.id, 0),
            )

        root_nodes: list[FolderTreeItem] = []
        for folder in all_folders:
            tree_item = items_map[folder.id]
            if folder.parent_id and folder.parent_id in items_map:
                items_map[folder.parent_id].subfolders.append(tree_item)
            else:
                root_nodes.append(tree_item)

        return root_nodes

    async def update_folder(self, folder_id: str, data: FolderUpdate, user_id: str) -> Folder:
        """Update folder name or move it to a different parent with cycle detection."""
        folder = await self.get_folder(folder_id, user_id)
        all_user_folders = await self.folder_repo.list_all_user_folders(user_id)
        folders_by_id = {f.id: f for f in all_user_folders}

        old_path = folder.path
        name_changed = False
        parent_changed = False

        if data.name and data.name.strip() != folder.name:
            folder.name = data.name.strip()
            name_changed = True

        new_parent_id = folder.parent_id
        if data.move_to_root:
            new_parent_id = None
            parent_changed = folder.parent_id is not None
        elif data.parent_id is not None and data.parent_id != folder.parent_id:
            # Check target parent exists
            if data.parent_id not in folders_by_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Target parent folder '{data.parent_id}' not found.",
                )

            # Cycle detection: cannot move folder inside itself or its descendants
            target_parent = folders_by_id[data.parent_id]
            if target_parent.path.startswith(folder.path):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot move a folder into itself or one of its subfolders.",
                )

            new_parent_id = data.parent_id
            parent_changed = True

        folder.parent_id = new_parent_id

        # Recompute path if name or parent changed
        if name_changed or parent_changed:
            parent_path = "/"
            if folder.parent_id:
                parent_folder = folders_by_id.get(folder.parent_id)
                if parent_folder:
                    parent_path = parent_folder.path
            new_path = f"{parent_path}{_sanitize_segment(folder.name)}/"
            folder.path = new_path
            folder.updated_at = datetime.now(UTC)

            # Cascade path updates to all descendant folders
            descendants = [
                f for f in all_user_folders if f.path.startswith(old_path) and f.id != folder.id
            ]
            for desc in descendants:
                desc.path = desc.path.replace(old_path, new_path, 1)
                desc.updated_at = datetime.now(UTC)

            if descendants:
                await self.folder_repo.update_bulk(descendants)

        folder.updated_at = datetime.now(UTC)
        return await self.folder_repo.update(folder)

    async def delete_folder(self, folder_id: str, user_id: str, cascade: bool = False) -> None:
        """Delete a folder, optionally cascading to subfolders and sets."""
        folder = await self.get_folder(folder_id, user_id)
        all_user_folders = await self.folder_repo.list_all_user_folders(user_id)

        # Collect folder and all its descendants
        descendant_folders = [f for f in all_user_folders if f.path.startswith(folder.path)]
        all_target_folder_ids = [f.id for f in descendant_folders]

        if cascade:
            # Delete sets and cards in all target folders
            target_sets = await self.set_repo.list_by_folders(all_target_folder_ids, user_id)
            set_ids = [s.id for s in target_sets]
            if set_ids:
                await self.flashcard_repo.delete_by_set_ids(set_ids)
                await self.set_repo.delete_by_folder_ids(all_target_folder_ids, user_id)

            # Delete all target folders
            await self.folder_repo.delete_bulk(all_target_folder_ids, user_id)
        else:
            # Reparent direct children folders to the deleted folder's parent
            direct_child_folders = [f for f in all_user_folders if f.parent_id == folder_id]
            for child in direct_child_folders:
                child.parent_id = folder.parent_id
                parent_path = "/"
                if folder.parent_id:
                    p = next((f for f in all_user_folders if f.id == folder.parent_id), None)
                    if p:
                        parent_path = p.path
                new_child_path = f"{parent_path}{_sanitize_segment(child.name)}/"
                old_child_path = child.path
                child.path = new_child_path
                child.updated_at = datetime.now(UTC)

                # Update sub-descendants of this child
                child_descendants = [
                    f
                    for f in all_user_folders
                    if f.path.startswith(old_child_path) and f.id != child.id
                ]
                for cd in child_descendants:
                    cd.path = cd.path.replace(old_child_path, new_child_path, 1)
                    cd.updated_at = datetime.now(UTC)

                await self.folder_repo.update(child)
                if child_descendants:
                    await self.folder_repo.update_bulk(child_descendants)

            # Move sets directly in this folder to the deleted folder's parent
            await self.set_repo.move_sets_to_folder(
                from_folder_id=folder_id,
                to_folder_id=folder.parent_id,
                user_id=user_id,
            )

            # Delete this single folder
            await self.folder_repo.delete(folder_id, user_id)
