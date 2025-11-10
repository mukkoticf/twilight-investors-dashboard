import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, TrendingUp, Car, DollarSign, Building, Calendar, Filter, Plus, Edit, Eye } from 'lucide-react';
import { usePageMetadata } from '@/hooks/use-page-metadata';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { trackPageViewToDB } from '@/utils/analytics';

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

const Index = () => {
  const navigate = useNavigate();
  const { user, investor, isAdmin } = useAuth();
  const [pools, setPools] = useState<CompanyPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<CompanyPool | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    pool_name: '',
    description: '',
    owner_names: [] as string[],
    vehicle_numbers: [] as string[],
    purchase_date: '',
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
    defaultTitle: "Pools Dashboard - Investor Management",
    defaultDescription: "Manage company pools, vehicle purchases, and investor funds"
  });

  useEffect(() => {
    // Track page view for investors (not admins)
    if (investor && !isAdmin) {
      trackPageViewToDB(investor.investor_id, investor.investor_name, 'Investments');
      // Redirect investors to their detail page
      navigate(`/investor/${investor.investor_id}`);
      return;
    }
    fetchPools();
  }, [user, investor, isAdmin, navigate]);

  const fetchPools = async () => {
    try {
      setLoading(true);
      
      if (isAdmin) {
        // Admin can see all pools
        const { data: poolsData, error: poolsError } = await (supabase as any)
          .from('company_pools')
          .select('*')
          .order('created_at', { ascending: false });

        if (poolsError) throw poolsError;
        setPools(poolsData || []);
      } else if (user) {
        // Investors see ALL pools (same as admin)
        const { data: poolsData, error: poolsError } = await (supabase as any)
          .from('company_pools')
          .select('*')
          .order('created_at', { ascending: false });

        if (poolsError) throw poolsError;
        setPools(poolsData || []);
      } else {
        console.log('No user data available');
        setPools([]);
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
      toast.error('Failed to fetch pools data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const poolData = {
        pool_name: formData.pool_name,
        description: formData.description,
        owner_names: formData.owner_names,
        vehicle_numbers: formData.vehicle_numbers,
        purchase_date: formData.purchase_date,
        total_cost: parseFloat(formData.total_cost),
        bank_loan_amount: parseFloat(formData.bank_loan_amount),
        investor_amount: parseFloat(formData.investor_amount),
        monthly_emi: parseFloat(formData.monthly_emi),
        emergency_fund_collected: parseFloat(formData.emergency_fund_collected),
        emergency_fund_company_share: parseFloat(formData.emergency_fund_company_share),
        emergency_fund_investor_share: parseFloat(formData.emergency_fund_investor_share),
        emergency_fund_remaining: parseFloat(formData.emergency_fund_remaining),
        status: formData.status,
      };

      if (editingPool) {
        const { error } = await (supabase as any)
          .from('company_pools')
          .update(poolData)
          .eq('purchase_id', editingPool.purchase_id);

        if (error) throw error;
        toast.success('Pool updated successfully');
      } else {
        const { error } = await (supabase as any)
          .from('company_pools')
          .insert([poolData]);

        if (error) throw error;
        toast.success('Pool created successfully');
      }

      setIsDialogOpen(false);
      setEditingPool(null);
      resetForm();
      fetchPools();
    } catch (error) {
      console.error('Error saving pool:', error);
      toast.error('Failed to save pool');
    }
  };

  const resetForm = () => {
    setFormData({
      pool_name: '',
      description: '',
      owner_names: [],
      vehicle_numbers: [],
      purchase_date: '',
      total_cost: '',
      bank_loan_amount: '',
      investor_amount: '',
      monthly_emi: '',
      emergency_fund_collected: '',
      emergency_fund_company_share: '',
      emergency_fund_investor_share: '',
      emergency_fund_remaining: '',
      status: 'Active'
    });
  };

  const handleEdit = (pool: CompanyPool) => {
    setEditingPool(pool);
    setFormData({
      pool_name: pool.pool_name,
      description: pool.description,
      owner_names: pool.owner_names,
      vehicle_numbers: pool.vehicle_numbers,
      purchase_date: pool.purchase_date,
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
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingPool(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleView = (pool: CompanyPool) => {
    navigate(`/pools/${pool.purchase_id}`);
  };

  const filteredPools = pools.filter(pool => {
    const matchesStatus = statusFilter === 'all' || pool.status === statusFilter;
    const matchesSearch = pool.pool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pool.owner_names.some(owner => owner.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

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

  // Calculate summary stats
  const totalInvestment = pools.reduce((sum, pool) => sum + pool.investor_amount, 0);
  const totalVehicles = pools.reduce((sum, pool) => sum + pool.vehicle_numbers.length, 0);
  const activePools = pools.filter(pool => pool.status === 'Active').length;

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Pools Dashboard</h1>
            {!isAdmin && user && (
              <p className="text-sm text-muted-foreground mt-1">
                Showing your investment pools
              </p>
            )}
          </div>
          {isAdmin && (
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Pool
            </Button>
          )}
        </div>

        {/* Summary Stats Cards */}
        <div className="flex gap-4 flex-wrap">
          <Card className="min-w-fit flex-1 max-w-fit">
            <CardContent className="p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Investment</p>
                <p className="text-xl font-bold text-black dark:text-white">{formatCurrency(totalInvestment)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="w-fit">
            <CardContent className="p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active Pools</p>
                <p className="text-xl font-bold text-black dark:text-white">{activePools}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="w-fit">
            <CardContent className="p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Vehicles</p>
                <p className="text-xl font-bold text-black dark:text-white">{totalVehicles}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
          <div className="flex-1">
            <Input
              placeholder="Search by pool name, description, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pools Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPools.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No pools found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters or search terms.'
                  : isAdmin 
                    ? 'Get started by adding your first company pool.'
                    : 'You have no investments in any pools yet.'
                }
              </p>
              {isAdmin && (
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Pool
                </Button>
              )}
            </div>
          ) : (
            filteredPools.map((pool) => (
              <Card 
                key={pool.purchase_id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleView(pool)}
              >
            <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{pool.pool_name}</CardTitle>
                      <CardDescription className="mt-1">
                        {pool.description}
                      </CardDescription>
                    </div>
                    {getStatusBadge(pool.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Owners */}
                  {!isAdmin && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Owners</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pool.owner_names.map((owner, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {owner}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vehicles */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Vehicles</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pool.vehicle_numbers.map((vehicle, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {vehicle}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Cost</p>
                      <p className="font-semibold">{formatCurrency(pool.total_cost)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Investor Amount</p>
                      <p className="font-semibold text-green-600">{formatCurrency(pool.investor_amount)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(pool);
                        }}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={isAdmin ? "flex-1" : "w-full"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(pool);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add/Edit Pool Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPool ? 'Edit Pool' : 'Add New Pool'}
              </DialogTitle>
              <DialogDescription>
                {editingPool ? 'Update pool information' : 'Create a new company pool'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pool_name">Pool Name</Label>
                  <Input
                    id="pool_name"
                    value={formData.pool_name}
                    onChange={(e) => setFormData({ ...formData, pool_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'Active' | 'Inactive' | 'Sold') => setFormData({ ...formData, status: value })}>
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="total_cost">Total Cost (₹)</Label>
                  <Input
                    id="total_cost"
                    type="number"
                    value={formData.total_cost}
                    onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_loan_amount">Bank Loan Amount (₹)</Label>
                  <Input
                    id="bank_loan_amount"
                    type="number"
                    value={formData.bank_loan_amount}
                    onChange={(e) => setFormData({ ...formData, bank_loan_amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="investor_amount">Investor Amount (₹)</Label>
                  <Input
                    id="investor_amount"
                    type="number"
                    value={formData.investor_amount}
                    onChange={(e) => setFormData({ ...formData, investor_amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthly_emi">Monthly EMI (₹)</Label>
                  <Input
                    id="monthly_emi"
                    type="number"
                    value={formData.monthly_emi}
                    onChange={(e) => setFormData({ ...formData, monthly_emi: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_fund_collected">Emergency Fund Collected (₹)</Label>
                  <Input
                    id="emergency_fund_collected"
                    type="number"
                    value={formData.emergency_fund_collected}
                    onChange={(e) => setFormData({ ...formData, emergency_fund_collected: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_fund_company_share">Emergency Fund - Company Share (₹)</Label>
                  <Input
                    id="emergency_fund_company_share"
                    type="number"
                    value={formData.emergency_fund_company_share}
                    onChange={(e) => setFormData({ ...formData, emergency_fund_company_share: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_fund_investor_share">Emergency Fund - Investor Share (₹)</Label>
                  <Input
                    id="emergency_fund_investor_share"
                    type="number"
                    value={formData.emergency_fund_investor_share}
                    onChange={(e) => setFormData({ ...formData, emergency_fund_investor_share: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="emergency_fund_remaining">Emergency Fund Remaining (₹)</Label>
                <Input
                  id="emergency_fund_remaining"
                  type="number"
                  value={formData.emergency_fund_remaining}
                  onChange={(e) => setFormData({ ...formData, emergency_fund_remaining: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPool ? 'Update Pool' : 'Create Pool'}
              </Button>
        </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default Index;
