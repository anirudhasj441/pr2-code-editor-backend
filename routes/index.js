var express = require('express');
var router = express.Router();
const fspromise = require('fs/promises');
const fs = require("fs");
const path = require('path');

let rootDir = "./public/rootDir";

const hasChilds = async(dir) => {
    let childs = await fspromise.readdir(dir);
    // console.log("childs: ", childs);
    return childs.length > 0;
}

// const createNode = (dir) => {
//     // var node = {}
//     console.log("dir: ", dir)
//     fs.readdir(dir, (err, files) => {
//         files.forEach((file) => {
//             let filePath = path.join(dir, file);
//             let isDir = fs.lstatSync(filePath).isDirectory();
//             console.log("isDir: ", isDir);
//             let avatar = isDir ?
//                 "../assets/editor-icons/default_folder.svg" :
//                 "../assets/editor-icons/default_file.svg";
//             var node = {
//                 label: path.basename(file),
//                 avatar: avatar,
//                 selectable: !isDir,
//                 renameActive: false,
//                 newFolderActive: false,
//                 newFileActive: false,
//                 type: isDir ? 'folder' : 'file',
//                 path: file,
//             }
//             console.log("node: ", node)
//             if(!isDir) {
//                 return node;
//             }
//             if(!hasChilds(file)){
//                 return node;
//             }
//             node.children = createNode(filePath);
//         })
//     })
//     // return node;
// }

const createNode = async(parent, dir) => {
    let dirPath = path.join(parent, dir);
    // console.log("dirPath: ", dirPath)
    let isDir = fs.lstatSync(dirPath).isDirectory();
    let avatar = isDir ? "folder" : "file";


    var node = {
        label: path.basename(dir),
        avatar: avatar,
        selectable: !isDir,
        renameActive: false,
        newFolderActive: false,
        newFileActive: false,
        type: isDir ? 'folder' : 'file',
        path: dirPath.split('/').splice(2).join('/')
        // path: dirPath
    }
    // console.log(dirPath);
    // console.log("isDir: ", isDir);
    if(!isDir) return node;
    let hasChild = await hasChilds(path.join(parent, dir));
    // console.log('hasChild: ', hasChild);
    if(!hasChild) return node;
    // if(!hasChilds(path.join(parent, dir))) return node;
    let childs = await fspromise.readdir(path.join(parent, dir));

    node.children = [];
    for(let childDir of childs) {
        let childNode = await createNode(dirPath, childDir);
        node.children.push(childNode)
    }
    return node;
}

/* GET home page. */
router.get('/', function (req, res) {
    res.send({ message: "Hello" })
});

router.get('/list_files', async(req, res) => {

    let dirs = await fspromise.readdir(rootDir, {recursive: false});
    var treeNodes = []
    // await new Promise((resolve) => {
    // })
    for(let dir of dirs){
        let node = await createNode(rootDir, dir);
        treeNodes.push(node)
        console.log("tree: ", treeNodes);
        // console.log(node);
    }
    console.log("final tree: ", treeNodes)

    // console.log(createNode(rootDir));
    res.send({tree: treeNodes});

})

router.post('/create_folder', (req, res) => {
    data = req.body;
    console.log(data);
    let dirPath = path.join(rootDir, data.path);
    if(!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath, {recursive: true})
    }
    res.send({statu: 200})
})

router.post('/create_file', (req, res) => {
    data = req.body;
    let dirPath = path.join(rootDir, data.path);
    console.log(dirPath);
    console.log(fs.existsSync(dirPath))
    if(!fs.existsSync(dirPath)){
        fs.closeSync(fs.openSync(dirPath, 'w'))
    }
    res.send({status: 200})
})

module.exports = router;
