import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageLayout from "@/components/layout/PageLayout";
import { usePageMetadata } from "@/hooks/use-page-metadata";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface QuarterlyROI {
  id: number;
  quarter: string;
  year: number;
  investment: number;
  return: number;
  roi: number;
}

const QuarterlyRoiPage = () => {
  usePageMetadata({
    defaultTitle: "Quarterly ROI - Investors",
    defaultDescription: "Monitor quarterly return on investment metrics"
  });

  const [records, setRecords] = useState<QuarterlyROI[]>([
    { id: 1, quarter: "Q1", year: 2024, investment: 100000, return: 115000, roi: 15 },
    { id: 2, quarter: "Q2", year: 2024, investment: 120000, return: 138000, roi: 15 },
    { id: 3, quarter: "Q3", year: 2024, investment: 150000, return: 165000, roi: 10 }
  ]);

  const [newRecord, setNewRecord] = useState({
    quarter: "",
    year: "",
    investment: "",
    return: ""
  });

  const handleAdd = () => {
    if (!newRecord.quarter || !newRecord.year || !newRecord.investment || !newRecord.return) {
      toast.error("Please fill in all fields");
      return;
    }

    const investment = parseFloat(newRecord.investment);
    const returnAmount = parseFloat(newRecord.return);
    const roi = ((returnAmount - investment) / investment) * 100;

    const record: QuarterlyROI = {
      id: Date.now(),
      quarter: newRecord.quarter,
      year: parseInt(newRecord.year),
      investment,
      return: returnAmount,
      roi
    };

    setRecords([...records, record]);
    setNewRecord({ quarter: "", year: "", investment: "", return: "" });
    toast.success("ROI record added successfully");
  };

  const handleDelete = (id: number) => {
    setRecords(records.filter(r => r.id !== id));
    toast.success("ROI record deleted");
  };

  const avgROI = records.length > 0 
    ? (records.reduce((sum, r) => sum + r.roi, 0) / records.length).toFixed(2)
    : "0";

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quarterly ROI</h1>
          <p className="text-muted-foreground mt-2">
            Monitor quarterly return on investment metrics
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New ROI Record</CardTitle>
            <CardDescription>Record quarterly investment performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="quarter">Quarter</Label>
                <Input
                  id="quarter"
                  value={newRecord.quarter}
                  onChange={(e) => setNewRecord({ ...newRecord, quarter: e.target.value })}
                  placeholder="e.g., Q1, Q2"
                />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={newRecord.year}
                  onChange={(e) => setNewRecord({ ...newRecord, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
              <div>
                <Label htmlFor="investment">Investment ($)</Label>
                <Input
                  id="investment"
                  type="number"
                  value={newRecord.investment}
                  onChange={(e) => setNewRecord({ ...newRecord, investment: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="return">Return ($)</Label>
                <Input
                  id="return"
                  type="number"
                  value={newRecord.return}
                  onChange={(e) => setNewRecord({ ...newRecord, return: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAdd} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ROI Performance</CardTitle>
            <CardDescription>Average ROI: {avgROI}%</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Investment</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>ROI</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.quarter} {record.year}
                    </TableCell>
                    <TableCell>${record.investment.toLocaleString()}</TableCell>
                    <TableCell>${record.return.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {record.roi >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={record.roi >= 0 ? "text-green-600" : "text-red-600"}>
                          {record.roi.toFixed(2)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default QuarterlyRoiPage;
