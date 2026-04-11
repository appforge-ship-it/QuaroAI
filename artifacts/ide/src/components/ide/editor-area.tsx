import React, { useEffect, useRef, useState, useCallback } from "react";
import MonacoEditor from "@monaco-editor/react";
import { X, Code, Save } from "lucide-react";
import { useGetFile, useUpdateFile, getGetFileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
interface IdeFile {
  id: number;
  name: string;
  content?: string | null;
  isFolder: boolean;
  [key: string]: unknown;
}

interface EditorAreaProps {
  projectId: number;
  openFiles: IdeFile[];
  activeFileId: number | null;
  onOpenFile: (id: number) => void;
  onCloseFile: (id: number) => void;
  onContentChange?: (content: string) => void;
}

export function EditorArea({ projectId, openFiles, activeFileId, onOpenFile, onCloseFile, onContentChange }: EditorAreaProps) {
  const queryClient = useQueryClient();
  const updateFile = useUpdateFile();

  const { data: activeFileData } = useGetFile(projectId, activeFileId || 0, {
    query: { enabled: !!activeFileId, queryKey: activeFileId ? getGetFileQueryKey(projectId, activeFileId) : [] }
  });

  const [editorContent, setEditorContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track what we last loaded from DB so we don't overwrite user changes
  const loadedFileIdRef = useRef<number | null>(null);
  const lastSavedContentRef = useRef<string>("");

  useEffect(() => {
    if (activeFileId && activeFileData && activeFileId !== loadedFileIdRef.current) {
      loadedFileIdRef.current = activeFileId;
      const content = activeFileData.content || "";
      setEditorContent(content);
      lastSavedContentRef.current = content;
      setSaveStatus("idle");
      onContentChange?.(content);
    }
  }, [activeFileId, activeFileData, onContentChange]);

  const handleEditorChange = (value: string | undefined) => {
    const val = value || "";
    setEditorContent(val);
    setSaveStatus("idle");
    onContentChange?.(val);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (activeFileId && val !== lastSavedContentRef.current) {
      saveTimeoutRef.current = setTimeout(() => {
        saveFile(activeFileId, val);
      }, 1500); // Debounce 1.5s
    }
  };

  const saveFile = useCallback((fileId: number, content: string) => {
    setSaveStatus("saving");
    updateFile.mutate(
      { projectId, fileId, data: { content } },
      {
        onSuccess: () => {
          setSaveStatus("saved");
          lastSavedContentRef.current = content;
          // Update the cache so subsequent reads have the right data
          queryClient.setQueryData(getGetFileQueryKey(projectId, fileId), (old: any) => 
            old ? { ...old, content } : old
          );
          setTimeout(() => setSaveStatus("idle"), 2000);
        },
        onError: () => {
          setSaveStatus("idle");
        }
      }
    );
  }, [projectId, updateFile, queryClient]);

  const getLanguage = (fileName: string) => {
    if (fileName.endsWith(".ts") || fileName.endsWith(".tsx")) return "typescript";
    if (fileName.endsWith(".js") || fileName.endsWith(".jsx")) return "javascript";
    if (fileName.endsWith(".json")) return "json";
    if (fileName.endsWith(".md")) return "markdown";
    if (fileName.endsWith(".css")) return "css";
    if (fileName.endsWith(".html")) return "html";
    if (fileName.endsWith(".py")) return "python";
    if (fileName.endsWith(".go")) return "go";
    if (fileName.endsWith(".rs")) return "rust";
    return "plaintext";
  };

  const activeFile = openFiles.find(f => f.id === activeFileId);

  if (openFiles.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] text-muted-foreground/60">
        <div className="text-center">
          <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a file to start coding</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] overflow-hidden">
      {/* Tabs */}
      <div className="flex overflow-x-auto shrink-0 bg-[#252526] scrollbar-none">
        {openFiles.map(file => {
          const isActive = file.id === activeFileId;
          return (
            <div
              key={file.id}
              className={`flex items-center h-10 px-4 min-w-fit max-w-[200px] border-r border-black/20 cursor-pointer select-none group transition-colors ${
                isActive 
                  ? "bg-[#1e1e1e] text-white border-t-2 border-t-primary" 
                  : "bg-[#2d2d2d] text-gray-400 hover:bg-[#2a2d2e] border-t-2 border-t-transparent"
              }`}
              onClick={() => onOpenFile(file.id)}
            >
              <span className="truncate text-sm mr-2">{file.name}</span>
              <div 
                className={`w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(file.id);
                }}
              >
                <X className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor Status Bar */}
      {activeFile && (
        <div className="h-7 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-end px-4 shrink-0 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            {saveStatus === "saving" && <span className="flex items-center gap-1"><Save className="w-3 h-3 animate-pulse" /> Saving...</span>}
            {saveStatus === "saved" && <span className="flex items-center gap-1 text-green-400"><Save className="w-3 h-3" /> Saved</span>}
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 relative">
        {activeFile && (
          <MonacoEditor
            key={activeFile.id} // Force remount if needed, but react component handles it
            height="100%"
            language={getLanguage(activeFile.name)}
            theme="vs-dark"
            value={editorContent}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "var(--font-mono)",
              lineHeight: 24,
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              formatOnPaste: true,
            }}
          />
        )}
      </div>
    </div>
  );
}
