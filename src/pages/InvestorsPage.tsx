import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageLayout from "@/components/layout/PageLayout";
import { usePageMetadata } from "@/hooks/use-page-metadata";
import { TrendingUp, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const InvestorsPage = () => {
  usePageMetadata({ 
    defaultTitle: "Investors - Agri Dom",
    defaultDescription: "Manage investor modules including vehicle purchases and quarterly ROI"
  });

  const modules = [
    {
      title: "Vehicle Purchases",
      description: "Track and manage vehicle acquisition data",
      icon: DollarSign,
      link: "/investors/vehicle-pur",
      color: "bg-blue-500"
    },
    {
      title: "Quarterly ROI",
      description: "Monitor quarterly return on investment metrics",
      icon: TrendingUp,
      link: "/investors/quarterly-roi",
      color: "bg-green-500"
    }
  ];

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Investors</h1>
          <p className="text-muted-foreground mt-2">
            Access investor management modules
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.link} to={module.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`${module.color} p-3 rounded-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>{module.title}</CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
};

export default InvestorsPage;
