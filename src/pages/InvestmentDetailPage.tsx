import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Building, User, Eye, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input'; import { usePageMetadata } from '@/hooks/use-page-metadata';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { trackPageViewToDB } from '@/utils/analytics';
import { DatePicker } from '@/components/ui/date-picker';
import { formatDate } from '@/utils/crm-operations';

interface ExitRecord {
  amount: number;
  date: string;
}

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
  exited_amount?: number; // Keep for backward compatibility
  exited_amounts?: ExitRecord[]; // New JSON array format
}

interface QuarterlyPayment {
  payment_id: string;
  investment_id: string;
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
  month_names: string | null;
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    investment_amount: 0,
    exited_amounts: [] as ExitRecord[]
  });
  const [newExitAmount, setNewExitAmount] = useState<string>('');
  const [newExitDate, setNewExitDate] = useState<Date | undefined>(undefined);

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

      // Fetch investment data - start with minimal query to avoid column errors
      let investmentData: any;
      let investmentError: any;

      // First, try with just the basic fields and relations
      const basicQuery = (supabase as any)
        .from('investor_investments')
        .select(`
          investment_id,
          investor_id,
          purchase_id,
          investment_amount,
          investment_percentage,
          created_at,
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

      const basicResult = await basicQuery;
      investmentData = basicResult.data;
      investmentError = basicResult.error;

      if (investmentError) {
        throw investmentError;
      }

      if (!investmentData) {
        throw new Error('Investment not found');
      }

      // Now try to get exited_amounts separately if it exists (don't fetch exited_amount - it doesn't exist)
      try {
        const exitedQuery = await (supabase as any)
          .from('investor_investments')
          .select('exited_amounts')
          .eq('investment_id', investmentId)
          .single();
        
        if (exitedQuery.data && exitedQuery.data.exited_amounts !== undefined) {
          investmentData.exited_amounts = exitedQuery.data.exited_amounts;
        } else {
          investmentData.exited_amounts = null;
        }
        // Set exited_amount to 0 for backward compatibility (column doesn't exist)
        investmentData.exited_amount = 0;
      } catch (e: any) {
        // Column doesn't exist - that's okay, use defaults
        console.log('exited_amounts column not found, using defaults');
        investmentData.exited_amount = 0;
        investmentData.exited_amounts = null;
      }

      if (!investmentData) {
        throw new Error('Investment not found');
      }

      // Parse exited_amounts JSON if it exists, otherwise use empty array
      let exitedAmounts: ExitRecord[] = [];
      if (investmentData.exited_amounts !== undefined && investmentData.exited_amounts !== null) {
        try {
          if (Array.isArray(investmentData.exited_amounts)) {
            exitedAmounts = investmentData.exited_amounts;
          } else if (typeof investmentData.exited_amounts === 'string') {
            exitedAmounts = JSON.parse(investmentData.exited_amounts);
          } else if (typeof investmentData.exited_amounts === 'object') {
            // Already parsed JSONB
            exitedAmounts = investmentData.exited_amounts;
          }
        } catch (e) {
          console.error('Error parsing exited_amounts:', e);
          exitedAmounts = [];
        }
      }

      // Transform the data to flatten the related information
      const transformedData = {
        ...investmentData,
        investor_name: investmentData.investors?.investor_name || 'Unknown',
        pool_name: investmentData.company_pools?.pool_name || 'Unknown Pool',
        total_cost: investmentData.company_pools?.total_cost || 0,
        status: investmentData.company_pools?.status || 'Unknown',
        exited_amount: investmentData.exited_amount || 0, // Keep for backward compatibility
        exited_amounts: exitedAmounts
      };

      console.log('Investment data loaded:', transformedData);
      console.log('Exited amounts:', exitedAmounts);
      console.log('Total exited:', exitedAmounts.reduce((sum, exit) => sum + (exit?.amount || 0), 0));
      setInvestment(transformedData);
      
      // Calculate original investment amount (current + total exits)
      const totalExited = exitedAmounts.reduce((sum, exit) => sum + (exit?.amount || 0), 0);
      const originalAmount = transformedData.investment_amount + totalExited;
      
      setEditFormData({
        investment_amount: originalAmount, // Store original amount before exits
        exited_amounts: exitedAmounts
      });
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

  const handleAddExit = () => {
    if (!newExitAmount || parseFloat(newExitAmount) <= 0) {
      toast.error('Please enter a valid exit amount');
      return;
    }
    if (!newExitDate) {
      toast.error('Please select an exit date');
      return;
    }

    const totalExited = editFormData.exited_amounts.reduce((sum, exit) => sum + exit.amount, 0);
    const newExit = parseFloat(newExitAmount);
    // Use original investment amount (before exits) for validation
    const originalInvestment = editFormData.investment_amount;
    
    if (totalExited + newExit > originalInvestment) {
      toast.error(`Total exited amount (${formatCurrency(totalExited + newExit)}) cannot exceed original investment amount (${formatCurrency(originalInvestment)})`);
      return;
    }

    const newExitRecord: ExitRecord = {
      amount: newExit,
      date: newExitDate.toISOString().split('T')[0]
    };

    setEditFormData({
      ...editFormData,
      exited_amounts: [...editFormData.exited_amounts, newExitRecord]
    });

    setNewExitAmount('');
    setNewExitDate(undefined);
    toast.success('Exit added. Click "Save Changes" to update.');
  };

  const handleRemoveExit = (index: number) => {
    setEditFormData({
      ...editFormData,
      exited_amounts: editFormData.exited_amounts.filter((_, i) => i !== index)
    });
  };

  const handleUpdateInvestment = async () => {
    try {
      if (!investment) return;

      setLoading(true);
      
      // If there's a new exit amount entered, add it to the exits array
      let updatedExits = [...editFormData.exited_amounts];
      if (newExitAmount && parseFloat(newExitAmount) > 0) {
        if (!newExitDate) {
          toast.error('Please select an exit date');
          setLoading(false);
          return;
        }

        const newExit: ExitRecord = {
          amount: parseFloat(newExitAmount),
          date: newExitDate.toISOString().split('T')[0]
        };

        // Validate that new exit doesn't exceed investment
        const totalExited = updatedExits.reduce((sum, exit) => sum + exit.amount, 0);
        if (totalExited + newExit.amount > editFormData.investment_amount) {
          toast.error(`Total exited amount (${formatCurrency(totalExited + newExit.amount)}) cannot exceed original investment amount (${formatCurrency(editFormData.investment_amount)})`);
          setLoading(false);
          return;
        }

        updatedExits.push(newExit);
      }
      
      // Calculate total exited amount
      const totalExitedAmount = updatedExits.reduce((sum, exit) => sum + exit.amount, 0);
      
      // Validate that total exits don't exceed original investment
      if (totalExitedAmount > editFormData.investment_amount) {
        toast.error('Total exited amount cannot exceed original investment amount');
        setLoading(false);
        return;
      }

      // Call RPC function to update exits (if available)
      let updateSuccess = false;
      
      try {
        const { data, error } = await (supabase as any)
          .rpc('update_investment_exits', {
            p_investment_id: investment.investment_id,
            p_exited_amounts: updatedExits,
            p_original_investment_amount: editFormData.investment_amount
          });

        if (error) {
          // If RPC function or its dependencies don't exist, fall back to direct update
          if (error.code === '42883' || 
              error.message?.includes('function') || 
              error.message?.includes('does not exist') ||
              error.message?.includes('get_total_exited_amount')) {
            console.warn('RPC function or dependencies not found, using direct update:', error.message);
            updateSuccess = false; // Will use fallback
          } else {
            throw error;
          }
        } else if (data && !data.success) {
          throw new Error(data.error || 'Failed to update investment');
        } else {
          updateSuccess = true;
        }
      } catch (rpcError: any) {
        // If RPC fails for any reason (including missing dependencies), use direct update
        if (rpcError.code === '42883' || 
            rpcError.message?.includes('function') || 
            rpcError.message?.includes('does not exist') ||
            rpcError.message?.includes('get_total_exited_amount')) {
          console.warn('RPC function not available, using direct update');
          updateSuccess = false;
        } else {
          throw rpcError;
        }
      }

      // Fallback to direct update if RPC is not available
      if (!updateSuccess) {
        const updatedInvestmentAmount = editFormData.investment_amount - totalExitedAmount;
        
        if (updatedInvestmentAmount < 0) {
          throw new Error('Total exited amount cannot exceed investment amount');
        }

        // Only update columns that exist - exited_amount column doesn't exist
        const updateData: any = {
          investment_amount: updatedInvestmentAmount,
          exited_amounts: updatedExits
        };

        const { data: updateDataResult, error: updateError } = await (supabase as any)
          .from('investor_investments')
          .update(updateData)
          .eq('investment_id', investment.investment_id)
          .select();

        if (updateError) {
          console.error('Direct update error:', updateError);
          // If it's a 404, it might be RLS or permissions issue
          if (updateError.status === 404 || updateError.code === 'PGRST301') {
            throw new Error('Permission denied or investment not found. Please check your database permissions.');
          }
          throw updateError;
        }
      }

      // Refresh investment data
      await fetchInvestmentDetails();

      toast.success('Investment updated successfully');
      setIsEditDialogOpen(false);
      setNewExitAmount('');
      setNewExitDate(new Date()); // Reset to today's date
    } catch (error: any) {
      console.error('Error updating investment:', error);
      toast.error('Failed to update investment', {
        description: error.message || 'Unknown error occurred'
      });
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

  // Calculate total exited amount from JSON array
  const getTotalExitedAmount = (): number => {
    if (!investment) return 0;
    
    // Check if exited_amounts exists and is valid
    if (investment.exited_amounts) {
      try {
        // Handle different formats
        let exits: ExitRecord[] = [];
        if (Array.isArray(investment.exited_amounts)) {
          exits = investment.exited_amounts;
        } else if (typeof investment.exited_amounts === 'string') {
          exits = JSON.parse(investment.exited_amounts);
        } else if (typeof investment.exited_amounts === 'object') {
          exits = investment.exited_amounts;
        }
        
        if (exits && exits.length > 0) {
          return exits.reduce((sum, exit) => sum + (exit?.amount || 0), 0);
        }
      } catch (e) {
        console.error('Error calculating total exited amount:', e);
      }
    }
    
    // Fallback to old exited_amount for backward compatibility
    return investment.exited_amount || 0;
  };

  // Calculate active investment amount (Current investment_amount already has exits deducted)
  const activeInvestmentAmount = investment ? investment.investment_amount : 0;
  
  // Get original investment amount (before exits)
  const originalInvestmentAmount = investment ? investment.investment_amount + getTotalExitedAmount() : 0;

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
              onClick={() => {
                if (investment?.purchase_id) {
                  navigate(`/pools/${investment.purchase_id}`);
                } else {
                  navigate('/');
                }
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />

            </Button>
            <div>
              <h1 className="text-3xl font-bold">Investment Details</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Investment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(activeInvestmentAmount)}</div>

              {getTotalExitedAmount() > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Initial: {formatCurrency(originalInvestmentAmount)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="relative">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Exited Amount</CardTitle>
              {isAdmin && (
                <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                  setIsEditDialogOpen(open);
                  if (open && investment) {
                    // Reset form when opening dialog
                    const totalExited = (investment.exited_amounts || []).reduce((sum, exit) => sum + exit.amount, 0);
                    const originalAmount = investment.investment_amount + totalExited;
                    setEditFormData({
                      investment_amount: originalAmount,
                      exited_amounts: investment.exited_amounts || []
                    });
                    setNewExitAmount('');
                    setNewExitDate(new Date()); // Set to today's date by default
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Investment Details</DialogTitle>
                      <DialogDescription>
                        Update the investment amount and add exit records with dates.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="investment_amount" className="text-right">
                          Investment Amount
                        </Label>
                        <Input
                          id="investment_amount"
                          type="number"
                          value={editFormData.investment_amount || ''}
                          readOnly
                          disabled
                          className="col-span-3 bg-muted cursor-not-allowed"
                        />
                      </div>
                      
                      {/* Add New Exit Section */}
                      <div className="col-span-4 border-t pt-4">
                        <Label className="text-base font-semibold mb-2 block">Add New Exit</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="new_exit_amount">Exit Amount</Label>
                            <Input
                              id="new_exit_amount"
                              type="number"
                              value={newExitAmount}
                              onChange={(e) => setNewExitAmount(e.target.value)}
                              placeholder="Enter amount"
                            />
                          </div>
                          <div>
                            <Label htmlFor="new_exit_date">Exit Date</Label>
                            <DatePicker
                              date={newExitDate}
                              setDate={setNewExitDate}
                              placeholderText="Select date"
                              className="w-full"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Enter exit amount and date, then click "Save Changes" to add the exit.
                        </p>
                      </div>

                      {/* Existing Exits List */}
                      {editFormData.exited_amounts.length > 0 && (
                        <div className="col-span-4 border-t pt-4">
                          <Label className="text-base font-semibold mb-2 block">Exit History</Label>
                          <div className="space-y-2">
                            {editFormData.exited_amounts.map((exit, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <span className="font-semibold">{formatCurrency(exit.amount)}</span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    on {formatDate(exit.date)}
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveExit(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 p-2 bg-muted rounded">
                            <span className="text-sm font-semibold">
                              Total Exited: {formatCurrency(editFormData.exited_amounts.reduce((sum, exit) => sum + exit.amount, 0))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleUpdateInvestment}>Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {getTotalExitedAmount() > 0 ? formatCurrency(getTotalExitedAmount()) : '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                Withdrawn capital
              </p>
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
                    <TableHead className="text-center">TDS Ded.</TableHead>
                    <TableHead className="text-center">Net Payable Amount</TableHead>
                    <TableHead className="text-center">Receipt</TableHead>
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
                        <Badge variant="outline" className="text-purple-600">
                          {investment ? ((payment.gross_roi_amount / investment.investment_amount) * 100).toFixed(2) : payment.roi_percentage.toFixed(2)}%
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

        {/* Exit History Table */}
        {getTotalExitedAmount() > 0 && investment.exited_amounts && investment.exited_amounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Exit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Exit Date</TableHead>
                    <TableHead className="text-center">Exit Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investment.exited_amounts
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((exit, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-center">
                          {formatDate(exit.date)}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-orange-600">
                          {formatCurrency(exit.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  <TableRow className="bg-muted">
                    <TableCell className="text-center font-semibold">Total</TableCell>
                    <TableCell className="text-center font-semibold text-orange-600">
                      {formatCurrency(getTotalExitedAmount())}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default InvestmentDetailPage;

