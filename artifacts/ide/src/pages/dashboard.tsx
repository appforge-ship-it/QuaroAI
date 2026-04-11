import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useListProjects, 
  useGetDashboardStats, 
  useCreateProject, 
  useGetRecentProjects,
  getListProjectsQueryKey,
  getGetDashboardStatsQueryKey,
  getGetRecentProjectsQueryKey
} from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { 
  FolderPlus, 
  Code2, 
  TerminalSquare, 
  FileCode2, 
  Activity, 
  Clock, 
  ChevronRight,
  Plus
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectLanguage, setNewProjectLanguage] = useState("typescript");

  const { data: stats, isLoading: isLoadingStats } = useGetDashboardStats();
  const { data: recentProjects, isLoading: isLoadingRecent } = useGetRecentProjects();
  const { data: allProjects, isLoading: isLoadingAll } = useListProjects();

  const createProject = useCreateProject();

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    createProject.mutate(
      { data: { name: newProjectName, language: newProjectLanguage } },
      {
        onSuccess: (project) => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentProjectsQueryKey() });
          setIsCreateOpen(false);
          setLocation(`/project/${project.id}`);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TerminalSquare className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">Replit<span className="text-primary">Clone</span></span>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateProject}>
                <DialogHeader>
                  <DialogTitle>Create Project</DialogTitle>
                  <DialogDescription>
                    Set up a new workspace to start coding instantly.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input 
                      id="name" 
                      placeholder="my-awesome-app" 
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={newProjectLanguage} onValueChange={setNewProjectLanguage}>
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="rust">Rust</SelectItem>
                        <SelectItem value="go">Go</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={!newProjectName.trim() || createProject.isPending}>
                    {createProject.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        
        {/* Stats Section */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
                <FolderPlus className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoadingStats ? <Skeleton className="h-8 w-16" /> : stats?.totalProjects || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Files</CardTitle>
                <FileCode2 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoadingStats ? <Skeleton className="h-8 w-16" /> : stats?.totalFiles || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Executions</CardTitle>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoadingStats ? <Skeleton className="h-8 w-16" /> : stats?.totalExecutions || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent & All Projects */}
          <section className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Recent Projects
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isLoadingRecent ? (
                  Array(4).fill(0).map((_, i) => (
                    <Card key={i} className="bg-card/30 border-border/40">
                      <CardHeader className="pb-3"><Skeleton className="h-5 w-1/2" /></CardHeader>
                      <CardContent><Skeleton className="h-4 w-3/4" /></CardContent>
                    </Card>
                  ))
                ) : recentProjects && recentProjects.length > 0 ? (
                  recentProjects.map(project => (
                    <Link key={project.id} href={`/project/${project.id}`}>
                      <Card className="bg-card/40 border-border/50 hover:bg-accent/40 transition-colors cursor-pointer group">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center justify-between">
                            {project.name}
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Code2 className="w-4 h-4" />
                            {project.language}
                          </div>
                        </CardContent>
                        <CardFooter className="text-xs text-muted-foreground pt-0">
                          Opened {project.lastOpenedAt ? formatDistanceToNow(new Date(project.lastOpenedAt), { addSuffix: true }) : 'never'}
                        </CardFooter>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed border-border/50 rounded-lg bg-card/20">
                    No recent projects. Create one to get started.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">All Projects</h2>
              <div className="rounded-md border border-border/40 overflow-hidden">
                <div className="bg-card/50">
                  {isLoadingAll ? (
                    <div className="p-4"><Skeleton className="h-8 w-full" /></div>
                  ) : allProjects && allProjects.length > 0 ? (
                    <div className="divide-y divide-border/40">
                      {allProjects.map(project => (
                        <Link key={project.id} href={`/project/${project.id}`} className="block hover:bg-accent/30 transition-colors p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{project.name}</div>
                              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
                                <span className="flex items-center gap-1"><Code2 className="w-3 h-3" /> {project.language}</span>
                                <span>{project.fileCount || 0} files</span>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                     <div className="p-8 text-center text-muted-foreground">
                       Your workspace is empty.
                     </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Activity Feed */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-muted-foreground" />
              Activity Stream
            </h2>
            <Card className="bg-card/40 border-border/50">
              <CardContent className="p-0">
                {isLoadingStats ? (
                  <div className="p-4 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {stats.recentActivity.map((activity, i) => (
                      <div key={i} className="p-4 flex gap-4">
                        <div className="mt-1">
                          <div className="w-2 h-2 rounded-full bg-primary/70" />
                        </div>
                        <div>
                          <div className="text-sm">{activity.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No recent activity.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

        </div>
      </main>
    </div>
  );
}
