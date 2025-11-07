import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Plus, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { usePageMetadata } from '@/hooks/use-page-metadata';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { formatDate } from '@/utils/crm-operations';

interface QuarterlyROI {
  declaration_id: string;
  quarter_year: string;
  roi_percentage: number;
  declaration_date: string;
  purchase_id: string;
  is_finalized: boolean;
  created_at: string;
  updated_at: string;
  pool_name?: string;
  description?: string;
}

interface VehiclePurchase {
  purchase_id: string;
  pool_name: string;
  description: string;
  status: 'Active' | 'Inactive' | 'Sold';
  emergency_fund_remaining?: number;
}

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
}

const QuarterlyRoiPage = () => {
  const [roiDeclarations, setRoiDeclarations] = useState<QuarterlyROI[]>([]);
  const [vehicles, setVehicles] = useState<VehiclePurchase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState<QuarterlyROI | null>(null);
  const [selectedPoolFilter, setSelectedPoolFilter] = useState<string>('all');
  const [paymentGeneratedStates, setPaymentGeneratedStates] = useState<{[key: string]: boolean}>({});
  const [formData, setFormData] = useState({
    quarter_year: '',
    roi_percentage: '',
    declaration_date: '',
    purchase_id: '',
    is_finalized: false,
    deduct_emergency_fund: false,
    emergency_fund_amount: ''
  });
  const [selectedPoolEmergencyFund, setSelectedPoolEmergencyFund] = useState<number | null>(null);
  const [declarationDate, setDeclarationDate] = useState<Date | undefined>(undefined);

  usePageMetadata({
    defaultTitle: "Quarterly ROI - Investor Dashboard",
    defaultDescription: "Manage quarterly ROI declarations and payments"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch ROI declarations with pool information
      const { data: roiData, error: roiError } = await (supabase as any)
        .from('quarterly_roi_declarations')
        .select(`
          *,
          company_pools!inner(pool_name, description)
        `)
        .order('declaration_date', { ascending: false });

      if (roiError) throw roiError;

      // Fetch company pools with emergency fund data
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('company_pools')
        .select('purchase_id, pool_name, description, status, emergency_fund_remaining')
        .eq('status', 'Active');

      if (vehicleError) throw vehicleError;

      // Fetch payments with investor names
      const { data: paymentData, error: paymentError } = await (supabase as any)
        .from('investor_quarterly_payments')
        .select(`
          *,
          investors!inner(investor_name)
        `);

      if (paymentError) throw paymentError;

      // Transform ROI data to include pool information
      const transformedRoiData = roiData?.map((roi: any) => ({
        ...roi,
        pool_name: roi.company_pools?.pool_name || 'Unknown',
        description: roi.company_pools?.description || 'N/A'
      })) || [];

      setRoiDeclarations(transformedRoiData);
      setVehicles(vehicleData || []);
      setPayments(paymentData?.map((p: any) => ({
        ...p,
        investor_name: p.investors?.investor_name || 'Unknown'
      })) || []);

      // Check which declarations already have payments generated
      const paymentStates: {[key: string]: boolean} = {};
      transformedRoiData.forEach((declaration: any) => {
        const hasPayments = paymentData?.some((payment: any) => 
          payment.declaration_id === declaration.declaration_id
        );
        paymentStates[declaration.declaration_id] = hasPayments || false;
      });
      setPaymentGeneratedStates(paymentStates);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate emergency fund amount if deduction is enabled
    if (formData.deduct_emergency_fund) {
      const amount = parseFloat(formData.emergency_fund_amount);
      if (!amount || amount <= 0) {
        toast.error('Please enter a valid emergency fund amount');
        return;
      }
      if (selectedPoolEmergencyFund !== null && amount > selectedPoolEmergencyFund) {
        toast.error(`Emergency fund amount cannot exceed remaining amount: ${formatCurrency(selectedPoolEmergencyFund)}`);
        return;
      }
    }
    
    try {
      // Format date as YYYY-MM-DD for database
      const formattedDate = declarationDate ? declarationDate.toISOString().split('T')[0] : '';
      
      if (!formattedDate) {
        toast.error('Please select a declaration date');
        return;
      }

      const roiData = {
        quarter_year: formData.quarter_year,
        roi_percentage: parseFloat(formData.roi_percentage),
        declaration_date: formattedDate,
        purchase_id: formData.purchase_id,
        is_finalized: formData.is_finalized,
        emergency_fund_deduction_amount: formData.deduct_emergency_fund 
          ? parseFloat(formData.emergency_fund_amount) 
          : null
      };

      const { data, error } = await (supabase as any)
        .from('quarterly_roi_declarations')
        .insert([roiData])
        .select()
        .single();

      if (error) throw error;

      // If finalized, generate payments
      if (formData.is_finalized) {
        console.log('Generating payments for declaration:', data.declaration_id);
        
        const { data: paymentResult, error: paymentError } = await (supabase as any).rpc('generate_quarterly_payments', {
          p_declaration_id: data.declaration_id
        });

        console.log('Payment generation result:', paymentResult, 'Error:', paymentError);

        if (paymentError) {
          console.error('Error generating payments:', paymentError);
          toast.error(`Failed to generate payments: ${paymentError.message}`);
        } else {
          console.log(`Successfully generated ${paymentResult} payment records`);
          toast.success(`ROI declared and ${paymentResult} payments generated successfully`);
          
          // Update the payment generated state for this declaration
          setPaymentGeneratedStates(prev => ({
            ...prev,
            [data.declaration_id]: true
          }));
        }
      } else {
        toast.success('ROI declaration saved as draft');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving ROI declaration:', error);
      toast.error('Failed to save ROI declaration');
    }
  };

  const resetForm = () => {
    setFormData({
      quarter_year: '',
      roi_percentage: '',
      declaration_date: '',
      purchase_id: '',
      is_finalized: false,
      deduct_emergency_fund: false,
      emergency_fund_amount: ''
    });
    setSelectedPoolEmergencyFund(null);
    setDeclarationDate(undefined);
  };

  // Fetch emergency fund when pool is selected
  const handlePoolChange = async (purchaseId: string) => {
    setFormData({ ...formData, purchase_id: purchaseId, deduct_emergency_fund: false, emergency_fund_amount: '' });
    
    if (purchaseId) {
      try {
        const { data: poolData, error } = await (supabase as any)
          .from('company_pools')
          .select('emergency_fund_remaining')
          .eq('purchase_id', purchaseId)
          .single();
        
        if (!error && poolData) {
          setSelectedPoolEmergencyFund(poolData.emergency_fund_remaining || 0);
        } else {
          setSelectedPoolEmergencyFund(null);
        }
      } catch (error) {
        console.error('Error fetching emergency fund:', error);
        setSelectedPoolEmergencyFund(null);
      }
    } else {
      setSelectedPoolEmergencyFund(null);
    }
  };


  const handleViewPayments = (declaration: QuarterlyROI) => {
    setSelectedDeclaration(declaration);
    setIsPaymentDialogOpen(true);
  };

  const handleGeneratePayments = async (declaration: QuarterlyROI) => {
    try {
      console.log('Generating payments for declaration:', declaration.declaration_id);
      
      // If the declaration is not yet finalized, finalize it first
      if (!declaration.is_finalized) {
        const { error: finalizeError } = await (supabase as any)
          .from('quarterly_roi_declarations')
          .update({ is_finalized: true })
          .eq('declaration_id', declaration.declaration_id);

        if (finalizeError) throw finalizeError;
        console.log('Declaration finalized before generating payments');
      }
      
      const { data: paymentResult, error: paymentError } = await (supabase as any).rpc('generate_quarterly_payments', {
        p_declaration_id: declaration.declaration_id
      });

      console.log('Payment generation result:', paymentResult, 'Error:', paymentError);

      if (paymentError) {
        console.error('Error generating payments:', paymentError);
        toast.error(`Failed to generate payments: ${paymentError.message}`);
      } else {
        console.log(`Successfully generated ${paymentResult} payment records`);
        toast.success(`${paymentResult} payments generated successfully`);
        
        // Update the payment generated state for this declaration
        setPaymentGeneratedStates(prev => ({
          ...prev,
          [declaration.declaration_id]: true
        }));
        
        fetchData(); // Refresh the data
      }
    } catch (error) {
      console.error('Error generating payments:', error);
      toast.error('Failed to generate payments');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (declaration: QuarterlyROI) => {
    if (paymentGeneratedStates[declaration.declaration_id]) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Completed</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      Paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      Failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return <Badge className={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const getPaymentIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  // Filter ROI declarations based on selected pool
  const filteredDeclarations = selectedPoolFilter === 'all' 
    ? roiDeclarations 
    : roiDeclarations.filter(declaration => declaration.purchase_id === selectedPoolFilter);

  // Get unique pools for filter dropdown
  const uniquePools = vehicles.filter((vehicle, index, self) => 
    index === self.findIndex(v => v.purchase_id === vehicle.purchase_id)
  );

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading ROI data...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Quarterly ROI Management</h1>
            
        </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Declare ROI
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Declare Quarterly ROI</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
              <div>
                    <Label htmlFor="quarter_year">Quarter & Year</Label>
                <Input
                      id="quarter_year"
                      value={formData.quarter_year}
                      onChange={(e) => setFormData({ ...formData, quarter_year: e.target.value })}
                      placeholder="Q1-2024"
                      required
                />
              </div>
              <div>
                    <Label htmlFor="roi_percentage">ROI Percentage</Label>
                <Input
                      id="roi_percentage"
                  type="number"
                      step="0.01"
                      value={formData.roi_percentage}
                      onChange={(e) => setFormData({ ...formData, roi_percentage: e.target.value })}
                      placeholder="6.00"
                      required
                />
              </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
              <div>
                    <Label htmlFor="declaration_date">Declaration Date</Label>
                <DatePicker
                      date={declarationDate}
                      setDate={setDeclarationDate}
                      placeholderText="Select declaration date"
                      className="w-full"
                />
              </div>
                  <div>
                    <Label htmlFor="purchase_id">Vehicle Purchase</Label>
                    <Select
                      value={formData.purchase_id}
                      onValueChange={handlePoolChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle purchase" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.purchase_id} value={vehicle.purchase_id}>
                            {vehicle.pool_name} - {vehicle.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Emergency Fund Deduction Section */}
                {formData.purchase_id && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="deduct_emergency_fund"
                        checked={formData.deduct_emergency_fund}
                        onChange={(e) => setFormData({ ...formData, deduct_emergency_fund: e.target.checked, emergency_fund_amount: e.target.checked ? formData.emergency_fund_amount : '' })}
                        className="rounded"
                      />
                      <Label htmlFor="deduct_emergency_fund" className="font-semibold">
                        Deduct Emergency Fund
                      </Label>
                    </div>
                    
                    {formData.deduct_emergency_fund && (
                      <div className="space-y-2 pl-6">
                        {selectedPoolEmergencyFund !== null && (
                          <p className="text-sm text-muted-foreground">
                            Remaining Emergency Fund: <span className="font-semibold text-primary">{formatCurrency(selectedPoolEmergencyFund)}</span>
                          </p>
                        )}
                        <div>
                          <Label htmlFor="emergency_fund_amount">Emergency Fund Amount (₹)</Label>
                          <Input
                            id="emergency_fund_amount"
                            type="number"
                            step="0.01"
                            min="0"
                            max={selectedPoolEmergencyFund || undefined}
                            value={formData.emergency_fund_amount}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (selectedPoolEmergencyFund !== null && value) {
                                const numValue = parseFloat(value);
                                if (numValue > selectedPoolEmergencyFund) {
                                  toast.error(`Amount cannot exceed remaining: ${formatCurrency(selectedPoolEmergencyFund)}`);
                                  return;
                                }
                              }
                              setFormData({ ...formData, emergency_fund_amount: value });
                            }}
                            placeholder="Enter amount to deduct"
                            required={formData.deduct_emergency_fund}
                          />
                          {formData.emergency_fund_amount && selectedPoolEmergencyFund !== null && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Will deduct {formatCurrency(parseFloat(formData.emergency_fund_amount) || 0)} from remaining {formatCurrency(selectedPoolEmergencyFund)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

               

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {formData.is_finalized ? 'Declare & Generate Payments' : 'Save'}
                </Button>
              </div>
              </form>
            </DialogContent>
          </Dialog>
            </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  ROI Declarations ({filteredDeclarations.length})
                </CardTitle>
              </div>
              <div className="flex items-center space-x-4">
                <Label htmlFor="pool-filter" className="text-sm font-medium">
                  Filter by Pool:
                </Label>
                <Select value={selectedPoolFilter} onValueChange={setSelectedPoolFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a pool" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pools</SelectItem>
                    {uniquePools.map((pool) => (
                      <SelectItem key={pool.purchase_id} value={pool.purchase_id}>
                        {pool.pool_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredDeclarations.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {selectedPoolFilter === 'all' ? 'No ROI declarations found' : 'No ROI declarations for selected pool'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {selectedPoolFilter === 'all' 
                    ? 'Get started by declaring your first quarterly ROI.'
                    : 'Try selecting a different pool or declare ROI for this pool.'
                  }
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Declare ROI
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                      <TableHead>Quarter</TableHead>
                      <TableHead>ROI %</TableHead>
                      <TableHead>Declaration Date</TableHead>
                      <TableHead>Vehicle Purchase</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {filteredDeclarations.map((declaration) => {
                      const vehicle = vehicles.find(v => v.purchase_id === declaration.purchase_id);
                      return (
                        <TableRow key={declaration.declaration_id}>
                    <TableCell className="font-medium">
                            {declaration.quarter_year}
                    </TableCell>
                    <TableCell>
                            <span className="font-medium text-primary">
                              {declaration.roi_percentage}%
                        </span>
                          </TableCell>
                          <TableCell>
                            {formatDate(declaration.declaration_date)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{declaration.pool_name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">
                                {declaration.description || 'N/A'}
                              </div>
                      </div>
                    </TableCell>
                          <TableCell>
                            {getStatusBadge(declaration)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {paymentGeneratedStates[declaration.declaration_id] ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  Payment Generated
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGeneratePayments(declaration)}
                                >
                                  Generate Payments
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewPayments(declaration)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                    </TableCell>
                  </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Details Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Payment Details - {selectedDeclaration?.quarter_year}
              </DialogTitle>
              <DialogDescription>
                ROI: {selectedDeclaration?.roi_percentage}% | 
                Declaration Date: {selectedDeclaration && formatDate(selectedDeclaration.declaration_date)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedDeclaration && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor</TableHead>
                      <TableHead>Gross ROI</TableHead>
                      <TableHead>Emergency Fund</TableHead>
                      <TableHead>TDS</TableHead>
                      <TableHead>Net Payable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments
                      .filter(p => p.declaration_id === selectedDeclaration.declaration_id)
                      .map((payment) => (
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
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default QuarterlyRoiPage;
