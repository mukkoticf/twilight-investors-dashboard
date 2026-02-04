import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Building, User, Eye, Save, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  investment_id: string;
  declaration_id: string;
  gross_roi_amount: number;
  emergency_fund_deduction: number;
  fd_returns: number | null;
  tds_deduction: number;
  net_payable_amount: number;
  payment_status: 'Pending' | 'Paid' | 'Failed';
  payment_date: string | null;
  payment_reference: string | null;
  created_at: string;
  quarter: string;
  year: number;
  quarter_year: string;
  month_names: string | null;
  roi_percentage: number;
  declaration_date: string | null;
  pool_name: string;
  company_name: string | null;
  receipt_url: string | null;
  remarks: string | null;
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
  
  // Editing states
  const [editingInvestmentAmount, setEditingInvestmentAmount] = useState(false);
  const [investmentAmountValue, setInvestmentAmountValue] = useState<string>('');
  const [editingPayments, setEditingPayments] = useState<{ [key: string]: any }>({});
  const [editingRemarks, setEditingRemarks] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState<string | null>(null);
  
  // Add payment form states
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [availableDeclarations, setAvailableDeclarations] = useState<any[]>([]);
  const [newPayment, setNewPayment] = useState({
    declaration_id: '',
    gross_roi_amount: '',
    emergency_fund_deduction: '',
    fd_returns: '',
    tds_deduction: '',
    net_payable_amount: '',
    payment_status: 'Paid' as 'Pending' | 'Paid' | 'Failed',
    payment_date: '',
    remarks: ''
  });

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
      setInvestmentAmountValue(investment.investment_amount.toString());
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

      console.log('Fetching quarterly payments for investment_id:', investment.investment_id);

      // Fetch payments for this specific investment
      const { data: paymentsData, error: paymentsError } = await (supabase as any)
        .from('investor_quarterly_payments')
        .select('*')
        .eq('investment_id', investment.investment_id)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Payments query error:', paymentsError);
        throw paymentsError;
      }

      console.log('Raw payments data:', paymentsData);

      // Fetch declarations separately if we have payments
      let declarationsMap = new Map();
      if (paymentsData && paymentsData.length > 0) {
        const declarationIds = [...new Set(paymentsData.map((p: any) => p.declaration_id))];
        
        const { data: declarationsData, error: declarationsError } = await (supabase as any)
          .from('quarterly_roi_declarations')
          .select(`
            declaration_id,
            quarter_year,
            month_names,
            roi_percentage,
            declaration_date,
            purchase_id,
            company_pools:purchase_id (
              pool_name
            )
          `)
          .in('declaration_id', declarationIds);

        if (declarationsError) {
          console.error('Declarations query error:', declarationsError);
          // Continue even if declarations fail
        } else {
          // Create a map for quick lookup
          declarationsData?.forEach((decl: any) => {
            declarationsMap.set(decl.declaration_id, decl);
          });
        }
      }

      // Transform the data to flatten the quarterly information
      const transformedData = paymentsData?.map((payment: any) => {
        const declaration = declarationsMap.get(payment.declaration_id);
        const quarterYear = declaration?.quarter_year || 'Q1-2024';
        const [quarter, year] = quarterYear.split('-');
        return {
          ...payment,
          fd_returns: payment.fd_returns ?? null,
          quarter: quarter || 'Q1',
          year: parseInt(year) || new Date().getFullYear(),
          quarter_year: quarterYear,
          month_names: declaration?.month_names || null,
          roi_percentage: declaration?.roi_percentage || 0,
          declaration_date: declaration?.declaration_date || null,
          pool_name: declaration?.company_pools?.pool_name || 'Unknown Pool',
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

  // Parse number from formatted string
  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(/[₹,\s]/g, '')) || 0;
  };

  // Save investment amount
  const handleSaveInvestmentAmount = async () => {
    if (!investment || !isAdmin) return;
    
    const newAmount = parseNumber(investmentAmountValue);
    if (newAmount <= 0) {
      toast.error('Investment amount must be greater than 0');
      return;
    }

    try {
      setSaving('investment_amount');
      const { error } = await (supabase as any)
        .from('investor_investments')
        .update({ investment_amount: newAmount })
        .eq('investment_id', investment.investment_id);

      if (error) throw error;

      setInvestment(prev => prev ? { ...prev, investment_amount: newAmount } : null);
      setEditingInvestmentAmount(false);
      toast.success('Investment amount updated successfully');
    } catch (error: any) {
      console.error('Error updating investment amount:', error);
      toast.error('Failed to update investment amount');
    } finally {
      setSaving(null);
    }
  };

  // Save payment field (value can be number or '' for fd_returns when clearing)
  const handleSavePaymentField = async (paymentId: string, field: string, value: number | string) => {
    if (!isAdmin) return;

    try {
      setSaving(`${paymentId}-${field}`);
      
      // Calculate net_payable_amount if other fields are being updated
      // Formula: net_payout = quarter_payout - emergency_fund_deduction + (FD Returns if present); final_payout = net_payout - TDS
      let updateData: any = { [field]: value };
      if (field === 'fd_returns') {
        const fdVal = value === '' || value == null || Number.isNaN(Number(value)) ? null : Number(value);
        updateData.fd_returns = fdVal;
      }

      if (field === 'gross_roi_amount' || field === 'emergency_fund_deduction' || field === 'fd_returns' || field === 'tds_deduction') {
        const payment = quarterlyPayments.find(p => p.payment_id === paymentId);
        if (payment) {
          const grossRoi = field === 'gross_roi_amount' ? Number(value) : payment.gross_roi_amount;
          const emergencyFund = field === 'emergency_fund_deduction' ? Number(value) : payment.emergency_fund_deduction;
          const fdReturns = field === 'fd_returns'
            ? (value === '' || value == null || Number.isNaN(Number(value)) ? 0 : Number(value))
            : (payment.fd_returns ?? 0);
          const tds = field === 'tds_deduction' ? Number(value) : payment.tds_deduction;
          const netPayout = grossRoi - emergencyFund + fdReturns;
          const netPayable = netPayout - tds;
          updateData.net_payable_amount = Math.max(0, netPayable);
        }
      }

      const { error } = await (supabase as any)
        .from('investor_quarterly_payments')
        .update(updateData)
        .eq('payment_id', paymentId);

      if (error) throw error;

      // Update local state
      setQuarterlyPayments(prev => prev.map(p => {
        if (p.payment_id === paymentId) {
          const updated = { ...p, ...updateData };
          return updated;
        }
        return p;
      }));

      // Clear editing state for this field
      const editingKey = `${paymentId}-${field}`;
      setEditingPayments(prev => {
        const newState = { ...prev };
        delete newState[editingKey];
        return newState;
      });

      toast.success(`${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} updated successfully`);
    } catch (error: any) {
      console.error(`Error updating ${field}:`, error);
      toast.error(`Failed to update ${field.replace(/_/g, ' ')}`);
    } finally {
      setSaving(null);
    }
  };

  // Start editing a payment field
  const startEditingPayment = (paymentId: string, field: string, currentValue: number) => {
    if (!isAdmin) return;
    const editingKey = `${paymentId}-${field}`;
    setEditingPayments(prev => ({
      ...prev,
      [editingKey]: currentValue.toString()
    }));
  };

  // Cancel editing
  const cancelEditing = (paymentId: string, field: string) => {
    const editingKey = `${paymentId}-${field}`;
    setEditingPayments(prev => {
      const newState = { ...prev };
      delete newState[editingKey];
      return newState;
    });
  };

  // Fetch available declarations for the current pool
  const fetchAvailableDeclarations = async () => {
    if (!investment) return;
    
    try {
      // Fetch all declarations for this pool (including non-finalized for manual entry)
      const { data: declarations, error } = await (supabase as any)
        .from('quarterly_roi_declarations')
        .select('declaration_id, quarter_year, month_names, declaration_date, is_finalized')
        .eq('purchase_id', investment.purchase_id)
        .order('declaration_date', { ascending: false });
      
      if (error) throw error;
      
      setAvailableDeclarations(declarations || []);
      
      if (declarations && declarations.length === 0) {
        toast.info('No quarters available for this pool');
      }
    } catch (error: any) {
      console.error('Error fetching declarations:', error);
      toast.error('Failed to fetch available quarters');
    }
  };

  // Handle opening add payment dialog
  const handleOpenAddPaymentDialog = () => {
    if (!investment) {
      toast.error('Investment not loaded');
      return;
    }
    fetchAvailableDeclarations();
    setShowAddPaymentDialog(true);
  };

  // Save new payment
  const handleSaveNewPayment = async () => {
    if (!investment || !isAdmin) return;
    
    // Validate required fields
    if (!newPayment.declaration_id) {
      toast.error('Please select a quarter');
      return;
    }
    
    if (!newPayment.gross_roi_amount || parseFloat(newPayment.gross_roi_amount) < 0) {
      toast.error('Please enter a valid payout amount');
      return;
    }
    
    try {
      setSaving('new-payment');
      
      const grossRoi = parseFloat(newPayment.gross_roi_amount) || 0;
      const emergencyFund = parseFloat(newPayment.emergency_fund_deduction) || 0;
      const fdReturnsRaw = newPayment.fd_returns.trim();
      const fdReturns = fdReturnsRaw === '' ? null : parseFloat(fdReturnsRaw) || 0;
      const tds = parseFloat(newPayment.tds_deduction) || 0;
      const netPayout = grossRoi - emergencyFund + (fdReturns ?? 0);
      const netPayable = Math.max(0, netPayout - tds);

      const paymentData = {
        investment_id: investment.investment_id,
        declaration_id: newPayment.declaration_id,
        gross_roi_amount: grossRoi,
        emergency_fund_deduction: emergencyFund,
        fd_returns: fdReturns,
        tds_deduction: tds,
        net_payable_amount: netPayable,
        payment_status: newPayment.payment_status,
        payment_date: newPayment.payment_date || null,
        remarks: newPayment.remarks || null
      };
      
      const { error } = await (supabase as any)
        .from('investor_quarterly_payments')
        .insert(paymentData);
      
      if (error) throw error;
      
      toast.success('Payment entry added successfully');
      
      // Reset form
      setNewPayment({
        declaration_id: '',
        gross_roi_amount: '',
        emergency_fund_deduction: '',
        fd_returns: '',
        tds_deduction: '',
        net_payable_amount: '',
        payment_status: 'Paid',
        payment_date: '',
        remarks: ''
      });
      
      setShowAddPaymentDialog(false);
      
      // Refresh payments
      await fetchQuarterlyPayments();
    } catch (error: any) {
      console.error('Error saving payment:', error);
      toast.error('Failed to save payment entry');
    } finally {
      setSaving(null);
    }
  };

  // Save remark
  const handleSaveRemark = async (paymentId: string, remark: string) => {
    if (!isAdmin) return;

    try {
      setSaving(`${paymentId}-remarks`);
      
      const { error } = await (supabase as any)
        .from('investor_quarterly_payments')
        .update({ remarks: remark || null })
        .eq('payment_id', paymentId);

      if (error) throw error;

      // Update local state
      setQuarterlyPayments(prev => prev.map(p => {
        if (p.payment_id === paymentId) {
          return { ...p, remarks: remark || null };
        }
        return p;
      }));

      // Clear editing state
      setEditingRemarks(prev => {
        const newState = { ...prev };
        delete newState[paymentId];
        return newState;
      });

      toast.success('Remark updated successfully');
    } catch (error: any) {
      console.error('Error updating remark:', error);
      toast.error('Failed to update remark');
    } finally {
      setSaving(null);
    }
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
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
              <h1 className="text-2xl md:text-3xl font-bold">Investment Details</h1>
            </div>
          </div>
          <Card className="w-full md:w-auto bg-blue-50 border-blue-200">
            <CardContent className="p-3 md:p-4">
              <p className="text-base md:text-2xl font-bold break-words text-left md:text-right text-blue-600">
                {investment.investor_name}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Investment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Investment Amount</CardTitle>
            </CardHeader>
            <CardContent>
              {isAdmin && editingInvestmentAmount ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={investmentAmountValue}
                    onChange={(e) => setInvestmentAmountValue(e.target.value)}
                    className="text-2xl font-bold text-green-600 h-auto py-1"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveInvestmentAmount}
                    disabled={saving === 'investment_amount'}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingInvestmentAmount(false);
                      setInvestmentAmountValue(investment.investment_amount.toString());
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="text-2xl font-bold text-green-600 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1"
                  onClick={() => isAdmin && setEditingInvestmentAmount(true)}
                  title={isAdmin ? "Click to edit" : ""}
                >
                  {formatCurrency(investment.investment_amount)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Payout until Now</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(totalGrossRoi)}
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
              {isAdmin && (
                <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={handleOpenAddPaymentDialog} size="sm" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Quarterly Payment Entry</DialogTitle>
                      <DialogDescription>
                        Fill in the payment details for this investment. Make sure the investment_id and declaration_id are correct.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="declaration">Quarter *</Label>
                        <Select
                          value={newPayment.declaration_id}
                          onValueChange={(value) => setNewPayment(prev => ({ ...prev, declaration_id: value }))}
                        >
                          <SelectTrigger id="declaration">
                            <SelectValue placeholder="Select a quarter" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDeclarations.map((decl) => (
                              <SelectItem key={decl.declaration_id} value={decl.declaration_id}>
                                {decl.quarter_year} {decl.month_names ? `(${decl.month_names})` : ''} - {new Date(decl.declaration_date).toLocaleDateString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="gross_roi">Payout (Gross ROI Amount) *</Label>
                          <Input
                            id="gross_roi"
                            type="number"
                            step="0.01"
                            value={newPayment.gross_roi_amount}
                            onChange={(e) => setNewPayment(prev => ({ ...prev, gross_roi_amount: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="emergency_fund">Emergency Fund Deduction</Label>
                          <Input
                            id="emergency_fund"
                            type="number"
                            step="0.01"
                            value={newPayment.emergency_fund_deduction}
                            onChange={(e) => setNewPayment(prev => ({ ...prev, emergency_fund_deduction: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fd_returns">FD Returns (optional)</Label>
                        <Input
                          id="fd_returns"
                          type="number"
                          step="0.01"
                          value={newPayment.fd_returns}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, fd_returns: e.target.value }))}
                          placeholder="0 or leave blank"
                        />
                        <p className="text-xs text-muted-foreground">Net payout = Payout − Emergency Fund + FD Returns; Final = Net payout − TDS</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tds">TDS Deduction</Label>
                          <Input
                            id="tds"
                            type="number"
                            step="0.01"
                            value={newPayment.tds_deduction}
                            onChange={(e) => setNewPayment(prev => ({ ...prev, tds_deduction: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="net_payable">Net Payable Amount</Label>
                          <Input
                            id="net_payable"
                            type="number"
                            step="0.01"
                            value={newPayment.net_payable_amount}
                            onChange={(e) => setNewPayment(prev => ({ ...prev, net_payable_amount: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="payment_status">Payment Status</Label>
                          <Select
                            value={newPayment.payment_status}
                            onValueChange={(value: 'Pending' | 'Paid' | 'Failed') => setNewPayment(prev => ({ ...prev, payment_status: value }))}
                          >
                            <SelectTrigger id="payment_status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Paid">Paid</SelectItem>
                              <SelectItem value="Failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="payment_date">Payment Date</Label>
                          <Input
                            id="payment_date"
                            type="date"
                            value={newPayment.payment_date}
                            onChange={(e) => setNewPayment(prev => ({ ...prev, payment_date: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Textarea
                          id="remarks"
                          value={newPayment.remarks}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, remarks: e.target.value }))}
                          placeholder="Enter any remarks..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddPaymentDialog(false);
                            setNewPayment({
                              declaration_id: '',
                              gross_roi_amount: '',
                              emergency_fund_deduction: '',
                              fd_returns: '',
                              tds_deduction: '',
                              net_payable_amount: '',
                              payment_status: 'Paid',
                              payment_date: '',
                              remarks: ''
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveNewPayment}
                          disabled={saving === 'new-payment'}
                        >
                          {saving === 'new-payment' ? 'Saving...' : 'Save Payment'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
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
                    <TableHead className="text-center">Quarterly Return %</TableHead>
                    <TableHead className="text-center">Payout</TableHead>
                    <TableHead className="text-center">Emergency Fund Ded.</TableHead>
                    <TableHead className="text-center">FD Returns</TableHead>
                    <TableHead className="text-center">TDS Ded.</TableHead>
                    <TableHead className="text-center">Net Payable Amount</TableHead>
                    <TableHead className="text-center">Receipt</TableHead>
                    <TableHead className="text-center">Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.payment_id}>
                      <TableCell className="font-medium text-center">
                        {payment.quarter_year}{payment.month_names ? ` (${payment.month_names})` : ''}
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
                        {(() => {
                          const editingKey = `${payment.payment_id}-roi_percentage`;
                          const isEditing = isAdmin && editingPayments[editingKey] !== undefined;
                          const roiPercent = investment ? ((payment.gross_roi_amount / investment.investment_amount) * 100) : payment.roi_percentage;
                          const declaredRoi = payment.roi_percentage ?? 0;
                          const showDeclared = declaredRoi > 0 && Math.abs(declaredRoi - roiPercent) > 0.01;
                          if (isEditing) {
                            return (
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingPayments[editingKey]}
                                  onChange={(e) => setEditingPayments(prev => ({ ...prev, [editingKey]: e.target.value }))}
                                  className="w-20 h-8 text-sm"
                                  onBlur={() => {
                                    const newValue = parseFloat(editingPayments[editingKey]);
                                    if (!isNaN(newValue) && newValue >= 0) {
                                      // Calculate gross_roi_amount from percentage
                                      const newGrossRoi = (investment.investment_amount * newValue) / 100;
                                      handleSavePaymentField(payment.payment_id, 'gross_roi_amount', newGrossRoi);
                                    } else {
                                      cancelEditing(payment.payment_id, 'roi_percentage');
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const newValue = parseFloat(editingPayments[editingKey]);
                                      if (!isNaN(newValue) && newValue >= 0) {
                                        const newGrossRoi = (investment.investment_amount * newValue) / 100;
                                        handleSavePaymentField(payment.payment_id, 'gross_roi_amount', newGrossRoi);
                                      }
                                    } else if (e.key === 'Escape') {
                                      cancelEditing(payment.payment_id, 'roi_percentage');
                                    }
                                  }}
                                  autoFocus
                                />
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-col items-center gap-0.5">
                              <Badge 
                                variant="outline" 
                                className="text-purple-600 cursor-pointer hover:bg-muted/50"
                                onClick={() => isAdmin && startEditingPayment(payment.payment_id, 'roi_percentage', roiPercent)}
                                title={isAdmin ? "Click to edit (Payout ÷ Investment)" : "Effective: Payout ÷ Investment"}
                              >
                                {roiPercent.toFixed(2)}%
                              </Badge>
                              {showDeclared && (
                                <span className="text-xs text-muted-foreground" title="Declared pool ROI for this quarter">
                                  Declared: {declaredRoi.toFixed(2)}%
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600 text-center">
                        {(() => {
                          const editingKey = `${payment.payment_id}-gross_roi_amount`;
                          const isEditing = isAdmin && editingPayments[editingKey] !== undefined;
                          
                          if (isEditing) {
                            return (
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingPayments[editingKey]}
                                  onChange={(e) => setEditingPayments(prev => ({ ...prev, [editingKey]: e.target.value }))}
                                  className="w-24 h-8 text-sm"
                                  onBlur={() => {
                                    const newValue = parseNumber(editingPayments[editingKey]);
                                    if (newValue >= 0) {
                                      handleSavePaymentField(payment.payment_id, 'gross_roi_amount', newValue);
                                    } else {
                                      cancelEditing(payment.payment_id, 'gross_roi_amount');
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const newValue = parseNumber(editingPayments[editingKey]);
                                      if (newValue >= 0) {
                                        handleSavePaymentField(payment.payment_id, 'gross_roi_amount', newValue);
                                      }
                                    } else if (e.key === 'Escape') {
                                      cancelEditing(payment.payment_id, 'gross_roi_amount');
                                    }
                                  }}
                                  autoFocus
                                />
                              </div>
                            );
                          }
                          return (
                            <span 
                              className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1"
                              onClick={() => isAdmin && startEditingPayment(payment.payment_id, 'gross_roi_amount', payment.gross_roi_amount)}
                              title={isAdmin ? "Click to edit" : ""}
                            >
                              {formatCurrency(payment.gross_roi_amount)}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="font-semibold text-orange-600 text-center">
                        {(() => {
                          const editingKey = `${payment.payment_id}-emergency_fund_deduction`;
                          const isEditing = isAdmin && editingPayments[editingKey] !== undefined;
                          
                          if (isEditing) {
                            return (
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingPayments[editingKey]}
                                  onChange={(e) => setEditingPayments(prev => ({ ...prev, [editingKey]: e.target.value }))}
                                  className="w-24 h-8 text-sm"
                                  onBlur={() => {
                                    const newValue = parseNumber(editingPayments[editingKey]);
                                    if (newValue >= 0) {
                                      handleSavePaymentField(payment.payment_id, 'emergency_fund_deduction', newValue);
                                    } else {
                                      cancelEditing(payment.payment_id, 'emergency_fund_deduction');
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const newValue = parseNumber(editingPayments[editingKey]);
                                      if (newValue >= 0) {
                                        handleSavePaymentField(payment.payment_id, 'emergency_fund_deduction', newValue);
                                      }
                                    } else if (e.key === 'Escape') {
                                      cancelEditing(payment.payment_id, 'emergency_fund_deduction');
                                    }
                                  }}
                                  autoFocus
                                />
                              </div>
                            );
                          }
                          return (
                            <span 
                              className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1"
                              onClick={() => isAdmin && startEditingPayment(payment.payment_id, 'emergency_fund_deduction', payment.emergency_fund_deduction)}
                              title={isAdmin ? "Click to edit" : ""}
                            >
                              {formatCurrency(payment.emergency_fund_deduction)}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="font-semibold text-center">
                        {(() => {
                          const editingKey = `${payment.payment_id}-fd_returns`;
                          const isEditing = isAdmin && editingPayments[editingKey] !== undefined;
                          const displayVal = payment.fd_returns != null ? formatCurrency(payment.fd_returns) : '–';
                          if (isEditing) {
                            return (
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0"
                                  value={editingPayments[editingKey]}
                                  onChange={(e) => setEditingPayments(prev => ({ ...prev, [editingKey]: e.target.value }))}
                                  className="w-24 h-8 text-sm"
                                  onBlur={() => {
                                    const raw = editingPayments[editingKey];
                                    const newValue = raw === '' ? null : parseNumber(raw);
                                    if (newValue === null || newValue >= 0) {
                                      handleSavePaymentField(payment.payment_id, 'fd_returns', newValue ?? '');
                                    } else {
                                      cancelEditing(payment.payment_id, 'fd_returns');
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const raw = editingPayments[editingKey];
                                      const newValue = raw === '' ? null : parseNumber(raw);
                                      if (newValue === null || newValue >= 0) {
                                        handleSavePaymentField(payment.payment_id, 'fd_returns', newValue ?? '');
                                      }
                                    } else if (e.key === 'Escape') {
                                      cancelEditing(payment.payment_id, 'fd_returns');
                                    }
                                  }}
                                  autoFocus
                                />
                              </div>
                            );
                          }
                          return (
                            <span
                              className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1"
                              onClick={() => isAdmin && startEditingPayment(payment.payment_id, 'fd_returns', payment.fd_returns ?? 0)}
                              title={isAdmin ? 'Click to edit' : ''}
                            >
                              {displayVal}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="font-semibold text-red-600 text-center">
                        {(() => {
                          const editingKey = `${payment.payment_id}-tds_deduction`;
                          const isEditing = isAdmin && editingPayments[editingKey] !== undefined;
                          
                          if (isEditing) {
                            return (
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingPayments[editingKey]}
                                  onChange={(e) => setEditingPayments(prev => ({ ...prev, [editingKey]: e.target.value }))}
                                  className="w-24 h-8 text-sm"
                                  onBlur={() => {
                                    const newValue = parseNumber(editingPayments[editingKey]);
                                    if (newValue >= 0) {
                                      handleSavePaymentField(payment.payment_id, 'tds_deduction', newValue);
                                    } else {
                                      cancelEditing(payment.payment_id, 'tds_deduction');
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const newValue = parseNumber(editingPayments[editingKey]);
                                      if (newValue >= 0) {
                                        handleSavePaymentField(payment.payment_id, 'tds_deduction', newValue);
                                      }
                                    } else if (e.key === 'Escape') {
                                      cancelEditing(payment.payment_id, 'tds_deduction');
                                    }
                                  }}
                                  autoFocus
                                />
                              </div>
                            );
                          }
                          return (
                            <span 
                              className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1"
                              onClick={() => isAdmin && startEditingPayment(payment.payment_id, 'tds_deduction', payment.tds_deduction)}
                              title={isAdmin ? "Click to edit" : ""}
                            >
                              {formatCurrency(payment.tds_deduction)}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600 text-center">
                        {(() => {
                          const editingKey = `${payment.payment_id}-net_payable_amount`;
                          const isEditing = isAdmin && editingPayments[editingKey] !== undefined;
                          
                          if (isEditing) {
                            return (
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingPayments[editingKey]}
                                  onChange={(e) => setEditingPayments(prev => ({ ...prev, [editingKey]: e.target.value }))}
                                  className="w-24 h-8 text-sm"
                                  onBlur={() => {
                                    const newValue = parseNumber(editingPayments[editingKey]);
                                    if (newValue >= 0) {
                                      handleSavePaymentField(payment.payment_id, 'net_payable_amount', newValue);
                                    } else {
                                      cancelEditing(payment.payment_id, 'net_payable_amount');
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const newValue = parseNumber(editingPayments[editingKey]);
                                      if (newValue >= 0) {
                                        handleSavePaymentField(payment.payment_id, 'net_payable_amount', newValue);
                                      }
                                    } else if (e.key === 'Escape') {
                                      cancelEditing(payment.payment_id, 'net_payable_amount');
                                    }
                                  }}
                                  autoFocus
                                />
                              </div>
                            );
                          }
                          return (
                            <span 
                              className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1"
                              onClick={() => isAdmin && startEditingPayment(payment.payment_id, 'net_payable_amount', payment.net_payable_amount)}
                              title={isAdmin ? "Click to edit" : ""}
                            >
                              {formatCurrency(payment.net_payable_amount)}
                            </span>
                          );
                        })()}
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
                      <TableCell className="text-center">
                        {(() => {
                          const isEditing = isAdmin && editingRemarks[payment.payment_id];
                          
                          if (isEditing) {
                            return (
                              <div className="flex items-center justify-center gap-1 min-w-[200px]">
                                <Textarea
                                  value={editingPayments[`${payment.payment_id}-remarks`] || payment.remarks || ''}
                                  onChange={(e) => setEditingPayments(prev => ({ 
                                    ...prev, 
                                    [`${payment.payment_id}-remarks`]: e.target.value 
                                  }))}
                                  className="w-full min-h-[60px] text-sm"
                                  placeholder="Enter remark..."
                                  onBlur={() => {
                                    const remark = editingPayments[`${payment.payment_id}-remarks`] || '';
                                    handleSaveRemark(payment.payment_id, remark);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                      const remark = editingPayments[`${payment.payment_id}-remarks`] || '';
                                      handleSaveRemark(payment.payment_id, remark);
                                    } else if (e.key === 'Escape') {
                                      setEditingRemarks(prev => {
                                        const newState = { ...prev };
                                        delete newState[payment.payment_id];
                                        return newState;
                                      });
                                      setEditingPayments(prev => {
                                        const newState = { ...prev };
                                        delete newState[`${payment.payment_id}-remarks`];
                                        return newState;
                                      });
                                    }
                                  }}
                                  autoFocus
                                />
                              </div>
                            );
                          }
                          return (
                            <div 
                              className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 min-w-[200px] max-w-[300px]"
                              onClick={() => {
                                if (isAdmin) {
                                  setEditingRemarks(prev => ({ ...prev, [payment.payment_id]: true }));
                                  setEditingPayments(prev => ({ 
                                    ...prev, 
                                    [`${payment.payment_id}-remarks`]: payment.remarks || '' 
                                  }));
                                }
                              }}
                              title={isAdmin ? "Click to edit" : ""}
                            >
                              <span className="text-sm text-muted-foreground">
                                {payment.remarks || '-'}
                              </span>
                            </div>
                          );
                        })()}
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

