// Orchestration Engine Types
export interface OrchestrationNode {
  id: string
  label: string
  description: string
  status: 'idle' | 'thinking' | 'analyzing' | 'generating' | 'complete'
  progress: number
  dependencies: string[]
}

export interface OrchestrationEdge {
  id: string
  source: string
  target: string
  animated: boolean
  label?: string
}

// Workspace Module Types
export interface Requirement {
  id: string
  title: string
  category: 'frontend' | 'backend' | 'security' | 'ai' | 'integrations' | 'infrastructure'
  description: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
}

export interface Task {
  id: string
  title: string
  description: string
  category: string
  sprint?: number
  dependencies: string[]
  estimatedDays: number
  confidence: number // 0-100
  assigned?: string
  status: 'todo' | 'in-progress' | 'complete'
}

export interface RiskItem {
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  probability: number // 0-100
  impact: number // 0-100
  mitigation: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  skills: string[]
  workload: number // 0-100
  sprintAllocation: number[] // percentage per sprint
}

export interface CostEstimate {
  category: string
  amount: number
  currency: 'USD' | 'EUR' | 'GBP'
  timeframe: 'monthly' | 'quarterly' | 'annual'
  breakdown?: Record<string, number>
}

export interface Milestone {
  id: string
  title: string
  description: string
  phase: 'mvp' | 'beta' | 'production' | 'scaling'
  startDate: Date
  endDate: Date
  progress: number // 0-100
  deliverables: string[]
  dependencies: string[]
}

// AI Chat Types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  context?: {
    module?: string
    nodeId?: string
    projectId?: string
  }
  thinking?: string // Claude thinking state
}

export interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  action: () => void
}

// Project Types
export interface Project {
  id: string
  title: string
  description: string
  createdAt: Date
  updatedAt: Date
  requirements: Requirement[]
  tasks: Task[]
  risks: RiskItem[]
  team: TeamMember[]
  costs: CostEstimate[]
  milestones: Milestone[]
  chatHistory: ChatMessage[]
}
