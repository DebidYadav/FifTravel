This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Live MCP / Orchestrator configuration

This project now uses public open-source endpoints for itinerary data where available. Set the following environment variables in `.env.local`:

```
# External orchestrator to generate plans (server-side)
ORCHESTRATOR_URL=https://orchestrator.fifatravel.com/plan

# Required: Public data providers for itinerary generation
NEXT_PUBLIC_MATCH_API_URL=https://worldcupjson.net/matches
NEXT_PUBLIC_FLIGHT_API_URL=https://api.skypicker.com/flights
NEXT_PUBLIC_HOTEL_API_URL=https://overpass-api.de/api/interpreter
NEXT_PUBLIC_VISA_API_URL=https://restcountries.com/v3.1
```

The app also supports optional local mock MCP infrastructure for development if you want to override live data with mock endpoints.

### Running a local mock MCP server

For quick local testing a small mock MCP server is included. Start it with:

```bash
npm run mock:mcp
```

By default the mock server listens on port `4000`.

Then run the Next.js dev server in another terminal:

```bash
npm run dev
```

Example `.env.local` for local mock testing:

```bash
ORCHESTRATOR_URL=http://localhost:4000/plan
NEXT_PUBLIC_MATCH_API_URL=http://localhost:4000/matches
NEXT_PUBLIC_FLIGHT_API_URL=http://localhost:4000/flights
NEXT_PUBLIC_HOTEL_API_URL=http://localhost:4000/hotels
NEXT_PUBLIC_VISA_API_URL=http://localhost:4000/visa
NEXT_PUBLIC_ELASTIC_MCP_URL=http://localhost:4000
NEXT_PUBLIC_MONGO_MCP_URL=http://localhost:4000
MOCK_MCP_PORT=4000
```
