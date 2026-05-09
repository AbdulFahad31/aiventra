import dagre from 'dagre';
import { Edge, Node } from 'reactflow';
import type { TimelineEvent, RiskFlag, InvestigativeHypothesis, InvestigationNodeData } from '@/lib/types';

function aiData(data: Partial<InvestigationNodeData>): InvestigationNodeData {
  return {
    label: data.label || 'AI Investigation Node',
    category: data.category || 'ai_flag',
    source: 'ai',
    ...data,
  } as InvestigationNodeData;
}

export function generateGraphLayout(
  timeline: TimelineEvent[],
  flags: RiskFlag[],
  intelligence?: any
): { nodes: Node[]; edges: Edge[] } {
  const hypotheses: InvestigativeHypothesis[] = intelligence?.investigative_hypotheses || [];
  const crimeStory: string = intelligence?.crime_story || "";
  // 1. Sort timeline chronologically
  const sortedTimeline = [...timeline].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const storyBeats = intelligence?.story_beats || [];
  
  // 1.5 Add Crime Story Node if available
  if (crimeStory) {
    nodes.push({
      id: 'story-node',
      type: 'customStory',
      data: aiData({
        label: 'Executive Crime Story',
        category: 'hypothesis',
        story: crimeStory,
        description: crimeStory,
      }),
      position: { x: 0, y: 0 },
    });
  }

  let lastSpineNodeId = crimeStory ? 'story-node' : null;

  // 2. Generate Story Beats spine OR Timeline spine
  if (storyBeats.length > 0) {
    storyBeats.forEach((beat: any, index: number) => {
      const id = `beat-${index}`;
      nodes.push({
        id,
        type: 'customStoryBeat',
        data: aiData({
          label: beat.title || `Story Beat ${index + 1}`,
          category: beat.phase === 'critical' ? 'ai_flag' : 'hypothesis',
          beat,
          description: beat.description,
        }),
        position: { x: 0, y: 0 },
      });
      
      if (lastSpineNodeId) {
        edges.push({
          id: `e-${lastSpineNodeId}-${id}`,
          source: lastSpineNodeId,
          target: id,
          animated: true,
          style: { stroke: 'rgba(99,102,241,0.5)', strokeWidth: 2 },
        });
      }
      lastSpineNodeId = id;
    });
  } else {
    sortedTimeline.forEach((event, index) => {
      const id = `timeline-${index}`;
      nodes.push({
        id,
        type: 'customTimeline',
        data: aiData({
          label: event.event || `Timeline Event ${index + 1}`,
          category: 'evidence',
          event,
          description: event.event,
        }),
        position: { x: 0, y: 0 },
      });

      if (lastSpineNodeId) {
        edges.push({
          id: `e-${lastSpineNodeId}-${id}`,
          source: lastSpineNodeId,
          target: id,
          animated: true,
          style: { stroke: 'rgba(34,211,238,0.5)', strokeWidth: 2 },
        });
      }
      lastSpineNodeId = id;
    });
  }


  // 4. Generate red anomaly nodes from report.flags[]
  flags.forEach((flag, index) => {
    const id = `risk-${index}`;
    nodes.push({
      id,
      type: 'customRisk',
      data: aiData({
        label: flag.name || `Risk Flag ${index + 1}`,
        category: 'ai_flag',
        flag,
        description: flag.description,
      }),
      position: { x: 0, y: 0 },
    });

    // Connect anomaly nodes to the last spine node
    if (lastSpineNodeId) {
      edges.push({
        id: `e-risk-${lastSpineNodeId}-${index}`,
        source: lastSpineNodeId,
        target: id,
        animated: true,
        style: { stroke: 'rgba(239,68,68,0.5)', strokeWidth: 2 },
      });
    }
  });

  // 6. Generate Hypothesis nodes (Crime Story Synthesis)
  hypotheses.forEach((hypothesis, index) => {
    const id = `hypothesis-${index}`;
    nodes.push({
      id,
      type: 'customHypothesis',
      data: aiData({
        label: hypothesis.title || `Hypothesis ${index + 1}`,
        category: 'hypothesis',
        hypothesis,
        description: hypothesis.reasoning,
      }),
      position: { x: 0, y: 0 },
    });

    // Connect hypotheses to the last spine node to show investigation conclusion
    if (lastSpineNodeId) {
      edges.push({
        id: `e-hypothesis-${lastSpineNodeId}-${index}`,
        source: lastSpineNodeId,
        target: id,
        animated: true,
        style: { stroke: 'rgba(234,179,8,0.5)', strokeWidth: 2, strokeDasharray: '5,5' },
      });
    }
  });

  // 7. Use Dagre auto-layout
  try {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 56, ranksep: 130, align: 'UL' });

    nodes.forEach((node) => {
      let width = 320;
      let height = 120;
      if (node.type === 'customStory') { width = 450; height = 200; }
      else if (node.type === 'customStoryBeat') { width = 360; height = 140; }
      dagreGraph.setNode(node.id, { width, height });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.position = {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      };
    });
  } catch (err) {
    console.error("Dagre layout failed, using fallback grid layout", err);
  }

  return { nodes, edges };
}
