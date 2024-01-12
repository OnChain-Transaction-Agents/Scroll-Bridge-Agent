import { handlerPath } from '@libs/handler-resolver';


export const processTransactionNode = {
    handler: `${handlerPath(__dirname)}/handler.processTransactionNode`,
    events: [
        {
            http: {
                method: 'post',
                path: 'process-transaction/',
            },
        },
    ],
};





export const getPrediction = {
    handler: `${handlerPath(__dirname)}/handler.getPrediction`,
    events: [
        {
            http: {
                method: 'post',
                path: 'get-prediction/',
            },
        },
    ],
};


export const tokenMetaData = {
    handler: `${handlerPath(__dirname)}/handler.tokenMetaData`,
    events: [
        {
            http: {
                method: 'get',
                path: 'metadata/{id}',
            },
        },
    ],
};