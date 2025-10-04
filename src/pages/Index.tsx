
import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePageMetadata } from '@/hooks/use-page-metadata';

const Index = () => {
  const navigate = useNavigate();
  
  usePageMetadata({
    defaultTitle: "Agri Dom - Dashboard",
    defaultDescription: "Investor management platform"
  });

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Agri Dom</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Investor Management Platform
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-3 rounded-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Investors Module</CardTitle>
                <CardDescription>
                  Manage vehicle purchases and quarterly ROI metrics
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Access comprehensive investor management tools including vehicle acquisition tracking
              and quarterly return on investment analysis.
            </p>
            <Button 
              onClick={() => navigate('/investors')}
              className="w-full"
              size="lg"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Go to Investors
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Index;
