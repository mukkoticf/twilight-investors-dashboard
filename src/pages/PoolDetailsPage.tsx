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
import { ArrowLeft, Edit, Building, Car, DollarSign, Shield, Users, TrendingUp, Calendar } from 'lucide-react';
import { usePageMetadata } from '@/hooks/use-page-metadata';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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
  email: string;
  phone: string;
}

const PoolDetailsPage = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [pool, setPool] = useState<CompanyPool | null>(null);
  const [investorInvestments, setInvestorInvestments] = useState<InvestorInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [investmentsLoading, setInvestmentsLoading] = useState(true);
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

  usePageMetadata({
    defaultTitle: pool ? `${pool.pool_name} - Pool Details` : "Pool Details - Investor Management",
    defaultDescription: "View detailed information about company pool and investor investments"
  });

  useEffect(() => {
    if (poolId) {
      fetchPoolDetails();
      fetchInvestorInvestments();
    }
  }, [poolId]);

  const fetchPoolDetails = async () => {
    try {
      setLoading(true);
      
      const { data: poolData, error: poolError } = await (supabase as any)
        .from('company_pools')
        .select('*')
        .eq('purchase_id', poolId)
        .single();

      if (poolError) throw poolError;

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


        {/* Pool Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Pool Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner Names</TableHead>
                    <TableHead>Vehicle Numbers</TableHead>
                    <TableHead>Total Cost</TableHead> 
                    <TableHead>Total Investment Amount</TableHead>
                     <TableHead>Monthly EMI</TableHead> 
                    <TableHead>Total Emergency Fund</TableHead> 
                    <TableHead>Emergency Fund Remaining</TableHead> 
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {pool.owner_names.map((owner, index) => (
                          <Badge key={index} variant="outline">
                            {owner}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {pool.vehicle_numbers.map((vehicle, index) => (
                          <Badge key={index} variant="secondary">
                            {vehicle}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(pool.total_cost)}</TableCell>
                    <TableCell className="font-semibold text-green-600">{formatCurrency(pool.investor_amount)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(pool.monthly_emi)}</TableCell> 
                    <TableCell className="font-semibold text-blue-600">{formatCurrency(pool.emergency_fund_investor_share)}</TableCell>
                    <TableCell className="font-semibold text-orange-600">{formatCurrency(pool.emergency_fund_remaining)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Investor Investments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Investor Investments
            </CardTitle>
            <CardDescription>
              All investors who have invested in this pool
            </CardDescription>
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
                    <TableHead>Investor Name</TableHead>
                    <TableHead>Investment Amount</TableHead>
                    <TableHead>Investment %</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Investment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investorInvestments.map((investment) => (
                    <TableRow key={investment.investment_id}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => navigate(`/investor/${investment.investor_id}`)}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {investment.investor_name}
                        </button>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        <button
                          onClick={() => navigate(`/investment/${investment.investment_id}`)}
                          className="text-green-600 hover:text-green-800 hover:underline cursor-pointer"
                        >
                          {formatCurrency(investment.investment_amount)}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {investment.investment_percentage.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{investment.phone}</TableCell>
                      <TableCell>
                        {new Date(investment.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

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
