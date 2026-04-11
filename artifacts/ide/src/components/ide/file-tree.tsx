import React, { useState } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  FileCode2, 
  Folder, 
  FileText,
  Plus,
  FolderPlus,
  MoreVertical,
  Edit2,
  Trash2,
  FileJson,
  File as FileIcon
} from "lucide-react";
import { 
  useCreateFile, 
  useDeleteFile, 
  useUpdateFile,
  getListFilesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
interface IdeFile {
  id: number;
  projectId: number;
  name: string;
  path: string;
  content?: string | null;
  isFolder: boolean;
  parentId?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface FileTreeProps {
  projectId: number;
  files: IdeFile[];
  activeFileId: number | null;
  onOpenFile: (file: IdeFile) => void;
}

export function FileTree({ projectId, files, activeFileId, onOpenFile }: FileTreeProps) {
  const queryClient = useQueryClient();
  const createFile = useCreateFile();
  const deleteFile = useDeleteFile();
  const updateFile = useUpdateFile();

  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<"file" | "folder">("file");
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState("");

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renamingFile, setRenamingFile] = useState<ProjectFile | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingFile, setDeletingFile] = useState<ProjectFile | null>(null);

  const toggleFolder = (folderId: number) => {
    const next = new Set(expandedFolders);
    if (next.has(folderId)) {
      next.delete(folderId);
    } else {
      next.add(folderId);
    }
    setExpandedFolders(next);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    createFile.mutate(
      { 
        projectId, 
        data: { 
          name: newItemName, 
          isFolder: createType === "folder",
          parentId: createParentId
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFilesQueryKey(projectId) });
          if (createParentId) {
            setExpandedFolders(prev => new Set(prev).add(createParentId));
          }
          setIsCreateOpen(false);
          setNewItemName("");
        }
      }
    );
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFile || !renameValue.trim() || renameValue === renamingFile.name) {
      setIsRenameOpen(false);
      return;
    }

    updateFile.mutate(
      {
        projectId,
        fileId: renamingFile.id,
        data: { name: renameValue }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFilesQueryKey(projectId) });
          setIsRenameOpen(false);
        }
      }
    );
  };

  const handleDelete = () => {
    if (!deletingFile) return;

    deleteFile.mutate(
      { projectId, fileId: deletingFile.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFilesQueryKey(projectId) });
          setIsDeleteOpen(false);
        }
      }
    );
  };

  const openCreateDialog = (type: "file" | "folder", parentId: number | null = null) => {
    setCreateType(type);
    setCreateParentId(parentId);
    setNewItemName("");
    setIsCreateOpen(true);
  };

  const openRenameDialog = (file: ProjectFile) => {
    setRenamingFile(file);
    setRenameValue(file.name);
    setIsRenameOpen(true);
  };

  const openDeleteDialog = (file: ProjectFile) => {
    setDeletingFile(file);
    setIsDeleteOpen(true);
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return <FileCode2 className="w-4 h-4 text-blue-400" />;
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return <FileCode2 className="w-4 h-4 text-yellow-400" />;
    if (fileName.endsWith('.json')) return <FileJson className="w-4 h-4 text-green-400" />;
    if (fileName.endsWith('.md')) return <FileText className="w-4 h-4 text-slate-300" />;
    return <FileIcon className="w-4 h-4 text-slate-400" />;
  };

  const renderTree = (parentId: number | null = null, depth = 0) => {
    const nodes = files.filter(f => f.parentId === parentId).sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.id);
      const isActive = activeFileId === node.id;
      
      return (
        <div key={node.id}>
          <div 
            className={`group flex items-center justify-between py-1 px-2 cursor-pointer select-none text-sm transition-colors ${
              isActive ? "bg-primary/20 text-primary" : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
            }`}
            style={{ paddingLeft: `${(depth * 12) + 8}px` }}
            onClick={() => node.isFolder ? toggleFolder(node.id) : onOpenFile(node)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {node.isFolder ? (
                isExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 shrink-0" /> // spacer
              )}
              
              {node.isFolder ? (
                <Folder className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              ) : (
                getFileIcon(node.name)
              )}
              <span className="truncate">{node.name}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-5 w-5 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 -mr-1 ${isActive ? "text-primary" : ""}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {node.isFolder && (
                  <>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openCreateDialog("file", node.id); }}>
                      <Plus className="mr-2 h-4 w-4" /> New File
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openCreateDialog("folder", node.id); }}>
                      <FolderPlus className="mr-2 h-4 w-4" /> New Folder
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openRenameDialog(node); }}>
                  <Edit2 className="mr-2 h-4 w-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                  onClick={(e) => { e.stopPropagation(); openDeleteDialog(node); }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {node.isFolder && isExpanded && renderTree(node.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full border-r border-border/40">
      <div className="flex items-center justify-between p-3 shrink-0 border-b border-border/40">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Files</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openCreateDialog("file")}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openCreateDialog("folder")}>
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="py-2">
          {renderTree()}
        </div>
      </ScrollArea>

      {/* Modals */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>New {createType === "file" ? "File" : "Folder"}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder={`Name (e.g. ${createType === "file" ? "index.ts" : "src"})`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!newItemName.trim() || createFile.isPending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename {renamingFile?.isFolder ? "Folder" : "File"}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!renameValue.trim() || renameValue === renamingFile?.name || updateFile.isPending}>
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete {deletingFile?.isFolder ? "Folder" : "File"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-bold">{deletingFile?.name}</span>? 
              {deletingFile?.isFolder && " This will also delete all files inside it."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteFile.isPending}>
              {deleteFile.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
