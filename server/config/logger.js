import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// get the path of log directory
const __fileName = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__fileName);
const logsDir = path.join(__dirname, "../../logs");


// check if logs directory exists

const checkIfLogDirectoryExists = async ()=>{
  try{
    if(!fs.existsSync(logsDir)){
      fs.mkdirSync(logsDir);
      console.log("Log Directory created");
    }
  }catch(err){
    console.error("Error creating logs directory:", err);
  }
}

await checkIfLogDirectoryExists();

const logger = {
  info: (message) => {
    const timeStamp = new Date().toISOString();
    const logMessagge = `[${timeStamp}] Info: ${message} \n`;
    try{
      fs.appendFileSync(path.join(logsDir,"app.log"),logMessagge);
    }catch(err){
      console.log("failed to write info log",err);
    }
  },
  warn: (message) =>{
    const timeStamp = new Date().toISOString();
    const logMessagge = `[${timeStamp}] Warn: ${message} \n`;
    try{
      fs.appendFileSync(path.join(logsDir,"warn.log"),logMessagge);
    }catch(err){
      console.log("failed to write warn log",err);
    }
  },
  error: (message) => {
    const timeStamp = new Date().toISOString();
    const logMessagge = `[${timeStamp}] Error: ${message} \n`;
    try{
      fs.appendFileSync(path.join(logsDir,"error.log"),logMessagge);
    }catch(err){
      console.log("failed to write error log",err);
    }
  }
}

export default logger;