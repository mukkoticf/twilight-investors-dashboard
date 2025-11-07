import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { usePageMetadata } from '@/hooks/use-page-metadata';
import { toast } from 'sonner';

const ReceiptViewerPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [decodedUrl, setDecodedUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  usePageMetadata({
    defaultTitle: "Document Viewer",
    defaultDescription: "View and download document"
  });

  useEffect(() => {
    // Get the receipt URL from query parameter
    const urlParam = searchParams.get('url');
    
    if (urlParam) {
      // Decode the URL if it was encoded
      try {
        const decoded = decodeURIComponent(urlParam);
        setDecodedUrl(decoded);
      } catch (e) {
        setDecodedUrl(urlParam);
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const handleDownload = async () => {
    if (!decodedUrl) return;

    try {
      // Fetch the file
      const response = await fetch(decodedUrl);
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from URL
      const urlParts = decodedUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || 'receipt';
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully!');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!decodedUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Document not found</h3>
          <p className="text-muted-foreground mb-4">
            The document URL is invalid or missing.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Download Button - Fixed at top */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 border-b sticky top-0 z-50 shadow-sm">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>

      {/* Document Viewer - Opens directly in browser */}
      <div className="w-full h-[calc(100vh-64px)]">
        {decodedUrl.endsWith('.pdf') || decodedUrl.includes('.pdf') ? (
          <object
            data={decodedUrl}
            type="application/pdf"
            className="w-full h-full"
            aria-label="Document PDF"
          >
            <p className="p-4 text-center text-muted-foreground">
              Unable to display PDF. <a href={decodedUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Click here to open in new tab</a>
            </p>
          </object>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-800">
            <img
              src={decodedUrl}
              alt="Document"
              className="max-w-full max-h-full object-contain"
              onError={() => {
                toast.error('Failed to load document image');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptViewerPage;

