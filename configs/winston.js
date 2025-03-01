import winston from 'winston'
import appRoot from 'app-root-path'
import DailyRotateFile from  'winston-daily-rotate-file';



var transport = new DailyRotateFile({
    filename: `SupertreeAdmin_%DATE%.log`,
    dirname:`${appRoot}/logs/`,
    datePattern: 'MM-DD-YYYY',
    zippedArchive: true,
    maxSize: '500m',
    maxFiles: '30d',
    colorize:true,   
    format: winston.format.combine(   
          winston.format.timestamp({
            format:"MMM-DD-YYYY HH:mm:ss.SSS"
          }),
          winston.format.printf((info) => {
            if(info.username===undefined)
            {
              info.username="NA"
            }        
            return `{"DateTime":"${info.timestamp}","Level":"${info.level}","Username":"${info.username}","Module":"${info.reqdetails}","Message": "${info.message}"}`;
          }),
         
        )
      
  })

// Create a logger
export const logger = winston.createLogger({  
  transports: [
    transport, // Log to the console
  ],
});


