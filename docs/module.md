## Frontend Component Architecture
/components
  ├── Layout/
  │     ├── Sidebar.tsx
  │     ├── Navbar.tsx
  │     └── PageWrapper.tsx
  ├── Charts/
  │     ├── LineChart.tsx
  │     ├── AreaChart.tsx
  │     ├── BarChart.tsx
  │     └── Heatmap.tsx
  ├── Cards/
  │     ├── StatCard.tsx
  │     ├── DeveloperCard.tsx
  │     ├── RepoCard.tsx
  │     └── PRCard.tsx
  ├── Tables/
  │     ├── CommitsTable.tsx
  │     ├── PRTable.tsx
  │     └── AlertsTable.tsx
  ├── Shared/
  │     ├── Button.tsx
  │     ├── Avatar.tsx
  │     ├── Tag.tsx
  │     ├── Loader.tsx
  │     └── Separator.tsx

## Frontend State Stores (Zustand)
/store
  ├── useAuthStore.ts
  ├── useRepoStore.ts
  ├── useDeveloperStore.ts
  └── useAlertStore.ts

## Frontend API Services
/services
  ├── auth.service.ts
  ├── repos.service.ts
  ├── developers.service.ts
  ├── prs.service.ts
  ├── alerts.service.ts
  └── analytics.service.ts

## Frontend Util Functions
/utils
  ├── formatDate.ts
  ├── formatNumber.ts
  ├── calculateRisk.ts
  └── apiClient.ts

## Frontend Types (TypeScript)
/types
  ├── repo.types.ts
  ├── pr.types.ts
  ├── alert.types.ts
  ├── developer.types.ts
  └── metrics.types.ts