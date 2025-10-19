import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePageMetadata } from '@/hooks/use-page-metadata';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Download, Filter, TrendingUp, DollarSign, Users, Calendar, Eye } from 'lucide-react';

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

const ReportsPage = () => {
  const [investorReports, setInvestorReports] = useState<InvestorReport[]>([]);
  const [investorDetails, setInvestorDetails] = useState<InvestorQuarterlyDetail[]>([]);
  const [investmentBreakdown, setInvestmentBreakdown] = useState<InvestorInvestmentBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorReport | null>(null);

  usePageMetadata({
    defaultTitle: "Investor Reports - Investment Performance",
    defaultDescription: ""
  });

  useEffect(() => {
    fetchInvestorReports();
  }, []);

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

          const investorData = {
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
            pool_names: poolNames
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
        
        return {
          quarter_year: payment.quarterly_roi_declarations?.quarter_year || 'Unknown',
          pool_name: payment.company_pools?.pool_name || 'Unknown',
          roi_percentage: payment.quarterly_roi_declarations?.roi_percentage || 0,
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
    return matchesSearch;
  });

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

  const exportToCSV = (investor: InvestorReport) => {
    if (!selectedInvestor || investorDetails.length === 0) return;

    const csvContent = [
      ['Quarter', 'Pool Name', 'ROI %', 'Investment Amount', 'Investment %', 'Gross ROI', 'Emergency Deduction', 'TDS Deduction', 'Net Payable', 'Payment Status', 'Payment Date'],
      ...investorDetails.map(detail => [
        detail.quarter_year,
        detail.pool_name,
        detail.roi_percentage.toString(),
        detail.investment_amount.toString(),
        detail.investment_percentage.toString(),
        detail.gross_roi_amount.toString(),
        detail.emergency_fund_deduction.toString(),
        detail.tds_deduction.toString(),
        detail.net_payable_amount.toString(),
        detail.payment_status,
        detail.payment_date || 'Not Paid'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${investor.investor_name}_investment_report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
              placeholder="Search by investor name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                      <TableHead>Total Investment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvestors.map((investor) => (
                      <TableRow key={investor.investor_id}>
                        <TableCell className="font-medium">{investor.investor_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {investor.pool_names.map((poolName, index) => (
                              <Badge key={index} variant="outline" className="text-blue-600">
                                {poolName}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(investor.total_investment)}</TableCell>
                        <TableCell>
                          <Badge variant={investor.pending_amount > 0 ? 'secondary' : 'default'}>
                            {investor.pending_amount > 0 ? 'Pending' : 'Up to Date'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(investor)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => exportToCSV(investor)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                          <TableCell>{new Date(investment.investment_date).toLocaleDateString()}</TableCell>
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
                        <TableCell className="text-green-600 font-medium">{detail.roi_percentage}%</TableCell>
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
                            ? new Date(detail.payment_date).toLocaleDateString()
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
      </div>
    </PageLayout>
  );
};

export default ReportsPage;
