export default {
  providers: [
    {
      // @ts-nocheck - process.env is not defined in the browser
      domain: process.env.CLERK_FRONTEND_API_URL,
      applicationID: "convex",
    },
  ],
};
