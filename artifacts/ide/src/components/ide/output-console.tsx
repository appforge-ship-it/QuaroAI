import React, { useRef, useEffect } from "react";
import { Terminal, Clock, CheckCircle2, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface OutputConsoleProps {
  result: any; // ExecutionResult
  isRunning: boolean;
}

export function OutputConsole({ result, isRunning }: OutputConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new result comes in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [result, isRunning]);

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] border-t border-border/20 font-mono text-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/10 bg-[#151515] shrink-0 text-muted-foreground">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold">
          <Terminal className="w-4 h-4" />
          Console Output
        </div>
        
        {result && !isRunning && (
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {result.executionTime}ms
            </span>
            <span className={`flex items-center gap-1 ${result.exitCode === 0 ? 'text-green-500' : 'text-red-500'}`}>
              {result.exitCode === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              Exit {result.exitCode}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4" ref={scrollRef}>
        {isRunning ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-1/3 bg-white/5" />
            <Skeleton className="h-4 w-1/4 bg-white/5" />
            <Skeleton className="h-4 w-1/2 bg-white/5" />
          </div>
        ) : result ? (
          <div className="space-y-2">
            {result.stdout && (
              <pre className="text-gray-300 whitespace-pre-wrap break-all font-mono leading-relaxed">
                {result.stdout}
              </pre>
            )}
            {result.stderr && (
              <pre className="text-red-400 whitespace-pre-wrap break-all font-mono leading-relaxed mt-2 border-l-2 border-red-500/30 pl-3">
                {result.stderr}
              </pre>
            )}
            {!result.stdout && !result.stderr && (
              <div className="text-gray-500 italic">Program exited with no output.</div>
            )}
          </div>
        ) : (
          <div className="text-gray-600 h-full flex items-center justify-center">
            Click Run to execute your code
          </div>
        )}
      </div>
    </div>
  );
}
