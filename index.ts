import express from "express";
import WebSocket,{ WebSocketServer } from "ws";

const app = express();
app.use(express.json());

const server = app.listen(8080,() => {
    console.log('Server started on port 8080');
});

const clients = new Map<string | null,WebSocket>();


const wss = new WebSocketServer({server});


wss.on('connection',(socket,req) => {
   
    const url = new URL(req.url!,"http://dummy");
    const userId = url.searchParams.get("userId");

    clients.set(userId,socket);
    
    console.log("socket: ",socket);
   socket.on('error',(error)=> {
    console.log("error in connection",error);
   })


   socket.on('message',(data,isBinary) => {
    try{
     const parsedData = JSON.parse(data.toString());

     if(parsedData.type === "dm"){
        handleDirectMessage(userId,parsedData);
     }else if(parsedData.type === "multiple"){
        handleMultipleMessage(userId,parsedData);
     }
    }catch(error){
       console.log(error,"Error in handleDirect");
    }
   });

   socket.send(
  JSON.stringify({
    type: "system",
    message: "Connected successfully",
  })
);
});



const handleDirectMessage = (from: string | null, payload: {to: string,message: string}) => {
    const targetSocket = clients.get(payload.to);
    const messageData = {
        type: "dm",
        from,
        message: payload.message,
    }

    if(targetSocket && targetSocket.readyState === WebSocket.OPEN){
        targetSocket.send(JSON.stringify(messageData));
    }
}

const handleMultipleMessage = (from: string | null, payload: {to: string[],message: string}) => {
    const recipients = [...new Set(payload.to)];

    const messageData = {
        type: "multiple",
        from,
        message: payload.message,
    }
  recipients.forEach((id) => {

    const targetSocket = clients.get(id);
    if(targetSocket && targetSocket.readyState === WebSocket.OPEN){
        targetSocket.send(JSON.stringify(messageData));
    }
  });

    
}