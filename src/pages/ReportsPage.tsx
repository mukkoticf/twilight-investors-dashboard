import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { usePageMetadata } from '@/hooks/use-page-metadata';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDate } from '@/utils/crm-operations';
import { FileText, Upload, Filter, TrendingUp, DollarSign, Users, Calendar, Loader2, CheckCircle2, Edit, Eye, ExternalLink, Download } from 'lucide-react';

interface InvestorReport {
  investor_id: string;
  investor_name: string;
  email: string;
  phone: string;
  total_investment: number;
  total_gross_roi: number;
  total_emergency_deduction: number;
  total_tds_deduction: number;
  total_net_payable: number;
  quarters_invested: number;
  avg_roi_percentage: number;
  last_payment_date: string | null;
  total_paid: number;
  pending_amount: number;
  pool_names: string[];
}

interface InvestorQuarterlyDetail {
  quarter_year: string;
  pool_name: string;
  roi_percentage: number;
  investment_amount: number;
  investment_percentage: number;
  gross_roi_amount: number;
  emergency_fund_deduction: number;
  tds_deduction: number;
  net_payable_amount: number;
  payment_status: string;
  payment_date: string | null;
  declaration_date: string;
}

interface InvestorInvestmentBreakdown {
  pool_name: string;
  investment_amount: number;
  investment_date: string;
  pool_status: string;
}

interface PoolInfo {
  purchase_id: string;
  pool_name: string;
}

interface PoolInvestment {
  pool_name: string;
  investment_amount: number;
  purchase_id: string;
  investment_id?: string;
  agreement_url?: string | null;
}

interface InvestorReportWithPools extends InvestorReport {
  pool_investments: PoolInvestment[];
}

