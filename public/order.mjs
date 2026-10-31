// Preserve existing card nodes (and pointer capture) when their order is unchanged.
export function reconcileCards(parent,nodes){const keep=new Set(nodes);for(let index=0;index<nodes.length;index++){const node=nodes[index];if(parent.children[index]!==node)parent.insertBefore(node,parent.children[index]||null);}for(const node of [...parent.children])if(!keep.has(node))node.remove();}
