import { useState, useRef } from 'react';
import { Upload, Camera, FileImage, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScannedBillData } from '@/types/bill';

interface BillUploaderProps {
  onBillScanned: (data: ScannedBillData, imageUrl: string) => void;
}

export function BillUploader({ onBillScanned }: BillUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, WebP, or PDF file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bill-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('bill-images')
        .getPublicUrl(fileName);

      setUploadedImageUrl(urlData.publicUrl);

      toast({
        title: 'Upload complete',
        description: 'Your bill image has been uploaded. Click "Scan Bill" to extract data.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload the image. Please try again.',
        variant: 'destructive',
      });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleScanBill = async () => {
    if (!previewUrl) return;

    setIsScanning(true);

    try {
      const { data, error } = await supabase.functions.invoke('scan-bill', {
        body: { imageBase64: previewUrl },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.success || !data.data) {
        throw new Error('Failed to parse bill data');
      }

      toast({
        title: 'Bill scanned successfully',
        description: `Found ${data.data.items?.length || 0} items`,
      });

      onBillScanned(data.data, uploadedImageUrl || '');
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: 'Scan failed',
        description: error instanceof Error ? error.message : 'Failed to scan the bill. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const clearUpload = () => {
    setPreviewUrl(null);
    setUploadedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-6 shadow-card">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Camera className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold">Upload Bill</h3>
        </div>

        {!previewUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all duration-200"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex flex-col items-center gap-3">
              {isUploading ? (
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              ) : (
                <div className="p-4 rounded-full bg-accent">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
              )}
              <div>
                <p className="font-medium text-foreground">
                  {isUploading ? 'Uploading...' : 'Drop your bill here or click to browse'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports JPG, PNG, WebP, and PDF (max 10MB)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-muted">
              <img
                src={previewUrl}
                alt="Bill preview"
                className="w-full max-h-80 object-contain"
              />
              <button
                onClick={clearUpload}
                className="absolute top-2 right-2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
              >
                <FileImage className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleScanBill}
                disabled={isScanning}
                className="flex-1 gap-2"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Scan Bill
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={clearUpload}
                disabled={isScanning}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
