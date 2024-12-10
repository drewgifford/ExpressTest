import * as ts from 'typescript';
import { ParameterSpecification, RouteSpecification, Specification, ValidationRule } from './Specification';
import path from 'path';


export interface RouteDetails {
    path: string;
    method: string;
    parameters: ParameterDetails[];
    filePath: string;
}

export interface ParameterDetails {
    name: string;
    type: string;
    required: boolean;
    validationRules?: ValidationRule[];
}



export class RouteAnalyzer {

    private sourceFile: ts.SourceFile;
    private typeChecker: ts.TypeChecker;
    private specJSON: Specification;
    private projectPath: string;
    private filePath: string;

    constructor(fileContent: string, filePath: string, specJSON: Specification, projectPath: string){
        this.sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);
        this.typeChecker = ts.createProgram([filePath], {}).getTypeChecker();
        this.specJSON = specJSON;
        this.filePath = filePath;
        this.projectPath = projectPath;
    }

    extractRoutes(): RouteDetails[] {

        const routes: RouteDetails[] = [];

        const traverse = (node: ts.Node) => {

            if(ts.isCallExpression(node)){
                const routeDetails = this.analyzeRouteCall(node);

                if(routeDetails){
                    routes.push(routeDetails);
                }
            }

            ts.forEachChild(node, traverse);

        }
        traverse(this.sourceFile);
        return routes;

    }

    private analyzeRouteCall(node: ts.CallExpression): RouteDetails | null {
        const expression = node.expression;

        

        if(ts.isPropertyAccessExpression(expression)) {
            const methodName = expression.name.getText().toLowerCase();

            const routeMethods = ['get', 'post', 'put', 'delete', 'path'];

            if(!routeMethods.includes(methodName)) return null;

            const pathArg = node.arguments[0];
            if(!ts.isStringLiteral(pathArg)) return null;
            const routePath = pathArg.getText().replace(/^['"]|['"]$/g, '');

            const handlerArg = node.arguments[node.arguments.length - 1];
            if(ts.isFunctionLike(handlerArg)) return null;

            // GET SPEC
            let keyName = `${methodName.toUpperCase()} ${routePath}`;

            if(!Object.keys(this.specJSON).includes(keyName)) return null;

            const spec = this.specJSON[keyName as any];

            return {
                path: routePath,
                method: methodName.toUpperCase(),
                parameters: this.extractParameters(spec),
                filePath: path.relative(this.projectPath, this.filePath)
            }
        }
        return null;
    }

    private extractParameters(spec: RouteSpecification): ParameterDetails[] {

        return Object.keys(spec).map(paramName => {

            const paramSpec = spec[paramName];

            let paramType = paramSpec.type || 'any';
            let required = paramSpec.required || false;

            const validationRules: ValidationRule[] = paramSpec.validation || [];

            return {
                name: paramName,
                type: paramType,
                required,
                validationRules
            }
        })
    }


}

export { ValidationRule };
