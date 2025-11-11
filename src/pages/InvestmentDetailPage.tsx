import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Building, User, Eye } from 'lucide-react';
import { usePageMetadata } from '@/hooks/use-page-metadata';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { trackPageViewToDB } from '@/utils/analytics';

interface InvestmentDetail {
  investment_id: string;
  investor_id: string;
  purchase_id: string;
  investment_amount: number;
  investment_percentage: number;
  created_at: string;
  investor_name: string;
  pool_name: string;
  total_cost: number;
  status: 'Active' | 'Inactive' | 'Sold';
}

interface QuarterlyPayment {
  payment_id: string;
  investor_id: string;
  declaration_id: string;
  gross_roi_amount: number;
  emergency_fund_deduction: number;
  tds_deduction: number;
  net_payable_amount: number;
  payment_status: 'Pending' | 'Paid' | 'Failed';
  payment_date: string | null;
  payment_reference: string | null;
  created_at: string;
  quarter: string;
  year: number;
  quarter_year: string;
  roi_percentage: number;
  declaration_date: string | null;
  pool_name: string;
  company_name: string | null;
  receipt_url: string | null;
}

const InvestmentDetailPage = () => {
  const { investmentId } = useParams<{ investmentId: string }>();
  const navigate = useNavigate();
  const { investor, isAdmin } = useAuth();
  const [investment, setInvestment] = useState<InvestmentDetail | null>(null);
  const [quarterlyPayments, setQuarterlyPayments] = useState<QuarterlyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarterlyLoading, setQuarterlyLoading] = useState(true);
  // const [selectedPoolFilter, setSelectedPoolFilter] = useState<string>('');

  usePageMetadata({
    defaultTitle: investment ? `Investment Details - ${investment.investor_name}` : "Investment Details - Investor Management",
    defaultDescription: "View detailed quarterly breakdown of investment"
  });

  // Track page view for investors (not admins)
  useEffect(() => {
    if (investor && !isAdmin) {
      trackPageViewToDB(investor.investor_id, investor.investor_name, 'Investment Details');
    }
  }, [investor, isAdmin]);

  useEffect(() => {
    if (investmentId) {
      fetchInvestmentDetails();
    }
  }, [investmentId]);

  useEffect(() => {
    if (investment) {
      fetchQuarterlyPayments();
    }
  }, [investment]);

  // Set default pool filter when investment is loaded
  // useEffect(() => {
  //   if (investment?.pool_name) {
  //     setSelectedPoolFilter(investment.pool_name);
  //   }
  // }, [investment?.pool_name]);

  const fetchInvestmentDetails = async () => {
    try {
      setLoading(true);
      
      const { data: investmentData, error: investmentError } = await (supabase as any)
        .from('investor_investments')
        .select(`
          *,
          investors:investor_id (
            investor_name
          ),
          company_pools:purchase_id (
            pool_name,
            total_cost,
            status
          )
        `)
        .eq('investment_id', investmentId)
        .single();

      if (investmentError) throw investmentError;

      // Transform the data to flatten the related information
      const transformedData = {
        ...investmentData,
        investor_name: investmentData.investors?.investor_name || 'Unknown',
        pool_name: investmentData.company_pools?.pool_name || 'Unknown Pool',
        total_cost: investmentData.company_pools?.total_cost || 0,
        status: investmentData.company_pools?.status || 'Unknown'
      };

      console.log('Investment data loaded:', transformedData);
      setInvestment(transformedData);
    } catch (error) {
      console.error('Error fetching investment details:', error);
      toast.error('Failed to fetch investment details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuarterlyPayments = async () => {
    try {
      setQuarterlyLoading(true);
      
      if (!investment) return;

      console.log('Fetching quarterly payments for investor_id:', investment.investor_id);

      // First, let's test if we can fetch any quarterly payments at all
      const { data: allPayments, error: allPaymentsError } = await (supabase as any)
        .from('investor_quarterly_payments')
        .select('*')
        .limit(5);

      console.log('All quarterly payments (test):', allPayments);

      const { data: paymentsData, error: paymentsError } = await (supabase as any)
        .from('investor_quarterly_payments')
        .select(`
          *,
          quarterly_roi_declarations:declaration_id (
            quarter_year,
            roi_percentage,
            declaration_date,
            company_pools!inner (
              pool_name
            )
          )
        `)
        .eq('investor_id', investment.investor_id)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Payments query error:', paymentsError);
        throw paymentsError;
      }

      console.log('Raw payments data:', paymentsData);

      // Transform the data to flatten the quarterly information
      const transformedData = paymentsData?.map((payment: any) => {
        const quarterYear = payment.quarterly_roi_declarations?.quarter_year || 'Q1-2024';
        const [quarter, year] = quarterYear.split('-');
        
        return {
          ...payment,
          quarter: quarter || 'Q1',
          year: parseInt(year) || new Date().getFullYear(),
          quarter_year: quarterYear,
          roi_percentage: payment.quarterly_roi_declarations?.roi_percentage || 0,
          declaration_date: payment.quarterly_roi_declarations?.declaration_date || null,
          pool_name: payment.quarterly_roi_declarations?.company_pools?.pool_name || 'Unknown Pool',
          company_name: payment.company_name || null
        };
      }) || [];

      console.log('Transformed payments data:', transformedData);
      setQuarterlyPayments(transformedData);
    } catch (error) {
      console.error('Error fetching quarterly payments:', error);
      toast.error('Failed to fetch quarterly payments');
    } finally {
      setQuarterlyLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Active': 'default',
      'Inactive': 'secondary',
      'Sold': 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  // Filter payments to show only those for the current investment's pool
  const filteredPayments = investment?.pool_name 
    ? quarterlyPayments
        .filter(payment => payment.pool_name === investment.pool_name)
        .sort((a, b) => {
          // First sort by year (descending - latest first)
          if (b.year !== a.year) {
            return b.year - a.year;
          }
          // Then sort by quarter (Q4 > Q3 > Q2 > Q1)
          const quarterOrder: { [key: string]: number } = { 'Q4': 4, 'Q3': 3, 'Q2': 2, 'Q1': 1 };
          const aQuarter = quarterOrder[a.quarter] || 0;
          const bQuarter = quarterOrder[b.quarter] || 0;
          return bQuarter - aQuarter;
        })
    : [];

  // Calculate totals only for the current pool's payments
  const totalGrossRoi = filteredPayments.reduce((sum, payment) => sum + payment.gross_roi_amount, 0);
  const totalTdsDeduction = filteredPayments.reduce((sum, payment) => sum + payment.tds_deduction, 0);
  const totalNetPayable = filteredPayments.reduce((sum, payment) => sum + payment.net_payable_amount, 0);
  
  // Calculate total emergency fund deducted for the current pool
  const totalEmergencyFundDeductedForPool = filteredPayments.reduce((sum, payment) => sum + payment.emergency_fund_deduction, 0);

  // Calculate ROI percentage
  const noOfQuartersTillNow = filteredPayments.length;
  const calculateROIPercentage = () => {
    if (!investment || noOfQuartersTillNow === 0) return 0;
    const x = (totalGrossRoi / investment.investment_amount) * 100;
    const roiPercentage = (x / noOfQuartersTillNow) * 4;
    return roiPercentage;
  };
  const roiPercentage = calculateROIPercentage();

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  if (!investment) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Investment not found</h3>
          <p className="text-muted-foreground mb-4">
            The investment you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
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
              <h1 className="text-3xl font-bold">Investment Details</h1>
              {isAdmin && (
                <p className="text-muted-foreground">
                  {investment.investor_name} - {investment.pool_name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Investment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Investment Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(investment.investment_amount)}</div>
              
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Payout & Avg.ROI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(totalGrossRoi)}
                {roiPercentage > 0 && (
                  <span>({roiPercentage.toFixed(2)}%)</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Before deductions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Emergency Fund Ded. until Now</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalEmergencyFundDeductedForPool)}</div>
              <p className="text-xs text-muted-foreground">
                It's parked in Fixed Deposit
              </p>
            </CardContent>
          </Card>
        </div>


        {/* Quarterly Payments Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Quarterly Payouts
                  {investment?.pool_name && (
                    <Badge variant="outline" className="text-blue-600 text-base px-4 py-2 font-semibold">
                      {investment.pool_name}
                    </Badge>
                  )}
                </CardTitle>
              </div>
              {/* {uniquePools.length > 1 && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="pool-filter" className="text-sm font-medium">
                    Filter by Pool:
                  </Label>
                  <Select value={selectedPoolFilter} onValueChange={setSelectedPoolFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a pool" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniquePools.map((pool) => (
                        <SelectItem key={pool} value={pool}>
                          {pool}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )} */}
            </div>
          </CardHeader>
          <CardContent>
            {quarterlyLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No quarterly payments found</h3>
                <p className="text-muted-foreground">
                  Quarterly payments for this investment pool are not available yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Quarter</TableHead>
                    {/* <TableHead className="text-center">Company</TableHead> */}
                    <TableHead className="text-center">ROI %</TableHead>
                    <TableHead className="text-center">Payout</TableHead>
                    <TableHead className="text-center">Emergency Fund Ded.</TableHead>
                    <TableHead className="text-center">TDS Ded.</TableHead>
                    <TableHead className="text-center">Net Payable Amount</TableHead>
                    <TableHead className="text-center">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.payment_id}>
                      <TableCell className="font-medium text-center">
                        {payment.quarter} {payment.year}
                      </TableCell>
                      {/* <TableCell className="text-center">
                        {payment.company_name ? (
                          <Badge variant="secondary" className="text-sm">
                            {payment.company_name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell> */}
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-purple-600">
                          {payment.roi_percentage.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600 text-center">
                        {formatCurrency(payment.gross_roi_amount)}
                      </TableCell>
                      <TableCell className="font-semibold text-orange-600 text-center">
                        {formatCurrency(payment.emergency_fund_deduction)}
                      </TableCell>
                      <TableCell className="font-semibold text-red-600 text-center">
                        {formatCurrency(payment.tds_deduction)}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600 text-center">
                        {formatCurrency(payment.net_payable_amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {payment.receipt_url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const encodedUrl = encodeURIComponent(payment.receipt_url!);
                              window.open(`/receipt?url=${encodedUrl}`, '_blank');
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default InvestmentDetailPage;

