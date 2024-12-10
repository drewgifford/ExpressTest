import { RouteDetails, ParameterDetails, ValidationRule } from "./RouteAnalyzer";
import { faker } from '@faker-js/faker'
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import RandExp from "randexp";
import * as b from 'js-beautify';

const beautify = b.js_beautify

const TEST_HEADER = (route: RouteDetails, inputs: {[key: string]: any}) => `
    const res = await request(app).get('${route.path}')
        .query({
            ${Object.keys(inputs).map(x => x + ': ' + JSON.stringify(inputs[x])).join(',\n')}
        })
    ;
`

export class TestSuite {

    private route: RouteDetails;

    constructor(route: RouteDetails){
        this.route = route;
    }

    generate(): {path: string, contents: string} {
        const route = this.route;

        const randomInputs = this.generateRandomInputs(route.parameters);
        const invalidInputs = this.generateInvalidInputs(route.parameters);

        const fileName = route.filePath.split('.').slice(0, -1).join('.');

        // Add import contents at the top of the file
        const header = beautify(`
            import request from 'supertest';
            import app from '~/index.js';
        `);

        const contents = header + '\n' + beautify(` 
            describe('Test for ${route.path} (${route.method})', () => {

                ${this.generateRandomInputTestCases(randomInputs)}

                ${this.generateInvalidInputTestCases(invalidInputs)}

                // this.generateBoundaryTestCases();
                // Removed Boundary Test Case Scenarios temporarily
            
            })
        
        `);

        

       
        return {
            path: fileName+".test.js",
            contents: contents
        };
    }

    private generateRandomInputs(parameters: ParameterDetails[]): {[key: string]: any} {
        let obj: {[key: string]: any} = {}
        parameters.forEach((param) => {
            obj[param.name] = this.generateRandomInput(param.type, param.validationRules);
        })
        return obj;
    }
    private generateRandomInput(paramType: string, validationRules?: ValidationRule[]): any {


        switch(paramType.toLowerCase()){
            case 'string':
                return this.generateStringInput(validationRules);
            case 'number':
                return this.generateNumberInput(validationRules);
            case 'boolean':
                return faker.datatype.boolean();
            case 'date':
                return faker.date.recent();
            default:
                return faker.word.sample();
        }
    }

    private generateStringInput(validationRules?: ValidationRule[]): string {
        

        let min = null;
        let max = null;
        let regex: string | null = null;

        

        

        if(validationRules){
            validationRules.forEach(rule => {
                switch(rule.type){
                    case 'min':
                        min = rule.value; break;
                    case 'max':
                        max = rule.value; break;
                    case 'regex':
                        regex = rule.value; break;
                }
            })
        }

        let generated: string;
        
        if(regex){
            const randexp = new RandExp(regex);
            generated = randexp.gen();
        }
        else {
            generated = faker.word.words();

            if(min){
                let it = 0;
                while (generated.length < min && it < 1000){
                    generated = faker.word.words();
                    
                    it++;
                }
            }
            if(max){
                generated = generated.slice(0, max);
            }
        }

        return generated;
        
    }

    private generateNumberInput(validationRules?: ValidationRule[]): number {

        let generated = faker.number.int();

        if(validationRules){
            validationRules.forEach(rule => {

                // TODO: Replace this and make it generate a number based off these values instead

                switch(rule.type){
                    case 'min':
                        generated = Math.max(generated, rule.value);
                        break;
                    case 'max':
                        generated = Math.min(generated, rule.value);
                        break;
                }

            })
        }

        return generated;

    }

    private generateInvalidInputs(parameters: ParameterDetails[]): {[key: string]: any} {
        let obj: {[key: string]: any} = {}
        parameters.forEach((param) => {
            obj[param.name] = this.generateInvalidInput(param.type);
        })
        return obj;
    }
    private generateInvalidInput(paramType: string): any {
        switch(paramType.toLowerCase()) {
            case 'string':
                return 12345;
            case 'number':
                return 'NaN';
            case 'boolean':
                return 'true'
            default:
                return null;
        }
    }

    private generateRandomInputTestCases(inputs: {[key: string]: any}): string {
        let route = this.route;

        return `

            // RANDOM INPUT SCENARIOS

            it('should handle random input scenario', async () => {
                try {

                        
                    ${TEST_HEADER(route, inputs)}
                        
                    // Customizable assertions
                    expect(res.statusCode).toBe(200);
                    // Add more specific assertions based on expected response
                        
                } catch (error) {
                    // Error handling and logging
                    console.error('Test failed');
                    throw error;
                }
            });
        `;
    }

    private generateInvalidInputTestCases(inputs: {[key: string]: any}): string {

        let route = this.route;

        return `

            // INVALID INPUT SCENARIOS

            ${Object.keys(inputs).map((key, index) => `
            it('should handle invalid input scenario ${index + 1}', async () => {
                
                try {
                    ${TEST_HEADER(route, inputs)}
                    
                    // Expect error response or validation
                    expect(res.statusCode).toBe(200);
                
                } catch (error) {
                    // Validate error response
                    console.error('Test failed');
                    throw error;
                }
            })`).join('\n')}
        `;
    }

    private generateBoundaryTestCases(): string {

        let route = this.route;

        return `
            ${route.parameters.map(param => `
                it('should handle boundary conditions for ${param.name}', async () => {
                    const boundaryInputs = {
                        min: ${this.generateBoundaryValue(param.type, 'min')},
                        max: ${this.generateBoundaryValue(param.type, 'max')},
                        zero: ${this.generateBoundaryValue(param.type, 'zero')}
                    };
                    
                    for (const [type, value] of Object.entries(boundaryInputs)) {
                        try {
                            
                            // Boundary condition specific assertions
                            expect(response.status).toBe(200);
                        
                        } catch (error) {
                            console.error('Test failed');
                            throw error;
                        }
                    }
                })`).join('\n')}
        `;
    }


    private generateBoundaryValue(paramType: string, boundaryType: 'min' | 'max' | 'zero'): any {
        switch(paramType.toLowerCase()){
            case 'number':
                switch(boundaryType){
                    case 'min': return Number.MIN_SAFE_INTEGER;
                    case 'max': return Number.MAX_SAFE_INTEGER;
                    case 'zero': return 0;
                }
            case 'string':
                switch(boundaryType){
                    case 'min': return "''"; //TODO: Make this according to specs
                    case 'max': return "'"+'x'.repeat(100)+"'"; //TODO: Make this according to specs
                    case 'zero': return "''";
                
                }
            case 'boolean':
                return boundaryType === 'zero' ? false : true;
            default:
                return null;

        }
    }
}

