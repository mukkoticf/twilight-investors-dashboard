import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Building, User } from 'lucide-react';
import { usePageMetadata } from '@/hooks/use-page-metadata';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

const InvestmentDetailPage = () => {
  const { investmentId } = useParams<{ investmentId: string }>();
  const navigate = useNavigate();
  const [investment, setInvestment] = useState<InvestmentDetail | null>(null);
  const [quarterlyPayments, setQuarterlyPayments] = useState<QuarterlyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarterlyLoading, setQuarterlyLoading] = useState(true);

  usePageMetadata({
    defaultTitle: investment ? `Investment Details - ${investment.investor_name}` : "Investment Details - Investor Management",
    defaultDescription: "View detailed quarterly breakdown of investment"
  });

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
          pool_name: payment.quarterly_roi_declarations?.company_pools?.pool_name || 'Unknown Pool'
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

  const totalGrossRoi = quarterlyPayments.reduce((sum, payment) => sum + payment.gross_roi_amount, 0);
  const totalEmergencyFundDeduction = quarterlyPayments.reduce((sum, payment) => sum + payment.emergency_fund_deduction, 0);
  const totalTdsDeduction = quarterlyPayments.reduce((sum, payment) => sum + payment.tds_deduction, 0);
  const totalNetPayable = quarterlyPayments.reduce((sum, payment) => sum + payment.net_payable_amount, 0);

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
              <p className="text-muted-foreground">
                {investment.investor_name} - {investment.pool_name}
              </p>
            </div>
          </div>
        </div>

        {/* Investment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investment Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(investment.investment_amount)}</div>
              <p className="text-xs text-muted-foreground">
                {investment.investment_percentage.toFixed(2)}% of pool
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gross ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalGrossRoi)}</div>
              <p className="text-xs text-muted-foreground">
                Before deductions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Payable</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalNetPayable)}</div>
              <p className="text-xs text-muted-foreground">
                After all deductions
              </p>
            </CardContent>
          </Card>
        </div>


        {/* Quarterly Payments Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Quarterly Payments Breakdown
            </CardTitle>
            <CardDescription>
              Detailed quarterly payments and deductions for this investment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quarterlyLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : quarterlyPayments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No quarterly payments found</h3>
                <p className="text-muted-foreground">
                  Quarterly payments for this investment are not available yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quarter</TableHead>
                    <TableHead>ROI %</TableHead>
                    <TableHead>Gross ROI Amount</TableHead>
                    <TableHead>Emergency Fund Deduction</TableHead>
                    <TableHead>TDS Deduction</TableHead>
                    <TableHead>Net Payable Amount</TableHead>
                    <TableHead>Pool</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quarterlyPayments.map((payment) => (
                    <TableRow key={payment.payment_id}>
                      <TableCell className="font-medium">
                        {payment.quarter} {payment.year}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-purple-600">
                          {payment.roi_percentage.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        {formatCurrency(payment.gross_roi_amount)}
                      </TableCell>
                      <TableCell className="font-semibold text-orange-600">
                        {formatCurrency(payment.emergency_fund_deduction)}
                      </TableCell>
                      <TableCell className="font-semibold text-red-600">
                        {formatCurrency(payment.tds_deduction)}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(payment.net_payable_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-blue-600">
                          {payment.pool_name}
                        </Badge>
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
