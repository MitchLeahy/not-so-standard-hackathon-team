import { createBrowserRouter, RouterProvider, Outlet } from 'react-router';
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from '@databricks/appkit-ui/react';
import { Menu, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { HealthPlanningPage } from './pages/HealthPlanningPage';

function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b px-4 md:px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary p-2 text-primary-foreground">
            <Stethoscope className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Health Access Agent</h1>
        </div>
        <div className="ml-auto md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(true)}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Health Access Agent</SheetTitle>
              </SheetHeader>
              <p className="text-sm text-muted-foreground">
                District health prioritization powered by Databricks Lakebase.
              </p>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [{ path: '/', element: <HealthPlanningPage /> }],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
