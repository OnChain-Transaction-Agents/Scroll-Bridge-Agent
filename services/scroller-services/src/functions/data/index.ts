import { handlerPath } from '@libs/handler-resolver';


export const createDailyAverage = {
    handler: `${handlerPath(__dirname)}/handler.createDailyAverage`,
    events: [
        {
            http: {
                method: 'get',
                path: 'create-daily-average',
            },
        },
    ],
};



export const createHourlyRate = {
    handler: `${handlerPath(__dirname)}/handler.createHourlyRate`,
    events: [
        {
            http: {
                method: 'get',
                path: 'create-hourly-average',
            },
        },
    ],
};
