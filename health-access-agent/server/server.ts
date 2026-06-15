import { createApp, lakebase, server } from '@databricks/appkit';
import { setupHealthPlanningRoutes } from './routes/health-planning-routes';

createApp({
  plugins: [lakebase(), server()],
  async onPluginsReady(appkit) {
    await setupHealthPlanningRoutes(appkit);
  },
}).catch(console.error);
