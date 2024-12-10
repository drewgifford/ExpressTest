export default { 
    transform: {
        "^.+\\.js$": 'babel-jest'
    },
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.js$"
 }