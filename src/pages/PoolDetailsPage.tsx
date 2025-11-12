import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Edit, Building, Car, DollarSign, Shield, Users, TrendingUp, Calendar, Eye, Plus, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { usePageMetadata } from '@/hooks/use-page-metadata';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { DatePicker } from '@/components/ui/date-picker';
import { formatDate } from '@/utils/crm-operations';

interface CompanyPool {
  purchase_id: string;
  pool_name: string;
  description: string;
  owner_names: string[];
  vehicle_numbers: string[];
  purchase_date: string;
  total_cost: number;
  bank_loan_amount: number;
  investor_amount: number;
  monthly_emi: number;
  emergency_fund_collected: number;
  emergency_fund_company_share: number;
  emergency_fund_investor_share: number;
  emergency_fund_remaining: number;
  status: 'Active' | 'Inactive' | 'Sold';
  created_at: string;
  updated_at: string;
}

interface InvestorInvestment {
  investment_id: string;
  investor_id: string;
  purchase_id: string;
  investment_amount: number;
  investment_percentage: number;
  created_at: string;
  investor_name: string;
  associate_name: string | null;
  email: string;
  phone: string;
}

interface QuarterlyROI {
  declaration_id: string;
  quarter_year: string;
  roi_percentage: number;
  declaration_date: string;
  purchase_id: string;
  is_finalized: boolean;
  created_at: string;
  updated_at: string;
  emergency_fund_deduction_amount?: number | null;
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

const PoolDetailsPage = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [pool, setPool] = useState<CompanyPool | null>(null);
  const [investorInvestments, setInvestorInvestments] = useState<InvestorInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [investmentsLoading, setInvestmentsLoading] = useState(true);
  const [investorSearchFilter, setInvestorSearchFilter] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    pool_name: '',
    description: '',
    owner_names: [] as string[],
    vehicle_numbers: [] as string[],
    total_cost: '',
    bank_loan_amount: '',
    investor_amount: '',
    monthly_emi: '',
    emergency_fund_collected: '',
    emergency_fund_company_share: '',
    emergency_fund_investor_share: '',
    emergency_fund_remaining: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Sold'
  });

  // ROI Declaration Form State
  const [isRoiDialogOpen, setIsRoiDialogOpen] = useState(false);
  const [roiFormData, setRoiFormData] = useState({
    quarter_year: '',
    roi_percentage: '',
    deduct_emergency_fund: false,
    emergency_fund_amount: '',
    is_finalized: false
  });
  const [declarationDate, setDeclarationDate] = useState<Date | undefined>(undefined);
  const [selectedPoolEmergencyFund, setSelectedPoolEmergencyFund] = useState<number | null>(null);
  
  // ROI Declarations List State
  const [roiDeclarations, setRoiDeclarations] = useState<QuarterlyROI[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [roiLoading, setRoiLoading] = useState(true);
  const [paymentGeneratedStates, setPaymentGeneratedStates] = useState<{[key: string]: boolean}>({});

  usePageMetadata({
    defaultTitle: pool ? `${pool.pool_name} - Pool Details` : "Pool Details - Investor Management",
    defaultDescription: "View detailed information about company pool and investor investments"
  });

  useEffect(() => {
    if (poolId) {
      fetchPoolDetails();
      fetchInvestorInvestments();
      fetchRoiDeclarations();
    }
  }, [poolId]);

  // Fetch emergency fund remaining when pool is loaded
  useEffect(() => {
    if (pool?.purchase_id) {
      setSelectedPoolEmergencyFund(pool.emergency_fund_remaining || 0);
    }
  }, [pool?.purchase_id, pool?.emergency_fund_remaining]);

  const fetchPoolDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch pool data including emergency_fund_remaining (same as QuarterlyRoiPage)
      const { data: poolData, error: poolError } = await (supabase as any)
        .from('company_pools')
        .select('*')
        .eq('purchase_id', poolId)
        .single();

      if (poolError) throw poolError;

      // Ensure emergency_fund_remaining is properly set (default to 0 if null)
      if (poolData) {
        poolData.emergency_fund_remaining = poolData.emergency_fund_remaining ?? 0;
      }

      setPool(poolData);
    } catch (error) {
      console.error('Error fetching pool details:', error);
      toast.error('Failed to fetch pool details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestorInvestments = async () => {
    try {
      setInvestmentsLoading(true);
      
      let query = (supabase as any)
        .from('investor_investments')
        .select(`
          *,
          investors:investor_id (
            investor_name,
            associate_name,
            email,
            phone
          )
        `)
        .eq('purchase_id', poolId);

      // Filter by user_id for investors (RLS will also enforce this at DB level)
      if (!isAdmin && user) {
        query = query.eq('user_id', user.id);
      }

      const { data: investmentsData, error: investmentsError } = await query
        .order('created_at', { ascending: false });

      if (investmentsError) throw investmentsError;

      // Transform the data to flatten the investor information
      const transformedData = investmentsData?.map((investment: any) => ({
        ...investment,
        investor_name: investment.investors?.investor_name || 'Unknown',
        associate_name: investment.investors?.associate_name || null,
        email: investment.investors?.email || '',
        phone: investment.investors?.phone || ''
      })) || [];

      setInvestorInvestments(transformedData);
    } catch (error) {
      console.error('Error fetching investor investments:', error);
      toast.error('Failed to fetch investor investments');
    } finally {
      setInvestmentsLoading(false);
    }
  };

  const fetchRoiDeclarations = async () => {
    try {
      setRoiLoading(true);
      
      if (!poolId) return;

      // Fetch ROI declarations for this specific pool
      const { data: roiData, error: roiError } = await (supabase as any)
        .from('quarterly_roi_declarations')
        .select('*')
        .eq('purchase_id', poolId);

      if (roiError) throw roiError;

      // Sort by quarter/year (latest first)
      const sortedRoiData = (roiData || []).sort((a: QuarterlyROI, b: QuarterlyROI) => {
        const parseQuarterYear = (qy: string) => {
          const [quarter, year] = qy.split('-');
          const quarterOrder: { [key: string]: number } = { 'Q4': 4, 'Q3': 3, 'Q2': 2, 'Q1': 1 };
          return {
            year: parseInt(year) || 0,
            quarter: quarterOrder[quarter] || 0
          };
        };
        
        const aParsed = parseQuarterYear(a.quarter_year);
        const bParsed = parseQuarterYear(b.quarter_year);
        
        // First sort by year (descending - latest first)
        if (bParsed.year !== aParsed.year) {
          return bParsed.year - aParsed.year;
        }
        // Then sort by quarter (Q4 > Q3 > Q2 > Q1)
        return bParsed.quarter - aParsed.quarter;
      });

      setRoiDeclarations(sortedRoiData);

      // Fetch payments with investor names
      const { data: paymentData, error: paymentError } = await (supabase as any)
        .from('investor_quarterly_payments')
        .select(`
          *,
          investors!inner(investor_name)
        `);

      if (paymentError) throw paymentError;

      setPayments(paymentData?.map((p: any) => ({
        ...p,
        investor_name: p.investors?.investor_name || 'Unknown'
      })) || []);

      // Check which declarations already have payments generated
      const paymentStates: {[key: string]: boolean} = {};
      (roiData || []).forEach((declaration: any) => {
        const hasPayments = paymentData?.some((payment: any) => 
          payment.declaration_id === declaration.declaration_id
        );
        paymentStates[declaration.declaration_id] = hasPayments || false;
      });
      setPaymentGeneratedStates(paymentStates);
    } catch (error) {
      console.error('Error fetching ROI declarations:', error);
      toast.error('Failed to fetch ROI declarations');
    } finally {
      setRoiLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return '₹' + new Intl.NumberFormat('en-IN', {
      style: 'decimal',
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

  const handleEdit = () => {
    if (!pool) return;
    
    // Populate form with current pool data
    setEditFormData({
      pool_name: pool.pool_name,
      description: pool.description,
      owner_names: pool.owner_names,
      vehicle_numbers: pool.vehicle_numbers,
      total_cost: pool.total_cost.toString(),
      bank_loan_amount: pool.bank_loan_amount.toString(),
      investor_amount: pool.investor_amount.toString(),
      monthly_emi: pool.monthly_emi.toString(),
      emergency_fund_collected: pool.emergency_fund_collected.toString(),
      emergency_fund_company_share: pool.emergency_fund_company_share.toString(),
      emergency_fund_investor_share: pool.emergency_fund_investor_share.toString(),
      emergency_fund_remaining: pool.emergency_fund_remaining.toString(),
      status: pool.status
    });
    
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pool) return;

    try {
      const updateData = {
        pool_name: editFormData.pool_name,
        description: editFormData.description,
        owner_names: editFormData.owner_names,
        vehicle_numbers: editFormData.vehicle_numbers,
        total_cost: parseFloat(editFormData.total_cost),
        bank_loan_amount: parseFloat(editFormData.bank_loan_amount),
        investor_amount: parseFloat(editFormData.investor_amount),
        monthly_emi: parseFloat(editFormData.monthly_emi),
        emergency_fund_collected: parseFloat(editFormData.emergency_fund_collected),
        emergency_fund_company_share: parseFloat(editFormData.emergency_fund_company_share),
        emergency_fund_investor_share: parseFloat(editFormData.emergency_fund_investor_share),
        emergency_fund_remaining: parseFloat(editFormData.emergency_fund_remaining),
        status: editFormData.status,
        updated_at: new Date().toISOString()
      };

      const { error } = await (supabase as any)
        .from('company_pools')
        .update(updateData)
        .eq('purchase_id', pool.purchase_id);

      if (error) throw error;

      toast.success('Pool updated successfully');
      setIsEditDialogOpen(false);
      fetchPoolDetails(); // Refresh the data
    } catch (error) {
      console.error('Error updating pool:', error);
      toast.error('Failed to update pool');
    }
  };

  const handleArrayInputChange = (field: 'owner_names' | 'vehicle_numbers', value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setEditFormData(prev => ({
      ...prev,
      [field]: array
    }));
  };

  const handleRoiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pool?.purchase_id) {
      toast.error('Pool ID is missing. Cannot declare ROI.');
      return;
    }

    // Validate emergency fund amount if deduction is enabled
    if (roiFormData.deduct_emergency_fund) {
      const amount = parseFloat(roiFormData.emergency_fund_amount);
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

      if (!roiFormData.quarter_year || !/Q[1-4]-20\d{2}/.test(roiFormData.quarter_year)) {
        toast.error('Please enter Quarter & Year in the format Q1-20XX');
        return;
      }

      if (!roiFormData.roi_percentage || parseFloat(roiFormData.roi_percentage) <= 0) {
        toast.error('Please enter a valid ROI Percentage');
        return;
      }

      const roiData = {
        quarter_year: roiFormData.quarter_year,
        roi_percentage: parseFloat(roiFormData.roi_percentage),
        declaration_date: formattedDate,
        purchase_id: pool.purchase_id, // Use current pool's purchase_id
        is_finalized: true, // Always finalize when submitting
        emergency_fund_deduction_amount: roiFormData.deduct_emergency_fund 
          ? parseFloat(roiFormData.emergency_fund_amount) 
          : null
      };

      const { data, error } = await (supabase as any)
        .from('quarterly_roi_declarations')
        .insert([roiData])
        .select()
        .single();

      if (error) throw error;

      // Always generate payments automatically
      const { data: paymentResult, error: paymentError } = await (supabase as any).rpc('generate_quarterly_payments', {
        p_declaration_id: data.declaration_id
      });

      if (paymentError) {
        console.error('Error generating payments:', paymentError);
        toast.error(`Failed to generate payments: ${paymentError.message}`);
      } else {
        toast.success(`ROI declared and ${paymentResult} payments generated successfully`);
      }

      setIsRoiDialogOpen(false);
      resetRoiForm();
      fetchPoolDetails(); // Refresh pool data to update emergency fund remaining
      fetchRoiDeclarations(); // Refresh ROI declarations list
    } catch (error: any) {
      console.error('Error saving ROI declaration:', error);
      toast.error(`Failed to save ROI declaration: ${error.message || 'Unknown error'}`);
    }
  };

  const handleViewPayments = (declaration: QuarterlyROI) => {
    navigate(`/payments/${declaration.declaration_id}`);
  };

  const handleGeneratePayments = async (declaration: QuarterlyROI) => {
    try {
      // If the declaration is not yet finalized, finalize it first
      if (!declaration.is_finalized) {
        const { error: finalizeError } = await (supabase as any)
          .from('quarterly_roi_declarations')
          .update({ is_finalized: true })
          .eq('declaration_id', declaration.declaration_id);

        if (finalizeError) throw finalizeError;
      }
      
      const { data: paymentResult, error: paymentError } = await (supabase as any).rpc('generate_quarterly_payments', {
        p_declaration_id: declaration.declaration_id
      });

      if (paymentError) {
        console.error('Error generating payments:', paymentError);
        toast.error(`Failed to generate payments: ${paymentError.message}`);
      } else {
        toast.success(`${paymentResult} payments generated successfully`);
        
        // Update the payment generated state
        setPaymentGeneratedStates(prev => ({
          ...prev,
          [declaration.declaration_id]: true
        }));
        
        fetchRoiDeclarations(); // Refresh the data
      }
    } catch (error) {
      console.error('Error generating payments:', error);
      toast.error('Failed to generate payments');
    }
  };

  const getRoiStatusBadge = (declaration: QuarterlyROI) => {
    if (paymentGeneratedStates[declaration.declaration_id]) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Completed</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
  };

  const resetRoiForm = () => {
    setRoiFormData({
      quarter_year: '',
      roi_percentage: '',
      deduct_emergency_fund: false,
      emergency_fund_amount: '',
      is_finalized: false
    });
    setDeclarationDate(undefined);
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

  if (!pool) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Pool not found</h3>
          <p className="text-muted-foreground mb-4">
            The pool you're looking for doesn't exist or has been removed.
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
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
             
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{pool.pool_name}</h1>
              <p className="text-muted-foreground">{pool.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(pool.status)}
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Pool
            </Button>
          </div>
        </div>


        {/* Pool Information - KPI Cards */}
        <div className="flex gap-4">
          <Card className="w-fit">
            <CardContent className="p-3.5">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Investment Amount</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(pool.investor_amount)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="w-fit">
            <CardContent className="p-3.5">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Emergency Fund</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatCurrency(pool.emergency_fund_collected)} / {formatCurrency(pool.emergency_fund_investor_share)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle Numbers */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-muted-foreground">Vehicle Numbers</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pool.vehicle_numbers.map((vehicle, index) => (
                  <Badge key={index} variant="outline" className="text-xs py-0.5 px-2 border-blue-200 text-blue-700 bg-blue-50">
                    {vehicle}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investor Investments Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {isAdmin ? 'Investments' : 'Your Investments'}
              </CardTitle>
              {isAdmin && (
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by investor name..."
                    value={investorSearchFilter}
                    onChange={(e) => setInvestorSearchFilter(e.target.value)}
                    className="pl-10 placeholder:text-black-600"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {investmentsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : investorInvestments.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No investors found</h3>
                <p className="text-muted-foreground">
                  No investors have invested in this pool yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Investor Name</TableHead>
                    {isAdmin && <TableHead className="text-center">Associate Name</TableHead>}
                    <TableHead className="text-center">Investment Amount</TableHead>
                    <TableHead className="text-center">Phone</TableHead>
                    <TableHead className="text-center">Investment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investorInvestments
                    .filter((investment) => 
                      investment.investor_name.toLowerCase().includes(investorSearchFilter.toLowerCase())
                    )
                    .map((investment) => (
                    <TableRow key={investment.investment_id}>
                      <TableCell className="font-medium text-center">
                        <div className="flex justify-center">
                          {investment.investor_name}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-center">
                          {investment.associate_name || '-'}
                        </TableCell>
                      )}
                      <TableCell className="font-semibold text-green-600 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => navigate(`/investment/${investment.investment_id}`)}
                            className="text-green-600 hover:text-green-800 hover:underline cursor-pointer"
                          >
                            {formatCurrency(investment.investment_amount)}
                          </button>
                          <button
                            onClick={() => navigate(`/investment/${investment.investment_id}`)}
                            className="text-green-600 hover:text-green-800 cursor-pointer p-1 rounded hover:bg-muted transition-colors"
                            title="View Investment Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{investment.phone}</TableCell>
                      <TableCell className="text-center">
                        {formatDate(investment.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* ROI Declaration Section - Only for Admins */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  ROI Declarations ({roiDeclarations.length})
                </CardTitle>
                <Dialog open={isRoiDialogOpen} onOpenChange={setIsRoiDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => resetRoiForm()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Declare ROI
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Declare Quarterly ROI ({pool?.pool_name || 'Pool'})</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRoiSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quarter_year">Quarter & Year</Label>
                          <Input
                            id="quarter_year"
                            value={roiFormData.quarter_year}
                            onChange={(e) => setRoiFormData({ ...roiFormData, quarter_year: e.target.value })}
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
                            value={roiFormData.roi_percentage}
                            onChange={(e) => setRoiFormData({ ...roiFormData, roi_percentage: e.target.value })}
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
                      </div>

                      {/* Emergency Fund Deduction Section */}
                      {pool?.purchase_id && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="deduct_emergency_fund"
                              checked={roiFormData.deduct_emergency_fund}
                              onChange={(e) => setRoiFormData({ ...roiFormData, deduct_emergency_fund: e.target.checked, emergency_fund_amount: e.target.checked ? roiFormData.emergency_fund_amount : '' })}
                              className="rounded"
                            />
                            <Label htmlFor="deduct_emergency_fund" className="font-semibold">
                              Deduct Emergency Fund
                            </Label>
                          </div>
                          
                          {roiFormData.deduct_emergency_fund && (
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
                                  value={roiFormData.emergency_fund_amount}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (selectedPoolEmergencyFund !== null && value) {
                                      const numValue = parseFloat(value);
                                      if (numValue > selectedPoolEmergencyFund) {
                                        toast.error(`Amount cannot exceed remaining: ${formatCurrency(selectedPoolEmergencyFund)}`);
                                        return;
                                      }
                                    }
                                    setRoiFormData({ ...roiFormData, emergency_fund_amount: value });
                                  }}
                                  placeholder="Enter amount to deduct"
                                  required={roiFormData.deduct_emergency_fund}
                                />
                                {roiFormData.emergency_fund_amount && selectedPoolEmergencyFund !== null && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Will deduct {formatCurrency(parseFloat(roiFormData.emergency_fund_amount) || 0)} from remaining {formatCurrency(selectedPoolEmergencyFund)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsRoiDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          Generate Payments
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {roiLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : roiDeclarations.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No ROI declarations found</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by declaring your first quarterly ROI for this pool.
                  </p>
                  <Button onClick={() => setIsRoiDialogOpen(true)}>
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
                        <TableHead>Emergency Fund Ded.</TableHead>
                        <TableHead>Declaration Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roiDeclarations.map((declaration) => {
                        // Calculate ROI% from actual payouts: (total payout / total investment) * 100
                        const totalPayoutForQuarter = payments
                          .filter(p => p.declaration_id === declaration.declaration_id)
                          .reduce((sum, p) => sum + p.gross_roi_amount, 0);
                        const calculatedRoiPercentage = pool && pool.investor_amount > 0
                          ? (totalPayoutForQuarter / pool.investor_amount) * 100
                          : declaration.roi_percentage;
                        
                        return (
                        <TableRow key={declaration.declaration_id}>
                          <TableCell className="font-medium">
                            {declaration.quarter_year}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-primary">
                              {calculatedRoiPercentage.toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-orange-600">
                            {formatCurrency(declaration.emergency_fund_deduction_amount || 0)}
                          </TableCell>
                          <TableCell>
                            {formatDate(declaration.declaration_date)}
                          </TableCell>
                          <TableCell>
                            {getRoiStatusBadge(declaration)}
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
        )}

        {/* Edit Pool Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Pool</DialogTitle>
              <DialogDescription>
                Update the pool information and financial details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pool_name">Pool Name</Label>
                  <Input
                    id="pool_name"
                    value={editFormData.pool_name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, pool_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value: 'Active' | 'Inactive' | 'Sold') => 
                      setEditFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="owner_names">Owner Names (comma-separated)</Label>
                  <Input
                    id="owner_names"
                    value={editFormData.owner_names.join(', ')}
                    onChange={(e) => handleArrayInputChange('owner_names', e.target.value)}
                    placeholder="BSPN, Simsa"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehicle_numbers">Vehicle Numbers (comma-separated)</Label>
                  <Input
                    id="vehicle_numbers"
                    value={editFormData.vehicle_numbers.join(', ')}
                    onChange={(e) => handleArrayInputChange('vehicle_numbers', e.target.value)}
                    placeholder="KA02CD5678, AP39WE7890"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_cost">Total Cost (₹)</Label>
                  <Input
                    id="total_cost"
                    type="number"
                    value={editFormData.total_cost}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, total_cost: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bank_loan_amount">Bank Loan Amount (₹)</Label>
                  <Input
                    id="bank_loan_amount"
                    type="number"
                    value={editFormData.bank_loan_amount}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, bank_loan_amount: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="investor_amount">Investor Amount (₹)</Label>
                  <Input
                    id="investor_amount"
                    type="number"
                    value={editFormData.investor_amount}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, investor_amount: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="monthly_emi">Monthly EMI (₹)</Label>
                  <Input
                    id="monthly_emi"
                    type="number"
                    value={editFormData.monthly_emi}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, monthly_emi: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_fund_collected">Emergency Fund Collected (₹)</Label>
                  <Input
                    id="emergency_fund_collected"
                    type="number"
                    value={editFormData.emergency_fund_collected}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, emergency_fund_collected: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_fund_company_share">Emergency Fund Company Share (₹)</Label>
                  <Input
                    id="emergency_fund_company_share"
                    type="number"
                    value={editFormData.emergency_fund_company_share}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, emergency_fund_company_share: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_fund_investor_share">Emergency Fund Investor Share (₹)</Label>
                  <Input
                    id="emergency_fund_investor_share"
                    type="number"
                    value={editFormData.emergency_fund_investor_share}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, emergency_fund_investor_share: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_fund_remaining">Emergency Fund Remaining (₹)</Label>
                  <Input
                    id="emergency_fund_remaining"
                    type="number"
                    value={editFormData.emergency_fund_remaining}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, emergency_fund_remaining: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Pool
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default PoolDetailsPage;
