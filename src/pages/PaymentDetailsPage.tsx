import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Upload, FileText, Eye, Edit } from 'lucide-react';
import { usePageMetadata } from '@/hooks/use-page-metadata';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/utils/crm-operations';

interface Payment {
  payment_id: string;
  investor_id: string;
  declaration_id: string;
  gross_roi_amount: number;
  emergency_fund_deduction: number;
  tds_deduction: number;
  net_payable_amount: number;
  payment_status: 'Pending' | 'Paid' | 'Failed';
  payment_date: string | null;
  investor_name: string;
  receipt_url: string | null;
}

interface QuarterlyROI {
  declaration_id: string;
  quarter_year: string;
  month_names: string | null;
  roi_percentage: number;
  declaration_date: string;
  purchase_id: string;
  is_finalized: boolean;
}

interface CompanyPool {
  purchase_id: string;
  investor_amount: number;
}

const PaymentDetailsPage = () => {
  const { declarationId } = useParams<{ declarationId: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [declaration, setDeclaration] = useState<QuarterlyROI | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pool, setPool] = useState<CompanyPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingReceipt, setUploadingReceipt] = useState<string | null>(null);
  const [selectedPaymentForUpload, setSelectedPaymentForUpload] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  usePageMetadata({
    defaultTitle: declaration ? `Payment Details - ${declaration.quarter_year}` : "Payment Details",
    defaultDescription: "View and manage quarterly payment details"
  });

  useEffect(() => {
    if (declarationId) {
      fetchDeclarationDetails();
      fetchPayments();
    }
  }, [declarationId]);

  const fetchDeclarationDetails = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('quarterly_roi_declarations')
        .select('*')
        .eq('declaration_id', declarationId)
        .single();

      if (error) throw error;
      setDeclaration(data);
      
      // Fetch pool data to get total investment amount
      if (data?.purchase_id) {
        const { data: poolData, error: poolError } = await (supabase as any)
          .from('company_pools')
          .select('purchase_id, investor_amount')
          .eq('purchase_id', data.purchase_id)
          .single();
        
        if (!poolError && poolData) {
          setPool(poolData);
        }
      }
    } catch (error) {
      console.error('Error fetching declaration details:', error);
      toast.error('Failed to fetch declaration details');
      navigate(-1);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      const { data: paymentsData, error: paymentsError } = await (supabase as any)
        .from('investor_quarterly_payments')
        .select(`
          *,
          investors!inner(investor_name)
        `)
        .eq('declaration_id', declarationId);

      if (paymentsError) throw paymentsError;

      const transformedPayments = paymentsData?.map((p: any) => ({
        ...p,
        investor_name: p.investors?.investor_name || 'Unknown',
        receipt_url: p.receipt_url || null
      })) || [];

      setPayments(transformedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payment details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleFileSelect = (paymentId: string) => {
    setSelectedPaymentForUpload(paymentId);
    setIsUploadDialogOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPaymentForUpload) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG) or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingReceipt(selectedPaymentForUpload);
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedPaymentForUpload}_${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      // Upload file to Supabase Storage (using agreement_file bucket)
      const { error: uploadError } = await supabase.storage
        .from('agreement_file')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('agreement_file')
        .getPublicUrl(filePath);

      // Update payment record with receipt URL
      const { error: updateError } = await (supabase as any)
        .from('investor_quarterly_payments')
        .update({ receipt_url: publicUrl })
        .eq('payment_id', selectedPaymentForUpload);

      if (updateError) throw updateError;

      // Close the dialog immediately
      setIsUploadDialogOpen(false);
      setSelectedPaymentForUpload(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Show success toast at bottom right
      toast.success('Receipt uploaded successfully!', {
        duration: 3000,
      });
      
      fetchPayments(); // Refresh payments
    } catch (error: any) {
      console.error('Error uploading receipt:', error);
      toast.error(`Failed to upload receipt: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingReceipt(null);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Payment Details - {declaration?.quarter_year}{declaration?.month_names ? ` (${declaration.month_names})` : ''}</h1>
              <p className="text-muted-foreground">
                Quarterly Return %: {declaration?.roi_percentage?.toFixed(2) || '0.00'}% | 
                Declaration Date: {declaration && formatDate(declaration.declaration_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Investor Payments</CardTitle>
            <CardDescription>
              Payment details for all investors in this quarter
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No payments found</h3>
                <p className="text-muted-foreground">
                  No payment records found for this declaration.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Gross ROI</TableHead>
                    <TableHead>Emergency Fund</TableHead>
                    <TableHead>TDS</TableHead>
                    <TableHead>Net Payable</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.payment_id}>
                      <TableCell className="font-medium">
                        {payment.investor_name}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(payment.gross_roi_amount)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(payment.emergency_fund_deduction)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(payment.tds_deduction)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.net_payable_amount)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {payment.receipt_url ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(payment.receipt_url!, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Receipt
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleFileSelect(payment.payment_id)}
                                  disabled={uploadingReceipt === payment.payment_id}
                                  className="p-1 h-8 w-8"
                                  title="Edit Receipt"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleFileSelect(payment.payment_id)}
                                disabled={uploadingReceipt === payment.payment_id}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Receipt
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Upload Receipt Dialog */}
        {isAdmin && (
          <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
            setIsUploadDialogOpen(open);
            if (!open) {
              setSelectedPaymentForUpload(null);
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Receipt</DialogTitle>
                <DialogDescription>
                  Upload a receipt for this payment. Supported formats: JPEG, PNG, PDF (Max 5MB)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileUpload}
                  className="w-full"
                  disabled={uploadingReceipt !== null}
                />
                {uploadingReceipt && (
                  <p className="text-sm text-muted-foreground">
                    Uploading receipt...
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </PageLayout>
  );
};

export default PaymentDetailsPage;

