import fs from 'fs';
import path from 'path';
import { RouteAnalyzer, RouteDetails } from './RouteAnalyzer';
import { TestSuite } from './TestSuite';

type ExpressFileGroup = {
        file: string,
        specFile: string,
}

export default class TestGenerator {

    private projectPath: string;
    private routes: RouteDetails[] = [];

    constructor(projectPath: string){
        this.projectPath = projectPath;
    }

    async analyze(){
        console.info('Analyzing...')
        const expressFiles = this.findExpressFiles(this.projectPath);


        for(const { file, specFile } of expressFiles) {

            const sourceCode = fs.readFileSync(file, 'utf8');
            const specJSON = JSON.parse(fs.readFileSync(specFile, 'utf8'));

            let routes = this.extractRoutes(sourceCode, file, specJSON);

            this.routes = this.routes.concat(routes); 
        }

        return this.routes;

    }

    
    private findExpressFiles(dir: string): ExpressFileGroup[] {
        const expressFiles: ExpressFileGroup[] = [];

        const traverseDir = (currentPath: string) => {
            const files = fs.readdirSync(currentPath);

            for(const file of files){
                
                const fullPath = path.join(currentPath, file);
                const stat = fs.statSync(fullPath);

                if(stat.isDirectory()){

                    if(fullPath.includes('node_modules')) continue;
                    traverseDir(fullPath);

                }
                else if(file.endsWith('.js') || file.endsWith('.ts')){

                    // Check if file has a .spec.json
                    const baseName = path.basename(file, path.extname(file));
                    const specFilePath = path.join(currentPath, baseName + '.spec.json')

                    if(!fs.existsSync(specFilePath)) continue;

                    const content = fs.readFileSync(fullPath, 'utf8');
                    if(content.includes('express()') || content.includes('app.get(') || content.includes('app.post(')){
                        expressFiles.push({
                            file: fullPath,
                            specFile: specFilePath 
                        });
                    }
                }
            }
        }

        traverseDir(dir);

        console.info(expressFiles);
        return expressFiles;
    }


    private extractRoutes(sourceCode: string, filePath: string, specJSON: any){

        const analyzer = new RouteAnalyzer(sourceCode, filePath, specJSON, this.projectPath);
        const routes = analyzer.extractRoutes();

        console.log(routes);

        //console.debug('Extracted routes:', JSON.stringify(routes, null, 2));
        return routes;
    }

    generateTestSuites(){
        const testSuites: any[] = [];

        console.info("Routes:", this.routes.length);

        for(const route of this.routes){
            // Create string

            console.info('Creating suite for', route.filePath);

            let suite = new TestSuite(route);
            const testSuite = suite.generate();

            testSuites.push(testSuite);


        }
        return testSuites;
    }

}