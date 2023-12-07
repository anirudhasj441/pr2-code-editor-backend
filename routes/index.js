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

    if(!isDir) return node;

    let hasChild = await hasChilds(path.join(parent, dir));
    if(!hasChild) return node;

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
    for(let dir of dirs){
        let node = await createNode(rootDir, dir);
        treeNodes.push(node);
    }
    res.send({tree: treeNodes});

})

router.post('/create_folder', (req, res) => {
    let data = req.body;
    console.log(data);
    let dirPath = path.join(rootDir, data.path);
    if(!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath, {recursive: true})
    }
    res.send({statu: 200})
})

router.post('/create_file', (req, res) => {
    let data = req.body;
    let dirPath = path.join(rootDir, data.path);
    console.log(dirPath);
    console.log(fs.existsSync(dirPath))
    if(!fs.existsSync(dirPath)){
        if(dirPath.includes('/')) {
            let filename = path.basename(dirPath);
            fs.mkdirSync(dirPath.replace(`/${filename}`, ''), {recursive: true});
        }
        fs.closeSync(fs.openSync(dirPath, 'w'))
    }
    res.send({status: 200})
})

router.post('/rename_file', (req, res) => {
    let data = req.body;
    let oldPath = path.join(rootDir, data.old_path);
    let newPath = path.join(rootDir, data.new_path);
    if(!fs.existsSync(oldPath)) {
        res.send({status: 200});
        return;
    }
    fs.renameSync(oldPath, newPath);
    res.send({staus: 200});
})

router.post('/get_file_content', (req, res) => {
    let data = req.body;
    let filePath = path.join(rootDir, data.path);
    let fileContent = fs.readFileSync(filePath, 'utf-8');
    // console.log(fileBuffer);
    res.send({file_content: fileContent})
})
module.exports = router;
