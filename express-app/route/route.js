import express from "express";

function test(req, res){
    console.info("Hello world!", 1 + 1);

    res.send('Hello World');
}

export function setupRoutes(app){
    
    app.get('/testRoutes/', test);

}

