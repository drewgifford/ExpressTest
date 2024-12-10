import * as commander from "commander";
import process from "node:process";
import TestGenerator from "./testgenerator/TestGenerator";
import { fixPackageJSON } from "./testgenerator/PackageFixer";
import path from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";




async function main(){
    const program = new commander.Command();

    program
        .version('1.0.0')
        .description('Express.JS Test Case Generator')
        //.argument('<project-path>', 'Path to Express.JS Project')
        .action(async () => {

            const projectPath = "../express-app/" // This is configured for testing - Once this module would reach release, this will become a CLI command.
  
            try {
                const testGenerator = new TestGenerator(projectPath);

                await testGenerator.analyze();

                const testSuites = testGenerator.generateTestSuites();

                // Save test suites
                for(let testSuite of testSuites){
                    const p = path.resolve(path.join(projectPath, testSuite.path));

                    ensureDirectoryExistence(p);
                    writeFileSync(p, testSuite.contents, { encoding: 'utf8', flag: 'w'});
                }


                await fixPackageJSON(projectPath);

                // Update package.json of project
            }
            catch(e){}

        });

    program.parse(process.argv);
}

function ensureDirectoryExistence(filePath: string) {
    var dirname = path.dirname(filePath);
    if (existsSync(dirname)) {
      return true;
    }
    ensureDirectoryExistence(dirname);
    mkdirSync(dirname);
  }
  
main();