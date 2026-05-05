import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { LogIn, ShoppingCart } from "lucide-react";

export default function Login() {

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/20 p-4 rounded-lg">
              <ShoppingCart className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AlphaPOS Pro</h1>
          <p className="text-slate-400">Professional Point of Sale Management</p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-white">Welcome Back</CardTitle>
            <CardDescription>Sign in to manage your business operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/50">
                <h3 className="font-semibold text-white mb-2">Available Roles</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Shop Owner - Full system access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Manager - Branch management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Cashier - Sales operations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Stock Manager - Inventory control</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleLogin}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign in with Manus
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400 text-center">
                Secure authentication powered by Manus OAuth
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>© 2026 AlphaPOS Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
