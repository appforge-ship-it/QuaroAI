import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetProject, 
  useListFiles, 
  useRunCode,
  getGetProjectQueryKey,
  getListFilesQueryKey
} from "@workspace/api-client-react";
import { 
  TerminalSquare, 
  Play, 
  Loader2, 
  Settings, 
  ChevronLeft,
  Menu,
  MessageSquareCode
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

import { FileTree } from "@/components/ide/file-tree";
import { EditorArea } from "@/components/ide/editor-area";
import { OutputConsole } from "@/components/ide/output-console";
import { AiPanel } from "@/components/ide/ai-panel";
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

export default function ProjectIde() {
  const params = useParams();
  const projectId = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();

  const { data: project, isLoading: isLoadingProject } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });

  const { data: files, isLoading: isLoadingFiles } = useListFiles(projectId, {
    query: { enabled: !!projectId, queryKey: getListFilesQueryKey(projectId) }
  });

  const runCode = useRunCode();

  const [openFiles, setOpenFiles] = useState<IdeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<number | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const editorContentRef = useRef<string>("");

  useEffect(() => {
    if (files && files.length > 0 && openFiles.length === 0) {
      const firstFile = files.find(f => !f.isFolder);
      if (firstFile) {
        setOpenFiles([firstFile as IdeFile]);
        setActiveFileId(firstFile.id);
      }
    }
  }, [files, openFiles.length]);

  const handleOpenFile = (file: IdeFile) => {
    if (file.isFolder) return;
    if (!openFiles.find(f => f.id === file.id)) {
      setOpenFiles([...openFiles, file]);
    }
    setActiveFileId(file.id);
  };

  const handleCloseFile = (fileId: number) => {
    const newOpenFiles = openFiles.filter(f => f.id !== fileId);
    setOpenFiles(newOpenFiles);
    if (activeFileId === fileId) {
      setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[0].id : null);
    }
  };

  const handleEditorContentChange = useCallback((content: string) => {
    editorContentRef.current = content;
  }, []);

  const handleRunCode = () => {
    if (!activeFileId) return;
    const code = editorContentRef.current || "";
    
    runCode.mutate(
      { projectId, data: { code, language: project?.language } },
      {
        onSuccess: (result) => {
          setExecutionResult(result);
        }
      }
    );
  };

  if (isLoadingProject || isLoadingFiles) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Button asChild><Link href="/">Back to Dashboard</Link></Button>
        </div>
      </div>
    );
  }

  const activeFile = files?.find(f => f.id === activeFileId) || null;

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">
      {/* IDE Header */}
      <header className="h-12 border-b border-border/40 bg-card/40 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm">
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="h-4 w-[1px] bg-border" />
          <div className="font-medium flex items-center gap-2">
            <TerminalSquare className="w-4 h-4 text-primary" />
            {project.name}
            <span className="text-xs text-muted-foreground ml-2 px-2 py-0.5 rounded-full bg-muted/50">
              {project.language}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant={isAiPanelOpen ? "secondary" : "ghost"}
            onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
            className="gap-2"
          >
            <MessageSquareCode className="w-4 h-4" />
            AI Assistant
          </Button>

          <Button 
            size="sm" 
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleRunCode}
            disabled={runCode.isPending || !activeFileId}
          >
            {runCode.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run
          </Button>
        </div>
      </header>

      {/* Main IDE Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          
          {/* Left Sidebar - File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-card/20 flex flex-col">
            <FileTree 
              projectId={projectId} 
              files={files || []} 
              activeFileId={activeFileId}
              onOpenFile={handleOpenFile}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-border/50" />
          
          {/* Center Area - Editor & Console */}
          <ResizablePanel defaultSize={isAiPanelOpen ? 55 : 80}>
            <ResizablePanelGroup direction="vertical">
              
              {/* Editor Panel */}
              <ResizablePanel defaultSize={70} className="bg-[#1e1e1e]">
                <EditorArea 
                  projectId={projectId}
                  openFiles={openFiles}
                  activeFileId={activeFileId}
                  onOpenFile={setActiveFileId}
                  onCloseFile={handleCloseFile}
                  onContentChange={handleEditorContentChange}
                />
              </ResizablePanel>
              
              <ResizableHandle withHandle className="bg-border/50" />
              
              {/* Console Panel */}
              <ResizablePanel defaultSize={30} minSize={10} className="bg-[#0f0f0f]">
                <OutputConsole 
                  result={executionResult} 
                  isRunning={runCode.isPending} 
                />
              </ResizablePanel>

            </ResizablePanelGroup>
          </ResizablePanel>

          {/* Right Sidebar - AI Assistant */}
          {isAiPanelOpen && (
            <>
              <ResizableHandle withHandle className="bg-border/50" />
              <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-card/30">
                <AiPanel 
                  activeFile={activeFile}
                />
              </ResizablePanel>
            </>
          )}

        </ResizablePanelGroup>
      </div>
    </div>
  );
}
