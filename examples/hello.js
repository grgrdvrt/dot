/*
  build a simple hello world diagram
  the lib's interface is clearly overkill for this one.
*/
const dot = require("../index.js");

const helloNode = dot.node("hello");
const worldNode = dot.node("world");
const edge = dot.edge(helloNode, worldNode);
const graph = dot.graph()
      .setParams({isOriented:true})
      .add(helloNode, worldNode, edge);

console.log(graph.toString());
