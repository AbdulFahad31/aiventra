import { create } from 'zustand';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection, addEdge } from 'reactflow';
import type { InvestigationNodeData, EdgeRelationship } from '@/lib/types';

const STORAGE_KEY_PREFIX = 'investigation-workflow-';

function getStorageKey(caseId: string) {
  return `${STORAGE_KEY_PREFIX}${caseId}`;
}

function loadFromStorage(caseId: string): { nodes: Node[]; edges: Edge[] } | null {
  try {
    const raw = localStorage.getItem(getStorageKey(caseId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToStorage(caseId: string, nodes: Node[], edges: Edge[]) {
  try {
    localStorage.setItem(getStorageKey(caseId), JSON.stringify({ nodes, edges }));
  } catch {}
}

let userNodeCounter = Date.now();
function generateUserNodeId(category: string) {
  return `user-${category}-${++userNodeCounter}`;
}

export type InvestigationState = {
  caseId: string | null;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;

  setCaseId: (caseId: string) => void;
  initFromReport: (nodes: Node[], edges: Edge[], caseId: string) => void;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (node: Node) => void;
  updateNodeData: (nodeId: string, data: Partial<InvestigationNodeData>) => void;
  removeNode: (nodeId: string) => void;

  setSelectedNodeId: (nodeId: string | null) => void;
  getSelectedNode: () => Node | undefined;

  addEdgeWithRelationship: (source: string, target: string, relationship: EdgeRelationship) => void;
  updateEdgeRelationship: (edgeId: string, relationship: EdgeRelationship) => void;
  removeEdge: (edgeId: string) => void;

  persist: () => void;
  loadPersisted: (caseId: string) => boolean;
  reset: () => void;
};

export const useInvestigationStore = create<InvestigationState>((set, get) => ({
  caseId: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,

  setCaseId: (caseId) => set({ caseId }),

  initFromReport: (nodes, edges, caseId) => {
    const persisted = loadFromStorage(caseId);
    if (persisted) {
      set({ caseId, nodes: persisted.nodes, edges: persisted.edges });
    } else {
      set({ caseId, nodes, edges });
      saveToStorage(caseId, nodes, edges);
    }
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
    get().persist();
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
    get().persist();
  },

  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'rgba(148,163,184,0.5)', strokeWidth: 2 },
          data: { relationship: 'related' as EdgeRelationship },
        },
        state.edges
      ),
    }));
    get().persist();
  },

  addNode: (node) => {
    set((state) => ({ nodes: [...state.nodes, node] }));
    get().persist();
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }));
    get().persist();
  },

  removeNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const nodeData = node.data as InvestigationNodeData;
    if (nodeData?.source === 'ai') return;
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
    get().persist();
  },

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  getSelectedNode: () => {
    const { nodes, selectedNodeId } = get();
    return nodes.find((n) => n.id === selectedNodeId);
  },

  addEdgeWithRelationship: (source, target, relationship) => {
    const id = `e-${source}-${target}-${Date.now()}`;
    set((state) => ({
      edges: [
        ...state.edges,
        {
          id,
          source,
          target,
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'rgba(148,163,184,0.5)', strokeWidth: 2 },
          data: { relationship },
        },
      ],
    }));
    get().persist();
  },

  updateEdgeRelationship: (edgeId, relationship) => {
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, relationship } } : e
      ),
    }));
    get().persist();
  },

  removeEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    }));
    get().persist();
  },

  persist: () => {
    const { caseId, nodes, edges } = get();
    if (caseId) saveToStorage(caseId, nodes, edges);
  },

  loadPersisted: (caseId) => {
    const persisted = loadFromStorage(caseId);
    if (persisted) {
      set({ caseId, nodes: persisted.nodes, edges: persisted.edges });
      return true;
    }
    return false;
  },

  reset: () => {
    const { caseId } = get();
    if (caseId) {
      localStorage.removeItem(getStorageKey(caseId));
    }
    set({ nodes: [], edges: [], selectedNodeId: null });
  },
}));

export { generateUserNodeId };
