import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Briefcase } from "lucide-react";
import { toast } from "sonner";

export default function Services() {
  const [open, setOpen] = useState(false);
  const ALL_BRANCHES = "all";
  const [selectedBranch, setSelectedBranch] = useState<string>(ALL_BRANCHES);
  const [formData, setFormData] = useState({
    itemName: "",
    branchId: "",
    amount: "",
  });

  const { data: branches } = trpc.branches.list.useQuery();
  const { data: sales, refetch: refetchSales } = trpc.sales.list.useQuery({
    branchId: selectedBranch === ALL_BRANCHES ? undefined : parseInt(selectedBranch),
  });

  const recordServiceMutation = trpc.sales.recordServiceSale.useMutation({
    onSuccess: () => {
      toast.success("Service sale recorded successfully");
      refetchSales();
      setFormData({ itemName: "", branchId: "", amount: "" });
      setOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || !formData.branchId || !formData.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    recordServiceMutation.mutate({
      itemName: formData.itemName,
      branchId: parseInt(formData.branchId),
      amount: parseFloat(formData.amount),
    });
  };

  const branchMap = branches?.reduce((acc, b) => ({ ...acc, [b.id]: b.name }), {});
  const serviceSales = sales?.filter((s) => s.type === "service") || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground mt-1">Record and manage service sales</p>
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
                Record Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Service Sale</DialogTitle>
                <DialogDescription>
                  Record a new service sale transaction
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="serviceName">Service Name *</Label>
                  <Input
                    id="serviceName"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    placeholder="e.g., Consulting, Installation, Repair"
                  />
                </div>
                <div>
                  <Label htmlFor="branch">Branch *</Label>
                  <Select value={formData.branchId} onValueChange={(v) => setFormData({ ...formData, branchId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={recordServiceMutation.isPending}>
                  Record Service
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Sales History</CardTitle>
          <CardDescription>
            {serviceSales.length} service sales {selectedBranch !== ALL_BRANCHES ? "in selected branch" : "across all branches"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serviceSales.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">No service sales recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{sale.itemName}</TableCell>
                      <TableCell>{branchMap?.[sale.branchId as keyof typeof branchMap] || "Unknown"}</TableCell>
                      <TableCell className="text-right font-semibold">${parseFloat(sale.amount.toString()).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
