import { handlerPath } from '@libs/handler-resolver';


export const addEmail = {
    handler: `${handlerPath(__dirname)}/handler.addEmail`,
    events: [
        {
            http: {
                method: 'post',
                path: 'add-email/',
            },
        },
    ],
};




export const sendEmail = {
    handler: `${handlerPath(__dirname)}/handler.sendEmail`,
    events: [
        {
            http: {
                method: 'post',
                path: 'send-email/',
            },
        },
    ],
};