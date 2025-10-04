import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageLayout from "@/components/layout/PageLayout";
import { usePageMetadata } from "@/hooks/use-page-metadata";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface VehiclePurchase {
  id: number;
  vehicleType: string;
  purchaseDate: string;
  amount: number;
  vendor: string;
}

const VehiclePurPage = () => {
  usePageMetadata({
    defaultTitle: "Vehicle Purchases - Investors",
    defaultDescription: "Track and manage vehicle acquisition data"
  });

  const [purchases, setPurchases] = useState<VehiclePurchase[]>([
    { id: 1, vehicleType: "Sedan", purchaseDate: "2024-01-15", amount: 25000, vendor: "AutoCorp" },
    { id: 2, vehicleType: "SUV", purchaseDate: "2024-02-20", amount: 45000, vendor: "Motors Inc" }
  ]);

  const [newPurchase, setNewPurchase] = useState({
    vehicleType: "",
    purchaseDate: "",
    amount: "",
    vendor: ""
  });

  const handleAdd = () => {
    if (!newPurchase.vehicleType || !newPurchase.purchaseDate || !newPurchase.amount || !newPurchase.vendor) {
      toast.error("Please fill in all fields");
      return;
    }

    const purchase: VehiclePurchase = {
      id: Date.now(),
      vehicleType: newPurchase.vehicleType,
      purchaseDate: newPurchase.purchaseDate,
      amount: parseFloat(newPurchase.amount),
      vendor: newPurchase.vendor
    };

    setPurchases([...purchases, purchase]);
    setNewPurchase({ vehicleType: "", purchaseDate: "", amount: "", vendor: "" });
    toast.success("Vehicle purchase added successfully");
  };

  const handleDelete = (id: number) => {
    setPurchases(purchases.filter(p => p.id !== id));
    toast.success("Vehicle purchase deleted");
  };

  const totalAmount = purchases.reduce((sum, p) => sum + p.amount, 0);

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Purchases</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage vehicle acquisition data
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Purchase</CardTitle>
            <CardDescription>Record a new vehicle purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <Input
                  id="vehicleType"
                  value={newPurchase.vehicleType}
                  onChange={(e) => setNewPurchase({ ...newPurchase, vehicleType: e.target.value })}
                  placeholder="e.g., Sedan, SUV"
                />
              </div>
              <div>
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={newPurchase.purchaseDate}
                  onChange={(e) => setNewPurchase({ ...newPurchase, purchaseDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newPurchase.amount}
                  onChange={(e) => setNewPurchase({ ...newPurchase, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  value={newPurchase.vendor}
                  onChange={(e) => setNewPurchase({ ...newPurchase, vendor: e.target.value })}
                  placeholder="Vendor name"
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
            <CardTitle>Purchase Records</CardTitle>
            <CardDescription>Total Investment: ${totalAmount.toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.vehicleType}</TableCell>
                    <TableCell>{new Date(purchase.purchaseDate).toLocaleDateString()}</TableCell>
                    <TableCell>${purchase.amount.toLocaleString()}</TableCell>
                    <TableCell>{purchase.vendor}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(purchase.id)}
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

export default VehiclePurPage;
