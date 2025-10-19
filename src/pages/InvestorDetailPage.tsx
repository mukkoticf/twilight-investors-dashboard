import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, User, Building, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { usePageMetadata } from '@/hooks/use-page-metadata';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Investor {
  investor_id: string;
  investor_name: string;
  email: string;
  phone: string;
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
  pool_name: string;
  total_cost: number;
  status: 'Active' | 'Inactive' | 'Sold';
}

const InvestorDetailPage = () => {
  const { investorId } = useParams<{ investorId: string }>();
  const navigate = useNavigate();
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [investments, setInvestments] = useState<InvestorInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [investmentsLoading, setInvestmentsLoading] = useState(true);

  usePageMetadata({
    defaultTitle: investor ? `${investor.investor_name} - Investor Details` : "Investor Details - Investor Management",
    defaultDescription: "View detailed information about investor and their investments"
  });

  useEffect(() => {
    if (investorId) {
      fetchInvestorDetails();
      fetchInvestorInvestments();
    }
  }, [investorId]);

  const fetchInvestorDetails = async () => {
    try {
      setLoading(true);
      
      const { data: investorData, error: investorError } = await (supabase as any)
        .from('investors')
        .select('*')
        .eq('investor_id', investorId)
        .single();

      if (investorError) throw investorError;

      setInvestor(investorData);
    } catch (error) {
      console.error('Error fetching investor details:', error);
      toast.error('Failed to fetch investor details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestorInvestments = async () => {
    try {
      setInvestmentsLoading(true);
      
      const { data: investmentsData, error: investmentsError } = await (supabase as any)
        .from('investor_investments')
        .select(`
          *,
          company_pools:purchase_id (
            pool_name,
            total_cost,
            status
          )
        `)
        .eq('investor_id', investorId)
        .order('created_at', { ascending: false });

      if (investmentsError) throw investmentsError;

      // Transform the data to flatten the pool information
      const transformedData = investmentsData?.map((investment: any) => ({
        ...investment,
        pool_name: investment.company_pools?.pool_name || 'Unknown Pool',
        total_cost: investment.company_pools?.total_cost || 0,
        status: investment.company_pools?.status || 'Unknown'
      })) || [];

      setInvestments(transformedData);
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

  const totalInvestedAmount = investments.reduce((sum, investment) => sum + investment.investment_amount, 0);
  const totalPoolsInvested = investments.length;

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  if (!investor) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Investor not found</h3>
          <p className="text-muted-foreground mb-4">
            The investor you're looking for doesn't exist or has been removed.
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
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{investor.investor_name}</h1>
              <p className="text-muted-foreground">{investor.email}</p>
            </div>
          </div>
        </div>

        {/* Investment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pools Invested</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPoolsInvested}</div>
              <p className="text-xs text-muted-foreground">
                Active investments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount Invested</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalInvestedAmount)}</div>
              <p className="text-xs text-muted-foreground">
                Across all pools
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Investment</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalPoolsInvested > 0 ? formatCurrency(totalInvestedAmount / totalPoolsInvested) : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per pool investment
              </p>
            </CardContent>
          </Card>
        </div>


        {/* Investment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Investment History
            </CardTitle>
            <CardDescription>
              All pools this investor has invested in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {investmentsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : investments.length === 0 ? (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No investments found</h3>
                <p className="text-muted-foreground">
                  This investor hasn't invested in any pools yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pool Name</TableHead>
                    <TableHead>Investment Amount</TableHead>
                    <TableHead>Investment %</TableHead>
                    <TableHead>Pool Status</TableHead>
                    <TableHead>Investment Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((investment) => (
                    <TableRow key={investment.investment_id}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => navigate(`/pools/${investment.purchase_id}`)}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {investment.pool_name}
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
                      <TableCell>
                        {getStatusBadge(investment.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(investment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/pools/${investment.purchase_id}`)}
                        >
                          View Pool
                        </Button>
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

export default InvestorDetailPage;
