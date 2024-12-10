export interface ValidationRule {
    type: 'min' | 'max' | 'regex' | 'enum';
    value: any
}

export interface ParameterSpecification {
    required: boolean;
    type: string,
    validation: ValidationRule[]
}

export type RouteSpecification = {[key: string]: ParameterSpecification}
export type Specification = {[key: string]: RouteSpecification};
/*{
    "GET /users/:id": {
        "id": {
            "type": "string",

            "validation": [
                {
                    "type": "min",
                    "value": 10
                }
            ]
        }
    }
}*/