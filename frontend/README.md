# Devflow Frontend Client 🎨

This is the frontend dashboard of the Devflow orchestration workspace. It is built using **Next.js 16** and **React 19**, styled with **Tailwind CSS**, and uses modern interactive UI elements like glassmorphism, Framer Motion animations, and React Flow (`@xyflow/react`) for node-based graphs.

---

## 🛠️ Technology Stack

- **Core**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, CSS Variables for system colors, `next-themes` (Dark/Light mode support)
- **State Management**: Zustand
- **Animations**: Framer Motion (for smooth micro-animations and transition states)
- **Node Workflows**: `@xyflow/react` (for the interactive workspace design view)
- **Icons**: Lucide React
- **Auth**: Clerk integration ready (`@clerk/nextjs`)
- **Components**: Tailwind-configured Shadcn components

---

## 📁 Directory Structure

```
frontend/
├── app/
│   ├── globals.css         # Tailwind global directives and CSS theme variables
│   ├── layout.tsx          # App-wide context providers (Theme, Clerk, Store)
│   ├── page.tsx            # Main landing page introducing the workspace planner
│   └── workspace/          # Core dashboard router
│       ├── layout.tsx
│       └── page.tsx        # Dynamic dashboard renderer
│
├── components/
│   ├── landing/            # Landing page UI elements
│   ├── layout/             # Header, Sidebar, AI Chat Panel layout components
│   ├── ui/                 # Reusable primitive UI buttons, inputs, dialogs
│   └── workspace/          # Workspace modules
│       ├── backlog-view.tsx       # Sprint backlog tasks
│       ├── cost-view.tsx          # Infrastructure & cloud cost projections
│       ├── milestones-view.tsx    # GANTT / Milestone tracker
│       ├── overview-view.tsx      # High-level project summary
│       ├── risk-view.tsx          # Risk matrices and mitigation strategies
│       ├── team-view.tsx          # Resource management & roles
│       ├── requirements-view.tsx  # Documented project scope & specifications
│       ├── orchestration-view.tsx # Workflow designer view
│       ├── orchestration-loader.tsx # Animated agent consensus loader
│       ├── orchestration-node.tsx   # Custom graph nodes
│       └── workspace-client.tsx   # Switchboard routing dashboard
│
├── hooks/                  # Common React hooks
├── lib/
│   ├── store.ts            # Zustand store for UI toggles and project parameters
│   └── utils.ts            # Tailwind merging helpers (clsx, tailwind-merge)
│
├── public/                 # Static vector graphics and branding
├── tsconfig.json           # TypeScript configuration
└── package.json            # Scripts & dependencies
```

---

## 🚀 Local Development Setup

To run the frontend client separately from the Docker services (e.g. for fast UI iteration and hot reloading):

### 1. Install Dependencies

Using `npm`:
```bash
npm install
```
Or using `pnpm`:
```bash
pnpm install
```

### 2. Environment Variables

Create a `frontend/.env.local` file (if it doesn't already exist) to configure external service parameters (e.g., Clerk Auth keys):

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### 3. Run the Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧠 State Management & Routing

State is shared across components using a centralized **Zustand** store (`frontend/lib/store.ts`). It handles:
- Sidebar expand/collapse status
- Active dashboard view/tab selection
- Project scope title and description
- Agent orchestration simulation sequence state (`orchestrationRunning`)

### Adding a New Workspace View
1. Open `frontend/lib/store.ts` and append the new mode key to the `WorkspaceMode` union type.
2. Build the new view component in `frontend/components/workspace/`.
3. Open `frontend/components/workspace/workspace-client.tsx` and import the view, placing it under the workspace mode conditions.
