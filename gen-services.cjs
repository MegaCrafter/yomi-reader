const fs = require('fs');
const path = require('path');

const getAttributes = (filename) => {
    const obj = {};

    let index;
    let name = filename;
    while ((index = name.lastIndexOf('.')) != -1) {
        const attr = name.substring(index + 1);
        obj[attr] = true;
        
        name = name.substring(0, index);
    }

    obj.name = name;
    return obj;
}

const pathmap = new Map();
const usemap = new Map();

const walkDir = (startPath, relPath = '') => {
    let list = [];

    const find = fs.readdirSync(startPath);

    for (const found of find) {
        if (found.indexOf('.') == -1) {

            const dive = walkDir(path.join(startPath, found), relPath + '/' + found);

            for (const obj of dive) {
                if (obj.base) {
                    pathmap.set(obj.path + '/', obj.name);
                }

                list.push({ path: found + '/' + obj.path, ...obj });
            }

            continue;
        }

        if (!found.endsWith('.ts')) continue;

        let name = found.substring(0, found.lastIndexOf('.'));
        const attrs = getAttributes(name);

        if (attrs.base) {
            if (pathmap.get(relPath + '/')) {
                throw "There cannot be more than one base service!";
            }
            pathmap.set(relPath + '/', attrs.name);
        }

        if (attrs.use) {
            if (usemap.get(relPath + '/')) {
                throw "There cannot be more than one use service!";
            }
            usemap.set(relPath + '/', attrs.name);
        }

        console.log('Found ' + relPath + '/' + name + '.ts');
        list.push({ path: relPath + '/', fullname: name, ...attrs });
    }

    return list;
}

let imports = '';
let provides = '';

console.log('Looking for service files...');

const files = walkDir(path.join(__dirname, 'services'));

if (files.length === 0) {
    console.log('Could not find any services.');
    process.exit(1);
}

for (const file of files) {
    const base = pathmap.get(file.path);
    if (base && !file.base && !file.use) continue;
    
    if (file.base) continue;

    console.log('Generating for ' + file.path + file.fullname + '.ts');

    imports += 'import { ' + file.name + ' } from \'@/services'+file.path+file.fullname+'\';\n';

    const usename = base ?? file.name;

    if (file.lazy) {
        provides += '\n      ' + usename + ': store.lazyService(\'' + usename + '\', () => new ' + file.name + '()),';
    } else {
        provides += '\n      ' + usename + ': store.service(\'' + usename + '\', () => new ' + file.name + '()),';
    }
}
// TestService.ts -> Standard service
// TestService.lazy.ts -> Lazy loaded service (service instance is created on the first use of the service)
// TestService.base.ts -> Base service file for the folder (Error if there are more than one)
// TestService.use.ts -> Implementation service for the base service (Error if there are more than one)

const content = imports + '\nimport Store from \'./store\';\n\nconst store = new Store();\n\nexport default defineNuxtPlugin(() => {\n  return {\n    provide: {' + provides + '\n    },\n  };\n});';

fs.writeFileSync(path.join(__dirname, 'plugins/locator/index.ts'), content);
