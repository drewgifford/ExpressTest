import fs from "node:fs";
import path from "node:path";
import beautify from 'js-beautify';
import { execSync } from "node:child_process";

export async function fixPackageJSON(projectPath: string){

    const p = path.join(projectPath, 'package.json')
    
    const sourceCode = JSON.parse(fs.readFileSync(p, 'utf8'));

    let scripts = sourceCode['scripts'];
    if (!scripts) scripts = {};

    scripts['test'] = 'jest --coverage';

    sourceCode['scripts'] = scripts;

    fs.writeFileSync(p, beautify(JSON.stringify(sourceCode)));


    //execSync('pwd', { cwd: projectPath });
    console.info("Running tests...");
    execSync('yarn test --coverage', { cwd: projectPath})

}