import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { useShareGallery } from "@/hooks/use-photos";
import { useToast } from "@/hooks/use-toast";
import type { Gallery } from "@shared/schema";

interface EmailShareModalProps {
  gallery: Gallery | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EmailShareModal({ gallery, isOpen, onClose }: EmailShareModalProps) {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [includeDownload, setIncludeDownload] = useState(false);
  
  const shareGallery = useShareGallery();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gallery || !recipient || !subject) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await shareGallery.mutateAsync({
        galleryId: gallery.id,
        recipient,
        subject,
        message: message || undefined,
        includeDownload,
      });

      toast({
        title: "Gallery Shared!",
        description: `Gallery link sent to ${recipient}`,
      });

      // Reset form and close modal
      setRecipient("");
      setSubject("");
      setMessage("");
      setIncludeDownload(false);
      onClose();
    } catch (error) {
      toast({
        title: "Share Failed",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      });
    }
  };

  // Set default subject when gallery changes
  useState(() => {
    if (gallery) {
      setSubject(`Check out these photos: ${gallery.name}`);
    }
  }, [gallery]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Share Gallery
          </DialogTitle>
          <DialogDescription>
            {gallery ? `Share "${gallery.name}" via email` : "Share gallery via email"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Email *</Label>
            <Input
              id="recipient"
              type="email"
              placeholder="recipient@example.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message..."
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-download"
              checked={includeDownload}
              onCheckedChange={(checked) => setIncludeDownload(checked as boolean)}
            />
            <Label htmlFor="include-download" className="text-sm">
              Include download link
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={shareGallery.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={shareGallery.isPending}
            >
              {shareGallery.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Email"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
