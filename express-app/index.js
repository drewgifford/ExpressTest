
import express from "express";
import { setupRoutes } from "./route/route";

const app = express();
const port = 3000;

export function getUsers(req, res){
    console.info("Hello world!", 1 + 1);

    res.send('Hello World');
}

app.get('/users/', getUsers);

setupRoutes(app);

if(process.env.NODE_ENV !== 'test'){
    app.listen(port, () => {
        console.info(`App listening on port ${port}`);
    });
}


module.exports = app;
