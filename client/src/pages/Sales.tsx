import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function Sales() {
  const [open, setOpen] = useState(false);
  const ALL_BRANCHES = "all";
  const [selectedBranch, setSelectedBranch] = useState<string>(ALL_BRANCHES);
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "1",
  });

  const { data: branches } = trpc.branches.list.useQuery();
  const { data: products } = trpc.products.list.useQuery({
    branchId: selectedBranch === ALL_BRANCHES ? undefined : parseInt(selectedBranch),
  });
  const { data: sales, refetch: refetchSales } = trpc.sales.list.useQuery({
    branchId: selectedBranch === ALL_BRANCHES ? undefined : parseInt(selectedBranch),
  });

  const recordSaleMutation = trpc.sales.recordProductSale.useMutation({
    onSuccess: () => {
      toast.success("Sale recorded successfully");
      refetchSales();
      setFormData({ productId: "", quantity: "1" });
      setOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity) {
      toast.error("Please select a product and quantity");
      return;
    }

    recordSaleMutation.mutate({
      productId: parseInt(formData.productId),
      quantity: parseInt(formData.quantity),
    });
  };

  const branchMap = branches?.reduce((acc, b) => ({ ...acc, [b.id]: b.name }), {});
  const productMap = products?.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

  const productSales = sales?.filter((s) => s.type === "product") || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales</h1>
          <p className="text-muted-foreground mt-1">Record and manage product sales</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BRANCHES}>All Branches</SelectItem>
              {branches?.map((branch) => (
                <SelectItem key={branch.id} value={branch.id.toString()}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Record Sale
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Product Sale</DialogTitle>
                <DialogDescription>
                  Record a new product sale and automatically deduct from stock
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="product">Product *</Label>
                  <Select value={formData.productId} onValueChange={(v) => setFormData({ ...formData, productId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} (Stock: {product.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={recordSaleMutation.isPending}>
                  Record Sale
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>
            {productSales.length} product sales {selectedBranch !== ALL_BRANCHES ? "in selected branch" : "across all branches"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productSales.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">No sales recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productSales.map((sale) => {
                    const profit = parseFloat(sale.amount.toString()) - parseFloat(sale.cost?.toString() || "0");
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{sale.itemName}</TableCell>
                        <TableCell>{branchMap?.[sale.branchId as keyof typeof branchMap] || "Unknown"}</TableCell>
                        <TableCell className="text-right">{sale.quantity}</TableCell>
                        <TableCell className="text-right font-semibold">${parseFloat(sale.amount.toString()).toFixed(2)}</TableCell>
                        <TableCell className="text-right">${parseFloat(sale.cost?.toString() || "0").toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">${profit.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
