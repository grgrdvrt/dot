/*
  provides an interface to build dot documents for graphviz
  based on https://graphviz.gitlab.io/_pages/doc/info/lang.html
*/



let id = 0;
function genId(){
  return id++;
}

function tabs(n){
  let str = "";
  for(let i = 0; i < n; i++){
    str += "\t";
  }
  return str;
}

function attributesToString(attributes){
  const aList = formatAList(attributes);
  if(aList.length === 0){
    return "";
  }
  else{
    return `[${aList.join("; ")}]`;
  }
}

function formatAList(attributes){
  let list = [];
  for(let attrName in attributes){
    const value = attributes[attrName];
    if(value !== undefined && value !== ""){
      list.push(attrName + " = \"" + value + "\"");
    }
  }
  return list;
}

function typeParamsToString(type, params){
  const aList = formatAList(params);
  if(aList.length === 0){
    return "";
  }
  else{
    return `${type} [${aList.join("; ")}]`;
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
    const attributes = Object.assign({}, this.attributes, {label:this.label, shape:"record"});
    let attrsStr = attributesToString(attributes);
    return `${this.id}${(attrsStr === "" ? "" : " " + attrsStr)}`;
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
    let attrsStr = attributesToString(attributes);
    return `${this.id}${(attrsStr === "" ? "" : " " + attrsStr)}`;
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
    let attrsStr = attributesToString(this.attributes);
    return this.nodes.map(node => `"${node.id}"`).join(separator) + `${(attrsStr === "" ? "" : " " + attrsStr)}`;
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

  toString(level = 0){
    this.items.forEach(item => {
      if(item.setParams){
        item.setParams({isOriented:this.params.isOriented});
      }
    });
    const attributes = Object.assign({}, this.attributes, {label:this.label});
    let content = [
      ...formatAList(attributes),
      typeParamsToString("graph", this.params.graph),
      typeParamsToString("node", this.params.node),
      typeParamsToString("edge", this.params.edge),
      ...this.items.map(item => item.toString(level))
    ].filter(c => c).map(c => tabs(level + 1) + c + ";");
    return `${tabs(level)}{\n${content.join("\n")}\n${tabs(level)}}`;
  }
}



class Graph extends BaseGraph{
  constructor(label = ""){
    super(label);
  }

  toString(level = 0){
    return `${this.params.isStrict ? "strict" : ""} ${this.params.isOriented ? "digraph" : "graph"} "${this.id}" ${super.toString(level)}`;
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

  toString(level = 0){
    return `subgraph "${this.id}" ${super.toString(level)}`;
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

