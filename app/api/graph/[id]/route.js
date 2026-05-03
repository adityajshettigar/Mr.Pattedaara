// app/api/graph/[id]/route.js
import { NextResponse } from 'next/server';
import { requireAuth, ROLES } from '../../../../lib/auth';
import { query } from '../../../../lib/db';

export async function GET(req, { params }) {
  const auth = requireAuth(req, ROLES.VIEWER);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const [nodes, edges] = await Promise.all([
      query('SELECT * FROM graph_nodes WHERE case_id=$1 ORDER BY created_at', [params.id]),
      query('SELECT * FROM graph_edges WHERE case_id=$1 ORDER BY created_at', [params.id]),
    ]);
    const graph = {
      nodes: nodes.rows.map(n => ({ id:n.node_key, type:n.type, label:n.label, value:n.value, confidence:n.confidence, notes:n.notes, x:n.pos_x, y:n.pos_y })),
      edges: edges.rows.map(e => ({ id:e.edge_key, source:e.source_key, target:e.target_key, label:e.label, type:e.type })),
    };
    return NextResponse.json({ graph });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status:500 }); }
}

export async function POST(req, { params }) {
  const auth = requireAuth(req, ROLES.ANALYST);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await req.json();
    if (body.type === 'node') {
      await query(`
        INSERT INTO graph_nodes (case_id,node_key,type,label,value,confidence,notes,pos_x,pos_y)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (case_id,node_key) DO UPDATE
          SET type=$3,label=$4,value=$5,confidence=$6,notes=$7,pos_x=$8,pos_y=$9
      `, [params.id, body.id, body.nodeType, body.label, body.value||null, body.confidence||'suspected', body.notes||null, body.x||null, body.y||null]);
    } else {
      await query(`
        INSERT INTO graph_edges (case_id,edge_key,source_key,target_key,label,type)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (case_id,edge_key) DO NOTHING
      `, [params.id, body.id, body.source, body.target, body.label||null, body.edgeType||null]);
    }
    return NextResponse.json({ ok: true });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status:500 }); }
}

export async function DELETE(req, { params }) {
  const auth = requireAuth(req, ROLES.IO);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { searchParams } = new URL(req.url);
    const nodeId = searchParams.get('nodeId');
    const edgeId = searchParams.get('edgeId');
    if (nodeId) {
      await query('DELETE FROM graph_nodes WHERE case_id=$1 AND node_key=$2', [params.id, nodeId]);
      await query('DELETE FROM graph_edges WHERE case_id=$1 AND (source_key=$2 OR target_key=$2)', [params.id, nodeId]);
    } else if (edgeId) {
      await query('DELETE FROM graph_edges WHERE case_id=$1 AND edge_key=$2', [params.id, edgeId]);
    }
    return NextResponse.json({ ok: true });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status:500 }); }
}
