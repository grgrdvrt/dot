/*
  provides an interface to build dot documents for graphviz
  based on https://graphviz.gitlab.io/_pages/doc/info/lang.html
*/



let id = 0;
function genId(){
  return id++;
}

function itemsToString(items){
  return items.map(item => item.toString() + ";").join("");
}

function attributesToString(attributes){
  return `[${aListToString(attributes)}]`;
}

function aListToString(attributes){
  let list = [];
  for(let attrName in attributes){
    const value = attributes[attrName];
    if(value !== undefined && value !== ""){
      list.push(attrName + " = \"" + value + "\"");
    }
  }
  return list.join(";");
}

function typeParamsToString(type, params){
  const attributesStr = attributesToString(this.graphParams);
  if(attributesStr === "[]"){
    return "";
  }
  else{
    return `${type} ${attributesStr};`;
  }
}




class LabelCell{
  constructor(label){
    this.label = label;
    this._id = genId();
  }

  get id(){
    if(this.nodeId === undefined){
      console.warn("a Cell should be added to a Record or to another Cell before being used");
    }
    return `${this.nodeId}:${this._id}`;
  }

  setNodeId(nodeId){
    this.nodeId = nodeId;
  }

  toString(){
    return `<${this._id}> ${this.label}`;
  }
}



class Cell{
  constructor(...cells){
    this._id = genId();
    this.nodeId = undefined;
    this.cells = [];
    this.add(...cells);
  }

  get id(){
    if(this.nodeId === undefined){
      console.warn("a Cell should be added to a Record or to another Cell before being used");
    }
    return `${this.nodeId}:${this._id}`;
  }

  setNodeId(nodeId){
    this.nodeId = nodeId;
    this.cells.forEach(cell => cell.setNodeId(this.nodeId));
  }

  add(...cells){
    cells.forEach(cell => cell.setNodeId(this.nodeId));
    this.cells.push(...cells);
    return this;
  }

  toString(){
    let label;
    if(this.cells.length > 1){
      return `{${this.cells.map(cell => cell.toString()).join("|")}}`;
    }
    else {
      return `<${this._id}> ${label}`;
    }
  }
}



class Record{
  constructor(...cells){
    this.id = genId();
    this.attributes = {};
    this.cells = [];
    this.add(...cells);
  }

  setAttributes(attributes){
    Object.assign(this.attributes, attributes);
    return this;
  }

  add(...cells){
    cells.forEach(cell => cell.setNodeId(this.id));
    this.cells.push(...cells);
    return this;
  }

  toString(){
    let label;
    if(this.cells.length > 1){
      label = `{${this.cells.map(cell => cell.toString()).join("|")}}`;
    }
    else {
      label = this.cells[0].toString();
    }
    const attributes = Object.assign({}, this.attributes, {label:label, shape:"record"});
    return `${this.id} ${attributesToString(attributes)}`;
  }
}



class Node{
  constructor(label){
    this.id = genId();
    this.label = label;
    this.attributes = {};
  }

  setAttributes(attributes){
    Object.assign(this.attributes, attributes);
    return this;
  }

  toString(){
    const attributes = Object.assign({}, this.attributes, {label:this.label});
    return `${this.id} ${attributesToString(attributes)}`;
  }
}



class Edge{
  constructor(from, ...to){
    this.nodes = [from, ...to];
    this.isOriented = true;
    this.params = {};
    this.attributes = {};
  }

  setAttributes(attributes){
    Object.assign(this.attributes, attributes);
    return this;
  }

  setParams(params){
    Object.assign(this.params, params);
    return this;
  }

  toString(){
    let separator = this.params.isOriented ? " -> " : " -- ";
    return this.nodes.map(node => `"${node.id}"`).join(separator) + ` ${attributesToString(this.attributes)}`;
  }
}



class BaseGraph{
  constructor(label = ""){
    this._id = genId();
    this.label = label;
    this.items = [];
    this.attributes = {};
    this.params = {};
  }

  get id(){
    return this._id;
  }

  label(label){
    this.label = label;
    return this;
  }

  add(...items){
    this.items.push(...items);
    return this;
  }

  setAttributes(attributes){
    Object.assign(this.attributes, attributes);
    return this;
  }

  setParams(params){
    Object.assign(this.params, params);
    return this;
  }

  toString(){
    this.items.forEach(item => {
      if(item.setParams){
        item.setParams({isOriented:this.params.isOriented});
      }
    });
    const attributes = Object.assign({}, this.attributes, {label:this.label});
    const attribsStr = aListToString(attributes);
    return `{
        ${attribsStr ? attribsStr + ";" : ""}
        ${typeParamsToString("graph", this.params.graph)}
        ${typeParamsToString("node", this.params.node)}
        ${typeParamsToString("edge", this.params.edge)}
        ${itemsToString(this.items)}
      }`;
  }
}



class Graph extends BaseGraph{
  constructor(label = ""){
    super(label);
  }

  toString(){
    return `${this.params.isStrict ? "strict" : ""} ${this.params.isOriented ? "digraph" : "graph"} "${this.id}" ${super.toString()}`;
  }
}



class Subgraph extends BaseGraph{
  constructor(label = ""){
    super(label);
    this.firstNode = node().setAttributes({
      label:" ",
      fontsize:0,
      style:"invis",
      area:0,
      margin:"0,0",
      fixedsize:true,
      width:0,
      height:0
    });
    this.add(this.firstNode);
  }

  get id(){
    return (this.params.isCluster ? "cluster" : "") + this._id;
  }

  toString(){
    return `subgraph "${this.id}" ${super.toString()}`;
  }
}


function labelCell(label) {return new LabelCell(label);}
function cell(...cells) {return new Cell(...cells);}
function record(...cells) {return new Record(...cells);}
function node(label) {return new Node(label);}
function edge(from, ...to) {return new Edge(from, ...to);}
function graph(label) {return new Graph(label);}
function subgraph(label) {return new Subgraph(label);}

module.exports = {
  labelCell,
  cell,
  record,
  node,
  edge,
  graph,
  subgraph
};