const ReportsPage = () => {
  const [investorReports, setInvestorReports] = useState<InvestorReportWithPools[]>([]);
  const [investorDetails, setInvestorDetails] = useState<InvestorQuarterlyDetail[]>([]);
  const [investmentBreakdown, setInvestmentBreakdown] = useState<InvestorInvestmentBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorReport | null>(null);
  const [selectedPoolFilter, setSelectedPoolFilter] = useState<string>('');
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);
  const [availablePools, setAvailablePools] = useState<PoolInfo[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [viewAgreementUrl, setViewAgreementUrl] = useState<string | null>(null);
  const [isViewAgreementDialogOpen, setIsViewAgreementDialogOpen] = useState(false);
  const [selectedInvestorForUpload, setSelectedInvestorForUpload] = useState<InvestorReportWithPools | null>(null);

  usePageMetadata({
    defaultTitle: "Investor Reports - Investment Performance",
    defaultDescription: ""
  });

  useEffect(() => {
    fetchAvailablePools();
    fetchInvestorReports();
  }, []);

  const fetchAvailablePools = async () => {
    try {
      const { data: poolsData, error: poolsError } = await (supabase as any)
        .from('company_pools')
        .select('purchase_id, pool_name')
        .order('pool_name', { ascending: true });

      if (poolsError) throw poolsError;

      setAvailablePools(poolsData || []);
      
      // Set the first pool as default if no pool is selected
      if (poolsData && poolsData.length > 0 && !selectedPoolFilter) {
        setSelectedPoolFilter(poolsData[0].purchase_id);
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
    }
  };

  useEffect(() => {
    if (selectedInvestor) {
      fetchInvestorDetails(selectedInvestor.investor_id);
    }
  }, [selectedInvestor]);

  const fetchInvestorReports = async () => {
    try {
      setLoading(true);
      
      // Get all investors with their investment and payment summaries
      const { data: investorsData, error: investorsError } = await (supabase as any)
        .from('investors')
        .select('*')
        .order('investor_name', { ascending: true });

      if (investorsError) throw investorsError;
      
      console.log('Investors data:', investorsData);
      console.log('Number of investors found:', investorsData?.length || 0);

      // Process each investor to get their summary data
      const processedInvestors = await Promise.all(
        (investorsData || []).map(async (investor: any) => {
          // Get all investments for this investor
          const { data: investmentsData, error: investmentsError } = await (supabase as any)
            .from('investor_investments')
            .select(`
              *,
              company_pools!inner(pool_name, status)
            `)
            .eq('investor_id', investor.investor_id);

          if (investmentsError) throw investmentsError;

          const investments = investmentsData || [];
          console.log(`Investments for ${investor.investor_name}:`, investments);
          
          // Calculate total investment from actual investments
          const totalInvestment = investments.reduce((sum: number, inv: any) => sum + inv.investment_amount, 0);
          
          // Get pool names for this investor
          const poolNames = investments.map((inv: any) => inv.company_pools?.pool_name).filter(Boolean);
          
          // Get detailed pool investments with amounts and agreement URLs
          const poolInvestments: PoolInvestment[] = investments.map((inv: any) => ({
            pool_name: inv.company_pools?.pool_name || 'Unknown Pool',
            investment_amount: inv.investment_amount || 0,
            purchase_id: inv.purchase_id,
            investment_id: inv.investment_id,
            agreement_url: inv.agreement_url || null
          }));
          
          // Get all payments for this investor
          const { data: paymentsData, error: paymentsError } = await (supabase as any)
            .from('investor_quarterly_payments')
            .select(`
              *,
              quarterly_roi_declarations!inner(roi_percentage)
            `)
            .eq('investor_id', investor.investor_id);

          if (paymentsError) throw paymentsError;

          const payments = paymentsData || [];
          console.log(`Payments for ${investor.investor_name}:`, payments);
          
          const totalGrossRoi = payments.reduce((sum: number, p: any) => sum + (p.gross_roi_amount || 0), 0);
          const totalEmergencyDeduction = payments.reduce((sum: number, p: any) => sum + (p.emergency_fund_deduction || 0), 0);
          const totalTdsDeduction = payments.reduce((sum: number, p: any) => sum + (p.tds_deduction || 0), 0);
          const totalNetPayable = payments.reduce((sum: number, p: any) => sum + (p.net_payable_amount || 0), 0);
          const quartersInvested = payments.length;
          const avgRoiPercentage = payments.length > 0 
            ? payments.reduce((sum: number, p: any) => sum + (p.quarterly_roi_declarations?.roi_percentage || 0), 0) / payments.length
            : 0;
          
          const paidPayments = payments.filter((p: any) => p.payment_status === 'Paid');
          const totalPaid = paidPayments.reduce((sum: number, p: any) => sum + (p.net_payable_amount || 0), 0);
          const pendingAmount = totalNetPayable - totalPaid;
          
          const lastPayment = paidPayments.sort((a: any, b: any) => 
            new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
          )[0];

          const investorData: InvestorReportWithPools = {
            investor_id: investor.investor_id,
            investor_name: investor.investor_name,
            email: investor.email,
            phone: investor.phone,
            total_investment: totalInvestment,
            total_gross_roi: totalGrossRoi,
            total_emergency_deduction: totalEmergencyDeduction,
            total_tds_deduction: totalTdsDeduction,
            total_net_payable: totalNetPayable,
            quarters_invested: quartersInvested,
            avg_roi_percentage: avgRoiPercentage,
            last_payment_date: lastPayment?.payment_date || null,
            total_paid: totalPaid,
            pending_amount: pendingAmount,
            pool_names: poolNames,
            pool_investments: poolInvestments
          };
          
          console.log(`Processed investor ${investor.investor_name}:`, investorData);
          return investorData;
        })
      );

      console.log('All processed investors:', processedInvestors);
      
      // Filter to show only investors with actual investments
      const activeInvestors = processedInvestors.filter(investor => investor.total_investment > 0);
      console.log('Active investors with investments:', activeInvestors);
      
      setInvestorReports(activeInvestors);
    } catch (error) {
      console.error('Error fetching investor reports:', error);
      toast.error('Failed to fetch investor reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestorDetails = async (investorId: string) => {
    try {
      // Get payments with related data
      const { data: paymentsData, error: paymentsError } = await (supabase as any)
        .from('investor_quarterly_payments')
        .select(`
          *,
          quarterly_roi_declarations!inner(quarter_year, roi_percentage, declaration_date, purchase_id),
          company_pools!inner(pool_name)
        `)
        .eq('investor_id', investorId)
        .order('quarterly_roi_declarations.quarter_year', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Get investment amounts for this investor
      const { data: investmentsData, error: investmentsError } = await (supabase as any)
        .from('investor_investments')
        .select(`
          *,
          company_pools!inner(pool_name)
        `)
        .eq('investor_id', investorId);

      if (investmentsError) throw investmentsError;

      // Create a map of pool_id to investment_amount for quick lookup
      const investmentMap = new Map();
      (investmentsData || []).forEach((inv: any) => {
        investmentMap.set(inv.purchase_id, inv.investment_amount);
      });

      const processedDetails = (paymentsData || []).map((payment: any) => {
        const poolId = payment.quarterly_roi_declarations?.purchase_id;
        const investmentAmount = investmentMap.get(poolId) || 0;
        
        // Calculate ROI% from actual payout: (payout / investment) * 100
        const calculatedRoiPercentage = investmentAmount > 0
          ? (payment.gross_roi_amount / investmentAmount) * 100
          : (payment.quarterly_roi_declarations?.roi_percentage || 0);
        
        return {
          quarter_year: payment.quarterly_roi_declarations?.quarter_year || 'Unknown',
          pool_name: payment.company_pools?.pool_name || 'Unknown',
          roi_percentage: calculatedRoiPercentage,
          investment_amount: investmentAmount,
          investment_percentage: payment.investment_percentage || 0,
          gross_roi_amount: payment.gross_roi_amount || 0,
          emergency_fund_deduction: payment.emergency_fund_deduction || 0,
          tds_deduction: payment.tds_deduction || 0,
          net_payable_amount: payment.net_payable_amount || 0,
          payment_status: payment.payment_status,
          payment_date: payment.payment_date,
          declaration_date: payment.quarterly_roi_declarations?.declaration_date || ''
        };
      });

      // Process investment breakdown
      const processedBreakdown = (investmentsData || []).map((investment: any) => ({
        pool_name: investment.company_pools?.pool_name || 'Unknown',
        investment_amount: investment.investment_amount,
        investment_date: investment.investment_date,
        pool_status: investment.company_pools?.status || 'Unknown'
      }));

      setInvestorDetails(processedDetails);
      setInvestmentBreakdown(processedBreakdown);
    } catch (error) {
      console.error('Error fetching investor details:', error);
      toast.error('Failed to fetch investor details');
    }
  };

  const filteredInvestors = investorReports.filter(investor => {
    const matchesSearch = investor.investor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         investor.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Always filter by selected pool
    if (selectedPoolFilter) {
      const selectedPoolName = availablePools.find(p => p.purchase_id === selectedPoolFilter)?.pool_name;
      const hasInvestmentInPool = investor.pool_investments.some(
        pi => pi.pool_name === selectedPoolName
      );
      return matchesSearch && hasInvestmentInPool;
    }
    
    return false; // Don't show anything if no pool is selected
  });

  // Get investment amount for selected pool
  const getInvestmentForSelectedPool = (investor: InvestorReportWithPools) => {
    if (!selectedPoolFilter) return 0;
    
    const selectedPoolName = availablePools.find(p => p.purchase_id === selectedPoolFilter)?.pool_name;
    const poolInvestment = investor.pool_investments.find(pi => pi.pool_name === selectedPoolName);
    return poolInvestment?.investment_amount || 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      'Paid': 'default',
      'Pending': 'secondary',
      'Failed': 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const handleViewDetails = (investor: InvestorReport) => {
    setSelectedInvestor(investor);
  };

  const handleUploadAgreement = (investor: InvestorReportWithPools, purchaseId?: string, investmentId?: string) => {
    setSelectedInvestorForUpload(investor);
    // If purchaseId is provided, use it; otherwise use selectedPoolFilter
    if (purchaseId) {
      setSelectedPoolFilter(purchaseId);
    }
    if (investmentId) {
      setSelectedInvestmentId(investmentId);
    } else {
      setSelectedInvestmentId(null);
    }
    setIsUploadDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF, images, etc.)
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type', {
          description: 'Please upload a PDF or image file (PNG, JPEG, JPG)'
        });
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large', {
          description: 'Please upload a file smaller than 10MB'
        });
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !selectedPoolFilter || !selectedInvestorForUpload) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      
      const selectedPool = availablePools.find(p => p.purchase_id === selectedPoolFilter);
      if (!selectedPool) {
        toast.error('Pool not found');
        setUploading(false);
        return;
      }

      // Create a unique filename
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `agreements/${selectedInvestorForUpload.investor_id}/${selectedPoolFilter}/${Date.now()}.${fileExt}`;

      let agreementUrl = '';

      // Try to upload to Supabase Storage first
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('agreement_file')
          .upload(fileName, uploadFile, {
            cacheControl: '3600',
            upsert: true // Allow overwriting if file exists
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL if upload was successful
        const { data: urlData } = supabase.storage
          .from('agreement_file')
          .getPublicUrl(fileName);

        agreementUrl = urlData.publicUrl;
      } catch (storageError: any) {
        // If storage bucket doesn't exist, convert to base64 as fallback
        console.warn('Storage upload failed, using base64 fallback:', storageError);
        
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(uploadFile);
        });

        agreementUrl = await base64Promise;
      }

      // Update investor_investments table with agreement URL for this specific investment
      let updateQuery = (supabase as any)
        .from('investor_investments')
        .update({ agreement_url: agreementUrl })
        .eq('investor_id', selectedInvestorForUpload.investor_id)
        .eq('purchase_id', selectedPoolFilter);
      
      // If a specific investment_id is provided, update only that investment
      if (selectedInvestmentId) {
        updateQuery = updateQuery.eq('investment_id', selectedInvestmentId);
      }
      
      const { error: updateError } = await updateQuery;

      if (updateError) {
        // Check if agreement_url column exists
        if (updateError.code === '42703') {
          toast.error('Database column missing', {
            description: 'Please add agreement_url column to investor_investments table. See instructions in console.'
          });
          console.error('Add this column to investor_investments table:');
          console.error('ALTER TABLE public.investor_investments ADD COLUMN agreement_url TEXT;');
          setUploading(false);
          return;
        }
        throw updateError;
      }

      // Close upload dialog and reset state immediately on success
      setIsUploadDialogOpen(false);
      setUploading(false);
      setSelectedInvestorForUpload(null);
      setSelectedInvestmentId(null);

      // Store filename for display
      setUploadedFileName(uploadFile.name);
      
      // Refresh investor reports to get updated agreement_url
      await fetchInvestorReports();
      
      // Show success dialog for 3 seconds (but don't auto-close if user wants to edit)
      const investorName = selectedInvestorForUpload?.investor_name || 'Investor';
      setSuccessMessage(`Agreement has been saved for ${investorName} - ${selectedPool.pool_name}.`);
      setShowSuccessDialog(true);

      // Auto-close success dialog after 3 seconds (only if still open)
      const timeoutId = setTimeout(() => {
        setShowSuccessDialog(false);
      }, 3000);
      
      // Store timeout ID so we can clear it if user clicks edit
      (window as any).successDialogTimeout = timeoutId;

      toast.success('Agreement uploaded successfully', {
        description: `Agreement has been saved for ${selectedInvestorForUpload.investor_name} - ${selectedPool.pool_name}.`
      });
    } catch (error: any) {
      console.error('Error uploading agreement:', error);
      toast.error('Failed to upload agreement', {
        description: error?.message || 'Please try again'
      });
      setUploading(false);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Investor Reports</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
          <div className="flex-1">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-[250px]">
            <Select value={selectedPoolFilter} onValueChange={setSelectedPoolFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select a pool" />
              </SelectTrigger>
              <SelectContent>
                {availablePools.map((pool) => (
                  <SelectItem key={pool.purchase_id} value={pool.purchase_id}>
                    {pool.pool_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Investor Reports */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredInvestors.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No investors found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Try adjusting your search terms.'
                : 'No investors with investments found.'
              }
            </p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor</TableHead>
                      <TableHead>Pools Invested</TableHead>
                      <TableHead>Investment Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Flatten investments: create one row per investment instead of one per investor
                      const investmentRows: Array<{
                        investor: InvestorReportWithPools;
                        investment: PoolInvestment;
                        key: string;
                      }> = [];
                      
                      filteredInvestors.forEach((investor) => {
                        const selectedPoolName = availablePools.find(p => p.purchase_id === selectedPoolFilter)?.pool_name;
                        investor.pool_investments
                          .filter(pi => pi.pool_name === selectedPoolName)
                          .forEach((investment) => {
                            investmentRows.push({
                              investor,
                              investment,
                              key: investment.investment_id || `${investor.investor_id}-${investment.purchase_id}-${investment.investment_amount}`
                            });
                          });
                      });
                      
                      return investmentRows.map(({ investor, investment, key }) => {
                        const hasAgreement = investment.agreement_url && investment.agreement_url.trim() !== '';
                        
                        return (
                          <TableRow key={key}>
                            <TableCell className="font-medium">{investor.investor_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-blue-600">
                                {investment.pool_name}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(investment.investment_amount)}
                            </TableCell>
                            <TableCell>
                              {hasAgreement ? (
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setViewAgreementUrl(investment.agreement_url!);
                                      setIsViewAgreementDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Agreement
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleUploadAgreement(investor, investment.purchase_id, investment.investment_id)}
                                    title="Edit/Replace Agreement"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUploadAgreement(investor, investment.purchase_id, investment.investment_id)}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Agreement
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investor Details Modal */}
        {selectedInvestor && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{selectedInvestor.investor_name} - Investment Details</CardTitle>
                  <CardDescription>
                    Quarterly breakdown of investments and returns
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setSelectedInvestor(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Investment</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedInvestor.total_investment)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Gross ROI</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(selectedInvestor.total_gross_roi)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Emergency Deduction</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(selectedInvestor.total_emergency_deduction)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Net Payable</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(selectedInvestor.total_net_payable)}
                  </p>
                </div>
              </div>

              {/* Investment Breakdown */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Investment Breakdown by Pool</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pool Name</TableHead>
                        <TableHead>Investment Amount</TableHead>
                        <TableHead>Investment Date</TableHead>
                        <TableHead>Pool Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investmentBreakdown.map((investment, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{investment.pool_name}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(investment.investment_amount)}</TableCell>
                          <TableCell>{formatDate(investment.investment_date)}</TableCell>
                          <TableCell>
                            <Badge variant={investment.pool_status === 'Active' ? 'default' : 'secondary'}>
                              {investment.pool_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Quarterly Details Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quarter</TableHead>
                      <TableHead>Pool</TableHead>
                      <TableHead>ROI %</TableHead>
                      <TableHead>Investment</TableHead>
                      <TableHead>Investment %</TableHead>
                      <TableHead>Gross ROI</TableHead>
                      <TableHead>Emergency Deduction</TableHead>
                      <TableHead>TDS Deduction</TableHead>
                      <TableHead>Net Payable</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investorDetails.map((detail, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{detail.quarter_year}</TableCell>
                        <TableCell>{detail.pool_name}</TableCell>
                        <TableCell className="text-green-600 font-medium">{detail.roi_percentage.toFixed(2)}%</TableCell>
                        <TableCell>{formatCurrency(detail.investment_amount)}</TableCell>
                        <TableCell>{detail.investment_percentage.toFixed(2)}%</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(detail.gross_roi_amount)}
                        </TableCell>
                        <TableCell className="text-orange-600">
                          {formatCurrency(detail.emergency_fund_deduction)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {formatCurrency(detail.tds_deduction)}
                        </TableCell>
                        <TableCell className="text-blue-600 font-medium">
                          {formatCurrency(detail.net_payable_amount)}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(detail.payment_status)}
                        </TableCell>
                        <TableCell>
                          {detail.payment_date 
                            ? formatDate(detail.payment_date)
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Agreement Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
          setIsUploadDialogOpen(open);
          if (!open) {
            setSelectedInvestmentId(null);
            setUploadFile(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Agreement for Pool
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  id="agreement-file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, PNG, JPEG, JPG (Max 10MB)
                </p>
                {uploadFile && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">{uploadFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setSelectedInvestmentId(null);
                  setUploadFile(null);
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || uploading || !selectedPoolFilter}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Agreement
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Notification - Bottom Right */}
        {showSuccessDialog && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in-0 sm:max-w-md">
            <div className="bg-background border rounded-lg shadow-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">Agreement Uploaded</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {successMessage}
                  </p>
                  {uploadedFileName && (
                    <div className="mt-2 flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">
                        {uploadedFileName}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={() => {
                    // Clear auto-close timeout
                    if ((window as any).successDialogTimeout) {
                      clearTimeout((window as any).successDialogTimeout);
                    }
                    // Close success notification
                    setShowSuccessDialog(false);
                    // Reopen upload dialog
                    setIsUploadDialogOpen(true);
                    setUploadFile(null);
                  }}
                  title="Edit/Replace Agreement"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Agreement Dialog */}
        <Dialog open={isViewAgreementDialogOpen} onOpenChange={setIsViewAgreementDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Investment Agreement / Receipt
              </DialogTitle>
              <DialogDescription>
                View the agreement document for this investment pool
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {viewAgreementUrl ? (
                <div className="w-full">
                  <iframe
                    src={viewAgreementUrl}
                    className="w-full h-[600px] border rounded-lg"
                    title="Agreement Document"
                  />
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open(viewAgreementUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => {
                        // Handle download for both URLs and base64 data URLs
                        if (viewAgreementUrl.startsWith('data:')) {
                          // Base64 data URL
                          const link = document.createElement('a');
                          link.href = viewAgreementUrl;
                          link.download = `agreement-${new Date().getTime()}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } else {
                          // Regular URL - fetch and download
                          fetch(viewAgreementUrl)
                            .then(response => response.blob())
                            .then(blob => {
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `agreement-${new Date().getTime()}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                            })
                            .catch(error => {
                              console.error('Download error:', error);
                              toast.error('Failed to download agreement', {
                                description: 'Please try opening in a new tab instead'
                              });
                            });
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Agreement
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No agreement available</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default ReportsPage;
