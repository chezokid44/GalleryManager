import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Upload, Image, Edit, Trash2, Calendar, Loader2 } from "lucide-react";
import { UploadForm } from "@/components/upload-form";
import { useGalleries, useCreateGallery, useDeleteGallery } from "@/hooks/use-galleries";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGallerySchema } from "@shared/schema";
import type { InsertGallery } from "@shared/schema";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<"galleries" | "upload" | "settings">("galleries");
  
  const { data: galleries = [], isLoading: galleriesLoading } = useGalleries();
  const createGallery = useCreateGallery();
  const deleteGallery = useDeleteGallery();
  const { toast } = useToast();

  const form = useForm<InsertGallery>({
    resolver: zodResolver(insertGallerySchema),
    defaultValues: {
      name: "",
      folderPath: "",
      description: "",
      isPublic: false,
      allowDownload: true,
    },
  });

  const handleCreateGallery = async (data: InsertGallery) => {
    try {
      await createGallery.mutateAsync(data);
      toast({
        title: "Gallery Created",
        description: `Gallery "${data.name}" has been created successfully.`,
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create gallery",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGallery = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteGallery.mutateAsync(id);
      toast({
        title: "Gallery Deleted",
        description: `Gallery "${name}" has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete gallery",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const adminTabs = [
    { id: "galleries" as const, label: "Manage Galleries", icon: Image },
    { id: "upload" as const, label: "Upload Photos", icon: Upload },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Admin Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {adminTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4 space-y-8">
          {/* Gallery Management Tab */}
          {activeTab === "galleries" && (
            <>
              {/* Create Gallery Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create New Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(handleCreateGallery)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Gallery Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter gallery name"
                          {...form.register("name")}
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="folderPath">Folder Path</Label>
                        <Input
                          id="folderPath"
                          placeholder="/photos/gallery-name"
                          {...form.register("folderPath")}
                        />
                        {form.formState.errors.folderPath && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.folderPath.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Gallery description..."
                        rows={3}
                        {...form.register("description")}
                      />
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isPublic"
                          checked={form.watch("isPublic")}
                          onCheckedChange={(checked) => form.setValue("isPublic", checked as boolean)}
                        />
                        <Label htmlFor="isPublic">Public Gallery</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allowDownload"
                          checked={form.watch("allowDownload")}
                          onCheckedChange={(checked) => form.setValue("allowDownload", checked as boolean)}
                        />
                        <Label htmlFor="allowDownload">Allow Downloads</Label>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={createGallery.isPending}
                        className="flex items-center gap-2"
                      >
                        {createGallery.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Create Gallery
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                      >
                        Clear
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Existing Galleries */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Galleries</CardTitle>
                </CardHeader>
                <CardContent>
                  {galleriesLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                          <Skeleton className="w-16 h-16 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                          <div className="flex gap-2">
                            <Skeleton className="w-8 h-8 rounded" />
                            <Skeleton className="w-8 h-8 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : galleries.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-muted-foreground mb-2">No galleries yet</h3>
                      <p className="text-muted-foreground">Create your first gallery using the form above.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {galleries.map((gallery) => (
                        <div key={gallery.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Image className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold truncate">{gallery.name}</h4>
                              <Badge variant={gallery.isPublic ? "default" : "secondary"}>
                                {gallery.isPublic ? "Public" : "Private"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate mb-1">
                              {gallery.folderPath}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              Created {formatDate(gallery.createdAt!)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGallery(gallery.id, gallery.name)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Upload Photos Tab */}
          {activeTab === "upload" && (
            <UploadForm galleries={galleries} />
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Email Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>SMTP Host</Label>
                        <Input placeholder="smtp.gmail.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>SMTP Port</Label>
                        <Input placeholder="587" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Username</Label>
                        <Input placeholder="your-email@domain.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Password</Label>
                        <Input type="password" placeholder="App password" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Gallery Defaults</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="defaultPublic" />
                        <Label htmlFor="defaultPublic">Make new galleries public by default</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="defaultDownload" defaultChecked />
                        <Label htmlFor="defaultDownload">Allow downloads by default</Label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button>Save Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
