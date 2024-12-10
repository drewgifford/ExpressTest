This repository contains two folders. `/express-app/` is an example Express API configured to allow test generation from `/express-test/`.

To initialize each project, type `yarn` in each folder. Build the `express-test` library with `yarn build` and run the project from the build directory, then run the file with Node at `/express-test/build/index.js`.

Required libraries on the express application are below:
```
@babel/core
@babel/preset-env
babel-plugin-root-import
babel-jest
express
faker
jest
supertest
```

Alongside this, the contents of `~/babel.config.json` need to be at least the following:
```
{
    "presets": [
      [
        "@babel/preset-env",
        {
          "targets": {
            "node": "current"
          }
        }
      ]
    ],
    "plugins": [
        [
            "babel-plugin-root-import"
        ]
    ]
  }
```

And `~/jest.config.json` needs to contain a transform for babel-jest and a regex expression to find ExpressTest's generated files:
```
export default { 
    transform: {
        "^.+\\.js$": 'babel-jest'
    },
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.js$"
 }
```

Finally, ensure your `app.listen()` call is wrapped with a process check so that SuperTest does not run it.
```
if(process.env.NODE_ENV !== 'test'){
    app.listen(port, () => {
        console.info(`App listening on port ${port}`);
    });
}
```


Ensure you are exporting your app from `index.js` using `module.exports = app;`. Use module.exports even in an ES6 project.

To see a test coverage report, use the `test` command in the target project.