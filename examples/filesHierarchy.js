const fs = require('fs');
const path = require('path');
const process = require('process');
const dot = require('../index.js');

const graph = dot.graph()
      .setParams({isOriented:true, node:{shape:"note"}});


function getFileHierarchyAux(filePath, rootPath){
  const fileName = path.parse(filePath).base || rootPath;
  const fileAbsolutePath = path.join(rootPath, filePath);

  let node;
  if(fs.statSync(fileAbsolutePath).isDirectory()){

    node = dot.node(fileName)
          .setAttributes({shape:"folder"});

    fs.readdirSync(fileAbsolutePath).forEach(childName => {
      const childPath = path.join(filePath, childName);
      const child = getFileHierarchyAux(childPath, rootPath);
      graph.add(dot.edge(node, child));
    });

  }
  else {
    node = dot.node(fileName);
  }

  graph.add(node);

  return node;
}

getFileHierarchyAux("", process.argv[2]);
console.log(graph.toString());
